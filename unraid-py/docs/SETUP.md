# Setup Guide -- unraid-mcp

Step-by-step instructions to get unraid-mcp running locally, in Docker, or as a Claude Code plugin.

## Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) package manager
- An Unraid server with the API enabled (Settings > Management Access > API Keys)
- Docker and Docker Compose (for container deployment)

## Option 1: Claude Code plugin (recommended)

Configuration is collected by the plugin's config form — no interactive wizard.

1. Install as a Claude Code plugin:
   ```bash
   /plugin marketplace add jmagar/unraid-mcp
   /plugin install unraid-mcp@unraid-mcp
   ```

2. In the plugin's configuration form, set:
   - **Unraid GraphQL API URL**: Your Unraid GraphQL endpoint (e.g. `https://10-1-0-2.xxx.myunraid.net:31337`)
   - **Unraid API Key**: Found in Unraid > Settings > Management Access > API Keys

3. On the next session start (and whenever you change these fields), a setup hook
   persists them to `~/.unraid-mcp/.env` with mode 600 — so the server, CLI, and
   Docker all share one source of truth. No manual file editing required.

4. Check status / get help any time:
   ```python
   unraid(action="health", subaction="setup")
   ```

5. Verify the connection:
   ```python
   unraid(action="health", subaction="test_connection")
   ```

## Option 2: Manual .env setup

1. Clone the repository:
   ```bash
   git clone https://github.com/jmagar/unraid-mcp.git
   cd unraid-mcp
   ```

2. Create the credentials directory and file:
   ```bash
   mkdir -p ~/.unraid-mcp
   cp .env.example ~/.unraid-mcp/.env
   chmod 700 ~/.unraid-mcp
   chmod 600 ~/.unraid-mcp/.env
   ```

3. Edit `~/.unraid-mcp/.env` with your credentials:
   ```bash
   UNRAID_API_URL=https://your-unraid-server
   UNRAID_API_KEY=your_api_key
   ```

4. Install dependencies and start:
   ```bash
   uv sync
   uv run unraid-mcp-server
   ```

## Option 3: Docker deployment

1. Clone and configure:
   ```bash
   git clone https://github.com/jmagar/unraid-mcp.git
   cd unraid-mcp
   ```

2. Set up credentials (the Docker container reads from `~/.unraid-mcp/.env` via `env_file`):
   ```bash
   mkdir -p ~/.unraid-mcp
   cp .env.example ~/.unraid-mcp/.env
   chmod 700 ~/.unraid-mcp
   chmod 600 ~/.unraid-mcp/.env
   # Edit ~/.unraid-mcp/.env with UNRAID_API_URL and UNRAID_API_KEY.
   ```

3. Start the container:
   ```bash
   docker compose up -d
   ```

4. Verify:
   ```bash
   curl http://localhost:6970/health
   ```

## Option 4: PyPI install

```bash
uvx unraid-mcp
# or
pip install unraid-mcp
unraid-mcp-server
```

## Post-setup verification

After any installation method, verify the setup:

```python
# Test connection
unraid(action="health", subaction="test_connection")

# Run full health check
unraid(action="health", subaction="check")

# Get system overview
unraid(action="system", subaction="overview")
```

## Troubleshooting

**"Credentials not configured"**
- Set the plugin's *Unraid GraphQL API URL* / *Unraid API Key* fields (the setup
  hook persists them to `~/.unraid-mcp/.env`), then restart the server
- Or create `~/.unraid-mcp/.env` manually from `.env.example`
- Run `unraid(action="health", subaction="setup")` to see current status + the exact path

**"Connection refused"**
- Verify `UNRAID_API_URL` is correct and accessible from the server host
- Check if Unraid's API is enabled in Settings > Management Access

**"SSL verification failed"**
- **Recommended:** point `UNRAID_VERIFY_SSL` at a CA-bundle path
  (`UNRAID_VERIFY_SSL=/path/to/ca.pem`) to trust a self-signed cert *without* turning off
  verification.
- Disabling verification entirely (`UNRAID_VERIFY_SSL=false`) is discouraged: it sends
  your `UNRAID_API_KEY` to an unverified peer over **both** the GraphQL HTTP client and the
  WebSocket subscription connection, so a man-in-the-middle can capture the key. If you
  must, the server requires a second explicit opt-in (`UNRAID_ALLOW_INSECURE_TLS=true`) and
  it should only ever be used on a fully trusted network.

**"Bearer token required"**
- The server auto-generates a token on first HTTP startup
- Check `~/.unraid-mcp/.env` for the generated `UNRAID_MCP_BEARER_TOKEN`
- Configure your MCP client to send it as `Authorization: Bearer <token>`

See [CONFIG](CONFIG.md) for all environment variables and [mcp/AUTH](mcp/AUTH.md) for authentication details.
