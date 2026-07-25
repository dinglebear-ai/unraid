//! Schema-as-contract test.
//!
//! Validates, against the **vendored Unraid SDL** (`schema/unraid-schema.graphql`):
//!   1. every GraphQL query `graphql.rs` actually sends (captured by driving the
//!      real dispatch through a recording mock), and
//!   2. every scenario fixture's leaf values — scalar JSON type (BigInt accepts
//!      the number emitted by live Unraid and legacy strings, Int/Float=number,
//!      …) and enum membership.
//!
//! This is the guardrail that mechanically catches the class of mistakes that
//! were hand-fixed earlier (invalid `DiskSmartStatus`, wrong `ArrayDiskType`
//! casing, and custom-scalar wire mismatches). It uses `apollo-compiler` for real schema-aware
//! validation rather than string heuristics.
//!
//! **What it does NOT prove:** that a *real* Unraid server returns data matching
//! these fixtures. SDL validation only proves the queries are well-formed and the
//! fixtures are self-consistent with the schema; the schema itself can lie about
//! runtime (e.g. `flash.guid` is non-null in SDL yet null in practice). Only a
//! live integration test closes that gap. Because of that, fixture validation is
//! intentionally **lenient on nullability** — a `null` leaf is always accepted.

use apollo_compiler::ast::Type;
use apollo_compiler::executable::{Selection, SelectionSet};
use apollo_compiler::schema::ExtendedType;
use apollo_compiler::validation::Valid;
use apollo_compiler::{ExecutableDocument, Name, Schema};
use serde_json::Value;
use unraid_rmcp::mock::{Scenario, SCENARIOS};
use unraid_rmcp::testing::{execute_tool, state_with_upstream};
use wiremock::{Mock, MockServer, Request, Respond, ResponseTemplate};

const SCHEMA_SDL: &str = include_str!("../schema/unraid-schema.graphql");

use unraid_rmcp::testing::{mutation_action_calls, upstream_action_calls};

/// Every query AND mutation, so the contract test validates the whole surface.
fn action_calls() -> Vec<(&'static str, Value)> {
    let mut calls = upstream_action_calls();
    calls.extend(mutation_action_calls());
    calls
}

/// Mock that echoes a valid healthy response so dispatch succeeds (we only care
/// about the *request* it records).
struct HealthyResponder {
    scenario: Scenario,
}
impl Respond for HealthyResponder {
    fn respond(&self, request: &Request) -> ResponseTemplate {
        let body: Value = serde_json::from_slice(&request.body).unwrap_or(Value::Null);
        let query = body.get("query").and_then(Value::as_str).unwrap_or("");
        ResponseTemplate::new(200).set_body_json(self.scenario.respond(query))
    }
}

/// Drive `action` through the real dispatch against a recording mock and return
/// the exact GraphQL query string that `graphql.rs` sent.
async fn capture_query(action: &str, args: Value) -> String {
    let server = MockServer::start().await;
    Mock::given(wiremock::matchers::method("POST"))
        .respond_with(HealthyResponder {
            scenario: Scenario::load("healthy").unwrap(),
        })
        .mount(&server)
        .await;

    let state = state_with_upstream(&server.uri());
    execute_tool(&state, "unraid", args)
        .await
        .unwrap_or_else(|e| panic!("action {action} should dispatch: {e}"));

    let requests = server.received_requests().await.expect("recording enabled");
    let last = requests.last().expect("one upstream request");
    let body: Value = serde_json::from_slice(&last.body).expect("json body");
    body["query"].as_str().expect("query string").to_string()
}

fn load_schema() -> Valid<Schema> {
    Schema::parse_and_validate(SCHEMA_SDL, "unraid-schema.graphql")
        .unwrap_or_else(|e| panic!("vendored SDL must be valid:\n{}", e.errors))
}

#[tokio::test]
async fn every_query_is_valid_against_the_schema() {
    let schema = load_schema();
    let mut failures = Vec::new();
    for (action, args) in action_calls() {
        let query = capture_query(action, args).await;
        if let Err(e) = ExecutableDocument::parse_and_validate(&schema, &query, "query.graphql") {
            failures.push(format!("action `{action}` query is INVALID:\n{}", e.errors));
        }
    }
    assert!(
        failures.is_empty(),
        "queries drifted from the Unraid schema:\n\n{}",
        failures.join("\n")
    );
}

#[tokio::test]
async fn every_fixture_conforms_to_the_schema() {
    let schema = load_schema();
    let mut errors = Vec::new();

    for (action, args) in action_calls() {
        let query = capture_query(action, args.clone()).await;
        let doc = ExecutableDocument::parse_and_validate(&schema, &query, "query.graphql")
            .unwrap_or_else(|e| panic!("action {action}: query invalid: {}", e.errors));
        let op = doc
            .operations
            .get(None)
            .expect("each query has a single operation");

        // Validate this action's fixture in every scenario — overlays can
        // introduce their own (potentially wrong) enum/scalar values.
        for scenario in SCENARIOS {
            let payload = Scenario::load(scenario)
                .unwrap()
                .payload(action)
                .cloned()
                .unwrap_or_else(|| panic!("{scenario} missing fixture for {action}"));
            let where_ = format!("{scenario}/{action}");
            check_selection_set(&schema, &op.selection_set, &payload, &where_, &mut errors);
        }
    }

    assert!(
        errors.is_empty(),
        "fixtures violate the Unraid schema:\n  - {}",
        errors.join("\n  - ")
    );
}

// ── schema-aware response walker ────────────────────────────────────────────

/// Walk a selection set against a JSON object, recursing into sub-selections and
/// checking leaf scalar/enum values.
fn check_selection_set(
    schema: &Schema,
    selection_set: &SelectionSet,
    value: &Value,
    path: &str,
    errors: &mut Vec<String>,
) {
    if value.is_null() {
        return; // lenient: a null object is allowed (real server nullability)
    }
    let Some(obj) = value.as_object() else {
        errors.push(format!("{path}: expected an object, got {}", kind(value)));
        return;
    };
    for sel in &selection_set.selections {
        let Selection::Field(field) = sel else {
            continue; // our queries use no fragments
        };
        let key = field.response_key().as_str();
        let child = obj.get(key).unwrap_or(&Value::Null);
        check_typed_value(
            schema,
            &field.definition.ty,
            &field.selection_set,
            child,
            &format!("{path}.{key}"),
            errors,
        );
    }
}

/// Check a JSON value against a GraphQL `Type`, unwrapping list/non-null layers.
fn check_typed_value(
    schema: &Schema,
    ty: &Type,
    selection_set: &SelectionSet,
    value: &Value,
    path: &str,
    errors: &mut Vec<String>,
) {
    if value.is_null() {
        return; // lenient on nullability everywhere
    }
    match ty {
        Type::List(inner) | Type::NonNullList(inner) => match value.as_array() {
            Some(items) => {
                for (i, item) in items.iter().enumerate() {
                    check_typed_value(
                        schema,
                        inner,
                        selection_set,
                        item,
                        &format!("{path}[{i}]"),
                        errors,
                    );
                }
            }
            None => errors.push(format!(
                "{path}: expected a list ({ty}), got {}",
                kind(value)
            )),
        },
        Type::Named(name) | Type::NonNullNamed(name) => {
            check_named(schema, name, selection_set, value, path, errors)
        }
    }
}

fn check_named(
    schema: &Schema,
    name: &Name,
    selection_set: &SelectionSet,
    value: &Value,
    path: &str,
    errors: &mut Vec<String>,
) {
    match schema.types.get(name.as_str()) {
        Some(ExtendedType::Enum(e)) => match value.as_str() {
            Some(s) if e.values.keys().any(|k| k.as_str() == s) => {}
            Some(s) => errors.push(format!("{path}: '{s}' is not a valid {name} enum value")),
            None => errors.push(format!(
                "{path}: enum {name} expects a string, got {}",
                kind(value)
            )),
        },
        Some(ExtendedType::Scalar(_)) => check_scalar(name.as_str(), value, path, errors),
        Some(ExtendedType::Object(_))
        | Some(ExtendedType::Interface(_))
        | Some(ExtendedType::Union(_)) => {
            check_selection_set(schema, selection_set, value, path, errors)
        }
        // Input objects never appear in responses; unknown names can't happen on
        // a validated document.
        Some(ExtendedType::InputObject(_)) | None => {}
    }
}

/// Map a GraphQL scalar name to the JSON type the Unraid API serializes it as.
fn check_scalar(name: &str, value: &Value, path: &str, errors: &mut Vec<String>) {
    let ok = match name {
        // Live Unraid serializes BigInt as a JSON number. Older releases and
        // fixtures may use strings, and the client intentionally accepts both.
        "BigInt" => value.is_number() || value.is_string(),
        "String" | "DateTime" | "URL" | "PrefixedID" | "ID" => value.is_string(),
        "Int" | "Port" => value.is_i64() || value.is_u64(),
        "Float" => value.is_number(),
        "Boolean" => value.is_boolean(),
        // JSON / any unknown custom scalar: accept anything.
        _ => true,
    };
    if !ok {
        errors.push(format!(
            "{path}: scalar {name} should be {}, got {} ({value})",
            expected_json_kind(name),
            kind(value)
        ));
    }
}

fn expected_json_kind(scalar: &str) -> &'static str {
    match scalar {
        "BigInt" => "a number or string",
        "String" | "DateTime" | "URL" | "PrefixedID" | "ID" => "a string",
        "Int" | "Port" => "an integer",
        "Float" => "a number",
        "Boolean" => "a boolean",
        _ => "anything",
    }
}

fn kind(value: &Value) -> &'static str {
    match value {
        Value::Null => "null",
        Value::Bool(_) => "boolean",
        Value::Number(_) => "number",
        Value::String(_) => "string",
        Value::Array(_) => "array",
        Value::Object(_) => "object",
    }
}
