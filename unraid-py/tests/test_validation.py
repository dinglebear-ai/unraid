"""Tests for shared input validation constants in unraid_mcp.core.validation."""

import pytest

from unraid_mcp.core.validation import DANGEROUS_KEY_PATTERN


class TestDangerousKeyPattern:
    """DANGEROUS_KEY_PATTERN should block all documented dangerous characters."""

    @pytest.mark.parametrize(
        "char",
        [
            "&",
            "<",
            ">",
            "'",
            '"',
            "#",
            " ",  # space (0x20)
            "\x7f",  # DEL
            "\x00",  # null
            "\x1f",  # control character
            "..",  # path traversal sequence
            "/",
            "\\",
            ";",
            "|",
            "`",
            "$",
            "(",
            ")",
            "{",
            "}",
        ],
    )
    def test_dangerous_chars_match(self, char: str) -> None:
        """Each documented dangerous character or sequence must match the pattern."""
        assert DANGEROUS_KEY_PATTERN.search(char), (
            f"Expected DANGEROUS_KEY_PATTERN to match {char!r} but it did not"
        )

    @pytest.mark.parametrize(
        "key",
        [
            "my_remote",
            "gdrive",
            "s3-backup",
            "UNRAID_API_URL",
            "setting123",
            "CamelCase",
        ],
    )
    def test_safe_keys_do_not_match(self, key: str) -> None:
        """Alphanumeric keys with underscores/hyphens should NOT match."""
        assert not DANGEROUS_KEY_PATTERN.search(key), (
            f"Expected DANGEROUS_KEY_PATTERN NOT to match {key!r} but it did"
        )


class TestValidateInputMapping:
    """validate_input_mapping bounds nested GraphQL inputs and rejects unsafe shapes."""

    def test_preserves_nested_structure(self) -> None:
        from unraid_mcp.core.validation import validate_input_mapping

        payload = {
            "enabled": True,
            "thresholds": {"cpu_warning": 70, "cpu_critical": 90},
            "servers": ["a", "b"],
            "optional": None,
        }
        assert validate_input_mapping(payload, "x") == payload

    def test_rejects_dangerous_key(self) -> None:
        from unraid_mcp.core.exceptions import ToolError
        from unraid_mcp.core.validation import validate_input_mapping

        with pytest.raises(ToolError, match="disallowed characters"):
            validate_input_mapping({"bad;key": 1}, "x")

    def test_rejects_dangerous_key_when_nested(self) -> None:
        from unraid_mcp.core.exceptions import ToolError
        from unraid_mcp.core.validation import validate_input_mapping

        with pytest.raises(ToolError, match="disallowed characters"):
            validate_input_mapping({"outer": {"in/ner": 1}}, "x")

    def test_rejects_too_many_keys(self) -> None:
        from unraid_mcp.core.exceptions import ToolError
        from unraid_mcp.core.validation import validate_input_mapping

        with pytest.raises(ToolError, match="max"):
            validate_input_mapping({f"k{i}": i for i in range(11)}, "x", max_keys=10)

    def test_rejects_excessive_depth(self) -> None:
        from unraid_mcp.core.exceptions import ToolError
        from unraid_mcp.core.validation import validate_input_mapping

        deep: dict = {"v": 1}
        for _ in range(5):
            deep = {"v": deep}
        with pytest.raises(ToolError, match="depth"):
            validate_input_mapping(deep, "x", max_depth=2)

    def test_rejects_oversized_string(self) -> None:
        from unraid_mcp.core.exceptions import ToolError
        from unraid_mcp.core.validation import MAX_VALUE_LENGTH, validate_input_mapping

        with pytest.raises(ToolError, match="max length"):
            validate_input_mapping({"k": "x" * (MAX_VALUE_LENGTH + 1)}, "x")

    def test_rejects_non_scalar_leaf(self) -> None:
        from unraid_mcp.core.exceptions import ToolError
        from unraid_mcp.core.validation import validate_input_mapping

        with pytest.raises(ToolError, match="must be a scalar"):
            validate_input_mapping({"k": {1, 2, 3}}, "x")

    def test_non_string_key_rejected(self) -> None:
        from unraid_mcp.core.exceptions import ToolError
        from unraid_mcp.core.validation import validate_input_mapping

        with pytest.raises(ToolError, match="non-empty strings"):
            validate_input_mapping({1: "v"}, "x")


class TestValidateInputMappingNonDict:
    def test_top_level_non_dict_rejected(self) -> None:
        from unraid_mcp.core.exceptions import ToolError
        from unraid_mcp.core.validation import validate_input_mapping

        with pytest.raises(ToolError, match="must be an object"):
            validate_input_mapping("not-a-dict", "x")  # type: ignore[arg-type]

    def test_list_item_non_dict_rejected_with_index(self) -> None:
        from unraid_mcp.core.exceptions import ToolError
        from unraid_mcp.core.validation import validate_input_mapping_list

        with pytest.raises(ToolError, match=r"x\[1\] must be an object"):
            validate_input_mapping_list([{"ok": 1}, "bad"], "x")

    def test_list_of_objects_passes(self) -> None:
        from unraid_mcp.core.validation import validate_input_mapping_list

        assert validate_input_mapping_list([{"a": 1}, {"b": 2}], "x") == [{"a": 1}, {"b": 2}]


class TestValidateStrParam:
    def test_within_limit_passthrough(self) -> None:
        from unraid_mcp.core.validation import validate_str_param

        assert validate_str_param("Tower", "name") == "Tower"

    def test_over_limit_rejected(self) -> None:
        from unraid_mcp.core.exceptions import ToolError
        from unraid_mcp.core.validation import MAX_VALUE_LENGTH, validate_str_param

        with pytest.raises(ToolError, match="max length"):
            validate_str_param("x" * (MAX_VALUE_LENGTH + 1), "name")
