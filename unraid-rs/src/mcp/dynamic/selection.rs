//! Bounded, cycle-safe GraphQL response selection planning.

use std::collections::{BTreeMap, BTreeSet};

use serde::{Deserialize, Serialize};

use super::{
    schema::{OutputField, TypeDefinition, TypeRegistry},
    types::{FieldName, TypeName, TypeRef},
};

/// One node in a validated GraphQL selection tree.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SelectionNode {
    /// Select a concrete field and optional child selection.
    Field {
        /// Field name.
        name: FieldName,
        /// Nested field selection.
        children: Vec<SelectionNode>,
    },
    /// Select fields for one concrete implementation of an abstract type.
    InlineFragment {
        /// Concrete type condition.
        on_type: TypeName,
        /// Fragment child selection.
        children: Vec<SelectionNode>,
    },
    /// Select the GraphQL runtime type name.
    Typename,
}

/// Complete bounded selection plan.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
pub struct SelectionPlan {
    /// Root selection nodes.
    pub nodes: Vec<SelectionNode>,
    /// Number of selected concrete fields.
    pub selected_fields: usize,
    /// Maximum selected object depth.
    pub depth: u8,
    /// Number of inline fragments.
    pub fragments: usize,
}

/// Selection planning or validation failure.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum SelectionError {
    #[error("selection references missing schema type {0}")]
    MissingType(TypeName),
    #[error("selection field {field} does not exist on {parent}")]
    UnknownField { parent: TypeName, field: String },
    #[error("selection field {parent}.{field} requires arguments")]
    FieldRequiresArguments { parent: TypeName, field: FieldName },
    #[error("selection path {0:?} is invalid")]
    InvalidPath(String),
    #[error("selection exceeds maximum field count {0}")]
    FieldLimit(usize),
    #[error("selection exceeds maximum fragment count {0}")]
    FragmentLimit(usize),
    #[error("selection exceeds maximum depth {0}")]
    DepthLimit(u8),
}

/// Generate a conservative default selection for one return type.
pub fn default_selection(
    registry: &TypeRegistry,
    return_type: &TypeRef,
    max_depth: u8,
    max_fields: usize,
    max_fragments: usize,
) -> Result<SelectionPlan, SelectionError> {
    let mut state = PlannerState::new(max_depth, max_fields, max_fragments);
    let mut stack = BTreeSet::new();
    let nodes = plan_named(
        registry,
        return_type.named_type(),
        0,
        &mut stack,
        &mut state,
    )?;
    Ok(state.finish(nodes))
}

/// Validate explicit dotted field paths and compile them into a selection plan.
pub fn requested_selection(
    registry: &TypeRegistry,
    return_type: &TypeRef,
    paths: &[String],
    max_depth: u8,
    max_fields: usize,
    max_fragments: usize,
) -> Result<SelectionPlan, SelectionError> {
    if paths.is_empty() {
        return default_selection(registry, return_type, max_depth, max_fields, max_fragments);
    }
    let mut trie = PathNode::default();
    for path in paths {
        let segments = path.split('.').collect::<Vec<_>>();
        if segments.is_empty()
            || segments.iter().any(|segment| segment.is_empty())
            || segments.len() > usize::from(max_depth) + 1
        {
            return Err(SelectionError::InvalidPath(path.clone()));
        }
        let mut cursor = &mut trie;
        for segment in segments {
            cursor = cursor.children.entry(segment.to_string()).or_default();
        }
        cursor.terminal = true;
    }
    let mut state = PlannerState::new(max_depth, max_fields, max_fragments);
    let nodes = compile_trie(registry, return_type.named_type(), &trie, 0, &mut state)?;
    Ok(state.finish(nodes))
}

/// Render a plan as a GraphQL selection block, without outer field braces.
pub fn render_selection(plan: &SelectionPlan) -> String {
    render_nodes(&plan.nodes)
}

fn render_nodes(nodes: &[SelectionNode]) -> String {
    nodes
        .iter()
        .map(|node| match node {
            SelectionNode::Typename => "__typename".to_string(),
            SelectionNode::Field { name, children } if children.is_empty() => name.to_string(),
            SelectionNode::Field { name, children } => {
                format!("{name} {{ {} }}", render_nodes(children))
            }
            SelectionNode::InlineFragment { on_type, children } => {
                format!("... on {on_type} {{ {} }}", render_nodes(children))
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

#[derive(Default)]
struct PathNode {
    terminal: bool,
    children: BTreeMap<String, PathNode>,
}

struct PlannerState {
    max_depth: u8,
    max_fields: usize,
    max_fragments: usize,
    selected_fields: usize,
    fragments: usize,
    deepest: u8,
}

impl PlannerState {
    fn new(max_depth: u8, max_fields: usize, max_fragments: usize) -> Self {
        Self {
            max_depth,
            max_fields,
            max_fragments,
            selected_fields: 0,
            fragments: 0,
            deepest: 0,
        }
    }

    fn field(&mut self, depth: u8) -> Result<(), SelectionError> {
        self.selected_fields += 1;
        self.deepest = self.deepest.max(depth);
        if self.selected_fields > self.max_fields {
            return Err(SelectionError::FieldLimit(self.max_fields));
        }
        Ok(())
    }

    fn fragment(&mut self) -> Result<(), SelectionError> {
        self.fragments += 1;
        if self.fragments > self.max_fragments {
            return Err(SelectionError::FragmentLimit(self.max_fragments));
        }
        Ok(())
    }

    fn finish(self, nodes: Vec<SelectionNode>) -> SelectionPlan {
        SelectionPlan {
            nodes,
            selected_fields: self.selected_fields,
            depth: self.deepest,
            fragments: self.fragments,
        }
    }
}

fn plan_named(
    registry: &TypeRegistry,
    name: &TypeName,
    depth: u8,
    stack: &mut BTreeSet<TypeName>,
    state: &mut PlannerState,
) -> Result<Vec<SelectionNode>, SelectionError> {
    let definition = registry
        .require(name)
        .map_err(|_| SelectionError::MissingType(name.clone()))?;
    match definition {
        TypeDefinition::Scalar(_) | TypeDefinition::Enum(_) => Ok(Vec::new()),
        TypeDefinition::Object(object) => {
            if !stack.insert(name.clone()) {
                return Ok(vec![SelectionNode::Typename]);
            }
            let nodes = plan_fields(registry, name, &object.fields, depth, stack, state)?;
            stack.remove(name);
            Ok(if nodes.is_empty() {
                vec![SelectionNode::Typename]
            } else {
                nodes
            })
        }
        TypeDefinition::Interface(interface) => {
            let mut nodes = vec![SelectionNode::Typename];
            nodes.extend(plan_fields(
                registry,
                name,
                &interface.fields,
                depth,
                stack,
                state,
            )?);
            if depth < state.max_depth {
                for concrete in &interface.possible_types {
                    state.fragment()?;
                    let children = plan_named(registry, concrete, depth + 1, stack, state)?;
                    nodes.push(SelectionNode::InlineFragment {
                        on_type: concrete.clone(),
                        children,
                    });
                }
            }
            Ok(nodes)
        }
        TypeDefinition::Union(union) => {
            let mut nodes = vec![SelectionNode::Typename];
            if depth < state.max_depth {
                for concrete in &union.possible_types {
                    state.fragment()?;
                    let children = plan_named(registry, concrete, depth + 1, stack, state)?;
                    nodes.push(SelectionNode::InlineFragment {
                        on_type: concrete.clone(),
                        children,
                    });
                }
            }
            Ok(nodes)
        }
        TypeDefinition::InputObject(_) => Err(SelectionError::MissingType(name.clone())),
    }
}

fn plan_fields(
    registry: &TypeRegistry,
    _parent: &TypeName,
    fields: &[OutputField],
    depth: u8,
    stack: &mut BTreeSet<TypeName>,
    state: &mut PlannerState,
) -> Result<Vec<SelectionNode>, SelectionError> {
    let mut nodes = Vec::new();
    for field in fields {
        if !field.arguments.is_empty() {
            continue;
        }
        let child = registry
            .require(field.ty.named_type())
            .map_err(|_| SelectionError::MissingType(field.ty.named_type().clone()))?;
        match child {
            TypeDefinition::Scalar(_) | TypeDefinition::Enum(_) => {
                state.field(depth)?;
                nodes.push(SelectionNode::Field {
                    name: field.name.clone(),
                    children: Vec::new(),
                });
            }
            _ if depth < state.max_depth => {
                let children =
                    plan_named(registry, field.ty.named_type(), depth + 1, stack, state)?;
                if !children.is_empty() {
                    state.field(depth)?;
                    nodes.push(SelectionNode::Field {
                        name: field.name.clone(),
                        children,
                    });
                }
            }
            _ => {}
        }
    }
    Ok(nodes)
}

fn compile_trie(
    registry: &TypeRegistry,
    parent: &TypeName,
    trie: &PathNode,
    depth: u8,
    state: &mut PlannerState,
) -> Result<Vec<SelectionNode>, SelectionError> {
    if depth > state.max_depth {
        return Err(SelectionError::DepthLimit(state.max_depth));
    }
    let fields = registry
        .output_fields(parent)
        .map_err(|_| SelectionError::MissingType(parent.clone()))?;
    let by_name = fields
        .iter()
        .map(|field| (field.name.as_str(), field))
        .collect::<BTreeMap<_, _>>();
    let mut nodes = Vec::new();
    for (requested, child_trie) in &trie.children {
        let field =
            by_name
                .get(requested.as_str())
                .ok_or_else(|| SelectionError::UnknownField {
                    parent: parent.clone(),
                    field: requested.clone(),
                })?;
        if !field.arguments.is_empty() {
            return Err(SelectionError::FieldRequiresArguments {
                parent: parent.clone(),
                field: field.name.clone(),
            });
        }
        let definition = registry
            .require(field.ty.named_type())
            .map_err(|_| SelectionError::MissingType(field.ty.named_type().clone()))?;
        let children = match definition {
            TypeDefinition::Scalar(_) | TypeDefinition::Enum(_) => {
                if !child_trie.children.is_empty() {
                    return Err(SelectionError::InvalidPath(requested.clone()));
                }
                Vec::new()
            }
            _ => {
                if child_trie.children.is_empty() {
                    return Err(SelectionError::InvalidPath(requested.clone()));
                }
                compile_trie(
                    registry,
                    field.ty.named_type(),
                    child_trie,
                    depth + 1,
                    state,
                )?
            }
        };
        state.field(depth)?;
        nodes.push(SelectionNode::Field {
            name: field.name.clone(),
            children,
        });
    }
    Ok(nodes)
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use crate::mcp::dynamic::{
        introspection::IntrospectionResponse,
        normalize::normalize_type,
        schema::TypeRegistry,
        types::{TypeName, TypeRef},
    };

    use super::{default_selection, render_selection, requested_selection};

    const FIXTURE: &str = include_str!("../../../tests/fixtures/dynamic/minimal-query-types.json");

    fn registry() -> TypeRegistry {
        let response: IntrospectionResponse = serde_json::from_str(FIXTURE).unwrap();
        let definitions = response
            .data
            .unwrap()
            .aliases
            .into_values()
            .flatten()
            .map(|wire| {
                let name = TypeName::new(wire.name.clone().unwrap()).unwrap();
                (name.clone(), normalize_type(name, wire).unwrap())
            })
            .collect::<BTreeMap<_, _>>();
        TypeRegistry::new(definitions)
    }

    #[test]
    fn dynamic_default_selection_is_bounded_and_skips_argument_fields() {
        let plan = default_selection(
            &registry(),
            &TypeRef::Named(TypeName::new("Query").unwrap()),
            2,
            10,
            4,
        )
        .unwrap();
        assert_eq!(render_selection(&plan), "ping");
    }

    #[test]
    fn dynamic_requested_selection_validates_paths() {
        let plan = requested_selection(
            &registry(),
            &TypeRef::Named(TypeName::new("Disk").unwrap()),
            &["id".to_string()],
            2,
            10,
            4,
        )
        .unwrap();
        assert_eq!(render_selection(&plan), "id");
        assert!(
            requested_selection(
                &registry(),
                &TypeRef::Named(TypeName::new("Disk").unwrap()),
                &["missing".to_string()],
                2,
                10,
                4,
            )
            .is_err()
        );
    }

    #[test]
    fn dynamic_selection_enforces_field_limit() {
        assert!(
            default_selection(
                &registry(),
                &TypeRef::Named(TypeName::new("Query").unwrap()),
                2,
                0,
                4,
            )
            .is_err()
        );
    }
}
