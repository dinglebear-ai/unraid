"""Tests for unraid_mcp.core.client — GraphQL client infrastructure."""

import json
import time
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from unraid_mcp.core.client import (
    _HTTP_CODE_304,
    _START_IDEMPOTENT_PHRASES,
    _STOP_IDEMPOTENT_PHRASES,
    DEFAULT_TIMEOUT,
    DISK_TIMEOUT,
    _RateLimiter,
    is_idempotent_error,
    make_graphql_request,
    redact_sensitive,
)
from unraid_mcp.core.exceptions import (
    CredentialsNotConfiguredError,
    ToolError,
    tool_error_handler,
)


# ---------------------------------------------------------------------------
# is_idempotent_error
# ---------------------------------------------------------------------------


class TestIsIdempotentError:
    """Verify all idempotent error pattern matches."""

    def test_start_already_started(self) -> None:
        assert is_idempotent_error("Container already started", "start") is True

    def test_start_container_already_running(self) -> None:
        assert is_idempotent_error("container already running", "start") is True

    def test_start_http_code_304(self) -> None:
        assert is_idempotent_error("HTTP code 304 - not modified", "start") is True

    def test_stop_already_stopped(self) -> None:
        assert is_idempotent_error("Container already stopped", "stop") is True

    def test_stop_not_running(self) -> None:
        assert is_idempotent_error("container not running", "stop") is True

    def test_stop_http_code_304(self) -> None:
        assert is_idempotent_error("HTTP code 304", "stop") is True

    def test_start_unrelated_error(self) -> None:
        assert is_idempotent_error("permission denied", "start") is False

    def test_stop_unrelated_error(self) -> None:
        assert is_idempotent_error("image not found", "stop") is False

    def test_unknown_operation(self) -> None:
        assert is_idempotent_error("already started", "restart") is False

    def test_case_insensitive(self) -> None:
        assert is_idempotent_error("ALREADY STARTED", "start") is True
        assert is_idempotent_error("ALREADY STOPPED", "stop") is True

    def test_idempotent_constants_drive_matching(self) -> None:
        """Every named constant phrase must actually match its operation."""
        # The numeric 304 signal is idempotent for BOTH operations.
        assert is_idempotent_error(_HTTP_CODE_304, "start") is True
        assert is_idempotent_error(_HTTP_CODE_304, "stop") is True
        # Each prose phrase must match (and stay in its own operation's bucket).
        for phrase in _START_IDEMPOTENT_PHRASES:
            assert is_idempotent_error(phrase, "start") is True
        for phrase in _STOP_IDEMPOTENT_PHRASES:
            assert is_idempotent_error(phrase, "stop") is True


# ---------------------------------------------------------------------------
# redact_sensitive
# ---------------------------------------------------------------------------


class TestRedactSensitive:
    """Verify recursive redaction of sensitive keys."""

    def test_flat_dict(self) -> None:
        data = {"username": "admin", "password": "hunter2", "host": "10.0.0.1"}
        result = redact_sensitive(data)
        assert result["username"] == "admin"
        assert result["password"] == "***"
        assert result["host"] == "10.0.0.1"

    def test_nested_dict(self) -> None:
        data = {"config": {"apiKey": "abc123", "url": "http://host"}}
        result = redact_sensitive(data)
        assert result["config"]["apiKey"] == "***"
        assert result["config"]["url"] == "http://host"

    def test_list_of_dicts(self) -> None:
        data = [{"token": "t1"}, {"name": "safe"}]
        result = redact_sensitive(data)
        assert result[0]["token"] == "***"
        assert result[1]["name"] == "safe"

    def test_deeply_nested(self) -> None:
        data = {"a": {"b": {"c": {"secret": "deep"}}}}
        result = redact_sensitive(data)
        assert result["a"]["b"]["c"]["secret"] == "***"

    def test_non_dict_passthrough(self) -> None:
        assert redact_sensitive("plain_string") == "plain_string"
        assert redact_sensitive(42) == 42
        assert redact_sensitive(None) is None

    def test_case_insensitive_keys(self) -> None:
        data = {"Password": "p1", "TOKEN": "t1", "ApiKey": "k1", "Secret": "s1", "Key": "x1"}
        result = redact_sensitive(data)
        for v in result.values():
            assert v == "***"

    def test_compound_key_names(self) -> None:
        """Keys containing sensitive substrings (e.g. 'user_password') are redacted."""
        data = {
            "user_password": "p1",
            "api_key_value": "k1",
            "auth_token_expiry": "t1",
            "client_secret_id": "s1",
            "username": "safe",
            "host": "safe",
        }
        result = redact_sensitive(data)
        assert result["user_password"] == "***"
        assert result["api_key_value"] == "***"
        assert result["auth_token_expiry"] == "***"
        assert result["client_secret_id"] == "***"
        assert result["username"] == "safe"
        assert result["host"] == "safe"

    def test_mixed_list_content(self) -> None:
        data = [{"key": "val"}, "string", 123, [{"token": "inner"}]]
        result = redact_sensitive(data)
        assert result[0]["key"] == "***"
        assert result[1] == "string"
        assert result[2] == 123
        assert result[3][0]["token"] == "***"

    def test_new_sensitive_keys_are_redacted(self) -> None:
        """PR-added keys: authorization, cookie, session, credential, passphrase, jwt."""
        data = {
            "authorization": "Bearer token123",
            "cookie": "session=abc",
            "jwt": "eyJ...",
            "credential": "secret_cred",
            "passphrase": "hunter2",
            "session": "sess_id",
        }
        result = redact_sensitive(data)
        for key, val in result.items():
            assert val == "***", f"Key '{key}' was not redacted"

    def test_additional_sensitive_keys_are_redacted(self) -> None:
        """client_secret, activation_code, private_key keys are redacted by name."""
        data = {
            "client_secret": "cs_value",
            "clientSecret": "cs_value2",
            "activation_code": "AC-123",
            "activationCode": "AC-456",
            "private_key": "pk_value",
            "privateKey": "pk_value2",
            "username": "safe",
        }
        result = redact_sensitive(data)
        assert result["client_secret"] == "***"
        assert result["clientSecret"] == "***"
        assert result["activation_code"] == "***"
        assert result["activationCode"] == "***"
        assert result["private_key"] == "***"
        assert result["privateKey"] == "***"
        assert result["username"] == "safe"

    def test_jwt_shaped_value_redacted_under_innocuous_key(self) -> None:
        """A JWT-shaped value is masked even when its key is not sensitive."""
        jwt = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
            ".eyJzdWIiOiIxMjM0NTY3ODkwIn0"
            ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        )
        data = {"note": jwt, "comment": "this is fine"}
        result = redact_sensitive(data)
        assert result["note"] == "***"
        assert result["comment"] == "this is fine"

    def test_sk_prefixed_token_value_redacted(self) -> None:
        """An sk- prefixed token value is masked regardless of key name."""
        data = {"detail": "sk-abcdef0123456789ABCDEF"}
        result = redact_sensitive(data)
        assert result["detail"] == "***"

    def test_high_entropy_token_value_redacted(self) -> None:
        """A long mixed-charset opaque token is masked even under a benign key."""
        data = {"misc": "AKIA1234567890ABCDEFxyz0987654321"}
        result = redact_sensitive(data)
        assert result["misc"] == "***"

    def test_client_secret_key_and_jwt_value_both_masked_ordinary_kept(self) -> None:
        """Combined: client_secret key masked, JWT value masked, ordinary text kept."""
        jwt = "eyJ0eXAiOiJKV1QifQ.eyJpZCI6N30.AbCdEfGhIjKlMnOpQrStUvWxYz012345"
        data = {
            "client_secret": "whatever",
            "blob": jwt,
            "description": "A perfectly ordinary sentence with words.",
        }
        result = redact_sensitive(data)
        assert result["client_secret"] == "***"
        assert result["blob"] == "***"
        assert result["description"] == "A perfectly ordinary sentence with words."

    def test_ordinary_strings_not_redacted(self) -> None:
        """Plain text, URLs, paths, short IDs, and pure-numeric values survive."""
        data = {
            "msg": "the array is healthy and mounted",
            "url": "https://unraid.local/graphql",
            "path": "/mnt/user/appdata",
            "short": "abc123",  # below length floor
            "count": "1234567890123456789012345",  # long but no letters
            "words": "alphabetical-words-with-no-digits-but-long-enough-here",
        }
        result = redact_sensitive(data)
        assert result["msg"] == "the array is healthy and mounted"
        assert result["url"] == "https://unraid.local/graphql"
        assert result["path"] == "/mnt/user/appdata"
        assert result["short"] == "abc123"
        assert result["count"] == "1234567890123456789012345"
        assert result["words"] == "alphabetical-words-with-no-digits-but-long-enough-here"

    def test_top_level_secret_string_redacted(self) -> None:
        """A bare JWT string (not in a dict) is redacted by value scanning."""
        jwt = "eyJ0eXAiOiJKV1QifQ.eyJpZCI6N30.AbCdEfGhIjKlMnOpQrStUvWxYz012345"
        assert redact_sensitive(jwt) == "***"

    def test_embedded_secrets_are_masked_and_output_is_bounded(self) -> None:
        fake_token = "".join(("sk-", "abcdefghijklmnop", "1234"))
        embedded = f"request failed Authorization: Bearer {fake_token}"
        value = redact_sensitive({"errors": [{"message": embedded}], "huge": "x" * 20_000})
        rendered = json.dumps(value)
        assert fake_token not in rendered
        assert "Authorization: Bearer" not in rendered
        assert len(rendered) < 10_000

    def test_depth_and_collection_width_are_bounded(self) -> None:
        deep: dict[str, object] = {}
        cursor = deep
        for index in range(30):
            child: dict[str, object] = {}
            cursor[str(index)] = child
            cursor = child
        wide = {str(index): index for index in range(1_000)}
        assert "truncated" in json.dumps(redact_sensitive({"deep": deep, "wide": wide})).lower()


# ---------------------------------------------------------------------------
# tool_error_handler — error classification
# ---------------------------------------------------------------------------


class TestToolErrorHandler:
    """Verify tool_error_handler distinguishes likely-bug vs upstream errors."""

    def _logger(self) -> MagicMock:
        return MagicMock()

    def test_keyerror_maps_to_internal_bug_class(self) -> None:
        logger = self._logger()
        with (
            pytest.raises(ToolError) as exc_info,
            tool_error_handler("docker", "list", logger),
        ):
            raise KeyError("missing_field")
        msg = str(exc_info.value)
        assert "likely a server bug" in msg
        assert "Retrying is unlikely to help" in msg
        # No internal specifics leaked (the missing key name must not appear).
        assert "missing_field" not in msg
        logger.exception.assert_called_once()

    @pytest.mark.parametrize("exc", [AttributeError, TypeError, IndexError, NameError])
    def test_other_bug_types_map_to_internal_class(self, exc: type[Exception]) -> None:
        logger = self._logger()
        with (
            pytest.raises(ToolError, match="likely a server bug"),
            tool_error_handler("vm", "start", logger),
        ):
            raise exc("boom")

    def test_network_error_maps_to_upstream_class(self) -> None:
        logger = self._logger()
        with (
            pytest.raises(ToolError) as exc_info,
            tool_error_handler("system", "overview", logger),
        ):
            raise httpx.ConnectError("Connection refused")
        msg = str(exc_info.value)
        assert "upstream/network error" in msg
        assert "retrying may help" in msg
        assert "likely a server bug" not in msg
        logger.exception.assert_called_once()

    def test_generic_runtime_error_maps_to_internal_class(self) -> None:
        logger = self._logger()
        with (
            pytest.raises(ToolError, match="Internal error"),
            tool_error_handler("array", "parity_status", logger),
        ):
            raise RuntimeError("unexpected upstream state")

    def test_credentials_remediation_names_the_consolidated_tool(self) -> None:
        with (
            pytest.raises(ToolError) as exc_info,
            tool_error_handler("system", "overview", self._logger()),
        ):
            raise CredentialsNotConfiguredError()
        assert 'unraid(action="health", subaction="setup")' in str(exc_info.value)
        assert "unraid_health" not in str(exc_info.value)

    def test_tool_error_passes_through_unchanged(self) -> None:
        logger = self._logger()
        with (
            pytest.raises(ToolError, match="original message"),
            tool_error_handler("docker", "list", logger),
        ):
            raise ToolError("original message")
        # Pass-through must not log.
        logger.exception.assert_not_called()

    def test_timeout_error_maps_to_timeout_message(self) -> None:
        logger = self._logger()
        with (
            pytest.raises(ToolError, match="timed out"),
            tool_error_handler("disk", "disks", logger),
        ):
            raise TimeoutError("slow")
        # A TimeoutError must not be classified as a bug.
        assert "likely a server bug" not in str(logger)


# ---------------------------------------------------------------------------
# Timeout constants
# ---------------------------------------------------------------------------


class TestTimeoutConstants:
    def test_default_timeout_read(self) -> None:
        assert DEFAULT_TIMEOUT.read == 30.0

    def test_default_timeout_connect(self) -> None:
        assert DEFAULT_TIMEOUT.connect == 5.0

    def test_disk_timeout_read(self) -> None:
        assert DISK_TIMEOUT.read == 90.0

    def test_disk_timeout_connect(self) -> None:
        assert DISK_TIMEOUT.connect == 5.0


# ---------------------------------------------------------------------------
# make_graphql_request — success paths
# ---------------------------------------------------------------------------


class TestMakeGraphQLRequestSuccess:
    """Test successful request paths."""

    @pytest.fixture(autouse=True)
    def _patch_config(self):
        with (
            patch("unraid_mcp.config.settings.UNRAID_API_URL", "https://unraid.local/graphql"),
            patch("unraid_mcp.config.settings.UNRAID_API_KEY", "test-key"),
        ):
            yield

    async def test_simple_query(self) -> None:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"data": {"info": {"os": "Unraid"}}}

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with patch("unraid_mcp.core.client.get_http_client", return_value=mock_client):
            result = await make_graphql_request("{ info { os } }")
        assert result == {"info": {"os": "Unraid"}}

    async def test_query_with_variables(self) -> None:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"data": {"container": {"name": "plex"}}}

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with patch("unraid_mcp.core.client.get_http_client", return_value=mock_client):
            result = await make_graphql_request(
                "query ($id: String!) { container(id: $id) { name } }",
                variables={"id": "abc123"},
            )
        assert result == {"container": {"name": "plex"}}
        # Verify variables were passed in the payload
        call_kwargs = mock_client.post.call_args
        assert call_kwargs.kwargs["json"]["variables"] == {"id": "abc123"}

    async def test_custom_timeout_passed(self) -> None:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"data": {}}

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        custom_timeout = httpx.Timeout(10.0, read=90.0)
        with patch("unraid_mcp.core.client.get_http_client", return_value=mock_client):
            await make_graphql_request("{ info }", custom_timeout=custom_timeout)
        call_kwargs = mock_client.post.call_args
        assert call_kwargs.kwargs["timeout"] is custom_timeout

    async def test_empty_data_returns_empty_dict(self) -> None:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"data": None}

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with patch("unraid_mcp.core.client.get_http_client", return_value=mock_client):
            result = await make_graphql_request("{ info }")
        assert result == {}

    async def test_missing_data_key_returns_empty_dict(self) -> None:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {}

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with patch("unraid_mcp.core.client.get_http_client", return_value=mock_client):
            result = await make_graphql_request("{ info }")
        assert result == {}


# ---------------------------------------------------------------------------
# make_graphql_request — error paths
# ---------------------------------------------------------------------------


class TestMakeGraphQLRequestErrors:
    """Test error handling in make_graphql_request."""

    @pytest.fixture(autouse=True)
    def _patch_config(self):
        with (
            patch("unraid_mcp.config.settings.UNRAID_API_URL", "https://unraid.local/graphql"),
            patch("unraid_mcp.config.settings.UNRAID_API_KEY", "test-key"),
        ):
            yield

    async def test_missing_api_url(self) -> None:
        with (
            patch("unraid_mcp.config.settings.UNRAID_API_URL", ""),
            pytest.raises(CredentialsNotConfiguredError),
        ):
            await make_graphql_request("{ info }")

    async def test_missing_api_key(self) -> None:
        with (
            patch("unraid_mcp.config.settings.UNRAID_API_KEY", ""),
            pytest.raises(CredentialsNotConfiguredError),
        ):
            await make_graphql_request("{ info }")

    async def test_http_401_error(self) -> None:
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        http_error = httpx.HTTPStatusError(
            "401 Unauthorized", request=MagicMock(), response=mock_response
        )
        mock_response.raise_for_status.side_effect = http_error

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with (
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
            pytest.raises(ToolError, match="Unraid API returned HTTP 401"),
        ):
            await make_graphql_request("{ info }")

    async def test_http_500_error(self) -> None:
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        http_error = httpx.HTTPStatusError(
            "500 Internal Server Error", request=MagicMock(), response=mock_response
        )
        mock_response.raise_for_status.side_effect = http_error

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with (
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
            pytest.raises(ToolError, match="Unraid API returned HTTP 500"),
        ):
            await make_graphql_request("{ info }")

    async def test_http_503_error(self) -> None:
        mock_response = MagicMock()
        mock_response.status_code = 503
        mock_response.text = "Service Unavailable"
        http_error = httpx.HTTPStatusError(
            "503 Service Unavailable", request=MagicMock(), response=mock_response
        )
        mock_response.raise_for_status.side_effect = http_error

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with (
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
            pytest.raises(ToolError, match="Unraid API returned HTTP 503"),
        ):
            await make_graphql_request("{ info }")

    async def test_network_connection_refused(self) -> None:
        mock_client = AsyncMock()
        mock_client.post.side_effect = httpx.ConnectError("Connection refused")

        with (
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
            pytest.raises(ToolError, match="Network error connecting to Unraid API"),
        ):
            await make_graphql_request("{ info }")

    async def test_network_timeout(self) -> None:
        mock_client = AsyncMock()
        mock_client.post.side_effect = httpx.ReadTimeout("Read timed out")

        with (
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
            pytest.raises(ToolError, match="Network error connecting to Unraid API"),
        ):
            await make_graphql_request("{ info }")

    async def test_json_decode_error(self) -> None:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.side_effect = json.JSONDecodeError("Expecting value", "", 0)

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with (
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
            pytest.raises(ToolError, match=r"invalid response.*not valid JSON"),
        ):
            await make_graphql_request("{ info }")


# ---------------------------------------------------------------------------
# make_graphql_request — GraphQL error handling
# ---------------------------------------------------------------------------


class TestGraphQLErrorHandling:
    """Test GraphQL-level error parsing and idempotent handling."""

    @pytest.fixture(autouse=True)
    def _patch_config(self):
        with (
            patch("unraid_mcp.config.settings.UNRAID_API_URL", "https://unraid.local/graphql"),
            patch("unraid_mcp.config.settings.UNRAID_API_KEY", "test-key"),
        ):
            yield

    async def test_graphql_error_raises_tool_error(self) -> None:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"errors": [{"message": "Field 'bogus' not found"}]}

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with (
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
            pytest.raises(ToolError, match="Field 'bogus' not found"),
        ):
            await make_graphql_request("{ bogus }")

    async def test_multiple_graphql_errors_joined(self) -> None:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            "errors": [
                {"message": "Error one"},
                {"message": "Error two"},
            ]
        }

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with (
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
            pytest.raises(ToolError, match="Error one; Error two"),
        ):
            await make_graphql_request("{ info }")

    async def test_idempotent_start_returns_success(self) -> None:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"errors": [{"message": "Container already running"}]}

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with patch("unraid_mcp.core.client.get_http_client", return_value=mock_client):
            result = await make_graphql_request(
                'mutation { docker { start(id: "x") } }',
                operation_context={"operation": "start"},
            )
        assert result["idempotent_success"] is True
        assert result["operation"] == "start"

    async def test_idempotent_stop_returns_success(self) -> None:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"errors": [{"message": "Container not running"}]}

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with patch("unraid_mcp.core.client.get_http_client", return_value=mock_client):
            result = await make_graphql_request(
                'mutation { docker { stop(id: "x") } }',
                operation_context={"operation": "stop"},
            )
        assert result["idempotent_success"] is True
        assert result["operation"] == "stop"

    async def test_idempotent_start_via_304_signal_not_prose(self) -> None:
        """The numeric 'HTTP code 304' signal is treated as idempotent success.

        Pins the locale-stable numeric path: an 'already started'-style no-op that
        carries ONLY the 304 signal (no English idempotent prose like 'already
        started') is synthesized into idempotent-success without relying on prose.
        """
        # Deliberately carries no _START_IDEMPOTENT_PHRASES substring — only 304.
        error_msg = "Error response from daemon: HTTP code 304"
        assert not any(p in error_msg.lower() for p in _START_IDEMPOTENT_PHRASES)

        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"errors": [{"message": error_msg}]}

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with patch("unraid_mcp.core.client.get_http_client", return_value=mock_client):
            result = await make_graphql_request(
                'mutation { docker { start(id: "x") } }',
                operation_context={"operation": "start"},
            )
        assert result["idempotent_success"] is True
        assert result["operation"] == "start"
        assert result["message"] == error_msg

    async def test_idempotent_stop_via_304_signal_not_prose(self) -> None:
        """The 304 signal is idempotent for 'stop' too, without prose matching."""
        # Deliberately carries no _STOP_IDEMPOTENT_PHRASES substring — only 304.
        error_msg = "Error response from daemon: HTTP code 304"
        assert not any(p in error_msg.lower() for p in _STOP_IDEMPOTENT_PHRASES)

        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"errors": [{"message": error_msg}]}

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with patch("unraid_mcp.core.client.get_http_client", return_value=mock_client):
            result = await make_graphql_request(
                'mutation { docker { stop(id: "x") } }',
                operation_context={"operation": "stop"},
            )
        assert result["idempotent_success"] is True
        assert result["operation"] == "stop"
        assert result["message"] == error_msg

    async def test_non_idempotent_error_with_context_raises(self) -> None:
        """An error that doesn't match idempotent patterns still raises even with context."""
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"errors": [{"message": "Permission denied"}]}

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with (
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
            pytest.raises(ToolError, match="Permission denied"),
        ):
            await make_graphql_request(
                'mutation { docker { start(id: "x") } }',
                operation_context={"operation": "start"},
            )

    async def test_graphql_error_without_message_key(self) -> None:
        """Error objects without a 'message' key fall back to str()."""
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            "errors": [{"code": "UNKNOWN", "detail": "something broke"}]
        }

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with (
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
            pytest.raises(ToolError, match="GraphQL API error"),
        ):
            await make_graphql_request("{ info }")


# ---------------------------------------------------------------------------
# _RateLimiter
# ---------------------------------------------------------------------------


class TestRateLimiter:
    """Unit tests for the token bucket rate limiter."""

    async def test_acquire_consumes_one_token(self) -> None:
        limiter = _RateLimiter(max_tokens=10, refill_rate=1.0)
        initial = limiter.tokens
        await limiter.acquire()
        assert limiter.tokens == pytest.approx(initial - 1, abs=1e-3)

    async def test_acquire_succeeds_when_tokens_available(self) -> None:
        limiter = _RateLimiter(max_tokens=5, refill_rate=1.0)
        # Should complete without sleeping
        for _ in range(5):
            await limiter.acquire()
        # _refill() runs during each acquire() call and adds a tiny time-based
        # amount; check < 1.0 (not enough for another immediate request) rather
        # than == 0.0 to avoid flakiness from timing.
        assert limiter.tokens < 1.0

    async def test_tokens_do_not_exceed_max(self) -> None:
        limiter = _RateLimiter(max_tokens=10, refill_rate=1.0)
        # Force refill with large elapsed time
        limiter.last_refill = time.monotonic() - 100.0  # 100 seconds ago
        limiter._refill()
        assert limiter.tokens == 10.0  # Capped at max_tokens

    async def test_refill_adds_tokens_based_on_elapsed(self) -> None:
        limiter = _RateLimiter(max_tokens=100, refill_rate=10.0)
        limiter.tokens = 0.0
        limiter.last_refill = time.monotonic() - 1.0  # 1 second ago
        limiter._refill()
        # Should have refilled ~10 tokens (10.0 rate * 1.0 sec)
        assert 9.5 < limiter.tokens < 10.5

    async def test_acquire_sleeps_when_no_tokens(self) -> None:
        """When tokens are exhausted, acquire should sleep before consuming."""
        limiter = _RateLimiter(max_tokens=1, refill_rate=1.0)
        limiter.tokens = 0.0

        sleep_calls = []

        async def fake_sleep(duration: float) -> None:
            sleep_calls.append(duration)
            # Simulate refill by advancing last_refill so tokens replenish
            limiter.tokens = 1.0
            limiter.last_refill = time.monotonic()

        with patch("unraid_mcp.core.client.asyncio.sleep", side_effect=fake_sleep):
            await limiter.acquire()

        assert len(sleep_calls) == 1
        assert sleep_calls[0] > 0

    async def test_default_params_match_api_limits(self) -> None:
        """Default rate limiter must use 90 tokens at 9.0/sec (10% headroom from 100/10s)."""
        limiter = _RateLimiter()
        assert limiter.max_tokens == 90
        assert limiter.refill_rate == 9.0


# ---------------------------------------------------------------------------
# make_graphql_request — 429 retry behavior
# ---------------------------------------------------------------------------


class TestRateLimitRetry:
    """Tests for the 429 retry loop in make_graphql_request."""

    @pytest.fixture(autouse=True)
    def _patch_config(self):
        with (
            patch("unraid_mcp.config.settings.UNRAID_API_URL", "https://unraid.local/graphql"),
            patch("unraid_mcp.config.settings.UNRAID_API_KEY", "test-key"),
            patch("unraid_mcp.core.client.asyncio.sleep", new_callable=AsyncMock),
        ):
            yield

    def _make_429_response(self) -> MagicMock:
        resp = MagicMock()
        resp.status_code = 429
        resp.raise_for_status = MagicMock()
        return resp

    def _make_ok_response(self, data: dict) -> MagicMock:
        resp = MagicMock()
        resp.status_code = 200
        resp.raise_for_status = MagicMock()
        resp.json.return_value = {"data": data}
        return resp

    async def test_single_429_then_success_retries(self) -> None:
        """One 429 followed by a success should return the data."""
        mock_client = AsyncMock()
        mock_client.post.side_effect = [
            self._make_429_response(),
            self._make_ok_response({"info": {"os": "Unraid"}}),
        ]

        with patch("unraid_mcp.core.client.get_http_client", return_value=mock_client):
            result = await make_graphql_request("{ info { os } }")

        assert result == {"info": {"os": "Unraid"}}
        assert mock_client.post.call_count == 2

    async def test_two_429s_then_success(self) -> None:
        """Two 429s followed by success returns data after 2 retries."""
        mock_client = AsyncMock()
        mock_client.post.side_effect = [
            self._make_429_response(),
            self._make_429_response(),
            self._make_ok_response({"x": 1}),
        ]

        with patch("unraid_mcp.core.client.get_http_client", return_value=mock_client):
            result = await make_graphql_request("{ x }")

        assert result == {"x": 1}
        assert mock_client.post.call_count == 3

    async def test_three_429s_raises_tool_error(self) -> None:
        """Three consecutive 429s (all retries exhausted) raises ToolError."""
        mock_client = AsyncMock()
        mock_client.post.side_effect = [
            self._make_429_response(),
            self._make_429_response(),
            self._make_429_response(),
        ]

        with (
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
            pytest.raises(ToolError, match="rate limiting"),
        ):
            await make_graphql_request("{ info }")

    async def test_every_physical_post_acquires_a_limiter_token(self) -> None:
        mock_client = AsyncMock()
        mock_client.post.side_effect = [
            self._make_429_response(),
            self._make_429_response(),
            self._make_ok_response({"x": 1}),
        ]
        with (
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
            patch(
                "unraid_mcp.core.client._rate_limiter.acquire", new_callable=AsyncMock
            ) as acquire,
        ):
            await make_graphql_request("{ x }")
        assert acquire.await_count == mock_client.post.await_count == 3

    async def test_exhausted_retries_do_not_sleep_after_final_response(self) -> None:
        mock_client = AsyncMock()
        mock_client.post.side_effect = [self._make_429_response() for _ in range(3)]
        with (
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
            patch("unraid_mcp.core.client.asyncio.sleep", new_callable=AsyncMock) as sleep,
            pytest.raises(ToolError, match="rate limiting"),
        ):
            await make_graphql_request("{ x }")
        assert sleep.await_count == 2

    async def test_retry_after_is_bounded_and_jittered(self) -> None:
        first = self._make_429_response()
        first.headers = {"Retry-After": "9999"}
        mock_client = AsyncMock()
        mock_client.post.side_effect = [first, self._make_ok_response({"x": 1})]
        with (
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
            patch("unraid_mcp.core.client.asyncio.sleep", new_callable=AsyncMock) as sleep,
            patch("unraid_mcp.core.client.random.uniform", return_value=0.125),
        ):
            await make_graphql_request("{ x }")
        delay = sleep.await_args.args[0]
        assert 10.0 < delay <= 10.25

    async def test_rate_limit_error_message_advises_wait(self) -> None:
        """The ToolError message should tell the user to wait ~10 seconds."""
        mock_client = AsyncMock()
        mock_client.post.side_effect = [
            self._make_429_response(),
            self._make_429_response(),
            self._make_429_response(),
        ]

        with (
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
            pytest.raises(ToolError, match="10 seconds"),
        ):
            await make_graphql_request("{ info }")


# ---------------------------------------------------------------------------
# make_graphql_request — rate limiter wiring
# ---------------------------------------------------------------------------


class TestRateLimiterWiring:
    """Pin that make_graphql_request actually goes through the singleton limiter."""

    @pytest.fixture(autouse=True)
    def _patch_config(self):
        with (
            patch("unraid_mcp.config.settings.UNRAID_API_URL", "https://unraid.local/graphql"),
            patch("unraid_mcp.config.settings.UNRAID_API_KEY", "test-key"),
        ):
            yield

    async def test_acquire_awaited_once_on_success(self) -> None:
        """A normal successful request must acquire exactly one rate-limiter token.

        Guards against the acquire() call being dropped: without this assertion,
        removing `await _rate_limiter.acquire()` from make_graphql_request would
        pass the whole suite silently.
        """
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"data": {"info": {"os": "Unraid"}}}

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with (
            patch(
                "unraid_mcp.core.client._rate_limiter.acquire", new_callable=AsyncMock
            ) as acquire,
            patch("unraid_mcp.core.client.get_http_client", return_value=mock_client),
        ):
            result = await make_graphql_request("{ info { os } }")

        assert result == {"info": {"os": "Unraid"}}
        acquire.assert_awaited_once()
