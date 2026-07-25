from unraid_mcp.devtools.schema_diff_summary import compare_schema_sdl, render_markdown


def test_render_markdown_summarizes_root_type_and_field_changes() -> None:
    old_sdl = """
        type Query {
          docker: Docker!
          oldRoot: String
        }

        type Mutation {
          docker: DockerMutations!
        }

        type Docker {
          containers: [DockerContainer!]!
        }

        type DockerMutations {
          start(id: ID!): DockerContainer!
        }

        type DockerContainer {
          id: ID!
        }

        enum Status {
          OK
        }
    """
    new_sdl = """
        type Query {
          docker: Docker!
          networkInterfaces: [InfoNetworkInterface!]!
        }

        type Mutation {
          docker: DockerMutations!
        }

        type Docker {
          containers: [DockerContainer!]!
        }

        type DockerMutations {
          start(id: ID!): DockerContainer!
          restart(id: ID!): DockerContainer!
        }

        type DockerContainer {
          id: ID!
          status: Status!
        }

        type InfoNetworkInterface {
          name: String!
        }

        enum Status {
          OK
          WARN
        }
    """

    summary = compare_schema_sdl(old_sdl, new_sdl)
    markdown = render_markdown(summary)

    assert "- `Query.networkInterfaces`" in markdown
    assert "- `Query.oldRoot`" in markdown
    assert "- `DockerMutations.restart`" in markdown
    assert "- `DockerContainer.status`" in markdown
    assert "- `Status.WARN`" in markdown
    assert "- `InfoNetworkInterface`" in markdown
