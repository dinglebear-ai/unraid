"""MCP tools — single consolidated unraid tool with action + subaction routing.

unraid - All Unraid operations (19 actions, 178 subactions)
system        - System info, metrics, UPS, network, registration
health        - Health checks, connection test, diagnostics, setup
array         - Parity, array state, assignable/add/remove/mount disks
disk          - Shares, physical disks, logs, flash backup
docker        - Container lifecycle, image updates, organizer folders, networks
vm            - VM list/details and lifecycle (start/stop/pause/resume/etc)
notification  - Notification CRUD and bulk operations
key           - API key & permission management
plugin        - Plugin list/add/remove and async installs
rclone        - Cloud remote management
setting       - System settings, UPS, SSH, time, server identity
connect       - Unraid Connect / remote access state and control
customization - Theme, locale and UI customization
oidc          - OIDC/SSO provider management
onboarding    - First-boot/onboarding state and internal boot context
user          - Current user info
live          - Real-time subscription snapshots
subscriptions - WebSocket subscription diagnostics (diagnose, test_query)
help          - Full Markdown action/subaction reference (no subaction)
"""
