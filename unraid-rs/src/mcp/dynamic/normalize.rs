//! Validation and normalization of targeted introspection responses.

use std::collections::BTreeSet;

use super::{
    introspection::{
        DiscoveryError, IntrospectionEnumValue, IntrospectionField, IntrospectionInputValue,
        IntrospectionNamedType, IntrospectionType, TypeKind,
    },
    schema::{
        Deprecation, EnumType, EnumValue, InputObjectType, InputValue, InterfaceType, ObjectType,
        OutputField, ScalarType, TypeDefinition, UnionType,
    },
    types::{FieldName, TypeName, TypeRef},
};

/// Convert one introspection response into a validated normalized definition.
pub fn normalize_type(
    requested_name: TypeName,
    wire: IntrospectionType,
) -> Result<TypeDefinition, DiscoveryError> {
    let returned_name = wire.name.as_deref().ok_or_else(|| {
        DiscoveryError::InvalidDefinition(format!("requested {requested_name} returned no name"))
    })?;
    if returned_name != requested_name.as_str() {
        return Err(DiscoveryError::InvalidDefinition(format!(
            "requested {requested_name} but response named {returned_name}"
        )));
    }
    let description = normalize_text(wire.description.clone());

    match wire.kind {
        TypeKind::Scalar => {
            reject_nonempty_shape(&wire, "SCALAR")?;
            Ok(TypeDefinition::Scalar(ScalarType {
                name: requested_name,
                description,
                specified_by_url: wire.specified_by_url,
            }))
        }
        TypeKind::Object => {
            reject_object_shape(&wire)?;
            Ok(TypeDefinition::Object(ObjectType {
                name: requested_name,
                description,
                fields: normalize_output_fields(required(wire.fields, "OBJECT fields")?)?,
                interfaces: normalize_named_types(wire.interfaces.unwrap_or_default())?,
            }))
        }
        TypeKind::Interface => {
            reject_interface_shape(&wire)?;
            Ok(TypeDefinition::Interface(InterfaceType {
                name: requested_name,
                description,
                fields: normalize_output_fields(required(wire.fields, "INTERFACE fields")?)?,
                interfaces: normalize_named_types(wire.interfaces.unwrap_or_default())?,
                possible_types: normalize_named_types(wire.possible_types.unwrap_or_default())?,
            }))
        }
        TypeKind::Union => {
            reject_shape_except(&wire, TypeKind::Union)?;
            Ok(TypeDefinition::Union(UnionType {
                name: requested_name,
                description,
                possible_types: normalize_named_types(required(
                    wire.possible_types,
                    "UNION possibleTypes",
                )?)?,
            }))
        }
        TypeKind::Enum => {
            reject_shape_except(&wire, TypeKind::Enum)?;
            Ok(TypeDefinition::Enum(EnumType {
                name: requested_name,
                description,
                values: normalize_enum_values(required(wire.enum_values, "ENUM enumValues")?)?,
            }))
        }
        TypeKind::InputObject => {
            reject_shape_except(&wire, TypeKind::InputObject)?;
            Ok(TypeDefinition::InputObject(InputObjectType {
                name: requested_name,
                description,
                fields: normalize_input_values(required(
                    wire.input_fields,
                    "INPUT_OBJECT inputFields",
                )?)?,
            }))
        }
        TypeKind::List | TypeKind::NonNull => Err(DiscoveryError::InvalidDefinition(
            "top-level named definition cannot be LIST or NON_NULL".to_string(),
        )),
    }
}

fn required<T>(value: Option<T>, label: &str) -> Result<T, DiscoveryError> {
    value.ok_or_else(|| DiscoveryError::InvalidDefinition(format!("missing {label}")))
}

fn normalize_text(value: Option<String>) -> Option<String> {
    value.map(|text| text.replace("\r\n", "\n").replace('\r', "\n"))
}

fn deprecation(flag: bool, reason: Option<String>) -> Option<Deprecation> {
    flag.then(|| Deprecation {
        reason: normalize_text(reason),
    })
}

fn normalize_output_fields(
    fields: Vec<IntrospectionField>,
) -> Result<Vec<OutputField>, DiscoveryError> {
    let mut names = BTreeSet::new();
    let mut normalized = Vec::with_capacity(fields.len());
    for field in fields {
        let name = FieldName::new(&field.name)
            .map_err(|error| DiscoveryError::InvalidDefinition(error.to_string()))?;
        if !names.insert(name.clone()) {
            return Err(DiscoveryError::InvalidDefinition(format!(
                "duplicate field {name}"
            )));
        }
        normalized.push(OutputField {
            name,
            description: normalize_text(field.description),
            arguments: normalize_input_values(field.args)?,
            ty: TypeRef::try_from(field.ty)?,
            deprecation: deprecation(field.is_deprecated, field.deprecation_reason),
        });
    }
    normalized.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(normalized)
}

fn normalize_input_values(
    values: Vec<IntrospectionInputValue>,
) -> Result<Vec<InputValue>, DiscoveryError> {
    let mut names = BTreeSet::new();
    let mut normalized = Vec::with_capacity(values.len());
    for value in values {
        let name = FieldName::new(&value.name)
            .map_err(|error| DiscoveryError::InvalidDefinition(error.to_string()))?;
        if !names.insert(name.clone()) {
            return Err(DiscoveryError::InvalidDefinition(format!(
                "duplicate input value {name}"
            )));
        }
        normalized.push(InputValue {
            name,
            description: normalize_text(value.description),
            ty: TypeRef::try_from(value.ty)?,
            default_literal: value.default_value,
            deprecation: deprecation(value.is_deprecated, value.deprecation_reason),
        });
    }
    normalized.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(normalized)
}

fn normalize_named_types(
    values: Vec<IntrospectionNamedType>,
) -> Result<Vec<TypeName>, DiscoveryError> {
    let mut normalized = BTreeSet::new();
    for value in values {
        if matches!(value.kind, TypeKind::List | TypeKind::NonNull) {
            return Err(DiscoveryError::InvalidDefinition(
                "named type list contains wrapper kind".to_string(),
            ));
        }
        let name = value.name.ok_or_else(|| {
            DiscoveryError::InvalidDefinition("named type reference has no name".to_string())
        })?;
        let name = TypeName::new(name)
            .map_err(|error| DiscoveryError::InvalidDefinition(error.to_string()))?;
        if !normalized.insert(name.clone()) {
            return Err(DiscoveryError::InvalidDefinition(format!(
                "duplicate named type {name}"
            )));
        }
    }
    Ok(normalized.into_iter().collect())
}

fn normalize_enum_values(
    values: Vec<IntrospectionEnumValue>,
) -> Result<Vec<EnumValue>, DiscoveryError> {
    let mut names = BTreeSet::new();
    let mut normalized = Vec::with_capacity(values.len());
    for value in values {
        let name = FieldName::new(&value.name)
            .map_err(|error| DiscoveryError::InvalidDefinition(error.to_string()))?;
        if !names.insert(name.clone()) {
            return Err(DiscoveryError::InvalidDefinition(format!(
                "duplicate enum value {name}"
            )));
        }
        normalized.push(EnumValue {
            name,
            description: normalize_text(value.description),
            deprecation: deprecation(value.is_deprecated, value.deprecation_reason),
        });
    }
    normalized.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(normalized)
}

fn reject_object_shape(wire: &IntrospectionType) -> Result<(), DiscoveryError> {
    if has_items(&wire.input_fields)
        || has_items(&wire.enum_values)
        || has_items(&wire.possible_types)
    {
        return Err(DiscoveryError::InvalidDefinition(
            "OBJECT contains fields reserved for another type kind".to_string(),
        ));
    }
    Ok(())
}

fn reject_interface_shape(wire: &IntrospectionType) -> Result<(), DiscoveryError> {
    if has_items(&wire.input_fields) || has_items(&wire.enum_values) {
        return Err(DiscoveryError::InvalidDefinition(
            "INTERFACE contains fields reserved for another type kind".to_string(),
        ));
    }
    Ok(())
}

fn reject_nonempty_shape(wire: &IntrospectionType, kind: &str) -> Result<(), DiscoveryError> {
    if has_items(&wire.fields)
        || has_items(&wire.input_fields)
        || has_items(&wire.interfaces)
        || has_items(&wire.enum_values)
        || has_items(&wire.possible_types)
    {
        return Err(DiscoveryError::InvalidDefinition(format!(
            "{kind} contains fields reserved for another type kind"
        )));
    }
    Ok(())
}

fn reject_shape_except(wire: &IntrospectionType, kind: TypeKind) -> Result<(), DiscoveryError> {
    let invalid = match kind {
        TypeKind::Union => {
            has_items(&wire.fields)
                || has_items(&wire.input_fields)
                || has_items(&wire.interfaces)
                || has_items(&wire.enum_values)
        }
        TypeKind::Enum => {
            has_items(&wire.fields)
                || has_items(&wire.input_fields)
                || has_items(&wire.interfaces)
                || has_items(&wire.possible_types)
        }
        TypeKind::InputObject => {
            has_items(&wire.fields)
                || has_items(&wire.interfaces)
                || has_items(&wire.enum_values)
                || has_items(&wire.possible_types)
        }
        _ => false,
    };
    if invalid {
        return Err(DiscoveryError::InvalidDefinition(format!(
            "{kind:?} contains fields reserved for another type kind"
        )));
    }
    Ok(())
}

fn has_items<T>(value: &Option<Vec<T>>) -> bool {
    value.as_ref().is_some_and(|items| !items.is_empty())
}

#[cfg(test)]
mod tests {
    use std::collections::{BTreeMap, BTreeSet};

    use crate::mcp::dynamic::{
        introspection::{IntrospectionResponse, TypeKind},
        schema::{TypeDefinition, TypeRegistry},
        types::TypeName,
    };

    use super::normalize_type;

    const FIXTURE: &str = include_str!("../../../tests/fixtures/dynamic/minimal-query-types.json");

    #[test]
    fn dynamic_normalize_object_sorts_fields_and_collects_references() {
        let response: IntrospectionResponse = serde_json::from_str(FIXTURE).unwrap();
        let query = response.data.unwrap().aliases["t0"].clone().unwrap();
        let normalized = normalize_type(TypeName::new("Query").unwrap(), query).unwrap();
        let TypeDefinition::Object(query) = normalized else {
            panic!("expected object")
        };
        assert_eq!(
            query
                .fields
                .iter()
                .map(|field| field.name.as_str())
                .collect::<Vec<_>>(),
            vec!["disk", "ping"]
        );
        let references = TypeDefinition::Object(query)
            .referenced_types()
            .into_iter()
            .map(|name| name.to_string())
            .collect::<BTreeSet<_>>();
        assert_eq!(
            references,
            BTreeSet::from([
                "Boolean".to_string(),
                "Disk".to_string(),
                "PrefixedID".to_string()
            ])
        );
    }

    #[test]
    fn dynamic_normalize_rejects_duplicate_fields() {
        let response: IntrospectionResponse = serde_json::from_str(FIXTURE).unwrap();
        let mut query = response.data.unwrap().aliases["t0"].clone().unwrap();
        let fields = query.fields.as_mut().unwrap();
        fields.push(fields[0].clone());
        let error = normalize_type(TypeName::new("Query").unwrap(), query).unwrap_err();
        assert!(error.to_string().contains("duplicate field"));
    }

    #[test]
    fn dynamic_normalize_rejects_kind_shape_mismatch() {
        let response: IntrospectionResponse = serde_json::from_str(FIXTURE).unwrap();
        let mut query = response.data.unwrap().aliases["t0"].clone().unwrap();
        query.kind = TypeKind::Scalar;
        let error = normalize_type(TypeName::new("Query").unwrap(), query).unwrap_err();
        assert!(error.to_string().contains("SCALAR"));
    }

    #[test]
    fn dynamic_type_registry_reports_missing_and_wrong_kind() {
        let response: IntrospectionResponse = serde_json::from_str(FIXTURE).unwrap();
        let mut definitions = BTreeMap::new();
        for wire in response.data.unwrap().aliases.into_values().flatten() {
            let name = TypeName::new(wire.name.clone().unwrap()).unwrap();
            definitions.insert(name.clone(), normalize_type(name, wire).unwrap());
        }
        let registry = TypeRegistry::new(definitions);
        assert_eq!(
            registry
                .output_fields(&TypeName::new("Query").unwrap())
                .unwrap()
                .len(),
            2
        );
        assert!(registry.object(&TypeName::new("Boolean").unwrap()).is_err());
        assert!(
            registry
                .require(&TypeName::new("Missing").unwrap())
                .is_err()
        );
    }
}
