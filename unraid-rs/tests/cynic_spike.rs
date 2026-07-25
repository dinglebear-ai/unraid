//! cynic migration spike — proves a typed operation yields the *same* `Value`
//! the hand-written string query does, so the rest of the stack (dispatch, CLI
//! formatters, MCP) is unaffected by the migration. Validates the three things
//! that could bite: custom scalars (`BigInt`→string, `PrefixedID`), enum
//! round-tripping, and camelCase field mapping.

use serde_json::Value;
use unraid_rmcp::config::UnraidConfig;
use unraid_rmcp::graphql::UnraidClient;
use unraid_rmcp::mock::Scenario;
use wiremock::{Mock, MockServer, Request, Respond, ResponseTemplate};

struct ScenarioResponder {
    scenario: Scenario,
}
impl Respond for ScenarioResponder {
    fn respond(&self, request: &Request) -> ResponseTemplate {
        let body: Value = serde_json::from_slice(&request.body).unwrap_or(Value::Null);
        let query = body.get("query").and_then(Value::as_str).unwrap_or("");
        ResponseTemplate::new(200).set_body_json(self.scenario.respond(query))
    }
}

async fn healthy_client() -> (MockServer, UnraidClient) {
    let server = MockServer::start().await;
    Mock::given(wiremock::matchers::method("POST"))
        .respond_with(ScenarioResponder {
            scenario: Scenario::load("healthy").unwrap(),
        })
        .mount(&server)
        .await;
    let client = UnraidClient::new(&UnraidConfig {
        api_url: server.uri(),
        api_key: "test".into(),
        skip_tls_verify: true,
    })
    .unwrap();
    (server, client)
}

/// `flash`: trivial type — exercises `PrefixedID` scalar + camelCase.
#[tokio::test]
async fn typed_flash_matches_hand_written() {
    let (_server, client) = healthy_client().await;
    let hand = client.flash().await.expect("hand-written flash");
    let typed = client.flash_typed().await.expect("typed flash");
    assert_eq!(
        typed, hand,
        "typed flash must serialise to the same Value as the string query"
    );
}

/// `array`: deeply nested, lists, `BigInt` scalars, five enums — the real stress
/// test for the migration strategy.
#[tokio::test]
async fn typed_array_matches_hand_written() {
    let (_server, client) = healthy_client().await;
    let hand = client.array().await.expect("hand-written array");
    let typed = client.array_typed().await.expect("typed array");
    assert_eq!(
        typed, hand,
        "typed array must serialise to the same Value as the string query"
    );
}
