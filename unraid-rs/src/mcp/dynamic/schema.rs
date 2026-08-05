//! Immutable normalized GraphQL schema models and registry.

use std::{
    collections::{BTreeMap, BTreeSet},
    sync::Arc,
};

use serde::{Deserialize, Serialize};

use super::types::{FieldName, TypeName, TypeRef};

/// Optional deprecation metadata preserved from introspection.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Deprecation {
    /// Human-readable reason, when supplied by the upstream.
    pub reason: Option<String>,
}

/// One normalized field argument or input-object field.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct InputValue {
    /// Validated GraphQL name.
    pub name: FieldName,
    /// Normalized human-readable description.
    pub description: Option<String>,
    /// Recursive GraphQL type reference.
    pub ty: TypeRef,
    /// GraphQL default literal, retained verbatim.
    pub default_literal: Option<String>,
    /// Optional deprecation metadata.
    pub deprecation: Option<Deprecation>,
}

/// One normalized object or interface field.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct OutputField {
    /// Validated GraphQL field name.
    pub name: FieldName,
    /// Normalized human-readable description.
    pub description: Option<String>,
    /// Deterministically sorted field arguments.
    pub arguments: Vec<InputValue>,
    /// Recursive return type.
    pub ty: TypeRef,
    /// Optional deprecation metadata.
    pub deprecation: Option<Deprecation>,
}

/// Normalized scalar definition.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ScalarType {
    pub name: TypeName,
    pub description: Option<String>,
    pub specified_by_url: Option<String>,
}

/// Normalized object definition.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ObjectType {
    pub name: TypeName,
    pub description: Option<String>,
    pub fields: Vec<OutputField>,
    pub interfaces: Vec<TypeName>,
}

/// Normalized interface definition.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct InterfaceType {
    pub name: TypeName,
    pub description: Option<String>,
    pub fields: Vec<OutputField>,
    pub interfaces: Vec<TypeName>,
    pub possible_types: Vec<TypeName>,
}

/// Normalized union definition.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct UnionType {
    pub name: TypeName,
    pub description: Option<String>,
    pub possible_types: Vec<TypeName>,
}

/// One normalized enum value.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct EnumValue {
    pub name: FieldName,
    pub description: Option<String>,
    pub deprecation: Option<Deprecation>,
}

/// Normalized enum definition.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct EnumType {
    pub name: TypeName,
    pub description: Option<String>,
    pub values: Vec<EnumValue>,
}

/// Normalized input-object definition.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct InputObjectType {
    pub name: TypeName,
    pub description: Option<String>,
    pub fields: Vec<InputValue>,
}

/// One validated named GraphQL type definition.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TypeDefinition {
    Scalar(ScalarType),
    Object(ObjectType),
    Interface(InterfaceType),
    Union(UnionType),
    Enum(EnumType),
    InputObject(InputObjectType),
}

impl TypeDefinition {
    /// Return the definition name.
    pub fn name(&self) -> &TypeName {
        match self {
            Self::Scalar(value) => &value.name,
            Self::Object(value) => &value.name,
            Self::Interface(value) => &value.name,
            Self::Union(value) => &value.name,
            Self::Enum(value) => &value.name,
            Self::InputObject(value) => &value.name,
        }
    }

    /// Return the GraphQL introspection kind name.
    pub const fn kind_name(&self) -> &'static str {
        match self {
            Self::Scalar(_) => "SCALAR",
            Self::Object(_) => "OBJECT",
            Self::Interface(_) => "INTERFACE",
            Self::Union(_) => "UNION",
            Self::Enum(_) => "ENUM",
            Self::InputObject(_) => "INPUT_OBJECT",
        }
    }

    /// Collect every named type referenced by this definition.
    pub fn referenced_types(&self) -> BTreeSet<TypeName> {
        let mut names = BTreeSet::new();
        match self {
            Self::Scalar(_) | Self::Enum(_) => {}
            Self::Object(value) => {
                names.extend(value.interfaces.iter().cloned());
                collect_output_references(&value.fields, &mut names);
            }
            Self::Interface(value) => {
                names.extend(value.interfaces.iter().cloned());
                names.extend(value.possible_types.iter().cloned());
                collect_output_references(&value.fields, &mut names);
            }
            Self::Union(value) => names.extend(value.possible_types.iter().cloned()),
            Self::InputObject(value) => {
                for field in &value.fields {
                    names.insert(field.ty.named_type().clone());
                }
            }
        }
        names
    }
}

fn collect_output_references(fields: &[OutputField], names: &mut BTreeSet<TypeName>) {
    for field in fields {
        names.insert(field.ty.named_type().clone());
        for argument in &field.arguments {
            names.insert(argument.ty.named_type().clone());
        }
    }
}

/// Immutable navigation over a complete normalized schema graph.
#[derive(Debug, Clone)]
pub struct TypeRegistry {
    types: Arc<BTreeMap<TypeName, TypeDefinition>>,
}

impl TypeRegistry {
    /// Construct an immutable registry.
    pub fn new(types: BTreeMap<TypeName, TypeDefinition>) -> Self {
        Self {
            types: Arc::new(types),
        }
    }

    /// Return all definitions in deterministic order.
    pub fn types(&self) -> &BTreeMap<TypeName, TypeDefinition> {
        &self.types
    }

    /// Resolve any named definition.
    pub fn require(&self, name: &TypeName) -> Result<&TypeDefinition, RegistryError> {
        self.types
            .get(name)
            .ok_or_else(|| RegistryError::Missing(name.clone()))
    }

    /// Resolve an object definition.
    pub fn object(&self, name: &TypeName) -> Result<&ObjectType, RegistryError> {
        match self.require(name)? {
            TypeDefinition::Object(value) => Ok(value),
            other => Err(RegistryError::WrongKind {
                name: name.clone(),
                expected: "OBJECT",
                actual: other.kind_name(),
            }),
        }
    }

    /// Resolve output fields for an object or interface.
    pub fn output_fields(&self, name: &TypeName) -> Result<&[OutputField], RegistryError> {
        match self.require(name)? {
            TypeDefinition::Object(value) => Ok(&value.fields),
            TypeDefinition::Interface(value) => Ok(&value.fields),
            other => Err(RegistryError::WrongKind {
                name: name.clone(),
                expected: "OBJECT or INTERFACE",
                actual: other.kind_name(),
            }),
        }
    }

    /// Resolve input fields for an input object.
    pub fn input_fields(&self, name: &TypeName) -> Result<&[InputValue], RegistryError> {
        match self.require(name)? {
            TypeDefinition::InputObject(value) => Ok(&value.fields),
            other => Err(RegistryError::WrongKind {
                name: name.clone(),
                expected: "INPUT_OBJECT",
                actual: other.kind_name(),
            }),
        }
    }

    /// Resolve possible concrete types for an interface or union.
    pub fn possible_types(&self, name: &TypeName) -> Result<&[TypeName], RegistryError> {
        match self.require(name)? {
            TypeDefinition::Interface(value) => Ok(&value.possible_types),
            TypeDefinition::Union(value) => Ok(&value.possible_types),
            other => Err(RegistryError::WrongKind {
                name: name.clone(),
                expected: "INTERFACE or UNION",
                actual: other.kind_name(),
            }),
        }
    }
}

/// Typed schema-registry lookup error.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum RegistryError {
    #[error("schema type {0} is missing")]
    Missing(TypeName),
    #[error("schema type {name} has kind {actual}, expected {expected}")]
    WrongKind {
        name: TypeName,
        expected: &'static str,
        actual: &'static str,
    },
}
