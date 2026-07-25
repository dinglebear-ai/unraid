"""GraphQL subscription query strings for snapshot and collect operations."""

# Subscriptions that only emit on state changes (not on a regular interval).
# When subscribe_once times out for these, it means no recent change — not an error.
EVENT_DRIVEN_ACTIONS: frozenset[str] = frozenset(
    {
        "parity_progress",
        "ups_status",
        "notifications_overview",
        "notifications_warnings",
        "owner",
        "server_status",
        "display",
    }
)

SNAPSHOT_ACTIONS = {
    "cpu": """
        subscription { systemMetricsCpu { id percentTotal cpus { percentTotal percentUser percentSystem percentIdle } } }
    """,
    "memory": """
        subscription { systemMetricsMemory { id total used free available active buffcache percentTotal swapTotal swapUsed swapFree percentSwapTotal } }
    """,
    "cpu_telemetry": """
        subscription { systemMetricsCpuTelemetry { id totalPower power temp } }
    """,
    "array_state": """
        subscription { arraySubscription { id state capacity { kilobytes { free used total } } parityCheckStatus { status progress speed errors } } }
    """,
    "parity_progress": """
        subscription { parityHistorySubscription { date status progress speed errors correcting paused running } }
    """,
    "ups_status": """
        subscription { upsUpdates { id name model status battery { chargeLevel estimatedRuntime health } power { inputVoltage outputVoltage loadPercentage } } }
    """,
    "notifications_overview": """
        subscription { notificationsOverview { unread { info warning alert total } archive { info warning alert total } } }
    """,
    "owner": """
        subscription { ownerSubscription { username url avatar } }
    """,
    "server_status": """
        subscription { serversSubscription { id name status guid wanip lanip localurl remoteurl } }
    """,
    "docker_container_stats": """
        subscription { dockerContainerStats { id cpuPercent memUsage memPercent netIO blockIO } }
    """,
    "temperature": """
        subscription { systemMetricsTemperature { id sensors { id name type location current { value unit status } } summary { average hottest { id name current { value unit status } } coolest { id name current { value unit status } } warningCount criticalCount } } }
    """,
    "notifications_warnings": """
        subscription { notificationsWarningsAndAlerts { id title subject description importance type timestamp } }
    """,
    "display": """
        subscription { displaySubscription { id theme unit scale locale total usage warning critical hot max } }
    """,
    "network_metrics": """
        subscription { systemMetricsNetwork { id name operstate bytesReceived bytesSent packetsReceived packetsSent receiveErrors transmitErrors receiveDropped transmitDropped rxSec txSec utilizationPercent lastUpdated } }
    """,
}

COLLECT_ACTIONS = {
    "notification_feed": """
        subscription { notificationAdded { id title subject description importance type timestamp } }
    """,
    "log_tail": """
        subscription LogTail($path: String!) { logFile(path: $path) { path content totalLines startLine } }
    """,
    "plugin_install_updates": """
        subscription PluginInstallUpdates($operationId: ID!) { pluginInstallUpdates(operationId: $operationId) { operationId status output timestamp } }
    """,
}
