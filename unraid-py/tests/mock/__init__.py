"""Mock GraphQL server harness — package marker so this dir's conftest is
imported as ``mock.conftest`` and does not shadow the top-level ``conftest``
(which other tests import via ``from conftest import make_tool_fn``).
"""
