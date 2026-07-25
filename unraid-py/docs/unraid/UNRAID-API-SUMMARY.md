# Unraid API Introspection Summary

> Auto-generated from API introspection on 2026-06-25T12:11:09+00:00
> Source: docs/unraid/UNRAID-API-INTROSPECTION.json

## Table of Contents

- [Schema Summary](#schema-summary)
- [Query Fields](#query-fields)
- [Mutation Fields](#mutation-fields)
- [Subscription Fields](#subscription-fields)
- [Type Kinds](#type-kinds)

## Schema Summary
- Query root: `Query`
- Mutation root: `Mutation`
- Subscription root: `Subscription`
- Total types: **243**
- Total directives: **6**

## Query Fields

| Field | Return Type | Arguments |
|-------|-------------|-----------|
| `apiKey` | `ApiKey` | id: PrefixedID! |
| `apiKeyPossiblePermissions` | `[Permission!]!` |  —  |
| `apiKeyPossibleRoles` | `[Role!]!` |  —  |
| `apiKeys` | `[ApiKey!]!` |  —  |
| `array` | `UnraidArray!` |  —  |
| `assignableDisks` | `[Disk!]!` |  —  |
| `cloud` | `Cloud!` |  —  |
| `config` | `Config!` |  —  |
| `connect` | `Connect!` |  —  |
| `customization` | `Customization` |  —  |
| `disk` | `Disk!` | id: PrefixedID! |
| `disks` | `[Disk!]!` |  —  |
| `display` | `InfoDisplay!` |  —  |
| `docker` | `Docker!` |  —  |
| `flash` | `Flash!` |  —  |
| `getApiKeyCreationFormSchema` | `ApiKeyFormSettings!` |  —  |
| `getAvailableAuthActions` | `[AuthAction!]!` |  —  |
| `getPermissionsForRoles` | `[Permission!]!` | roles: [Role!]! |
| `info` | `Info!` |  —  |
| `installedUnraidPlugins` | `[String!]!` |  —  |
| `internalBootContext` | `OnboardingInternalBootContext!` |  —  |
| `isFreshInstall` | `Boolean!` |  —  |
| `isSSOEnabled` | `Boolean!` |  —  |
| `logFile` | `LogFileContent!` | lines: Int, path: String!, startLine: Int |
| `logFiles` | `[LogFile!]!` |  —  |
| `me` | `UserAccount!` |  —  |
| `metrics` | `Metrics!` |  —  |
| `network` | `Network!` |  —  |
| `networkInterfaces` | `[InfoNetworkInterface!]!` |  —  |
| `notifications` | `Notifications!` |  —  |
| `oidcConfiguration` | `OidcConfiguration!` |  —  |
| `oidcProvider` | `OidcProvider` | id: PrefixedID! |
| `oidcProviders` | `[OidcProvider!]!` |  —  |
| `online` | `Boolean!` |  —  |
| `owner` | `Owner!` |  —  |
| `parityHistory` | `[ParityCheck!]!` |  —  |
| `pluginInstallOperation` | `PluginInstallOperation` | operationId: ID! |
| `pluginInstallOperations` | `[PluginInstallOperation!]!` |  —  |
| `plugins` | `[Plugin!]!` |  —  |
| `previewEffectivePermissions` | `[Permission!]!` | permissions: [AddPermissionInput!], roles: [Role!] |
| `publicOidcProviders` | `[PublicOidcProvider!]!` |  —  |
| `publicTheme` | `Theme!` |  —  |
| `rclone` | `RCloneBackupSettings!` |  —  |
| `registration` | `Registration` |  —  |
| `remoteAccess` | `RemoteAccess!` |  —  |
| `server` | `Server` |  —  |
| `servers` | `[Server!]!` |  —  |
| `services` | `[Service!]!` |  —  |
| `settings` | `Settings!` |  —  |
| `shares` | `[Share!]!` |  —  |
| `systemTime` | `SystemTime!` |  —  |
| `timeZoneOptions` | `[TimeZoneOption!]!` |  —  |
| `upsConfiguration` | `UPSConfiguration!` |  —  |
| `upsDeviceById` | `UPSDevice` | id: String! |
| `upsDevices` | `[UPSDevice!]!` |  —  |
| `validateOidcSession` | `OidcSessionValidation!` | token: String! |
| `vars` | `Vars!` |  —  |
| `vms` | `Vms!` |  —  |

## Mutation Fields

| Field | Return Type | Arguments |
|-------|-------------|-----------|
| `addPlugin` | `Boolean!` | input: PluginManagementInput! |
| `apiKey` | `ApiKeyMutations!` |  —  |
| `archiveAll` | `NotificationOverview!` | importance: NotificationImportance |
| `archiveNotification` | `Notification!` | id: PrefixedID! |
| `archiveNotifications` | `NotificationOverview!` | ids: [PrefixedID!]! |
| `array` | `ArrayMutations!` |  —  |
| `configureUps` | `Boolean!` | config: UPSConfigInput! |
| `connectSignIn` | `Boolean!` | input: ConnectSignInInput! |
| `connectSignOut` | `Boolean!` |  —  |
| `createDockerFolder` | `ResolvedOrganizerV1!` | childrenIds: [String!], name: String!, parentId: String |
| `createDockerFolderWithItems` | `ResolvedOrganizerV1!` | name: String!, parentId: String, position: Float, sourceEntryIds: [String!] |
| `createNotification` | `Notification!` | input: NotificationData! |
| `customization` | `CustomizationMutations!` |  —  |
| `deleteArchivedNotifications` | `NotificationOverview!` |  —  |
| `deleteDockerEntries` | `ResolvedOrganizerV1!` | entryIds: [String!]! |
| `deleteNotification` | `NotificationOverview!` | id: PrefixedID!, type: NotificationType! |
| `docker` | `DockerMutations!` |  —  |
| `enableDynamicRemoteAccess` | `Boolean!` | input: EnableDynamicRemoteAccessInput! |
| `initiateFlashBackup` | `FlashBackupStatus!` | input: InitiateFlashBackupInput! |
| `moveDockerEntriesToFolder` | `ResolvedOrganizerV1!` | destinationFolderId: String!, sourceEntryIds: [String!]! |
| `moveDockerItemsToPosition` | `ResolvedOrganizerV1!` | destinationFolderId: String!, position: Float!, sourceEntryIds: [String!]! |
| `notifyIfUnique` | `Notification` | input: NotificationData! |
| `onboarding` | `OnboardingMutations!` |  —  |
| `parityCheck` | `ParityCheckMutations!` |  —  |
| `rclone` | `RCloneMutations!` |  —  |
| `recalculateOverview` | `NotificationOverview!` |  —  |
| `refreshDockerDigests` | `Boolean!` |  —  |
| `removePlugin` | `Boolean!` | input: PluginManagementInput! |
| `renameDockerFolder` | `ResolvedOrganizerV1!` | folderId: String!, newName: String! |
| `resetDockerTemplateMappings` | `Boolean!` |  —  |
| `setDockerFolderChildren` | `ResolvedOrganizerV1!` | childrenIds: [String!]!, folderId: String |
| `setupRemoteAccess` | `Boolean!` | input: SetupRemoteAccessInput! |
| `syncDockerTemplatePaths` | `DockerTemplateSyncResult!` |  —  |
| `unarchiveAll` | `NotificationOverview!` | importance: NotificationImportance |
| `unarchiveNotifications` | `NotificationOverview!` | ids: [PrefixedID!]! |
| `unraidPlugins` | `UnraidPluginsMutations!` |  —  |
| `unreadNotification` | `Notification!` | id: PrefixedID! |
| `updateApiSettings` | `ConnectSettingsValues!` | input: ConnectSettingsInput! |
| `updateDockerViewPreferences` | `ResolvedOrganizerV1!` | prefs: JSON!, viewId: String (default: "default") |
| `updateServerIdentity` | `Server!` | comment: String, name: String!, sysModel: String |
| `updateSettings` | `UpdateSettingsResponse!` | input: JSON! |
| `updateSshSettings` | `Vars!` | input: UpdateSshInput! |
| `updateSystemTime` | `SystemTime!` | input: UpdateSystemTimeInput! |
| `updateTemperatureConfig` | `Boolean!` | input: TemperatureConfigInput! |
| `vm` | `VmMutations!` |  —  |

## Subscription Fields

| Field | Return Type | Arguments |
|-------|-------------|-----------|
| `arraySubscription` | `UnraidArray!` |  —  |
| `displaySubscription` | `InfoDisplay!` |  —  |
| `dockerContainerStats` | `DockerContainerStats!` |  —  |
| `logFile` | `LogFileContent!` | path: String! |
| `notificationAdded` | `Notification!` |  —  |
| `notificationsOverview` | `NotificationOverview!` |  —  |
| `notificationsWarningsAndAlerts` | `[Notification!]!` |  —  |
| `ownerSubscription` | `Owner!` |  —  |
| `parityHistorySubscription` | `ParityCheck!` |  —  |
| `pluginInstallUpdates` | `PluginInstallEvent!` | operationId: ID! |
| `serversSubscription` | `Server!` |  —  |
| `systemMetricsCpu` | `CpuUtilization!` |  —  |
| `systemMetricsCpuTelemetry` | `CpuPackages!` |  —  |
| `systemMetricsMemory` | `MemoryUtilization!` |  —  |
| `systemMetricsNetwork` | `[NetworkMetrics!]!` |  —  |
| `systemMetricsTemperature` | `TemperatureMetrics` |  —  |
| `upsUpdates` | `UPSDevice!` |  —  |

## Type Kinds

- `ENUM`: 40
- `INPUT_OBJECT`: 43
- `INTERFACE`: 2
- `OBJECT`: 147
- `SCALAR`: 11

## Notes

- This summary is intentionally condensed; the full schema reference lives in `UNRAID-API-COMPLETE-REFERENCE.md`.
- Raw schema exports live in `UNRAID-API-INTROSPECTION.json` and `UNRAID-SCHEMA.graphql`.
