//! Registers the vendored Unraid SDL with cynic so GraphQL operations defined
//! with `#[derive(cynic::QueryFragment)]` are type-checked against the real
//! schema at compile time.

fn main() {
    println!("cargo:rerun-if-changed=schema/unraid-schema.graphql");
    cynic_codegen::register_schema("unraid")
        .from_sdl_file("schema/unraid-schema.graphql")
        .expect("vendored Unraid SDL should parse")
        .as_default()
        .expect("registering the default cynic schema should succeed");
}
