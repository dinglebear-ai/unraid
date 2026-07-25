# Unraid API Complete Reference

> Generated on 2026-06-25T12:11:09+00:00
> Source: docs/unraid/UNRAID-API-INTROSPECTION.json
> Rendered by graphql-markdown / GraphQL Inspector — do not edit by hand.

# Schema Types

<details>
  <summary><strong>Table of Contents</strong></summary>

  * [Query](#query)
  * [Mutation](#mutation)
  * [Subscription](#subscription)
  * [Objects](#objects)
    * [AccessUrl](#accessurl)
    * [AccessUrlObject](#accessurlobject)
    * [ActivationCode](#activationcode)
    * [ApiConfig](#apiconfig)
    * [ApiKey](#apikey)
    * [ApiKeyFormSettings](#apikeyformsettings)
    * [ApiKeyMutations](#apikeymutations)
    * [ApiKeyResponse](#apikeyresponse)
    * [ArrayCapacity](#arraycapacity)
    * [ArrayDisk](#arraydisk)
    * [ArrayMutations](#arraymutations)
    * [BrandingConfig](#brandingconfig)
    * [Capacity](#capacity)
    * [Cloud](#cloud)
    * [CloudResponse](#cloudresponse)
    * [Config](#config)
    * [Connect](#connect)
    * [ConnectSettings](#connectsettings)
    * [ConnectSettingsValues](#connectsettingsvalues)
    * [ContainerHostConfig](#containerhostconfig)
    * [ContainerPort](#containerport)
    * [CoreVersions](#coreversions)
    * [CpuLoad](#cpuload)
    * [CpuPackages](#cpupackages)
    * [CpuUtilization](#cpuutilization)
    * [Customization](#customization)
    * [CustomizationMutations](#customizationmutations)
    * [Disk](#disk)
    * [DiskPartition](#diskpartition)
    * [Docker](#docker)
    * [DockerContainer](#dockercontainer)
    * [DockerContainerLogLine](#dockercontainerlogline)
    * [DockerContainerLogs](#dockercontainerlogs)
    * [DockerContainerPortConflict](#dockercontainerportconflict)
    * [DockerContainerStats](#dockercontainerstats)
    * [DockerLanPortConflict](#dockerlanportconflict)
    * [DockerMutations](#dockermutations)
    * [DockerNetwork](#dockernetwork)
    * [DockerPortConflictContainer](#dockerportconflictcontainer)
    * [DockerPortConflicts](#dockerportconflicts)
    * [DockerTemplateSyncResult](#dockertemplatesyncresult)
    * [DynamicRemoteAccessStatus](#dynamicremoteaccessstatus)
    * [ExplicitStatusItem](#explicitstatusitem)
    * [Flash](#flash)
    * [FlashBackupStatus](#flashbackupstatus)
    * [FlatOrganizerEntry](#flatorganizerentry)
    * [Info](#info)
    * [InfoBaseboard](#infobaseboard)
    * [InfoCpu](#infocpu)
    * [InfoDevices](#infodevices)
    * [InfoDisplay](#infodisplay)
    * [InfoDisplayCase](#infodisplaycase)
    * [InfoGpu](#infogpu)
    * [InfoMemory](#infomemory)
    * [InfoNetwork](#infonetwork)
    * [InfoNetworkInterface](#infonetworkinterface)
    * [InfoNetworkIpv4Address](#infonetworkipv4address)
    * [InfoNetworkIpv6Address](#infonetworkipv6address)
    * [InfoOs](#infoos)
    * [InfoPci](#infopci)
    * [InfoSystem](#infosystem)
    * [InfoUsb](#infousb)
    * [InfoVersions](#infoversions)
    * [IpmiConfig](#ipmiconfig)
    * [KeyFile](#keyfile)
    * [Language](#language)
    * [LmSensorsConfig](#lmsensorsconfig)
    * [LogFile](#logfile)
    * [LogFileContent](#logfilecontent)
    * [MemoryLayout](#memorylayout)
    * [MemoryUtilization](#memoryutilization)
    * [Metrics](#metrics)
    * [MinigraphqlResponse](#minigraphqlresponse)
    * [Network](#network)
    * [NetworkMetrics](#networkmetrics)
    * [Notification](#notification)
    * [NotificationCounts](#notificationcounts)
    * [NotificationOverview](#notificationoverview)
    * [Notifications](#notifications)
    * [OidcAuthorizationRule](#oidcauthorizationrule)
    * [OidcConfiguration](#oidcconfiguration)
    * [OidcProvider](#oidcprovider)
    * [OidcSessionValidation](#oidcsessionvalidation)
    * [Onboarding](#onboarding)
    * [OnboardingInternalBootContext](#onboardinginternalbootcontext)
    * [OnboardingInternalBootDriveWarning](#onboardinginternalbootdrivewarning)
    * [OnboardingInternalBootResult](#onboardinginternalbootresult)
    * [OnboardingMutations](#onboardingmutations)
    * [OnboardingState](#onboardingstate)
    * [Owner](#owner)
    * [PackageVersions](#packageversions)
    * [ParityCheck](#paritycheck)
    * [ParityCheckMutations](#paritycheckmutations)
    * [PartnerConfig](#partnerconfig)
    * [PartnerLink](#partnerlink)
    * [Permission](#permission)
    * [Plugin](#plugin)
    * [PluginInstallEvent](#plugininstallevent)
    * [PluginInstallOperation](#plugininstalloperation)
    * [ProfileModel](#profilemodel)
    * [PublicOidcProvider](#publicoidcprovider)
    * [RCloneBackupConfigForm](#rclonebackupconfigform)
    * [RCloneBackupSettings](#rclonebackupsettings)
    * [RCloneDrive](#rclonedrive)
    * [RCloneMutations](#rclonemutations)
    * [RCloneRemote](#rcloneremote)
    * [Registration](#registration)
    * [RelayResponse](#relayresponse)
    * [RemoteAccess](#remoteaccess)
    * [ResolvedOrganizerV1](#resolvedorganizerv1)
    * [ResolvedOrganizerView](#resolvedorganizerview)
    * [SensorConfig](#sensorconfig)
    * [Server](#server)
    * [Service](#service)
    * [Settings](#settings)
    * [Share](#share)
    * [SsoSettings](#ssosettings)
    * [SystemConfig](#systemconfig)
    * [SystemTime](#systemtime)
    * [TailscaleExitNodeStatus](#tailscaleexitnodestatus)
    * [TailscaleStatus](#tailscalestatus)
    * [TemperatureHistoryConfig](#temperaturehistoryconfig)
    * [TemperatureMetrics](#temperaturemetrics)
    * [TemperatureReading](#temperaturereading)
    * [TemperatureSensor](#temperaturesensor)
    * [TemperatureSensorsConfig](#temperaturesensorsconfig)
    * [TemperatureSummary](#temperaturesummary)
    * [TemperatureThresholdsConfig](#temperaturethresholdsconfig)
    * [Theme](#theme)
    * [TimeZoneOption](#timezoneoption)
    * [UPSBattery](#upsbattery)
    * [UPSConfiguration](#upsconfiguration)
    * [UPSDevice](#upsdevice)
    * [UPSPower](#upspower)
    * [UnifiedSettings](#unifiedsettings)
    * [UnraidArray](#unraidarray)
    * [UnraidPluginsMutations](#unraidpluginsmutations)
    * [UpdateSettingsResponse](#updatesettingsresponse)
    * [Uptime](#uptime)
    * [UserAccount](#useraccount)
    * [Vars](#vars)
    * [VmDomain](#vmdomain)
    * [VmMutations](#vmmutations)
    * [Vms](#vms)
  * [Inputs](#inputs)
    * [AccessUrlInput](#accessurlinput)
    * [AccessUrlObjectInput](#accessurlobjectinput)
    * [ActivationCodeOverrideInput](#activationcodeoverrideinput)
    * [AddPermissionInput](#addpermissioninput)
    * [AddRoleForApiKeyInput](#addroleforapikeyinput)
    * [ArrayDiskInput](#arraydiskinput)
    * [ArrayStateInput](#arraystateinput)
    * [BrandingConfigInput](#brandingconfiginput)
    * [ConnectSettingsInput](#connectsettingsinput)
    * [ConnectSignInInput](#connectsignininput)
    * [ConnectUserInfoInput](#connectuserinfoinput)
    * [CreateApiKeyInput](#createapikeyinput)
    * [CreateInternalBootPoolInput](#createinternalbootpoolinput)
    * [CreateRCloneRemoteInput](#creatercloneremoteinput)
    * [DeleteApiKeyInput](#deleteapikeyinput)
    * [DeleteRCloneRemoteInput](#deletercloneremoteinput)
    * [DockerAutostartEntryInput](#dockerautostartentryinput)
    * [EnableDynamicRemoteAccessInput](#enabledynamicremoteaccessinput)
    * [InitiateFlashBackupInput](#initiateflashbackupinput)
    * [InstallPluginInput](#installplugininput)
    * [IpmiConfigInput](#ipmiconfiginput)
    * [LmSensorsConfigInput](#lmsensorsconfiginput)
    * [NotificationData](#notificationdata)
    * [NotificationFilter](#notificationfilter)
    * [OnboardingOverrideCompletionInput](#onboardingoverridecompletioninput)
    * [OnboardingOverrideInput](#onboardingoverrideinput)
    * [PartnerConfigInput](#partnerconfiginput)
    * [PartnerInfoOverrideInput](#partnerinfooverrideinput)
    * [PartnerLinkInput](#partnerlinkinput)
    * [PluginManagementInput](#pluginmanagementinput)
    * [RCloneConfigFormInput](#rcloneconfigforminput)
    * [RemoveRoleFromApiKeyInput](#removerolefromapikeyinput)
    * [SensorConfigInput](#sensorconfiginput)
    * [SetupRemoteAccessInput](#setupremoteaccessinput)
    * [SystemConfigInput](#systemconfiginput)
    * [TemperatureConfigInput](#temperatureconfiginput)
    * [TemperatureHistoryConfigInput](#temperaturehistoryconfiginput)
    * [TemperatureSensorsConfigInput](#temperaturesensorsconfiginput)
    * [TemperatureThresholdsConfigInput](#temperaturethresholdsconfiginput)
    * [UPSConfigInput](#upsconfiginput)
    * [UpdateApiKeyInput](#updateapikeyinput)
    * [UpdateSshInput](#updatesshinput)
    * [UpdateSystemTimeInput](#updatesystemtimeinput)
  * [Enums](#enums)
    * [ArrayDiskFsColor](#arraydiskfscolor)
    * [ArrayDiskStatus](#arraydiskstatus)
    * [ArrayDiskType](#arraydisktype)
    * [ArrayState](#arraystate)
    * [ArrayStateInputState](#arraystateinputstate)
    * [AuthAction](#authaction)
    * [AuthorizationOperator](#authorizationoperator)
    * [AuthorizationRuleMode](#authorizationrulemode)
    * [ConfigErrorState](#configerrorstate)
    * [ContainerPortType](#containerporttype)
    * [ContainerState](#containerstate)
    * [DiskFsType](#diskfstype)
    * [DiskInterfaceType](#diskinterfacetype)
    * [DiskSmartStatus](#disksmartstatus)
    * [DynamicRemoteAccessType](#dynamicremoteaccesstype)
    * [MinigraphStatus](#minigraphstatus)
    * [NotificationImportance](#notificationimportance)
    * [NotificationType](#notificationtype)
    * [OnboardingStatus](#onboardingstatus)
    * [ParityCheckStatus](#paritycheckstatus)
    * [PluginInstallStatus](#plugininstallstatus)
    * [RegistrationState](#registrationstate)
    * [Resource](#resource)
    * [Role](#role)
    * [SensorType](#sensortype)
    * [ServerStatus](#serverstatus)
    * [Temperature](#temperature)
    * [TemperatureStatus](#temperaturestatus)
    * [TemperatureUnit](#temperatureunit)
    * [ThemeName](#themename)
    * [UPSCableType](#upscabletype)
    * [UPSKillPower](#upskillpower)
    * [UPSServiceState](#upsservicestate)
    * [UPSType](#upstype)
    * [URL_TYPE](#url_type)
    * [UpdateStatus](#updatestatus)
    * [VmState](#vmstate)
    * [WAN_ACCESS_TYPE](#wan_access_type)
    * [WAN_FORWARD_TYPE](#wan_forward_type)
    * [registrationType](#registrationtype)
  * [Scalars](#scalars)
    * [BigInt](#bigint)
    * [Boolean](#boolean)
    * [DateTime](#datetime)
    * [Float](#float)
    * [ID](#id)
    * [Int](#int)
    * [JSON](#json)
    * [Port](#port)
    * [PrefixedID](#prefixedid)
    * [String](#string)
    * [URL](#url)
  * [Interfaces](#interfaces)
    * [FormSchema](#formschema)
    * [Node](#node)

</details>

## Query
<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="query.apikeys">apiKeys</strong></td>
<td valign="top">[<a href="#apikey">ApiKey</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **API_KEY**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.apikey">apiKey</strong></td>
<td valign="top"><a href="#apikey">ApiKey</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **API_KEY**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.apikeypossibleroles">apiKeyPossibleRoles</strong></td>
<td valign="top">[<a href="#role">Role</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **PERMISSION**

#### Description:

All possible roles for API keys

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.apikeypossiblepermissions">apiKeyPossiblePermissions</strong></td>
<td valign="top">[<a href="#permission">Permission</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **PERMISSION**

#### Description:

All possible permissions for API keys

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.getpermissionsforroles">getPermissionsForRoles</strong></td>
<td valign="top">[<a href="#permission">Permission</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **PERMISSION**

#### Description:

Get the actual permissions that would be granted by a set of roles

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">roles</td>
<td valign="top">[<a href="#role">Role</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.previeweffectivepermissions">previewEffectivePermissions</strong></td>
<td valign="top">[<a href="#permission">Permission</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **PERMISSION**

#### Description:

Preview the effective permissions for a combination of roles and explicit permissions

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">roles</td>
<td valign="top">[<a href="#role">Role</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">permissions</td>
<td valign="top">[<a href="#addpermissioninput">AddPermissionInput</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.getavailableauthactions">getAvailableAuthActions</strong></td>
<td valign="top">[<a href="#authaction">AuthAction</a>!]!</td>
<td>

Get all available authentication actions with possession

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.getapikeycreationformschema">getApiKeyCreationFormSchema</strong></td>
<td valign="top"><a href="#apikeyformsettings">ApiKeyFormSettings</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **API_KEY**

#### Description:

Get JSON Schema for API key creation form

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.config">config</strong></td>
<td valign="top"><a href="#config">Config</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CONFIG**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.display">display</strong></td>
<td valign="top"><a href="#infodisplay">InfoDisplay</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DISPLAY**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.flash">flash</strong></td>
<td valign="top"><a href="#flash">Flash</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **FLASH**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.me">me</strong></td>
<td valign="top"><a href="#useraccount">UserAccount</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **ME**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.notifications">notifications</strong></td>
<td valign="top"><a href="#notifications">Notifications</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **NOTIFICATIONS**

#### Description:

Get all notifications

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.online">online</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **ONLINE**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.owner">owner</strong></td>
<td valign="top"><a href="#owner">Owner</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **OWNER**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.internalbootcontext">internalBootContext</strong></td>
<td valign="top"><a href="#onboardinginternalbootcontext">OnboardingInternalBootContext</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **WELCOME**

#### Description:

Get the latest onboarding context for configuring internal boot

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.registration">registration</strong></td>
<td valign="top"><a href="#registration">Registration</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **REGISTRATION**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.server">server</strong></td>
<td valign="top"><a href="#server">Server</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **SERVERS**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.servers">servers</strong></td>
<td valign="top">[<a href="#server">Server</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **SERVERS**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.services">services</strong></td>
<td valign="top">[<a href="#service">Service</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **SERVICES**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.shares">shares</strong></td>
<td valign="top">[<a href="#share">Share</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **SHARE**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.vars">vars</strong></td>
<td valign="top"><a href="#vars">Vars</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **VARS**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.vms">vms</strong></td>
<td valign="top"><a href="#vms">Vms</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **VMS**

#### Description:

Get information about all VMs on the system

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.parityhistory">parityHistory</strong></td>
<td valign="top">[<a href="#paritycheck">ParityCheck</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **ARRAY**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.array">array</strong></td>
<td valign="top"><a href="#unraidarray">UnraidArray</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **ARRAY**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.customization">customization</strong></td>
<td valign="top"><a href="#customization">Customization</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CUSTOMIZATIONS**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.isfreshinstall">isFreshInstall</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether the system is a fresh install (no license key)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.publictheme">publicTheme</strong></td>
<td valign="top"><a href="#theme">Theme</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.info">info</strong></td>
<td valign="top"><a href="#info">Info</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **INFO**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.docker">docker</strong></td>
<td valign="top"><a href="#docker">Docker</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.disks">disks</strong></td>
<td valign="top">[<a href="#disk">Disk</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DISK**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.assignabledisks">assignableDisks</strong></td>
<td valign="top">[<a href="#disk">Disk</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DISK**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.disk">disk</strong></td>
<td valign="top"><a href="#disk">Disk</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DISK**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.rclone">rclone</strong></td>
<td valign="top"><a href="#rclonebackupsettings">RCloneBackupSettings</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **FLASH**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.logfiles">logFiles</strong></td>
<td valign="top">[<a href="#logfile">LogFile</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **LOGS**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.logfile">logFile</strong></td>
<td valign="top"><a href="#logfilecontent">LogFileContent</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **LOGS**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">path</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">lines</td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">startLine</td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.settings">settings</strong></td>
<td valign="top"><a href="#settings">Settings</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.isssoenabled">isSSOEnabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.publicoidcproviders">publicOidcProviders</strong></td>
<td valign="top">[<a href="#publicoidcprovider">PublicOidcProvider</a>!]!</td>
<td>

Get public OIDC provider information for login buttons

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.oidcproviders">oidcProviders</strong></td>
<td valign="top">[<a href="#oidcprovider">OidcProvider</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CONFIG**

#### Description:

Get all configured OIDC providers (admin only)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.oidcprovider">oidcProvider</strong></td>
<td valign="top"><a href="#oidcprovider">OidcProvider</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CONFIG**

#### Description:

Get a specific OIDC provider by ID

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.oidcconfiguration">oidcConfiguration</strong></td>
<td valign="top"><a href="#oidcconfiguration">OidcConfiguration</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CONFIG**

#### Description:

Get the full OIDC configuration (admin only)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.validateoidcsession">validateOidcSession</strong></td>
<td valign="top"><a href="#oidcsessionvalidation">OidcSessionValidation</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CONFIG**

#### Description:

Validate an OIDC session token (internal use for CLI validation)

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">token</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.metrics">metrics</strong></td>
<td valign="top"><a href="#metrics">Metrics</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **INFO**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.systemtime">systemTime</strong></td>
<td valign="top"><a href="#systemtime">SystemTime</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **VARS**

#### Description:

Retrieve current system time configuration

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.timezoneoptions">timeZoneOptions</strong></td>
<td valign="top">[<a href="#timezoneoption">TimeZoneOption</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CONFIG**

#### Description:

Retrieve available time zone options

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.upsdevices">upsDevices</strong></td>
<td valign="top">[<a href="#upsdevice">UPSDevice</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.upsdevicebyid">upsDeviceById</strong></td>
<td valign="top"><a href="#upsdevice">UPSDevice</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.upsconfiguration">upsConfiguration</strong></td>
<td valign="top"><a href="#upsconfiguration">UPSConfiguration</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.plugininstalloperation">pluginInstallOperation</strong></td>
<td valign="top"><a href="#plugininstalloperation">PluginInstallOperation</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CONFIG**

#### Description:

Retrieve a plugin installation operation by identifier

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">operationId</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.plugininstalloperations">pluginInstallOperations</strong></td>
<td valign="top">[<a href="#plugininstalloperation">PluginInstallOperation</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CONFIG**

#### Description:

List all tracked plugin installation operations

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.installedunraidplugins">installedUnraidPlugins</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CONFIG**

#### Description:

List installed Unraid OS plugins by .plg filename

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.plugins">plugins</strong></td>
<td valign="top">[<a href="#plugin">Plugin</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CONFIG**

#### Description:

List all installed plugins with their metadata

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.remoteaccess">remoteAccess</strong></td>
<td valign="top"><a href="#remoteaccess">RemoteAccess</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CONNECT**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.connect">connect</strong></td>
<td valign="top"><a href="#connect">Connect</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CONNECT**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.network">network</strong></td>
<td valign="top"><a href="#network">Network</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **NETWORK**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.cloud">cloud</strong></td>
<td valign="top"><a href="#cloud">Cloud</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CLOUD**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.networkinterfaces">networkInterfaces</strong></td>
<td valign="top">[<a href="#infonetworkinterface">InfoNetworkInterface</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **INFO**

#### Description:

Get all network interfaces

</td>
</tr>
</tbody>
</table>

## Mutation
<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="mutation.createnotification">createNotification</strong></td>
<td valign="top"><a href="#notification">Notification</a>!</td>
<td>

Creates a new notification record

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#notificationdata">NotificationData</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.deletenotification">deleteNotification</strong></td>
<td valign="top"><a href="#notificationoverview">NotificationOverview</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">type</td>
<td valign="top"><a href="#notificationtype">NotificationType</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.deletearchivednotifications">deleteArchivedNotifications</strong></td>
<td valign="top"><a href="#notificationoverview">NotificationOverview</a>!</td>
<td>

Deletes all archived notifications on server.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.archivenotification">archiveNotification</strong></td>
<td valign="top"><a href="#notification">Notification</a>!</td>
<td>

Marks a notification as archived.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.archivenotifications">archiveNotifications</strong></td>
<td valign="top"><a href="#notificationoverview">NotificationOverview</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">ids</td>
<td valign="top">[<a href="#prefixedid">PrefixedID</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.notifyifunique">notifyIfUnique</strong></td>
<td valign="top"><a href="#notification">Notification</a></td>
<td>

Creates a notification if an equivalent unread notification does not already exist.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#notificationdata">NotificationData</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.archiveall">archiveAll</strong></td>
<td valign="top"><a href="#notificationoverview">NotificationOverview</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">importance</td>
<td valign="top"><a href="#notificationimportance">NotificationImportance</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.unreadnotification">unreadNotification</strong></td>
<td valign="top"><a href="#notification">Notification</a>!</td>
<td>

Marks a notification as unread.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.unarchivenotifications">unarchiveNotifications</strong></td>
<td valign="top"><a href="#notificationoverview">NotificationOverview</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">ids</td>
<td valign="top">[<a href="#prefixedid">PrefixedID</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.unarchiveall">unarchiveAll</strong></td>
<td valign="top"><a href="#notificationoverview">NotificationOverview</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">importance</td>
<td valign="top"><a href="#notificationimportance">NotificationImportance</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.recalculateoverview">recalculateOverview</strong></td>
<td valign="top"><a href="#notificationoverview">NotificationOverview</a>!</td>
<td>

Reads each notification to recompute & update the overview.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.array">array</strong></td>
<td valign="top"><a href="#arraymutations">ArrayMutations</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.docker">docker</strong></td>
<td valign="top"><a href="#dockermutations">DockerMutations</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.vm">vm</strong></td>
<td valign="top"><a href="#vmmutations">VmMutations</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.paritycheck">parityCheck</strong></td>
<td valign="top"><a href="#paritycheckmutations">ParityCheckMutations</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.apikey">apiKey</strong></td>
<td valign="top"><a href="#apikeymutations">ApiKeyMutations</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.customization">customization</strong></td>
<td valign="top"><a href="#customizationmutations">CustomizationMutations</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.rclone">rclone</strong></td>
<td valign="top"><a href="#rclonemutations">RCloneMutations</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.onboarding">onboarding</strong></td>
<td valign="top"><a href="#onboardingmutations">OnboardingMutations</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.unraidplugins">unraidPlugins</strong></td>
<td valign="top"><a href="#unraidpluginsmutations">UnraidPluginsMutations</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.updateserveridentity">updateServerIdentity</strong></td>
<td valign="top"><a href="#server">Server</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **SERVERS**

#### Description:

Update server name, comment, and model

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">name</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">comment</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">sysModel</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.updatesshsettings">updateSshSettings</strong></td>
<td valign="top"><a href="#vars">Vars</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **VARS**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#updatesshinput">UpdateSshInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.createdockerfolder">createDockerFolder</strong></td>
<td valign="top"><a href="#resolvedorganizerv1">ResolvedOrganizerV1</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">name</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">parentId</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">childrenIds</td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.setdockerfolderchildren">setDockerFolderChildren</strong></td>
<td valign="top"><a href="#resolvedorganizerv1">ResolvedOrganizerV1</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">folderId</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">childrenIds</td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.deletedockerentries">deleteDockerEntries</strong></td>
<td valign="top"><a href="#resolvedorganizerv1">ResolvedOrganizerV1</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">entryIds</td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.movedockerentriestofolder">moveDockerEntriesToFolder</strong></td>
<td valign="top"><a href="#resolvedorganizerv1">ResolvedOrganizerV1</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">sourceEntryIds</td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">destinationFolderId</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.movedockeritemstoposition">moveDockerItemsToPosition</strong></td>
<td valign="top"><a href="#resolvedorganizerv1">ResolvedOrganizerV1</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">sourceEntryIds</td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">destinationFolderId</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">position</td>
<td valign="top"><a href="#float">Float</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.renamedockerfolder">renameDockerFolder</strong></td>
<td valign="top"><a href="#resolvedorganizerv1">ResolvedOrganizerV1</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">folderId</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">newName</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.createdockerfolderwithitems">createDockerFolderWithItems</strong></td>
<td valign="top"><a href="#resolvedorganizerv1">ResolvedOrganizerV1</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">name</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">parentId</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">sourceEntryIds</td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">position</td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.updatedockerviewpreferences">updateDockerViewPreferences</strong></td>
<td valign="top"><a href="#resolvedorganizerv1">ResolvedOrganizerV1</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">viewId</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">prefs</td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.syncdockertemplatepaths">syncDockerTemplatePaths</strong></td>
<td valign="top"><a href="#dockertemplatesyncresult">DockerTemplateSyncResult</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.resetdockertemplatemappings">resetDockerTemplateMappings</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

#### Description:

Reset Docker template mappings to defaults. Use this to recover from corrupted state.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.refreshdockerdigests">refreshDockerDigests</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.initiateflashbackup">initiateFlashBackup</strong></td>
<td valign="top"><a href="#flashbackupstatus">FlashBackupStatus</a>!</td>
<td>

Initiates a flash drive backup using a configured remote.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#initiateflashbackupinput">InitiateFlashBackupInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.updatesettings">updateSettings</strong></td>
<td valign="top"><a href="#updatesettingsresponse">UpdateSettingsResponse</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **CONFIG**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.updatetemperatureconfig">updateTemperatureConfig</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **INFO**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#temperatureconfiginput">TemperatureConfigInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.updatesystemtime">updateSystemTime</strong></td>
<td valign="top"><a href="#systemtime">SystemTime</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **CONFIG**

#### Description:

Update system time configuration

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#updatesystemtimeinput">UpdateSystemTimeInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.configureups">configureUps</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">config</td>
<td valign="top"><a href="#upsconfiginput">UPSConfigInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.addplugin">addPlugin</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **CONFIG**

#### Description:

Add one or more plugins to the API. Returns false if restart was triggered automatically, true if manual restart is required.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#pluginmanagementinput">PluginManagementInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.removeplugin">removePlugin</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **DELETE_ANY**
- Resource: **CONFIG**

#### Description:

Remove one or more plugins from the API. Returns false if restart was triggered automatically, true if manual restart is required.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#pluginmanagementinput">PluginManagementInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.updateapisettings">updateApiSettings</strong></td>
<td valign="top"><a href="#connectsettingsvalues">ConnectSettingsValues</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **CONFIG**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#connectsettingsinput">ConnectSettingsInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.connectsignin">connectSignIn</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **CONNECT**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#connectsignininput">ConnectSignInInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.connectsignout">connectSignOut</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **CONNECT**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.setupremoteaccess">setupRemoteAccess</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **CONNECT**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#setupremoteaccessinput">SetupRemoteAccessInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.enabledynamicremoteaccess">enableDynamicRemoteAccess</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **CONNECT__REMOTE_ACCESS**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#enabledynamicremoteaccessinput">EnableDynamicRemoteAccessInput</a>!</td>
<td></td>
</tr>
</tbody>
</table>

## Subscription
<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="subscription.displaysubscription">displaySubscription</strong></td>
<td valign="top"><a href="#infodisplay">InfoDisplay</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DISPLAY**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.notificationadded">notificationAdded</strong></td>
<td valign="top"><a href="#notification">Notification</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **NOTIFICATIONS**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.notificationsoverview">notificationsOverview</strong></td>
<td valign="top"><a href="#notificationoverview">NotificationOverview</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **NOTIFICATIONS**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.notificationswarningsandalerts">notificationsWarningsAndAlerts</strong></td>
<td valign="top">[<a href="#notification">Notification</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **NOTIFICATIONS**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.ownersubscription">ownerSubscription</strong></td>
<td valign="top"><a href="#owner">Owner</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **OWNER**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.serverssubscription">serversSubscription</strong></td>
<td valign="top"><a href="#server">Server</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **SERVERS**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.parityhistorysubscription">parityHistorySubscription</strong></td>
<td valign="top"><a href="#paritycheck">ParityCheck</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **ARRAY**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.arraysubscription">arraySubscription</strong></td>
<td valign="top"><a href="#unraidarray">UnraidArray</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **ARRAY**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.dockercontainerstats">dockerContainerStats</strong></td>
<td valign="top"><a href="#dockercontainerstats">DockerContainerStats</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.logfile">logFile</strong></td>
<td valign="top"><a href="#logfilecontent">LogFileContent</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **LOGS**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">path</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.systemmetricscpu">systemMetricsCpu</strong></td>
<td valign="top"><a href="#cpuutilization">CpuUtilization</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **INFO**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.systemmetricscputelemetry">systemMetricsCpuTelemetry</strong></td>
<td valign="top"><a href="#cpupackages">CpuPackages</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **INFO**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.systemmetricsmemory">systemMetricsMemory</strong></td>
<td valign="top"><a href="#memoryutilization">MemoryUtilization</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **INFO**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.systemmetricstemperature">systemMetricsTemperature</strong></td>
<td valign="top"><a href="#temperaturemetrics">TemperatureMetrics</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **INFO**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.systemmetricsnetwork">systemMetricsNetwork</strong></td>
<td valign="top">[<a href="#networkmetrics">NetworkMetrics</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **INFO**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.upsupdates">upsUpdates</strong></td>
<td valign="top"><a href="#upsdevice">UPSDevice</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="subscription.plugininstallupdates">pluginInstallUpdates</strong></td>
<td valign="top"><a href="#plugininstallevent">PluginInstallEvent</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CONFIG**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">operationId</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
</tbody>
</table>

## Objects

### AccessUrl

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="accessurl.type">type</strong></td>
<td valign="top"><a href="#url_type">URL_TYPE</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="accessurl.name">name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="accessurl.ipv4">ipv4</strong></td>
<td valign="top"><a href="#url">URL</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="accessurl.ipv6">ipv6</strong></td>
<td valign="top"><a href="#url">URL</a></td>
<td></td>
</tr>
</tbody>
</table>

### AccessUrlObject

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="accessurlobject.ipv4">ipv4</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="accessurlobject.ipv6">ipv6</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="accessurlobject.type">type</strong></td>
<td valign="top"><a href="#url_type">URL_TYPE</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="accessurlobject.name">name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### ActivationCode

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="activationcode.code">code</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="activationcode.partner">partner</strong></td>
<td valign="top"><a href="#partnerconfig">PartnerConfig</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="activationcode.branding">branding</strong></td>
<td valign="top"><a href="#brandingconfig">BrandingConfig</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="activationcode.system">system</strong></td>
<td valign="top"><a href="#systemconfig">SystemConfig</a></td>
<td></td>
</tr>
</tbody>
</table>

### ApiConfig

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="apiconfig.version">version</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apiconfig.extraorigins">extraOrigins</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apiconfig.sandbox">sandbox</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apiconfig.ssosubids">ssoSubIds</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apiconfig.plugins">plugins</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### ApiKey

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="apikey.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apikey.key">key</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apikey.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apikey.description">description</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apikey.roles">roles</strong></td>
<td valign="top">[<a href="#role">Role</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apikey.createdat">createdAt</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apikey.permissions">permissions</strong></td>
<td valign="top">[<a href="#permission">Permission</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### ApiKeyFormSettings

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="apikeyformsettings.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apikeyformsettings.dataschema">dataSchema</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>

The data schema for the API key form

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apikeyformsettings.uischema">uiSchema</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>

The UI schema for the API key form

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apikeyformsettings.values">values</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>

The current values of the API key form

</td>
</tr>
</tbody>
</table>

### ApiKeyMutations

API Key related mutations

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="apikeymutations.create">create</strong></td>
<td valign="top"><a href="#apikey">ApiKey</a>!</td>
<td>


#### Required Permissions:

- Action: **CREATE_ANY**
- Resource: **API_KEY**

#### Description:

Create an API key

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#createapikeyinput">CreateApiKeyInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apikeymutations.addrole">addRole</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **API_KEY**

#### Description:

Add a role to an API key

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#addroleforapikeyinput">AddRoleForApiKeyInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apikeymutations.removerole">removeRole</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **API_KEY**

#### Description:

Remove a role from an API key

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#removerolefromapikeyinput">RemoveRoleFromApiKeyInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apikeymutations.delete">delete</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **DELETE_ANY**
- Resource: **API_KEY**

#### Description:

Delete one or more API keys

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#deleteapikeyinput">DeleteApiKeyInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apikeymutations.update">update</strong></td>
<td valign="top"><a href="#apikey">ApiKey</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **API_KEY**

#### Description:

Update an API key

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#updateapikeyinput">UpdateApiKeyInput</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### ApiKeyResponse

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="apikeyresponse.valid">valid</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="apikeyresponse.error">error</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### ArrayCapacity

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="arraycapacity.kilobytes">kilobytes</strong></td>
<td valign="top"><a href="#capacity">Capacity</a>!</td>
<td>

Capacity in kilobytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraycapacity.disks">disks</strong></td>
<td valign="top"><a href="#capacity">Capacity</a>!</td>
<td>

Capacity in number of disks

</td>
</tr>
</tbody>
</table>

### ArrayDisk

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.idx">idx</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Array slot number. Parity1 is always 0 and Parity2 is always 29. Array slots will be 1 - 28. Cache slots are 30 - 53. Flash is 54.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.name">name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.device">device</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.size">size</strong></td>
<td valign="top"><a href="#bigint">BigInt</a></td>
<td>

(KB) Disk Size total

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.status">status</strong></td>
<td valign="top"><a href="#arraydiskstatus">ArrayDiskStatus</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.rotational">rotational</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Is the disk a HDD or SSD.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.temp">temp</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Disk temp - will be NaN if array is not started or DISK_NP

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.numreads">numReads</strong></td>
<td valign="top"><a href="#bigint">BigInt</a></td>
<td>

Count of I/O read requests sent to the device I/O drivers. These statistics may be cleared at any time.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.numwrites">numWrites</strong></td>
<td valign="top"><a href="#bigint">BigInt</a></td>
<td>

Count of I/O writes requests sent to the device I/O drivers. These statistics may be cleared at any time.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.numerrors">numErrors</strong></td>
<td valign="top"><a href="#bigint">BigInt</a></td>
<td>

Number of unrecoverable errors reported by the device I/O drivers. Missing data due to unrecoverable array read errors is filled in on-the-fly using parity reconstruct (and we attempt to write this data back to the sector(s) which failed). Any unrecoverable write error results in disabling the disk.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.fssize">fsSize</strong></td>
<td valign="top"><a href="#bigint">BigInt</a></td>
<td>

(KB) Total Size of the FS (Not present on Parity type drive)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.fsfree">fsFree</strong></td>
<td valign="top"><a href="#bigint">BigInt</a></td>
<td>

(KB) Free Size on the FS (Not present on Parity type drive)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.fsused">fsUsed</strong></td>
<td valign="top"><a href="#bigint">BigInt</a></td>
<td>

(KB) Used Size on the FS (Not present on Parity type drive)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.exportable">exportable</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.type">type</strong></td>
<td valign="top"><a href="#arraydisktype">ArrayDiskType</a>!</td>
<td>

Type of Disk - used to differentiate Boot / Cache / Flash / Data (DATA) / Parity

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.warning">warning</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

(%) Disk space left to warn

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.critical">critical</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

(%) Disk space left for critical

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.fstype">fsType</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

File system type for the disk

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.comment">comment</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

User comment on disk

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.format">format</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

File format (ex MBR: 4KiB-aligned)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.transport">transport</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

ata | nvme | usb | (others)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.color">color</strong></td>
<td valign="top"><a href="#arraydiskfscolor">ArrayDiskFsColor</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydisk.isspinning">isSpinning</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Whether the disk is currently spinning

</td>
</tr>
</tbody>
</table>

### ArrayMutations

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="arraymutations.setstate">setState</strong></td>
<td valign="top"><a href="#unraidarray">UnraidArray</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **ARRAY**

#### Description:

Set array state

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#arraystateinput">ArrayStateInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraymutations.adddisktoarray">addDiskToArray</strong></td>
<td valign="top"><a href="#unraidarray">UnraidArray</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **ARRAY**

#### Description:

Add new disk to array

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#arraydiskinput">ArrayDiskInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraymutations.removediskfromarray">removeDiskFromArray</strong></td>
<td valign="top"><a href="#unraidarray">UnraidArray</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **ARRAY**

#### Description:

Remove existing disk from array. NOTE: The array must be stopped before running this otherwise it'll throw an error.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#arraydiskinput">ArrayDiskInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraymutations.mountarraydisk">mountArrayDisk</strong></td>
<td valign="top"><a href="#arraydisk">ArrayDisk</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **ARRAY**

#### Description:

Mount a disk in the array

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraymutations.unmountarraydisk">unmountArrayDisk</strong></td>
<td valign="top"><a href="#arraydisk">ArrayDisk</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **ARRAY**

#### Description:

Unmount a disk from the array

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraymutations.cleararraydiskstatistics">clearArrayDiskStatistics</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **ARRAY**

#### Description:

Clear statistics for a disk in the array

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### BrandingConfig

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.header">header</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.headermetacolor">headermetacolor</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.background">background</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.showbannergradient">showBannerGradient</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.theme">theme</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.bannerimage">bannerImage</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Banner image source. Supports local path, remote URL, or data URI/base64.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.casemodel">caseModel</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Built-in case model value written to case-model.cfg when no custom override is supplied.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.casemodelimage">caseModelImage</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Case model image source. Supports local path, remote URL, or data URI/base64.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.partnerlogolighturl">partnerLogoLightUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Partner logo source for light themes (azure/white). Supports local path, remote URL, or data URI/base64.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.partnerlogodarkurl">partnerLogoDarkUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Partner logo source for dark themes (black/gray). Supports local path, remote URL, or data URI/base64.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.haspartnerlogo">hasPartnerLogo</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Indicates if a partner logo exists

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.onboardingtitle">onboardingTitle</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Custom title for onboarding welcome step

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.onboardingsubtitle">onboardingSubtitle</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Custom subtitle for onboarding welcome step

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.onboardingtitlefreshinstall">onboardingTitleFreshInstall</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Custom title for fresh install onboarding

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.onboardingsubtitlefreshinstall">onboardingSubtitleFreshInstall</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Custom subtitle for fresh install onboarding

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.onboardingtitleupgrade">onboardingTitleUpgrade</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Custom title for upgrade onboarding

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.onboardingsubtitleupgrade">onboardingSubtitleUpgrade</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Custom subtitle for upgrade onboarding

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.onboardingtitledowngrade">onboardingTitleDowngrade</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Custom title for downgrade onboarding

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.onboardingsubtitledowngrade">onboardingSubtitleDowngrade</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Custom subtitle for downgrade onboarding

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.onboardingtitleincomplete">onboardingTitleIncomplete</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Custom title for incomplete onboarding

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfig.onboardingsubtitleincomplete">onboardingSubtitleIncomplete</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Custom subtitle for incomplete onboarding

</td>
</tr>
</tbody>
</table>

### Capacity

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="capacity.free">free</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Free capacity

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="capacity.used">used</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Used capacity

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="capacity.total">total</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Total capacity

</td>
</tr>
</tbody>
</table>

### Cloud

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="cloud.error">error</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cloud.apikey">apiKey</strong></td>
<td valign="top"><a href="#apikeyresponse">ApiKeyResponse</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cloud.relay">relay</strong></td>
<td valign="top"><a href="#relayresponse">RelayResponse</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cloud.minigraphql">minigraphql</strong></td>
<td valign="top"><a href="#minigraphqlresponse">MinigraphqlResponse</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cloud.cloud">cloud</strong></td>
<td valign="top"><a href="#cloudresponse">CloudResponse</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cloud.allowedorigins">allowedOrigins</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### CloudResponse

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="cloudresponse.status">status</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cloudresponse.ip">ip</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cloudresponse.error">error</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### Config

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="config.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="config.valid">valid</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="config.error">error</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### Connect

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="connect.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="connect.dynamicremoteaccess">dynamicRemoteAccess</strong></td>
<td valign="top"><a href="#dynamicremoteaccessstatus">DynamicRemoteAccessStatus</a>!</td>
<td>

The status of dynamic remote access

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="connect.settings">settings</strong></td>
<td valign="top"><a href="#connectsettings">ConnectSettings</a>!</td>
<td>

The settings for the Connect instance

</td>
</tr>
</tbody>
</table>

### ConnectSettings

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="connectsettings.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="connectsettings.dataschema">dataSchema</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>

The data schema for the Connect settings

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="connectsettings.uischema">uiSchema</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>

The UI schema for the Connect settings

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="connectsettings.values">values</strong></td>
<td valign="top"><a href="#connectsettingsvalues">ConnectSettingsValues</a>!</td>
<td>

The values for the Connect settings

</td>
</tr>
</tbody>
</table>

### ConnectSettingsValues

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="connectsettingsvalues.accesstype">accessType</strong></td>
<td valign="top"><a href="#wan_access_type">WAN_ACCESS_TYPE</a>!</td>
<td>

The type of WAN access used for Remote Access

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="connectsettingsvalues.forwardtype">forwardType</strong></td>
<td valign="top"><a href="#wan_forward_type">WAN_FORWARD_TYPE</a></td>
<td>

The type of port forwarding used for Remote Access

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="connectsettingsvalues.port">port</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

The port used for Remote Access

</td>
</tr>
</tbody>
</table>

### ContainerHostConfig

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="containerhostconfig.networkmode">networkMode</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### ContainerPort

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="containerport.ip">ip</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="containerport.privateport">privatePort</strong></td>
<td valign="top"><a href="#port">Port</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="containerport.publicport">publicPort</strong></td>
<td valign="top"><a href="#port">Port</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="containerport.type">type</strong></td>
<td valign="top"><a href="#containerporttype">ContainerPortType</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### CoreVersions

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="coreversions.unraid">unraid</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Unraid version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="coreversions.api">api</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Unraid API version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="coreversions.kernel">kernel</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Kernel version

</td>
</tr>
</tbody>
</table>

### CpuLoad

CPU load for a single core

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="cpuload.percenttotal">percentTotal</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The total CPU load on a single core, in percent.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cpuload.percentuser">percentUser</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The percentage of time the CPU spent in user space.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cpuload.percentsystem">percentSystem</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The percentage of time the CPU spent in kernel space.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cpuload.percentnice">percentNice</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The percentage of time the CPU spent on low-priority (niced) user space processes.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cpuload.percentidle">percentIdle</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The percentage of time the CPU was idle.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cpuload.percentirq">percentIrq</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The percentage of time the CPU spent servicing hardware interrupts.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cpuload.percentguest">percentGuest</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The percentage of time the CPU spent running virtual machines (guest).

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cpuload.percentsteal">percentSteal</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The percentage of CPU time stolen by the hypervisor.

</td>
</tr>
</tbody>
</table>

### CpuPackages

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="cpupackages.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cpupackages.totalpower">totalPower</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Total CPU package power draw (W)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cpupackages.power">power</strong></td>
<td valign="top">[<a href="#float">Float</a>!]!</td>
<td>

Power draw per package (W)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cpupackages.temp">temp</strong></td>
<td valign="top">[<a href="#float">Float</a>!]!</td>
<td>

Temperature per package (°C)

</td>
</tr>
</tbody>
</table>

### CpuUtilization

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="cpuutilization.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cpuutilization.percenttotal">percentTotal</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Total CPU load in percent

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="cpuutilization.cpus">cpus</strong></td>
<td valign="top">[<a href="#cpuload">CpuLoad</a>!]!</td>
<td>

CPU load for each core

</td>
</tr>
</tbody>
</table>

### Customization

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="customization.activationcode">activationCode</strong></td>
<td valign="top"><a href="#activationcode">ActivationCode</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **ACTIVATION_CODE**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="customization.onboarding">onboarding</strong></td>
<td valign="top"><a href="#onboarding">Onboarding</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **CUSTOMIZATIONS**

#### Description:

Onboarding completion state and context

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="customization.availablelanguages">availableLanguages</strong></td>
<td valign="top">[<a href="#language">Language</a>!]</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DISPLAY**

</td>
</tr>
</tbody>
</table>

### CustomizationMutations

Customization related mutations

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="customizationmutations.settheme">setTheme</strong></td>
<td valign="top"><a href="#theme">Theme</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **CUSTOMIZATIONS**

#### Description:

Update the UI theme (writes dynamix.cfg)

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">theme</td>
<td valign="top"><a href="#themename">ThemeName</a>!</td>
<td>

Theme to apply

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="customizationmutations.setlocale">setLocale</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **CUSTOMIZATIONS**

#### Description:

Update the display locale (language)

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">locale</td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Locale code to apply (e.g. en_US)

</td>
</tr>
</tbody>
</table>

### Disk

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="disk.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.device">device</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The device path of the disk (e.g. /dev/sdb)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.type">type</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The type of disk (e.g. SSD, HDD)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The model name of the disk

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.vendor">vendor</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The manufacturer of the disk

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.size">size</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The total size of the disk in bytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.bytespersector">bytesPerSector</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The number of bytes per sector

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.totalcylinders">totalCylinders</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The total number of cylinders on the disk

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.totalheads">totalHeads</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The total number of heads on the disk

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.totalsectors">totalSectors</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The total number of sectors on the disk

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.totaltracks">totalTracks</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The total number of tracks on the disk

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.trackspercylinder">tracksPerCylinder</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The number of tracks per cylinder

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.sectorspertrack">sectorsPerTrack</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The number of sectors per track

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.firmwarerevision">firmwareRevision</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The firmware revision of the disk

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.serialnum">serialNum</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The serial number of the disk

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.interfacetype">interfaceType</strong></td>
<td valign="top"><a href="#diskinterfacetype">DiskInterfaceType</a>!</td>
<td>

The interface type of the disk

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.smartstatus">smartStatus</strong></td>
<td valign="top"><a href="#disksmartstatus">DiskSmartStatus</a>!</td>
<td>

The SMART status of the disk

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.temperature">temperature</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

The current temperature of the disk in Celsius

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.partitions">partitions</strong></td>
<td valign="top">[<a href="#diskpartition">DiskPartition</a>!]!</td>
<td>

The partitions on the disk

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="disk.isspinning">isSpinning</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether the disk is spinning or not

</td>
</tr>
</tbody>
</table>

### DiskPartition

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="diskpartition.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The name of the partition

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="diskpartition.fstype">fsType</strong></td>
<td valign="top"><a href="#diskfstype">DiskFsType</a>!</td>
<td>

The filesystem type of the partition

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="diskpartition.size">size</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

The size of the partition in bytes

</td>
</tr>
</tbody>
</table>

### Docker

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="docker.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="docker.containers">containers</strong></td>
<td valign="top">[<a href="#dockercontainer">DockerContainer</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">skipCache</td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="docker.networks">networks</strong></td>
<td valign="top">[<a href="#dockernetwork">DockerNetwork</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">skipCache</td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="docker.portconflicts">portConflicts</strong></td>
<td valign="top"><a href="#dockerportconflicts">DockerPortConflicts</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">skipCache</td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="docker.logs">logs</strong></td>
<td valign="top"><a href="#dockercontainerlogs">DockerContainerLogs</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

#### Description:

Access container logs. Requires specifying a target container id through resolver arguments.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">since</td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">tail</td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="docker.container">container</strong></td>
<td valign="top"><a href="#dockercontainer">DockerContainer</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="docker.organizer">organizer</strong></td>
<td valign="top"><a href="#resolvedorganizerv1">ResolvedOrganizerV1</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">skipCache</td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="docker.containerupdatestatuses">containerUpdateStatuses</strong></td>
<td valign="top">[<a href="#explicitstatusitem">ExplicitStatusItem</a>!]!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

</td>
</tr>
</tbody>
</table>

### DockerContainer

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.names">names</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.image">image</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.imageid">imageId</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.command">command</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.created">created</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.ports">ports</strong></td>
<td valign="top">[<a href="#containerport">ContainerPort</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.lanipports">lanIpPorts</strong></td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td>

List of LAN-accessible host:port values

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.sizerootfs">sizeRootFs</strong></td>
<td valign="top"><a href="#bigint">BigInt</a></td>
<td>

Total size of all files in the container (in bytes)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.sizerw">sizeRw</strong></td>
<td valign="top"><a href="#bigint">BigInt</a></td>
<td>

Size of writable layer (in bytes)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.sizelog">sizeLog</strong></td>
<td valign="top"><a href="#bigint">BigInt</a></td>
<td>

Size of container logs (in bytes)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.labels">labels</strong></td>
<td valign="top"><a href="#json">JSON</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.state">state</strong></td>
<td valign="top"><a href="#containerstate">ContainerState</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.status">status</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.hostconfig">hostConfig</strong></td>
<td valign="top"><a href="#containerhostconfig">ContainerHostConfig</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.networksettings">networkSettings</strong></td>
<td valign="top"><a href="#json">JSON</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.mounts">mounts</strong></td>
<td valign="top">[<a href="#json">JSON</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.autostart">autoStart</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.autostartorder">autoStartOrder</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Zero-based order in the auto-start list

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.autostartwait">autoStartWait</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Wait time in seconds applied after start

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.templatepath">templatePath</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.projecturl">projectUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

#### Description:

Project/Product homepage URL

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.registryurl">registryUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

#### Description:

Registry/Docker Hub URL

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.supporturl">supportUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

#### Description:

Support page/thread URL

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.iconurl">iconUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

#### Description:

Icon URL

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.webuiurl">webUiUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

#### Description:

Resolved WebUI URL from template

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.shell">shell</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

#### Description:

Shell to use for console access (from template)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.templateports">templatePorts</strong></td>
<td valign="top">[<a href="#containerport">ContainerPort</a>!]</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

#### Description:

Port mappings from template (used when container is not running)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.isorphaned">isOrphaned</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether the container is orphaned (no template found)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.isupdateavailable">isUpdateAvailable</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.isrebuildready">isRebuildReady</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.tailscaleenabled">tailscaleEnabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

#### Description:

Whether Tailscale is enabled for this container

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainer.tailscalestatus">tailscaleStatus</strong></td>
<td valign="top"><a href="#tailscalestatus">TailscaleStatus</a></td>
<td>


#### Required Permissions:

- Action: **READ_ANY**
- Resource: **DOCKER**

#### Description:

Tailscale status for this container (fetched via docker exec)

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">forceRefresh</td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
</tbody>
</table>

### DockerContainerLogLine

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainerlogline.timestamp">timestamp</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainerlogline.message">message</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### DockerContainerLogs

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainerlogs.containerid">containerId</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainerlogs.lines">lines</strong></td>
<td valign="top">[<a href="#dockercontainerlogline">DockerContainerLogLine</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainerlogs.cursor">cursor</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Cursor that can be passed back through the since argument to continue streaming logs.

</td>
</tr>
</tbody>
</table>

### DockerContainerPortConflict

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainerportconflict.privateport">privatePort</strong></td>
<td valign="top"><a href="#port">Port</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainerportconflict.type">type</strong></td>
<td valign="top"><a href="#containerporttype">ContainerPortType</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainerportconflict.containers">containers</strong></td>
<td valign="top">[<a href="#dockerportconflictcontainer">DockerPortConflictContainer</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### DockerContainerStats

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainerstats.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainerstats.cpupercent">cpuPercent</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

CPU Usage Percentage

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainerstats.memusage">memUsage</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Memory Usage String (e.g. 100MB / 1GB)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainerstats.mempercent">memPercent</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Memory Usage Percentage

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainerstats.netio">netIO</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Network I/O String (e.g. 100MB / 1GB)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockercontainerstats.blockio">blockIO</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Block I/O String (e.g. 100MB / 1GB)

</td>
</tr>
</tbody>
</table>

### DockerLanPortConflict

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="dockerlanportconflict.lanipport">lanIpPort</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockerlanportconflict.publicport">publicPort</strong></td>
<td valign="top"><a href="#port">Port</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockerlanportconflict.type">type</strong></td>
<td valign="top"><a href="#containerporttype">ContainerPortType</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockerlanportconflict.containers">containers</strong></td>
<td valign="top">[<a href="#dockerportconflictcontainer">DockerPortConflictContainer</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### DockerMutations

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="dockermutations.start">start</strong></td>
<td valign="top"><a href="#dockercontainer">DockerContainer</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

#### Description:

Start a container

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockermutations.stop">stop</strong></td>
<td valign="top"><a href="#dockercontainer">DockerContainer</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

#### Description:

Stop a container

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockermutations.restart">restart</strong></td>
<td valign="top"><a href="#dockercontainer">DockerContainer</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

#### Description:

Restart a container

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockermutations.pause">pause</strong></td>
<td valign="top"><a href="#dockercontainer">DockerContainer</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

#### Description:

Pause (Suspend) a container

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockermutations.unpause">unpause</strong></td>
<td valign="top"><a href="#dockercontainer">DockerContainer</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

#### Description:

Unpause (Resume) a container

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockermutations.removecontainer">removeContainer</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **DELETE_ANY**
- Resource: **DOCKER**

#### Description:

Remove a container

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">withImage</td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockermutations.updateautostartconfiguration">updateAutostartConfiguration</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

#### Description:

Update auto-start configuration for Docker containers

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">entries</td>
<td valign="top">[<a href="#dockerautostartentryinput">DockerAutostartEntryInput</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">persistUserPreferences</td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockermutations.updatecontainer">updateContainer</strong></td>
<td valign="top"><a href="#dockercontainer">DockerContainer</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

#### Description:

Update a container to the latest image

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockermutations.updatecontainers">updateContainers</strong></td>
<td valign="top">[<a href="#dockercontainer">DockerContainer</a>!]!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

#### Description:

Update multiple containers to the latest images

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">ids</td>
<td valign="top">[<a href="#prefixedid">PrefixedID</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockermutations.updateallcontainers">updateAllContainers</strong></td>
<td valign="top">[<a href="#dockercontainer">DockerContainer</a>!]!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **DOCKER**

#### Description:

Update all containers that have available updates

</td>
</tr>
</tbody>
</table>

### DockerNetwork

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="dockernetwork.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockernetwork.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockernetwork.created">created</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockernetwork.scope">scope</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockernetwork.driver">driver</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockernetwork.enableipv6">enableIPv6</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockernetwork.ipam">ipam</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockernetwork.internal">internal</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockernetwork.attachable">attachable</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockernetwork.ingress">ingress</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockernetwork.configfrom">configFrom</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockernetwork.configonly">configOnly</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockernetwork.containers">containers</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockernetwork.options">options</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockernetwork.labels">labels</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### DockerPortConflictContainer

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="dockerportconflictcontainer.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockerportconflictcontainer.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### DockerPortConflicts

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="dockerportconflicts.containerports">containerPorts</strong></td>
<td valign="top">[<a href="#dockercontainerportconflict">DockerContainerPortConflict</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockerportconflicts.lanports">lanPorts</strong></td>
<td valign="top">[<a href="#dockerlanportconflict">DockerLanPortConflict</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### DockerTemplateSyncResult

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="dockertemplatesyncresult.scanned">scanned</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockertemplatesyncresult.matched">matched</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockertemplatesyncresult.skipped">skipped</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockertemplatesyncresult.errors">errors</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### DynamicRemoteAccessStatus

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="dynamicremoteaccessstatus.enabledtype">enabledType</strong></td>
<td valign="top"><a href="#dynamicremoteaccesstype">DynamicRemoteAccessType</a>!</td>
<td>

The type of dynamic remote access that is enabled

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dynamicremoteaccessstatus.runningtype">runningType</strong></td>
<td valign="top"><a href="#dynamicremoteaccesstype">DynamicRemoteAccessType</a>!</td>
<td>

The type of dynamic remote access that is currently running

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dynamicremoteaccessstatus.error">error</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Any error message associated with the dynamic remote access

</td>
</tr>
</tbody>
</table>

### ExplicitStatusItem

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="explicitstatusitem.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="explicitstatusitem.updatestatus">updateStatus</strong></td>
<td valign="top"><a href="#updatestatus">UpdateStatus</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### Flash

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="flash.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="flash.guid">guid</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="flash.vendor">vendor</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="flash.product">product</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### FlashBackupStatus

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="flashbackupstatus.status">status</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Status message indicating the outcome of the backup initiation.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="flashbackupstatus.jobid">jobId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Job ID if available, can be used to check job status.

</td>
</tr>
</tbody>
</table>

### FlatOrganizerEntry

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="flatorganizerentry.id">id</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="flatorganizerentry.type">type</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="flatorganizerentry.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="flatorganizerentry.parentid">parentId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="flatorganizerentry.depth">depth</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="flatorganizerentry.position">position</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="flatorganizerentry.path">path</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="flatorganizerentry.haschildren">hasChildren</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="flatorganizerentry.childrenids">childrenIds</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="flatorganizerentry.meta">meta</strong></td>
<td valign="top"><a href="#dockercontainer">DockerContainer</a></td>
<td></td>
</tr>
</tbody>
</table>

### Info

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="info.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="info.time">time</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Current server time

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="info.baseboard">baseboard</strong></td>
<td valign="top"><a href="#infobaseboard">InfoBaseboard</a>!</td>
<td>

Motherboard information

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="info.cpu">cpu</strong></td>
<td valign="top"><a href="#infocpu">InfoCpu</a>!</td>
<td>

CPU information

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="info.devices">devices</strong></td>
<td valign="top"><a href="#infodevices">InfoDevices</a>!</td>
<td>

Device information

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="info.display">display</strong></td>
<td valign="top"><a href="#infodisplay">InfoDisplay</a>!</td>
<td>

Display configuration

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="info.machineid">machineId</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Machine ID

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="info.memory">memory</strong></td>
<td valign="top"><a href="#infomemory">InfoMemory</a>!</td>
<td>

Memory information

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="info.os">os</strong></td>
<td valign="top"><a href="#infoos">InfoOs</a>!</td>
<td>

Operating system information

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="info.system">system</strong></td>
<td valign="top"><a href="#infosystem">InfoSystem</a>!</td>
<td>

System information

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="info.versions">versions</strong></td>
<td valign="top"><a href="#infoversions">InfoVersions</a>!</td>
<td>

Software versions

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="info.networkinterfaces">networkInterfaces</strong></td>
<td valign="top">[<a href="#infonetworkinterface">InfoNetworkInterface</a>!]!</td>
<td>

Network interfaces

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="info.primarynetwork">primaryNetwork</strong></td>
<td valign="top"><a href="#infonetworkinterface">InfoNetworkInterface</a></td>
<td>

Primary management interface

</td>
</tr>
</tbody>
</table>

### InfoBaseboard

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infobaseboard.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infobaseboard.manufacturer">manufacturer</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Motherboard manufacturer

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infobaseboard.model">model</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Motherboard model

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infobaseboard.version">version</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Motherboard version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infobaseboard.serial">serial</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Motherboard serial number

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infobaseboard.assettag">assetTag</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Motherboard asset tag

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infobaseboard.memmax">memMax</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Maximum memory capacity in bytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infobaseboard.memslots">memSlots</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Number of memory slots

</td>
</tr>
</tbody>
</table>

### InfoCpu

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.manufacturer">manufacturer</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

CPU manufacturer

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.brand">brand</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

CPU brand name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.vendor">vendor</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

CPU vendor

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.family">family</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

CPU family

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.model">model</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

CPU model

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.stepping">stepping</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

CPU stepping

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.revision">revision</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

CPU revision

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.voltage">voltage</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

CPU voltage

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.speed">speed</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Current CPU speed in GHz

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.speedmin">speedmin</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Minimum CPU speed in GHz

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.speedmax">speedmax</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Maximum CPU speed in GHz

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.threads">threads</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Number of CPU threads

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.cores">cores</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Number of CPU cores

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.processors">processors</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Number of physical processors

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.socket">socket</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

CPU socket type

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.cache">cache</strong></td>
<td valign="top"><a href="#json">JSON</a></td>
<td>

CPU cache information

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.flags">flags</strong></td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td>

CPU feature flags

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.topology">topology</strong></td>
<td valign="top">[[[<a href="#int">Int</a>!]!]!]!</td>
<td>

Per-package array of core/thread pairs, e.g. [[[0,1],[2,3]], [[4,5],[6,7]]]

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infocpu.packages">packages</strong></td>
<td valign="top"><a href="#cpupackages">CpuPackages</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### InfoDevices

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infodevices.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodevices.gpu">gpu</strong></td>
<td valign="top">[<a href="#infogpu">InfoGpu</a>!]</td>
<td>

List of GPU devices

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodevices.network">network</strong></td>
<td valign="top">[<a href="#infonetwork">InfoNetwork</a>!]</td>
<td>

List of network interfaces

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodevices.pci">pci</strong></td>
<td valign="top">[<a href="#infopci">InfoPci</a>!]</td>
<td>

List of PCI devices

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodevices.usb">usb</strong></td>
<td valign="top">[<a href="#infousb">InfoUsb</a>!]</td>
<td>

List of USB devices

</td>
</tr>
</tbody>
</table>

### InfoDisplay

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.case">case</strong></td>
<td valign="top"><a href="#infodisplaycase">InfoDisplayCase</a>!</td>
<td>

Case display configuration

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.theme">theme</strong></td>
<td valign="top"><a href="#themename">ThemeName</a>!</td>
<td>

UI theme name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.unit">unit</strong></td>
<td valign="top"><a href="#temperature">Temperature</a>!</td>
<td>

Temperature unit (C or F)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.scale">scale</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Enable UI scaling

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.tabs">tabs</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Show tabs in UI

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.resize">resize</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Enable UI resize

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.wwn">wwn</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Show WWN identifiers

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.total">total</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Show totals

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.usage">usage</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Show usage statistics

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.text">text</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Show text labels

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.warning">warning</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Warning temperature threshold

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.critical">critical</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Critical temperature threshold

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.hot">hot</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Hot temperature threshold

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.max">max</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Maximum temperature threshold

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplay.locale">locale</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Locale setting

</td>
</tr>
</tbody>
</table>

### InfoDisplayCase

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infodisplaycase.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplaycase.url">url</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Case image URL

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplaycase.icon">icon</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Case icon identifier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplaycase.error">error</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Error message if any

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infodisplaycase.base64">base64</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Base64 encoded case image

</td>
</tr>
</tbody>
</table>

### InfoGpu

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infogpu.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infogpu.type">type</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

GPU type/manufacturer

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infogpu.typeid">typeid</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

GPU type identifier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infogpu.blacklisted">blacklisted</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether GPU is blacklisted

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infogpu.class">class</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Device class

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infogpu.productid">productid</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Product ID

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infogpu.vendorname">vendorname</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Vendor name

</td>
</tr>
</tbody>
</table>

### InfoMemory

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infomemory.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infomemory.layout">layout</strong></td>
<td valign="top">[<a href="#memorylayout">MemoryLayout</a>!]!</td>
<td>

Physical memory layout

</td>
</tr>
</tbody>
</table>

### InfoNetwork

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infonetwork.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetwork.iface">iface</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Network interface name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetwork.model">model</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Network interface model

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetwork.vendor">vendor</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Network vendor

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetwork.mac">mac</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

MAC address

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetwork.virtual">virtual</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Virtual interface flag

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetwork.speed">speed</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Network speed

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetwork.dhcp">dhcp</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

DHCP enabled flag

</td>
</tr>
</tbody>
</table>

### InfoNetworkInterface

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Interface name (e.g. eth0)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.description">description</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Interface description/label

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.macaddress">macAddress</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

MAC Address

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.status">status</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Connection status

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.protocol">protocol</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

IPv4 Protocol mode

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.ipaddress">ipAddress</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

IPv4 Address

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.netmask">netmask</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

IPv4 Netmask

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.gateway">gateway</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

IPv4 Gateway

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.usedhcp">useDhcp</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Using DHCP for IPv4

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.ipv6address">ipv6Address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

IPv6 Address

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.ipv6netmask">ipv6Netmask</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

IPv6 Netmask

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.ipv6gateway">ipv6Gateway</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

IPv6 Gateway

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.usedhcp6">useDhcp6</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Using DHCP for IPv6

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.speed">speed</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Link speed in Mbps

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.duplex">duplex</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Duplex mode (full/half)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.mtu">mtu</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Maximum transmission unit

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.operstate">operstate</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Operational state

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.type">type</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Interface type

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.virtual">virtual</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Whether this is a virtual interface

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.vlanid">vlanId</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

VLAN identifier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.internal">internal</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Whether this is an internal interface

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.ipv4addresses">ipv4Addresses</strong></td>
<td valign="top">[<a href="#infonetworkipv4address">InfoNetworkIpv4Address</a>!]</td>
<td>

IPv4 address details

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkinterface.ipv6addresses">ipv6Addresses</strong></td>
<td valign="top">[<a href="#infonetworkipv6address">InfoNetworkIpv6Address</a>!]</td>
<td>

IPv6 address details

</td>
</tr>
</tbody>
</table>

### InfoNetworkIpv4Address

IPv4 address assigned to a network interface

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkipv4address.address">address</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

IPv4 address

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkipv4address.netmask">netmask</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

IPv4 netmask

</td>
</tr>
</tbody>
</table>

### InfoNetworkIpv6Address

IPv6 address assigned to a network interface

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkipv6address.address">address</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

IPv6 address

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infonetworkipv6address.prefixlength">prefixLength</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

IPv6 prefix length

</td>
</tr>
</tbody>
</table>

### InfoOs

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infoos.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoos.platform">platform</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Operating system platform

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoos.distro">distro</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Linux distribution name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoos.release">release</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

OS release version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoos.codename">codename</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

OS codename

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoos.kernel">kernel</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Kernel version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoos.arch">arch</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

OS architecture

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoos.hostname">hostname</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Hostname

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoos.fqdn">fqdn</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Fully qualified domain name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoos.build">build</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

OS build identifier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoos.servicepack">servicepack</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Service pack version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoos.uptime">uptime</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Boot time ISO string

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoos.logofile">logofile</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

OS logo name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoos.serial">serial</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

OS serial number

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoos.uefi">uefi</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

OS started via UEFI

</td>
</tr>
</tbody>
</table>

### InfoPci

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infopci.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infopci.type">type</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Device type/manufacturer

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infopci.typeid">typeid</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Type identifier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infopci.vendorname">vendorname</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Vendor name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infopci.vendorid">vendorid</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Vendor ID

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infopci.productname">productname</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Product name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infopci.productid">productid</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Product ID

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infopci.blacklisted">blacklisted</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Blacklisted status

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infopci.class">class</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Device class

</td>
</tr>
</tbody>
</table>

### InfoSystem

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infosystem.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infosystem.manufacturer">manufacturer</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

System manufacturer

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infosystem.model">model</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

System model

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infosystem.version">version</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

System version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infosystem.serial">serial</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

System serial number

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infosystem.uuid">uuid</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

System UUID

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infosystem.sku">sku</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

System SKU

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infosystem.virtual">virtual</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Virtual machine flag

</td>
</tr>
</tbody>
</table>

### InfoUsb

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infousb.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infousb.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

USB device name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infousb.bus">bus</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

USB bus number

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infousb.device">device</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

USB device number

</td>
</tr>
</tbody>
</table>

### InfoVersions

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="infoversions.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoversions.core">core</strong></td>
<td valign="top"><a href="#coreversions">CoreVersions</a>!</td>
<td>

Core system versions

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="infoversions.packages">packages</strong></td>
<td valign="top"><a href="#packageversions">PackageVersions</a></td>
<td>

Software package versions

</td>
</tr>
</tbody>
</table>

### IpmiConfig

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="ipmiconfig.enabled">enabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="ipmiconfig.args">args</strong></td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td></td>
</tr>
</tbody>
</table>

### KeyFile

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="keyfile.location">location</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="keyfile.contents">contents</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### Language

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="language.code">code</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Language code (e.g. en_US)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="language.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Language description/name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="language.url">url</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

URL to the language pack XML

</td>
</tr>
</tbody>
</table>

### LmSensorsConfig

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="lmsensorsconfig.enabled">enabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="lmsensorsconfig.config_path">config_path</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### LogFile

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="logfile.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Name of the log file

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="logfile.path">path</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Full path to the log file

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="logfile.size">size</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Size of the log file in bytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="logfile.modifiedat">modifiedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Last modified timestamp

</td>
</tr>
</tbody>
</table>

### LogFileContent

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="logfilecontent.path">path</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Path to the log file

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="logfilecontent.content">content</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Content of the log file

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="logfilecontent.totallines">totalLines</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Total number of lines in the file

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="logfilecontent.startline">startLine</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Starting line number of the content (1-indexed)

</td>
</tr>
</tbody>
</table>

### MemoryLayout

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="memorylayout.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memorylayout.size">size</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Memory module size in bytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memorylayout.bank">bank</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Memory bank location (e.g., BANK 0)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memorylayout.type">type</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Memory type (e.g., DDR4, DDR5)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memorylayout.clockspeed">clockSpeed</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Memory clock speed in MHz

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memorylayout.partnum">partNum</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Part number of the memory module

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memorylayout.serialnum">serialNum</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Serial number of the memory module

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memorylayout.manufacturer">manufacturer</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Memory manufacturer

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memorylayout.formfactor">formFactor</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Form factor (e.g., DIMM, SODIMM)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memorylayout.voltageconfigured">voltageConfigured</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Configured voltage in millivolts

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memorylayout.voltagemin">voltageMin</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Minimum voltage in millivolts

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memorylayout.voltagemax">voltageMax</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Maximum voltage in millivolts

</td>
</tr>
</tbody>
</table>

### MemoryUtilization

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="memoryutilization.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memoryutilization.total">total</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Total system memory in bytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memoryutilization.used">used</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Used memory in bytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memoryutilization.free">free</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Free memory in bytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memoryutilization.available">available</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Available memory in bytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memoryutilization.active">active</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Active memory in bytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memoryutilization.buffcache">buffcache</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Buffer/cache memory in bytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memoryutilization.percenttotal">percentTotal</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Memory usage percentage

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memoryutilization.swaptotal">swapTotal</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Total swap memory in bytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memoryutilization.swapused">swapUsed</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Used swap memory in bytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memoryutilization.swapfree">swapFree</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Free swap memory in bytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="memoryutilization.percentswaptotal">percentSwapTotal</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Swap usage percentage

</td>
</tr>
</tbody>
</table>

### Metrics

System metrics including CPU and memory utilization

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="metrics.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="metrics.cpu">cpu</strong></td>
<td valign="top"><a href="#cpuutilization">CpuUtilization</a></td>
<td>

Current CPU utilization metrics

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="metrics.memory">memory</strong></td>
<td valign="top"><a href="#memoryutilization">MemoryUtilization</a></td>
<td>

Current memory utilization metrics

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="metrics.temperature">temperature</strong></td>
<td valign="top"><a href="#temperaturemetrics">TemperatureMetrics</a></td>
<td>

Temperature metrics

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="metrics.network">network</strong></td>
<td valign="top">[<a href="#networkmetrics">NetworkMetrics</a>!]!</td>
<td>

Current network metrics for all interfaces

</td>
</tr>
</tbody>
</table>

### MinigraphqlResponse

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="minigraphqlresponse.status">status</strong></td>
<td valign="top"><a href="#minigraphstatus">MinigraphStatus</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="minigraphqlresponse.timeout">timeout</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="minigraphqlresponse.error">error</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### Network

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="network.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="network.accessurls">accessUrls</strong></td>
<td valign="top">[<a href="#accessurl">AccessUrl</a>!]</td>
<td></td>
</tr>
</tbody>
</table>

### NetworkMetrics

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="networkmetrics.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="networkmetrics.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Interface identifier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="networkmetrics.operstate">operstate</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Operational state

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="networkmetrics.bytesreceived">bytesReceived</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Total received bytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="networkmetrics.bytessent">bytesSent</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Total transmitted bytes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="networkmetrics.packetsreceived">packetsReceived</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Total received packets

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="networkmetrics.packetssent">packetsSent</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Total transmitted packets

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="networkmetrics.receiveerrors">receiveErrors</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Receive errors

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="networkmetrics.transmiterrors">transmitErrors</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Transmit errors

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="networkmetrics.receivedropped">receiveDropped</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Dropped receive packets

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="networkmetrics.transmitdropped">transmitDropped</strong></td>
<td valign="top"><a href="#bigint">BigInt</a>!</td>
<td>

Dropped transmit packets

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="networkmetrics.rxsec">rxSec</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Receive throughput in bytes per second

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="networkmetrics.txsec">txSec</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Transmit throughput in bytes per second

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="networkmetrics.utilizationpercent">utilizationPercent</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Estimated link utilization percentage

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="networkmetrics.lastupdated">lastUpdated</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Metric collection timestamp

</td>
</tr>
</tbody>
</table>

### Notification

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="notification.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notification.title">title</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Also known as 'event'

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notification.subject">subject</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notification.description">description</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notification.importance">importance</strong></td>
<td valign="top"><a href="#notificationimportance">NotificationImportance</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notification.link">link</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notification.type">type</strong></td>
<td valign="top"><a href="#notificationtype">NotificationType</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notification.timestamp">timestamp</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

ISO Timestamp for when the notification occurred

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notification.formattedtimestamp">formattedTimestamp</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### NotificationCounts

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="notificationcounts.info">info</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notificationcounts.warning">warning</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notificationcounts.alert">alert</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notificationcounts.total">total</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### NotificationOverview

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="notificationoverview.unread">unread</strong></td>
<td valign="top"><a href="#notificationcounts">NotificationCounts</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notificationoverview.archive">archive</strong></td>
<td valign="top"><a href="#notificationcounts">NotificationCounts</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### Notifications

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="notifications.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notifications.overview">overview</strong></td>
<td valign="top"><a href="#notificationoverview">NotificationOverview</a>!</td>
<td>

A cached overview of the notifications in the system & their severity.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notifications.list">list</strong></td>
<td valign="top">[<a href="#notification">Notification</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">filter</td>
<td valign="top"><a href="#notificationfilter">NotificationFilter</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notifications.warningsandalerts">warningsAndAlerts</strong></td>
<td valign="top">[<a href="#notification">Notification</a>!]!</td>
<td>

Deduplicated list of unread warning and alert notifications, sorted latest first.

</td>
</tr>
</tbody>
</table>

### OidcAuthorizationRule

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="oidcauthorizationrule.claim">claim</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The claim to check (e.g., email, sub, groups, hd)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcauthorizationrule.operator">operator</strong></td>
<td valign="top"><a href="#authorizationoperator">AuthorizationOperator</a>!</td>
<td>

The comparison operator

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcauthorizationrule.value">value</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td>

The value(s) to match against

</td>
</tr>
</tbody>
</table>

### OidcConfiguration

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="oidcconfiguration.providers">providers</strong></td>
<td valign="top">[<a href="#oidcprovider">OidcProvider</a>!]!</td>
<td>

List of configured OIDC providers

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcconfiguration.defaultallowedorigins">defaultAllowedOrigins</strong></td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td>

Default allowed redirect origins that apply to all OIDC providers (e.g., Tailscale domains)

</td>
</tr>
</tbody>
</table>

### OidcProvider

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="oidcprovider.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td>

The unique identifier for the OIDC provider

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcprovider.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Display name of the OIDC provider

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcprovider.clientid">clientId</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

OAuth2 client ID registered with the provider

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcprovider.clientsecret">clientSecret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

OAuth2 client secret (if required by provider)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcprovider.issuer">issuer</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

OIDC issuer URL (e.g., https://accounts.google.com). Required for auto-discovery via /.well-known/openid-configuration

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcprovider.authorizationendpoint">authorizationEndpoint</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

OAuth2 authorization endpoint URL. If omitted, will be auto-discovered from issuer/.well-known/openid-configuration

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcprovider.tokenendpoint">tokenEndpoint</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

OAuth2 token endpoint URL. If omitted, will be auto-discovered from issuer/.well-known/openid-configuration

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcprovider.jwksuri">jwksUri</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

JSON Web Key Set URI for token validation. If omitted, will be auto-discovered from issuer/.well-known/openid-configuration

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcprovider.scopes">scopes</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td>

OAuth2 scopes to request (e.g., openid, profile, email)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcprovider.authorizationrules">authorizationRules</strong></td>
<td valign="top">[<a href="#oidcauthorizationrule">OidcAuthorizationRule</a>!]</td>
<td>

Flexible authorization rules based on claims

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcprovider.authorizationrulemode">authorizationRuleMode</strong></td>
<td valign="top"><a href="#authorizationrulemode">AuthorizationRuleMode</a></td>
<td>

Mode for evaluating authorization rules - OR (any rule passes) or AND (all rules must pass). Defaults to OR.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcprovider.buttontext">buttonText</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Custom text for the login button

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcprovider.buttonicon">buttonIcon</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

URL or base64 encoded icon for the login button

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcprovider.buttonvariant">buttonVariant</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Button variant style from Reka UI. See https://reka-ui.com/docs/components/button

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcprovider.buttonstyle">buttonStyle</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Custom CSS styles for the button (e.g., "background: linear-gradient(to right, #4f46e5, #7c3aed); border-radius: 9999px;")

</td>
</tr>
</tbody>
</table>

### OidcSessionValidation

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="oidcsessionvalidation.valid">valid</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="oidcsessionvalidation.username">username</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### Onboarding

Onboarding completion state and context

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="onboarding.status">status</strong></td>
<td valign="top"><a href="#onboardingstatus">OnboardingStatus</a>!</td>
<td>

The current onboarding status (INCOMPLETE, UPGRADE, DOWNGRADE, or COMPLETED)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboarding.ispartnerbuild">isPartnerBuild</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether this is a partner/OEM build with activation code

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboarding.completed">completed</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether the onboarding flow has been completed

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboarding.completedatversion">completedAtVersion</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

The OS version when onboarding was completed

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboarding.activationcode">activationCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

The activation code from the .activationcode file, if present

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboarding.shouldopen">shouldOpen</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether the onboarding modal should currently be shown

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboarding.onboardingstate">onboardingState</strong></td>
<td valign="top"><a href="#onboardingstate">OnboardingState</a>!</td>
<td>

Runtime onboarding state values used by the onboarding flow

</td>
</tr>
</tbody>
</table>

### OnboardingInternalBootContext

Current onboarding context for configuring internal boot

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="onboardinginternalbootcontext.arraystopped">arrayStopped</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardinginternalbootcontext.booteligible">bootEligible</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardinginternalbootcontext.bootedfromflashwithinternalbootsetup">bootedFromFlashWithInternalBootSetup</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardinginternalbootcontext.enableboottransfer">enableBootTransfer</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardinginternalbootcontext.reservednames">reservedNames</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardinginternalbootcontext.sharenames">shareNames</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardinginternalbootcontext.poolnames">poolNames</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardinginternalbootcontext.assignabledisks">assignableDisks</strong></td>
<td valign="top">[<a href="#disk">Disk</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardinginternalbootcontext.drivewarnings">driveWarnings</strong></td>
<td valign="top">[<a href="#onboardinginternalbootdrivewarning">OnboardingInternalBootDriveWarning</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### OnboardingInternalBootDriveWarning

Warning metadata for an assignable internal boot drive

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="onboardinginternalbootdrivewarning.diskid">diskId</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardinginternalbootdrivewarning.device">device</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardinginternalbootdrivewarning.warnings">warnings</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### OnboardingInternalBootResult

Result of attempting internal boot pool setup

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="onboardinginternalbootresult.ok">ok</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardinginternalbootresult.code">code</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardinginternalbootresult.output">output</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### OnboardingMutations

Onboarding related mutations

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="onboardingmutations.completeonboarding">completeOnboarding</strong></td>
<td valign="top"><a href="#onboarding">Onboarding</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **WELCOME**

#### Description:

Mark onboarding as completed

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingmutations.resetonboarding">resetOnboarding</strong></td>
<td valign="top"><a href="#onboarding">Onboarding</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **WELCOME**

#### Description:

Reset onboarding progress (for testing)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingmutations.openonboarding">openOnboarding</strong></td>
<td valign="top"><a href="#onboarding">Onboarding</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **WELCOME**

#### Description:

Force the onboarding modal open

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingmutations.closeonboarding">closeOnboarding</strong></td>
<td valign="top"><a href="#onboarding">Onboarding</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **WELCOME**

#### Description:

Close the onboarding modal

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingmutations.bypassonboarding">bypassOnboarding</strong></td>
<td valign="top"><a href="#onboarding">Onboarding</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **WELCOME**

#### Description:

Temporarily bypass onboarding in API memory

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingmutations.resumeonboarding">resumeOnboarding</strong></td>
<td valign="top"><a href="#onboarding">Onboarding</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **WELCOME**

#### Description:

Clear the temporary onboarding bypass

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingmutations.setonboardingoverride">setOnboardingOverride</strong></td>
<td valign="top"><a href="#onboarding">Onboarding</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **WELCOME**

#### Description:

Override onboarding state for testing (in-memory only)

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#onboardingoverrideinput">OnboardingOverrideInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingmutations.clearonboardingoverride">clearOnboardingOverride</strong></td>
<td valign="top"><a href="#onboarding">Onboarding</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **WELCOME**

#### Description:

Clear onboarding override state and reload from disk

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingmutations.createinternalbootpool">createInternalBootPool</strong></td>
<td valign="top"><a href="#onboardinginternalbootresult">OnboardingInternalBootResult</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **WELCOME**

#### Description:

Create and configure internal boot pool via emcmd operations

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#createinternalbootpoolinput">CreateInternalBootPoolInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingmutations.refreshinternalbootcontext">refreshInternalBootContext</strong></td>
<td valign="top"><a href="#onboardinginternalbootcontext">OnboardingInternalBootContext</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **WELCOME**

#### Description:

Refresh the internal boot onboarding context from the latest emhttp state

</td>
</tr>
</tbody>
</table>

### OnboardingState

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="onboardingstate.registrationstate">registrationState</strong></td>
<td valign="top"><a href="#registrationstate">RegistrationState</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingstate.isregistered">isRegistered</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Indicates whether the system is registered

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingstate.isfreshinstall">isFreshInstall</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Indicates whether the system is a fresh install

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingstate.hasactivationcode">hasActivationCode</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Indicates whether an activation code is present

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingstate.activationrequired">activationRequired</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Indicates whether activation is required based on current state

</td>
</tr>
</tbody>
</table>

### Owner

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="owner.username">username</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="owner.url">url</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="owner.avatar">avatar</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### PackageVersions

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="packageversions.openssl">openssl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

OpenSSL version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="packageversions.node">node</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Node.js version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="packageversions.npm">npm</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

npm version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="packageversions.pm2">pm2</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

pm2 version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="packageversions.git">git</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Git version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="packageversions.nginx">nginx</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

nginx version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="packageversions.php">php</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

PHP version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="packageversions.docker">docker</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Docker version

</td>
</tr>
</tbody>
</table>

### ParityCheck

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="paritycheck.date">date</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date of the parity check

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="paritycheck.duration">duration</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Duration of the parity check in seconds

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="paritycheck.speed">speed</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Speed of the parity check, in MB/s

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="paritycheck.status">status</strong></td>
<td valign="top"><a href="#paritycheckstatus">ParityCheckStatus</a>!</td>
<td>

Status of the parity check

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="paritycheck.errors">errors</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Number of errors during the parity check

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="paritycheck.progress">progress</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Progress percentage of the parity check

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="paritycheck.correcting">correcting</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Whether corrections are being written to parity

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="paritycheck.paused">paused</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Whether the parity check is paused

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="paritycheck.running">running</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Whether the parity check is running

</td>
</tr>
</tbody>
</table>

### ParityCheckMutations

Parity check related mutations, WIP, response types and functionaliy will change

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="paritycheckmutations.start">start</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **ARRAY**

#### Description:

Start a parity check

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">correct</td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="paritycheckmutations.pause">pause</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **ARRAY**

#### Description:

Pause a parity check

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="paritycheckmutations.resume">resume</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **ARRAY**

#### Description:

Resume a parity check

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="paritycheckmutations.cancel">cancel</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **ARRAY**

#### Description:

Cancel a parity check

</td>
</tr>
</tbody>
</table>

### PartnerConfig

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="partnerconfig.name">name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="partnerconfig.url">url</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="partnerconfig.hardwarespecsurl">hardwareSpecsUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Link to hardware specifications for this system

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="partnerconfig.manualurl">manualUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Link to the system manual/documentation

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="partnerconfig.supporturl">supportUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Link to manufacturer support page

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="partnerconfig.extralinks">extraLinks</strong></td>
<td valign="top">[<a href="#partnerlink">PartnerLink</a>!]</td>
<td>

Additional custom links provided by the partner

</td>
</tr>
</tbody>
</table>

### PartnerLink

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="partnerlink.title">title</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Display title for the link

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="partnerlink.url">url</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The URL

</td>
</tr>
</tbody>
</table>

### Permission

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="permission.resource">resource</strong></td>
<td valign="top"><a href="#resource">Resource</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="permission.actions">actions</strong></td>
<td valign="top">[<a href="#authaction">AuthAction</a>!]!</td>
<td>

Actions allowed on this resource

</td>
</tr>
</tbody>
</table>

### Plugin

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="plugin.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The name of the plugin package

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="plugin.version">version</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The version of the plugin package

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="plugin.hasapimodule">hasApiModule</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Whether the plugin has an API module

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="plugin.hasclimodule">hasCliModule</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Whether the plugin has a CLI module

</td>
</tr>
</tbody>
</table>

### PluginInstallEvent

Emitted event representing progress for a plugin installation

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="plugininstallevent.operationid">operationId</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Identifier of the related plugin installation operation

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="plugininstallevent.status">status</strong></td>
<td valign="top"><a href="#plugininstallstatus">PluginInstallStatus</a>!</td>
<td>

Status reported with this event

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="plugininstallevent.output">output</strong></td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td>

Output lines newly emitted since the previous event

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="plugininstallevent.timestamp">timestamp</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Timestamp when the event was emitted

</td>
</tr>
</tbody>
</table>

### PluginInstallOperation

Represents a tracked plugin installation operation

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="plugininstalloperation.id">id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Unique identifier of the operation

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="plugininstalloperation.url">url</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Plugin URL passed to the installer

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="plugininstalloperation.name">name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Optional plugin name for display purposes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="plugininstalloperation.status">status</strong></td>
<td valign="top"><a href="#plugininstallstatus">PluginInstallStatus</a>!</td>
<td>

Current status of the operation

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="plugininstalloperation.createdat">createdAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Timestamp when the operation was created

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="plugininstalloperation.updatedat">updatedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Timestamp for the last update to this operation

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="plugininstalloperation.finishedat">finishedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Timestamp when the operation finished, if applicable

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="plugininstalloperation.output">output</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td>

Collected output lines generated by the installer (capped at recent lines)

</td>
</tr>
</tbody>
</table>

### ProfileModel

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="profilemodel.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="profilemodel.username">username</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="profilemodel.url">url</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="profilemodel.avatar">avatar</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### PublicOidcProvider

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="publicoidcprovider.id">id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="publicoidcprovider.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="publicoidcprovider.buttontext">buttonText</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="publicoidcprovider.buttonicon">buttonIcon</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="publicoidcprovider.buttonvariant">buttonVariant</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="publicoidcprovider.buttonstyle">buttonStyle</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### RCloneBackupConfigForm

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="rclonebackupconfigform.id">id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="rclonebackupconfigform.dataschema">dataSchema</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="rclonebackupconfigform.uischema">uiSchema</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### RCloneBackupSettings

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="rclonebackupsettings.configform">configForm</strong></td>
<td valign="top"><a href="#rclonebackupconfigform">RCloneBackupConfigForm</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">formOptions</td>
<td valign="top"><a href="#rcloneconfigforminput">RCloneConfigFormInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="rclonebackupsettings.drives">drives</strong></td>
<td valign="top">[<a href="#rclonedrive">RCloneDrive</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="rclonebackupsettings.remotes">remotes</strong></td>
<td valign="top">[<a href="#rcloneremote">RCloneRemote</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### RCloneDrive

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="rclonedrive.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Provider name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="rclonedrive.options">options</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>

Provider options and configuration schema

</td>
</tr>
</tbody>
</table>

### RCloneMutations

RClone related mutations

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="rclonemutations.creatercloneremote">createRCloneRemote</strong></td>
<td valign="top"><a href="#rcloneremote">RCloneRemote</a>!</td>
<td>


#### Required Permissions:

- Action: **CREATE_ANY**
- Resource: **FLASH**

#### Description:

Create a new RClone remote

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#creatercloneremoteinput">CreateRCloneRemoteInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="rclonemutations.deletercloneremote">deleteRCloneRemote</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **DELETE_ANY**
- Resource: **FLASH**

#### Description:

Delete an existing RClone remote

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#deletercloneremoteinput">DeleteRCloneRemoteInput</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### RCloneRemote

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="rcloneremote.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="rcloneremote.type">type</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="rcloneremote.parameters">parameters</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="rcloneremote.config">config</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>

Complete remote configuration

</td>
</tr>
</tbody>
</table>

### Registration

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="registration.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="registration.type">type</strong></td>
<td valign="top"><a href="#registrationtype">registrationType</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="registration.keyfile">keyFile</strong></td>
<td valign="top"><a href="#keyfile">KeyFile</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="registration.state">state</strong></td>
<td valign="top"><a href="#registrationstate">RegistrationState</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="registration.expiration">expiration</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="registration.updateexpiration">updateExpiration</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### RelayResponse

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="relayresponse.status">status</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="relayresponse.timeout">timeout</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="relayresponse.error">error</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### RemoteAccess

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="remoteaccess.accesstype">accessType</strong></td>
<td valign="top"><a href="#wan_access_type">WAN_ACCESS_TYPE</a>!</td>
<td>

The type of WAN access used for Remote Access

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="remoteaccess.forwardtype">forwardType</strong></td>
<td valign="top"><a href="#wan_forward_type">WAN_FORWARD_TYPE</a></td>
<td>

The type of port forwarding used for Remote Access

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="remoteaccess.port">port</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

The port used for Remote Access

</td>
</tr>
</tbody>
</table>

### ResolvedOrganizerV1

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="resolvedorganizerv1.version">version</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="resolvedorganizerv1.views">views</strong></td>
<td valign="top">[<a href="#resolvedorganizerview">ResolvedOrganizerView</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### ResolvedOrganizerView

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="resolvedorganizerview.id">id</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="resolvedorganizerview.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="resolvedorganizerview.rootid">rootId</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="resolvedorganizerview.flatentries">flatEntries</strong></td>
<td valign="top">[<a href="#flatorganizerentry">FlatOrganizerEntry</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="resolvedorganizerview.prefs">prefs</strong></td>
<td valign="top"><a href="#json">JSON</a></td>
<td></td>
</tr>
</tbody>
</table>

### SensorConfig

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="sensorconfig.enabled">enabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
</tbody>
</table>

### Server

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="server.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="server.owner">owner</strong></td>
<td valign="top"><a href="#profilemodel">ProfileModel</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="server.guid">guid</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="server.apikey">apikey</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="server.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="server.comment">comment</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Server description/comment

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="server.status">status</strong></td>
<td valign="top"><a href="#serverstatus">ServerStatus</a>!</td>
<td>

Whether this server is online or offline

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="server.wanip">wanip</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="server.lanip">lanip</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="server.localurl">localurl</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="server.remoteurl">remoteurl</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### Service

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="service.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="service.name">name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="service.online">online</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="service.uptime">uptime</strong></td>
<td valign="top"><a href="#uptime">Uptime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="service.version">version</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### Settings

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="settings.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="settings.unified">unified</strong></td>
<td valign="top"><a href="#unifiedsettings">UnifiedSettings</a>!</td>
<td>

A view of all settings

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="settings.sso">sso</strong></td>
<td valign="top"><a href="#ssosettings">SsoSettings</a>!</td>
<td>

SSO settings

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="settings.api">api</strong></td>
<td valign="top"><a href="#apiconfig">ApiConfig</a>!</td>
<td>

The API setting values

</td>
</tr>
</tbody>
</table>

### Share

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="share.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="share.name">name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Display name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="share.free">free</strong></td>
<td valign="top"><a href="#bigint">BigInt</a></td>
<td>

(KB) Free space

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="share.used">used</strong></td>
<td valign="top"><a href="#bigint">BigInt</a></td>
<td>

(KB) Used Size

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="share.size">size</strong></td>
<td valign="top"><a href="#bigint">BigInt</a></td>
<td>

(KB) Total size

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="share.include">include</strong></td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td>

Disks that are included in this share

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="share.exclude">exclude</strong></td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td>

Disks that are excluded from this share

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="share.cache">cache</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Is this share cached

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="share.nameorig">nameOrig</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Original name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="share.comment">comment</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

User comment

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="share.allocator">allocator</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Allocator

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="share.splitlevel">splitLevel</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Split level

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="share.floor">floor</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Floor

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="share.cow">cow</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

COW

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="share.color">color</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Color

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="share.luksstatus">luksStatus</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

LUKS status

</td>
</tr>
</tbody>
</table>

### SsoSettings

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="ssosettings.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="ssosettings.oidcproviders">oidcProviders</strong></td>
<td valign="top">[<a href="#oidcprovider">OidcProvider</a>!]!</td>
<td>

List of configured OIDC providers

</td>
</tr>
</tbody>
</table>

### SystemConfig

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="systemconfig.servername">serverName</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="systemconfig.model">model</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="systemconfig.comment">comment</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### SystemTime

System time configuration and current status

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="systemtime.currenttime">currentTime</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Current server time in ISO-8601 format (UTC)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="systemtime.timezone">timeZone</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

IANA timezone identifier currently in use

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="systemtime.usentp">useNtp</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether NTP/PTP time synchronization is enabled

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="systemtime.ntpservers">ntpServers</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td>

Configured NTP servers (empty strings indicate unused slots)

</td>
</tr>
</tbody>
</table>

### TailscaleExitNodeStatus

Tailscale exit node connection status

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="tailscaleexitnodestatus.online">online</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether the exit node is online

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscaleexitnodestatus.tailscaleips">tailscaleIps</strong></td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td>

Tailscale IPs of the exit node

</td>
</tr>
</tbody>
</table>

### TailscaleStatus

Tailscale status for a Docker container

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.online">online</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether Tailscale is online in the container

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.version">version</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Current Tailscale version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.latestversion">latestVersion</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Latest available Tailscale version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.updateavailable">updateAvailable</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether a Tailscale update is available

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.hostname">hostname</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Configured Tailscale hostname

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.dnsname">dnsName</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Actual Tailscale DNS name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.relay">relay</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

DERP relay code

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.relayname">relayName</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

DERP relay region name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.tailscaleips">tailscaleIps</strong></td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td>

Tailscale IPv4 and IPv6 addresses

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.primaryroutes">primaryRoutes</strong></td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td>

Advertised subnet routes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.isexitnode">isExitNode</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether this container is an exit node

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.exitnodestatus">exitNodeStatus</strong></td>
<td valign="top"><a href="#tailscaleexitnodestatus">TailscaleExitNodeStatus</a></td>
<td>

Status of the connected exit node (if using one)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.webuiurl">webUiUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Tailscale Serve/Funnel WebUI URL

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.keyexpiry">keyExpiry</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Tailscale key expiry date

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.keyexpirydays">keyExpiryDays</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Days until key expires

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.keyexpired">keyExpired</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether the Tailscale key has expired

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.backendstate">backendState</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Tailscale backend state (Running, NeedsLogin, Stopped, etc.)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="tailscalestatus.authurl">authUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Authentication URL if Tailscale needs login

</td>
</tr>
</tbody>
</table>

### TemperatureHistoryConfig

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="temperaturehistoryconfig.max_readings">max_readings</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturehistoryconfig.retention_ms">retention_ms</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
</tbody>
</table>

### TemperatureMetrics

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="temperaturemetrics.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturemetrics.sensors">sensors</strong></td>
<td valign="top">[<a href="#temperaturesensor">TemperatureSensor</a>!]!</td>
<td>

All temperature sensors

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturemetrics.summary">summary</strong></td>
<td valign="top"><a href="#temperaturesummary">TemperatureSummary</a>!</td>
<td>

Temperature summary

</td>
</tr>
</tbody>
</table>

### TemperatureReading

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="temperaturereading.value">value</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Temperature value

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturereading.unit">unit</strong></td>
<td valign="top"><a href="#temperatureunit">TemperatureUnit</a>!</td>
<td>

Temperature unit

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturereading.timestamp">timestamp</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Timestamp of reading

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturereading.status">status</strong></td>
<td valign="top"><a href="#temperaturestatus">TemperatureStatus</a>!</td>
<td>

Temperature status

</td>
</tr>
</tbody>
</table>

### TemperatureSensor

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensor.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensor.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Sensor name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensor.type">type</strong></td>
<td valign="top"><a href="#sensortype">SensorType</a>!</td>
<td>

Type of sensor

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensor.location">location</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Physical location

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensor.current">current</strong></td>
<td valign="top"><a href="#temperaturereading">TemperatureReading</a>!</td>
<td>

Current temperature

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensor.min">min</strong></td>
<td valign="top"><a href="#temperaturereading">TemperatureReading</a></td>
<td>

Minimum recorded

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensor.max">max</strong></td>
<td valign="top"><a href="#temperaturereading">TemperatureReading</a></td>
<td>

Maximum recorded

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensor.warning">warning</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Warning threshold

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensor.critical">critical</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Critical threshold

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensor.history">history</strong></td>
<td valign="top">[<a href="#temperaturereading">TemperatureReading</a>!]</td>
<td>

Historical readings for this sensor

</td>
</tr>
</tbody>
</table>

### TemperatureSensorsConfig

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensorsconfig.lm_sensors">lm_sensors</strong></td>
<td valign="top"><a href="#lmsensorsconfig">LmSensorsConfig</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensorsconfig.smartctl">smartctl</strong></td>
<td valign="top"><a href="#sensorconfig">SensorConfig</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensorsconfig.ipmi">ipmi</strong></td>
<td valign="top"><a href="#ipmiconfig">IpmiConfig</a></td>
<td></td>
</tr>
</tbody>
</table>

### TemperatureSummary

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesummary.average">average</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Average temperature across all sensors

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesummary.hottest">hottest</strong></td>
<td valign="top"><a href="#temperaturesensor">TemperatureSensor</a>!</td>
<td>

Hottest sensor

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesummary.coolest">coolest</strong></td>
<td valign="top"><a href="#temperaturesensor">TemperatureSensor</a>!</td>
<td>

Coolest sensor

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesummary.warningcount">warningCount</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Count of sensors at warning level

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesummary.criticalcount">criticalCount</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Count of sensors at critical level

</td>
</tr>
</tbody>
</table>

### TemperatureThresholdsConfig

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="temperaturethresholdsconfig.cpu_warning">cpu_warning</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturethresholdsconfig.cpu_critical">cpu_critical</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturethresholdsconfig.disk_warning">disk_warning</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturethresholdsconfig.disk_critical">disk_critical</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturethresholdsconfig.warning">warning</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturethresholdsconfig.critical">critical</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
</tbody>
</table>

### Theme

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="theme.name">name</strong></td>
<td valign="top"><a href="#themename">ThemeName</a>!</td>
<td>

The theme name

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="theme.showbannerimage">showBannerImage</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether to show the header banner image

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="theme.showbannergradient">showBannerGradient</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether to show the banner gradient

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="theme.showheaderdescription">showHeaderDescription</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether to show the description in the header

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="theme.headerbackgroundcolor">headerBackgroundColor</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

The background color of the header

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="theme.headerprimarytextcolor">headerPrimaryTextColor</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

The text color of the header

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="theme.headersecondarytextcolor">headerSecondaryTextColor</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

The secondary text color of the header

</td>
</tr>
</tbody>
</table>

### TimeZoneOption

Selectable timezone option from the system list

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="timezoneoption.value">value</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

IANA timezone identifier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="timezoneoption.label">label</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Display label for the timezone

</td>
</tr>
</tbody>
</table>

### UPSBattery

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="upsbattery.chargelevel">chargeLevel</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Battery charge level as a percentage (0-100). Unit: percent (%). Example: 100 means battery is fully charged

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsbattery.estimatedruntime">estimatedRuntime</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Estimated runtime remaining on battery power. Unit: seconds. Example: 3600 means 1 hour of runtime remaining

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsbattery.health">health</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Battery health status. Possible values: 'Good', 'Replace', 'Unknown'. Indicates if the battery needs replacement

</td>
</tr>
</tbody>
</table>

### UPSConfiguration

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiguration.service">service</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

UPS service state. Values: 'enable' or 'disable'. Controls whether the UPS monitoring service is running

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiguration.upscable">upsCable</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Type of cable connecting the UPS to the server. Common values: 'usb', 'smart', 'ether', 'custom'. Determines communication protocol

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiguration.customupscable">customUpsCable</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Custom cable configuration string. Only used when upsCable is set to 'custom'. Format depends on specific UPS model

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiguration.upstype">upsType</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

UPS communication type. Common values: 'usb', 'net', 'snmp', 'dumb', 'pcnet', 'modbus'. Defines how the server communicates with the UPS

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiguration.device">device</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Device path or network address for UPS connection. Examples: '/dev/ttyUSB0' for USB, '192.168.1.100:3551' for network. Depends on upsType setting

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiguration.overrideupscapacity">overrideUpsCapacity</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Override UPS capacity for runtime calculations. Unit: volt-amperes (VA). Example: 1500 for a 1500VA UPS. Leave unset to use UPS-reported capacity

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiguration.batterylevel">batteryLevel</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Battery level threshold for shutdown. Unit: percent (%). Example: 10 means shutdown when battery reaches 10%. System will shutdown when battery drops to this level

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiguration.minutes">minutes</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Runtime threshold for shutdown. Unit: minutes. Example: 5 means shutdown when 5 minutes runtime remaining. System will shutdown when estimated runtime drops below this

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiguration.timeout">timeout</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Timeout for UPS communications. Unit: seconds. Example: 0 means no timeout. Time to wait for UPS response before considering it offline

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiguration.killups">killUps</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Kill UPS power after shutdown. Values: 'yes' or 'no'. If 'yes', tells UPS to cut power after system shutdown. Useful for ensuring complete power cycle

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiguration.nisip">nisIp</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Network Information Server (NIS) IP address. Default: '0.0.0.0' (listen on all interfaces). IP address for apcupsd network information server

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiguration.netserver">netServer</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Network server mode. Values: 'on' or 'off'. Enable to allow network clients to monitor this UPS

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiguration.upsname">upsName</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

UPS name for network monitoring. Used to identify this UPS on the network. Example: 'SERVER_UPS'

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiguration.modelname">modelName</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Override UPS model name. Used for display purposes. Leave unset to use UPS-reported model

</td>
</tr>
</tbody>
</table>

### UPSDevice

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="upsdevice.id">id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Unique identifier for the UPS device. Usually based on the model name or a generated ID

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsdevice.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Display name for the UPS device. Can be customized by the user

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsdevice.model">model</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

UPS model name/number. Example: 'APC Back-UPS Pro 1500'

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsdevice.status">status</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Current operational status of the UPS. Common values: 'Online', 'On Battery', 'Low Battery', 'Replace Battery', 'Overload', 'Offline'. 'Online' means running on mains power, 'On Battery' means running on battery backup

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsdevice.battery">battery</strong></td>
<td valign="top"><a href="#upsbattery">UPSBattery</a>!</td>
<td>

Battery-related information

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsdevice.power">power</strong></td>
<td valign="top"><a href="#upspower">UPSPower</a>!</td>
<td>

Power-related information

</td>
</tr>
</tbody>
</table>

### UPSPower

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="upspower.inputvoltage">inputVoltage</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Input voltage from the wall outlet/mains power. Unit: volts (V). Example: 120.5 for typical US household voltage

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upspower.outputvoltage">outputVoltage</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Output voltage being delivered to connected devices. Unit: volts (V). Example: 120.5 - should match input voltage when on mains power

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upspower.loadpercentage">loadPercentage</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Current load on the UPS as a percentage of its capacity. Unit: percent (%). Example: 25 means UPS is loaded at 25% of its maximum capacity

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upspower.nominalpower">nominalPower</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Nominal power capacity of the UPS. Unit: watts (W). Example: 1000 means the UPS is rated for 1000 watts. This is the maximum power the UPS can deliver

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upspower.currentpower">currentPower</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Current power consumption calculated from load percentage and nominal power. Unit: watts (W). Example: 350 means 350 watts currently being used. Calculated as: nominalPower * (loadPercentage / 100)

</td>
</tr>
</tbody>
</table>

### UnifiedSettings

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="unifiedsettings.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="unifiedsettings.dataschema">dataSchema</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>

The data schema for the settings

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="unifiedsettings.uischema">uiSchema</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>

The UI schema for the settings

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="unifiedsettings.values">values</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>

The current values of the settings

</td>
</tr>
</tbody>
</table>

### UnraidArray

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="unraidarray.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="unraidarray.state">state</strong></td>
<td valign="top"><a href="#arraystate">ArrayState</a>!</td>
<td>

Current array state

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="unraidarray.capacity">capacity</strong></td>
<td valign="top"><a href="#arraycapacity">ArrayCapacity</a>!</td>
<td>

Current array capacity

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="unraidarray.boot">boot</strong></td>
<td valign="top"><a href="#arraydisk">ArrayDisk</a></td>
<td>

Returns the active boot disk

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="unraidarray.bootdevices">bootDevices</strong></td>
<td valign="top">[<a href="#arraydisk">ArrayDisk</a>!]!</td>
<td>

All detected boot devices: every Boot entry for internal boot, including mirrored members when configured, or the mounted /boot Flash entry for legacy USB boot

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="unraidarray.parities">parities</strong></td>
<td valign="top">[<a href="#arraydisk">ArrayDisk</a>!]!</td>
<td>

Parity disks in the current array

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="unraidarray.paritycheckstatus">parityCheckStatus</strong></td>
<td valign="top"><a href="#paritycheck">ParityCheck</a>!</td>
<td>

Current parity check status

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="unraidarray.disks">disks</strong></td>
<td valign="top">[<a href="#arraydisk">ArrayDisk</a>!]!</td>
<td>

Data disks in the current array

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="unraidarray.caches">caches</strong></td>
<td valign="top">[<a href="#arraydisk">ArrayDisk</a>!]!</td>
<td>

Caches in the current array

</td>
</tr>
</tbody>
</table>

### UnraidPluginsMutations

Unraid plugin management mutations

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="unraidpluginsmutations.installplugin">installPlugin</strong></td>
<td valign="top"><a href="#plugininstalloperation">PluginInstallOperation</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **CONFIG**

#### Description:

Install an Unraid plugin and track installation progress

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#installplugininput">InstallPluginInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="unraidpluginsmutations.installlanguage">installLanguage</strong></td>
<td valign="top"><a href="#plugininstalloperation">PluginInstallOperation</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **CONFIG**

#### Description:

Install an Unraid language pack and track installation progress

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#installplugininput">InstallPluginInput</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### UpdateSettingsResponse

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="updatesettingsresponse.restartrequired">restartRequired</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether a restart is required for the changes to take effect

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="updatesettingsresponse.values">values</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>

The updated settings values

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="updatesettingsresponse.warnings">warnings</strong></td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td>

Warning messages about configuration issues found during validation

</td>
</tr>
</tbody>
</table>

### Uptime

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="uptime.timestamp">timestamp</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### UserAccount

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="useraccount.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="useraccount.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The name of the user

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="useraccount.description">description</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

A description of the user

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="useraccount.roles">roles</strong></td>
<td valign="top">[<a href="#role">Role</a>!]!</td>
<td>

The roles of the user

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="useraccount.permissions">permissions</strong></td>
<td valign="top">[<a href="#permission">Permission</a>!]</td>
<td>

The permissions of the user

</td>
</tr>
</tbody>
</table>

### Vars

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="vars.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.version">version</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Unraid version

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.maxarraysz">maxArraysz</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.maxcachesz">maxCachesz</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.name">name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Machine hostname

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.timezone">timeZone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.comment">comment</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.security">security</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.workgroup">workgroup</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.domain">domain</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.domainshort">domainShort</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.hidedotfiles">hideDotFiles</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.localmaster">localMaster</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.enablefruit">enableFruit</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.usentp">useNtp</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Should a NTP server be used for time sync?

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.ntpserver1">ntpServer1</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

NTP Server 1

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.ntpserver2">ntpServer2</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

NTP Server 2

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.ntpserver3">ntpServer3</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

NTP Server 3

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.ntpserver4">ntpServer4</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

NTP Server 4

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.domainlogin">domainLogin</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sysmodel">sysModel</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sysarrayslots">sysArraySlots</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.syscacheslots">sysCacheSlots</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sysflashslots">sysFlashSlots</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.usessl">useSsl</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.port">port</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Port for the webui via HTTP

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.portssl">portssl</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Port for the webui via HTTPS

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.localtld">localTld</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.bindmgt">bindMgt</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.usetelnet">useTelnet</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Should telnet be enabled?

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.porttelnet">porttelnet</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.usessh">useSsh</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.portssh">portssh</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.startpage">startPage</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.startarray">startArray</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.spindowndelay">spindownDelay</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.queuedepth">queueDepth</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.spinupgroups">spinupGroups</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.defaultformat">defaultFormat</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.defaultfstype">defaultFsType</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.shutdowntimeout">shutdownTimeout</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.lukskeyfile">luksKeyfile</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.pollattributes">pollAttributes</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.pollattributesdefault">pollAttributesDefault</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.pollattributesstatus">pollAttributesStatus</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.nrrequests">nrRequests</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.nrrequestsdefault">nrRequestsDefault</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.nrrequestsstatus">nrRequestsStatus</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdnumstripes">mdNumStripes</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdnumstripesdefault">mdNumStripesDefault</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdnumstripesstatus">mdNumStripesStatus</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdsyncwindow">mdSyncWindow</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdsyncwindowdefault">mdSyncWindowDefault</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdsyncwindowstatus">mdSyncWindowStatus</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdsyncthresh">mdSyncThresh</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdsyncthreshdefault">mdSyncThreshDefault</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdsyncthreshstatus">mdSyncThreshStatus</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdwritemethod">mdWriteMethod</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdwritemethoddefault">mdWriteMethodDefault</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdwritemethodstatus">mdWriteMethodStatus</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sharedisk">shareDisk</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.shareuser">shareUser</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.shareuserinclude">shareUserInclude</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.shareuserexclude">shareUserExclude</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sharesmbenabled">shareSmbEnabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sharenfsenabled">shareNfsEnabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.shareafpenabled">shareAfpEnabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.shareinitialowner">shareInitialOwner</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.shareinitialgroup">shareInitialGroup</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sharecacheenabled">shareCacheEnabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sharecachefloor">shareCacheFloor</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sharemoverschedule">shareMoverSchedule</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sharemoverlogging">shareMoverLogging</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.fuseremember">fuseRemember</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.fuserememberdefault">fuseRememberDefault</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.fuserememberstatus">fuseRememberStatus</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.fusedirectio">fuseDirectio</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.fusedirectiodefault">fuseDirectioDefault</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.fusedirectiostatus">fuseDirectioStatus</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.shareavahienabled">shareAvahiEnabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.shareavahismbname">shareAvahiSmbName</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.shareavahismbmodel">shareAvahiSmbModel</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.shareavahiafpname">shareAvahiAfpName</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.shareavahiafpmodel">shareAvahiAfpModel</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.safemode">safeMode</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.startmode">startMode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.configvalid">configValid</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.configerror">configError</strong></td>
<td valign="top"><a href="#configerrorstate">ConfigErrorState</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.joinstatus">joinStatus</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.devicecount">deviceCount</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.flashguid">flashGuid</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.flashproduct">flashProduct</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.flashvendor">flashVendor</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.tpmguid">tpmGuid</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.regcheck">regCheck</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.regfile">regFile</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.regguid">regGuid</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.regty">regTy</strong></td>
<td valign="top"><a href="#registrationtype">registrationType</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.regstate">regState</strong></td>
<td valign="top"><a href="#registrationstate">RegistrationState</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.regto">regTo</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Registration owner

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.regtm">regTm</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.regtm2">regTm2</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.reggen">regGen</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sbname">sbName</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sbversion">sbVersion</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sbupdated">sbUpdated</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sbevents">sbEvents</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sbstate">sbState</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sbclean">sbClean</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sbsynced">sbSynced</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sbsyncerrs">sbSyncErrs</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sbsynced2">sbSynced2</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sbsyncexit">sbSyncExit</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sbnumdisks">sbNumDisks</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdcolor">mdColor</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdnumdisks">mdNumDisks</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdnumdisabled">mdNumDisabled</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdnuminvalid">mdNumInvalid</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdnummissing">mdNumMissing</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdnumnew">mdNumNew</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdnumerased">mdNumErased</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdresync">mdResync</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdresynccorr">mdResyncCorr</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdresyncpos">mdResyncPos</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdresyncdb">mdResyncDb</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdresyncdt">mdResyncDt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdresyncaction">mdResyncAction</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdresyncsize">mdResyncSize</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdstate">mdState</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.mdversion">mdVersion</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.cachenumdevices">cacheNumDevices</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.cachesbnumdisks">cacheSbNumDisks</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.fsstate">fsState</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.booteligible">bootEligible</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.enableboottransfer">enableBootTransfer</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.bootedfromflashwithinternalbootsetup">bootedFromFlashWithInternalBootSetup</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.reservednames">reservedNames</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.fsprogress">fsProgress</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Human friendly string of array events happening

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.fscopyprcnt">fsCopyPrcnt</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Percentage from 0 - 100 while upgrading a disk or swapping parity drives

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.fsnummounted">fsNumMounted</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.fsnumunmountable">fsNumUnmountable</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.fsunmountablemask">fsUnmountableMask</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sharecount">shareCount</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Total amount of user shares

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sharesmbcount">shareSmbCount</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Total amount shares with SMB enabled

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sharenfscount">shareNfsCount</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Total amount shares with NFS enabled

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.shareafpcount">shareAfpCount</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Total amount shares with AFP enabled

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.sharemoveractive">shareMoverActive</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vars.csrftoken">csrfToken</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### VmDomain

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="vmdomain.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td>

The unique identifier for the vm (uuid)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vmdomain.name">name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

A friendly name for the vm

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vmdomain.state">state</strong></td>
<td valign="top"><a href="#vmstate">VmState</a>!</td>
<td>

Current domain vm state

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vmdomain.uuid">uuid</strong> ⚠️</td>
<td valign="top"><a href="#string">String</a></td>
<td>

The UUID of the vm

<p>⚠️ <strong>DEPRECATED</strong></p>
<blockquote>

Use id instead

</blockquote>
</td>
</tr>
</tbody>
</table>

### VmMutations

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="vmmutations.start">start</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **VMS**

#### Description:

Start a virtual machine

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vmmutations.stop">stop</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **VMS**

#### Description:

Stop a virtual machine

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vmmutations.pause">pause</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **VMS**

#### Description:

Pause a virtual machine

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vmmutations.resume">resume</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **VMS**

#### Description:

Resume a virtual machine

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vmmutations.forcestop">forceStop</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **VMS**

#### Description:

Force stop a virtual machine

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vmmutations.reboot">reboot</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **VMS**

#### Description:

Reboot a virtual machine

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vmmutations.reset">reset</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>


#### Required Permissions:

- Action: **UPDATE_ANY**
- Resource: **VMS**

#### Description:

Reset a virtual machine

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### Vms

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="vms.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vms.domains">domains</strong></td>
<td valign="top">[<a href="#vmdomain">VmDomain</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="vms.domain">domain</strong></td>
<td valign="top">[<a href="#vmdomain">VmDomain</a>!]</td>
<td></td>
</tr>
</tbody>
</table>

## Inputs

### AccessUrlInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="accessurlinput.type">type</strong></td>
<td valign="top"><a href="#url_type">URL_TYPE</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="accessurlinput.name">name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="accessurlinput.ipv4">ipv4</strong></td>
<td valign="top"><a href="#url">URL</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="accessurlinput.ipv6">ipv6</strong></td>
<td valign="top"><a href="#url">URL</a></td>
<td></td>
</tr>
</tbody>
</table>

### AccessUrlObjectInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="accessurlobjectinput.ipv4">ipv4</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="accessurlobjectinput.ipv6">ipv6</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="accessurlobjectinput.type">type</strong></td>
<td valign="top"><a href="#url_type">URL_TYPE</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="accessurlobjectinput.name">name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### ActivationCodeOverrideInput

Activation code override input

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="activationcodeoverrideinput.code">code</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="activationcodeoverrideinput.partner">partner</strong></td>
<td valign="top"><a href="#partnerconfiginput">PartnerConfigInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="activationcodeoverrideinput.branding">branding</strong></td>
<td valign="top"><a href="#brandingconfiginput">BrandingConfigInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="activationcodeoverrideinput.system">system</strong></td>
<td valign="top"><a href="#systemconfiginput">SystemConfigInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### AddPermissionInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="addpermissioninput.resource">resource</strong></td>
<td valign="top"><a href="#resource">Resource</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="addpermissioninput.actions">actions</strong></td>
<td valign="top">[<a href="#authaction">AuthAction</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### AddRoleForApiKeyInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="addroleforapikeyinput.apikeyid">apiKeyId</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="addroleforapikeyinput.role">role</strong></td>
<td valign="top"><a href="#role">Role</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### ArrayDiskInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="arraydiskinput.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td>

Disk ID

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraydiskinput.slot">slot</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

The slot for the disk

</td>
</tr>
</tbody>
</table>

### ArrayStateInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="arraystateinput.desiredstate">desiredState</strong></td>
<td valign="top"><a href="#arraystateinputstate">ArrayStateInputState</a>!</td>
<td>

Array state

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraystateinput.decryptionpassword">decryptionPassword</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Optional password used to unlock encrypted array disks when starting the array

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="arraystateinput.decryptionkeyfile">decryptionKeyfile</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Optional keyfile contents used to unlock encrypted array disks when starting the array. Accepts a data URL or raw base64 payload.

</td>
</tr>
</tbody>
</table>

### BrandingConfigInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.header">header</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.headermetacolor">headermetacolor</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.background">background</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.showbannergradient">showBannerGradient</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.theme">theme</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.bannerimage">bannerImage</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.casemodel">caseModel</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.casemodelimage">caseModelImage</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.partnerlogolighturl">partnerLogoLightUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.partnerlogodarkurl">partnerLogoDarkUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.haspartnerlogo">hasPartnerLogo</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.onboardingtitle">onboardingTitle</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.onboardingsubtitle">onboardingSubtitle</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.onboardingtitlefreshinstall">onboardingTitleFreshInstall</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.onboardingsubtitlefreshinstall">onboardingSubtitleFreshInstall</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.onboardingtitleupgrade">onboardingTitleUpgrade</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.onboardingsubtitleupgrade">onboardingSubtitleUpgrade</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.onboardingtitledowngrade">onboardingTitleDowngrade</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.onboardingsubtitledowngrade">onboardingSubtitleDowngrade</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.onboardingtitleincomplete">onboardingTitleIncomplete</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="brandingconfiginput.onboardingsubtitleincomplete">onboardingSubtitleIncomplete</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### ConnectSettingsInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="connectsettingsinput.accesstype">accessType</strong></td>
<td valign="top"><a href="#wan_access_type">WAN_ACCESS_TYPE</a></td>
<td>

The type of WAN access to use for Remote Access

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="connectsettingsinput.forwardtype">forwardType</strong></td>
<td valign="top"><a href="#wan_forward_type">WAN_FORWARD_TYPE</a></td>
<td>

The type of port forwarding to use for Remote Access

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="connectsettingsinput.port">port</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

The port to use for Remote Access. Not required for UPNP forwardType. Required for STATIC forwardType. Ignored if accessType is DISABLED or forwardType is UPNP.

</td>
</tr>
</tbody>
</table>

### ConnectSignInInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="connectsignininput.apikey">apiKey</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The API key for authentication

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="connectsignininput.userinfo">userInfo</strong></td>
<td valign="top"><a href="#connectuserinfoinput">ConnectUserInfoInput</a></td>
<td>

User information for the sign-in

</td>
</tr>
</tbody>
</table>

### ConnectUserInfoInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="connectuserinfoinput.preferred_username">preferred_username</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The preferred username of the user

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="connectuserinfoinput.email">email</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The email address of the user

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="connectuserinfoinput.avatar">avatar</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

The avatar URL of the user

</td>
</tr>
</tbody>
</table>

### CreateApiKeyInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="createapikeyinput.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="createapikeyinput.description">description</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="createapikeyinput.roles">roles</strong></td>
<td valign="top">[<a href="#role">Role</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="createapikeyinput.permissions">permissions</strong></td>
<td valign="top">[<a href="#addpermissioninput">AddPermissionInput</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="createapikeyinput.overwrite">overwrite</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

This will replace the existing key if one already exists with the same name, otherwise returns the existing key

</td>
</tr>
</tbody>
</table>

### CreateInternalBootPoolInput

Input for creating an internal boot pool during onboarding

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="createinternalbootpoolinput.poolname">poolName</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="createinternalbootpoolinput.devices">devices</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="createinternalbootpoolinput.bootsizemib">bootSizeMiB</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="createinternalbootpoolinput.updatebios">updateBios</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="createinternalbootpoolinput.reboot">reboot</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
</tbody>
</table>

### CreateRCloneRemoteInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="creatercloneremoteinput.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="creatercloneremoteinput.type">type</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="creatercloneremoteinput.parameters">parameters</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### DeleteApiKeyInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="deleteapikeyinput.ids">ids</strong></td>
<td valign="top">[<a href="#prefixedid">PrefixedID</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### DeleteRCloneRemoteInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="deletercloneremoteinput.name">name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### DockerAutostartEntryInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="dockerautostartentryinput.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td>

Docker container identifier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockerautostartentryinput.autostart">autoStart</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether the container should auto-start

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="dockerautostartentryinput.wait">wait</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Number of seconds to wait after starting the container

</td>
</tr>
</tbody>
</table>

### EnableDynamicRemoteAccessInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="enabledynamicremoteaccessinput.url">url</strong></td>
<td valign="top"><a href="#accessurlinput">AccessUrlInput</a>!</td>
<td>

The AccessURL Input for dynamic remote access

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="enabledynamicremoteaccessinput.enabled">enabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether to enable or disable dynamic remote access

</td>
</tr>
</tbody>
</table>

### InitiateFlashBackupInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="initiateflashbackupinput.remotename">remoteName</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

The name of the remote configuration to use for the backup.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="initiateflashbackupinput.sourcepath">sourcePath</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Source path to backup (typically the flash drive).

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="initiateflashbackupinput.destinationpath">destinationPath</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Destination path on the remote.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="initiateflashbackupinput.options">options</strong></td>
<td valign="top"><a href="#json">JSON</a></td>
<td>

Additional options for the backup operation, such as --dry-run or --transfers.

</td>
</tr>
</tbody>
</table>

### InstallPluginInput

Input payload for installing a plugin

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="installplugininput.url">url</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Plugin installation URL (.plg)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="installplugininput.name">name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Optional human-readable plugin name used for logging

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="installplugininput.forced">forced</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Force installation even when plugin is already present. Defaults to true to mirror the existing UI behaviour.

</td>
</tr>
</tbody>
</table>

### IpmiConfigInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="ipmiconfiginput.enabled">enabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="ipmiconfiginput.args">args</strong></td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td></td>
</tr>
</tbody>
</table>

### LmSensorsConfigInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="lmsensorsconfiginput.enabled">enabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="lmsensorsconfiginput.config_path">config_path</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### NotificationData

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="notificationdata.title">title</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notificationdata.subject">subject</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notificationdata.description">description</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notificationdata.importance">importance</strong></td>
<td valign="top"><a href="#notificationimportance">NotificationImportance</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notificationdata.link">link</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### NotificationFilter

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="notificationfilter.importance">importance</strong></td>
<td valign="top"><a href="#notificationimportance">NotificationImportance</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notificationfilter.type">type</strong></td>
<td valign="top"><a href="#notificationtype">NotificationType</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notificationfilter.offset">offset</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="notificationfilter.limit">limit</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### OnboardingOverrideCompletionInput

Onboarding completion override input

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="onboardingoverridecompletioninput.completed">completed</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingoverridecompletioninput.completedatversion">completedAtVersion</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingoverridecompletioninput.forceopen">forceOpen</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
</tbody>
</table>

### OnboardingOverrideInput

Onboarding override input for testing

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="onboardingoverrideinput.onboarding">onboarding</strong></td>
<td valign="top"><a href="#onboardingoverridecompletioninput">OnboardingOverrideCompletionInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingoverrideinput.activationcode">activationCode</strong></td>
<td valign="top"><a href="#activationcodeoverrideinput">ActivationCodeOverrideInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingoverrideinput.partnerinfo">partnerInfo</strong></td>
<td valign="top"><a href="#partnerinfooverrideinput">PartnerInfoOverrideInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="onboardingoverrideinput.registrationstate">registrationState</strong></td>
<td valign="top"><a href="#registrationstate">RegistrationState</a></td>
<td></td>
</tr>
</tbody>
</table>

### PartnerConfigInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="partnerconfiginput.name">name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="partnerconfiginput.url">url</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="partnerconfiginput.hardwarespecsurl">hardwareSpecsUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="partnerconfiginput.manualurl">manualUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="partnerconfiginput.supporturl">supportUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="partnerconfiginput.extralinks">extraLinks</strong></td>
<td valign="top">[<a href="#partnerlinkinput">PartnerLinkInput</a>!]</td>
<td></td>
</tr>
</tbody>
</table>

### PartnerInfoOverrideInput

Partner info override input

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="partnerinfooverrideinput.partner">partner</strong></td>
<td valign="top"><a href="#partnerconfiginput">PartnerConfigInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="partnerinfooverrideinput.branding">branding</strong></td>
<td valign="top"><a href="#brandingconfiginput">BrandingConfigInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### PartnerLinkInput

Partner link input for custom links

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="partnerlinkinput.title">title</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="partnerlinkinput.url">url</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### PluginManagementInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="pluginmanagementinput.names">names</strong></td>
<td valign="top">[<a href="#string">String</a>!]!</td>
<td>

Array of plugin package names to add or remove

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="pluginmanagementinput.bundled">bundled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether to treat plugins as bundled plugins. Bundled plugins are installed to node_modules at build time and controlled via config only.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="pluginmanagementinput.restart">restart</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Whether to restart the API after the operation. When false, a restart has already been queued.

</td>
</tr>
</tbody>
</table>

### RCloneConfigFormInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="rcloneconfigforminput.providertype">providerType</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="rcloneconfigforminput.showadvanced">showAdvanced</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="rcloneconfigforminput.parameters">parameters</strong></td>
<td valign="top"><a href="#json">JSON</a></td>
<td></td>
</tr>
</tbody>
</table>

### RemoveRoleFromApiKeyInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="removerolefromapikeyinput.apikeyid">apiKeyId</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="removerolefromapikeyinput.role">role</strong></td>
<td valign="top"><a href="#role">Role</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### SensorConfigInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="sensorconfiginput.enabled">enabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
</tbody>
</table>

### SetupRemoteAccessInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="setupremoteaccessinput.accesstype">accessType</strong></td>
<td valign="top"><a href="#wan_access_type">WAN_ACCESS_TYPE</a>!</td>
<td>

The type of WAN access to use for Remote Access

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="setupremoteaccessinput.forwardtype">forwardType</strong></td>
<td valign="top"><a href="#wan_forward_type">WAN_FORWARD_TYPE</a></td>
<td>

The type of port forwarding to use for Remote Access

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="setupremoteaccessinput.port">port</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

The port to use for Remote Access. Not required for UPNP forwardType. Required for STATIC forwardType. Ignored if accessType is DISABLED or forwardType is UPNP.

</td>
</tr>
</tbody>
</table>

### SystemConfigInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="systemconfiginput.servername">serverName</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="systemconfiginput.model">model</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="systemconfiginput.comment">comment</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### TemperatureConfigInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="temperatureconfiginput.enabled">enabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperatureconfiginput.polling_interval">polling_interval</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperatureconfiginput.default_unit">default_unit</strong></td>
<td valign="top"><a href="#temperatureunit">TemperatureUnit</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperatureconfiginput.sensors">sensors</strong></td>
<td valign="top"><a href="#temperaturesensorsconfiginput">TemperatureSensorsConfigInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperatureconfiginput.thresholds">thresholds</strong></td>
<td valign="top"><a href="#temperaturethresholdsconfiginput">TemperatureThresholdsConfigInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperatureconfiginput.history">history</strong></td>
<td valign="top"><a href="#temperaturehistoryconfiginput">TemperatureHistoryConfigInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### TemperatureHistoryConfigInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="temperaturehistoryconfiginput.max_readings">max_readings</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturehistoryconfiginput.retention_ms">retention_ms</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
</tbody>
</table>

### TemperatureSensorsConfigInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensorsconfiginput.lm_sensors">lm_sensors</strong></td>
<td valign="top"><a href="#lmsensorsconfiginput">LmSensorsConfigInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensorsconfiginput.smartctl">smartctl</strong></td>
<td valign="top"><a href="#sensorconfiginput">SensorConfigInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturesensorsconfiginput.ipmi">ipmi</strong></td>
<td valign="top"><a href="#ipmiconfiginput">IpmiConfigInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### TemperatureThresholdsConfigInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="temperaturethresholdsconfiginput.cpu_warning">cpu_warning</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturethresholdsconfiginput.cpu_critical">cpu_critical</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturethresholdsconfiginput.disk_warning">disk_warning</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturethresholdsconfiginput.disk_critical">disk_critical</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturethresholdsconfiginput.warning">warning</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="temperaturethresholdsconfiginput.critical">critical</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
</tbody>
</table>

### UPSConfigInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiginput.service">service</strong></td>
<td valign="top"><a href="#upsservicestate">UPSServiceState</a></td>
<td>

Enable or disable the UPS monitoring service

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiginput.upscable">upsCable</strong></td>
<td valign="top"><a href="#upscabletype">UPSCableType</a></td>
<td>

Type of cable connecting the UPS to the server

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiginput.customupscable">customUpsCable</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Custom cable configuration (only used when upsCable is CUSTOM). Format depends on specific UPS model

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiginput.upstype">upsType</strong></td>
<td valign="top"><a href="#upstype">UPSType</a></td>
<td>

UPS communication protocol

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiginput.device">device</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Device path or network address for UPS connection. Examples: '/dev/ttyUSB0' for USB, '192.168.1.100:3551' for network

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiginput.overrideupscapacity">overrideUpsCapacity</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Override UPS capacity for runtime calculations. Unit: watts (W). Leave unset to use UPS-reported capacity

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiginput.batterylevel">batteryLevel</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Battery level percentage to initiate shutdown. Unit: percent (%) - Valid range: 0-100

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiginput.minutes">minutes</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Runtime left in minutes to initiate shutdown. Unit: minutes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiginput.timeout">timeout</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Time on battery before shutdown. Unit: seconds. Set to 0 to disable timeout-based shutdown

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="upsconfiginput.killups">killUps</strong></td>
<td valign="top"><a href="#upskillpower">UPSKillPower</a></td>
<td>

Turn off UPS power after system shutdown. Useful for ensuring complete power cycle

</td>
</tr>
</tbody>
</table>

### UpdateApiKeyInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="updateapikeyinput.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="updateapikeyinput.name">name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="updateapikeyinput.description">description</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="updateapikeyinput.roles">roles</strong></td>
<td valign="top">[<a href="#role">Role</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="updateapikeyinput.permissions">permissions</strong></td>
<td valign="top">[<a href="#addpermissioninput">AddPermissionInput</a>!]</td>
<td></td>
</tr>
</tbody>
</table>

### UpdateSshInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="updatesshinput.enabled">enabled</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="updatesshinput.port">port</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

SSH Port (default 22)

</td>
</tr>
</tbody>
</table>

### UpdateSystemTimeInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="updatesystemtimeinput.timezone">timeZone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

New IANA timezone identifier to apply

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="updatesystemtimeinput.usentp">useNtp</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Enable or disable NTP-based synchronization

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="updatesystemtimeinput.ntpservers">ntpServers</strong></td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td>

Ordered list of up to four NTP servers. Supply empty strings to clear positions.

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="updatesystemtimeinput.manualdatetime">manualDateTime</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Manual date/time to apply when disabling NTP, expected format YYYY-MM-DD HH:mm:ss

</td>
</tr>
</tbody>
</table>

## Enums

### ArrayDiskFsColor

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>GREEN_ON</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>GREEN_BLINK</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>BLUE_ON</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>BLUE_BLINK</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>YELLOW_ON</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>YELLOW_BLINK</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>RED_ON</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>RED_OFF</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>GREY_OFF</strong></td>
<td></td>
</tr>
</tbody>
</table>

### ArrayDiskStatus

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>DISK_NP</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DISK_OK</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DISK_NP_MISSING</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DISK_INVALID</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DISK_WRONG</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DISK_DSBL</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DISK_NP_DSBL</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DISK_DSBL_NEW</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DISK_NEW</strong></td>
<td></td>
</tr>
</tbody>
</table>

### ArrayDiskType

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>DATA</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PARITY</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>BOOT</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>FLASH</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CACHE</strong></td>
<td></td>
</tr>
</tbody>
</table>

### ArrayState

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>STARTED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>STOPPED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>NEW_ARRAY</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>RECON_DISK</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DISABLE_DISK</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SWAP_DSBL</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>INVALID_EXPANSION</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PARITY_NOT_BIGGEST</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>TOO_MANY_MISSING_DISKS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>NEW_DISK_TOO_SMALL</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>NO_DATA_DISKS</strong></td>
<td></td>
</tr>
</tbody>
</table>

### ArrayStateInputState

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>START</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>STOP</strong></td>
<td></td>
</tr>
</tbody>
</table>

### AuthAction

Authentication actions with possession (e.g., create:any, read:own)

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>CREATE_ANY</strong></td>
<td>

Create any resource

</td>
</tr>
<tr>
<td valign="top"><strong>CREATE_OWN</strong></td>
<td>

Create own resource

</td>
</tr>
<tr>
<td valign="top"><strong>READ_ANY</strong></td>
<td>

Read any resource

</td>
</tr>
<tr>
<td valign="top"><strong>READ_OWN</strong></td>
<td>

Read own resource

</td>
</tr>
<tr>
<td valign="top"><strong>UPDATE_ANY</strong></td>
<td>

Update any resource

</td>
</tr>
<tr>
<td valign="top"><strong>UPDATE_OWN</strong></td>
<td>

Update own resource

</td>
</tr>
<tr>
<td valign="top"><strong>DELETE_ANY</strong></td>
<td>

Delete any resource

</td>
</tr>
<tr>
<td valign="top"><strong>DELETE_OWN</strong></td>
<td>

Delete own resource

</td>
</tr>
</tbody>
</table>

### AuthorizationOperator

Operators for authorization rule matching

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>EQUALS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CONTAINS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ENDS_WITH</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>STARTS_WITH</strong></td>
<td></td>
</tr>
</tbody>
</table>

### AuthorizationRuleMode

Mode for evaluating authorization rules - OR (any rule passes) or AND (all rules must pass)

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>OR</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>AND</strong></td>
<td></td>
</tr>
</tbody>
</table>

### ConfigErrorState

Possible error states for configuration

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>UNKNOWN_ERROR</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>INELIGIBLE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>INVALID</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>NO_KEY_SERVER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>WITHDRAWN</strong></td>
<td></td>
</tr>
</tbody>
</table>

### ContainerPortType

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>TCP</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>UDP</strong></td>
<td></td>
</tr>
</tbody>
</table>

### ContainerState

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>RUNNING</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PAUSED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>EXITED</strong></td>
<td></td>
</tr>
</tbody>
</table>

### DiskFsType

The type of filesystem on the disk partition

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>XFS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>BTRFS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>VFAT</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ZFS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>EXT4</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>NTFS</strong></td>
<td></td>
</tr>
</tbody>
</table>

### DiskInterfaceType

The type of interface the disk uses to connect to the system

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>SAS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SATA</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>USB</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PCIE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>UNKNOWN</strong></td>
<td></td>
</tr>
</tbody>
</table>

### DiskSmartStatus

The SMART (Self-Monitoring, Analysis and Reporting Technology) status of the disk

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>OK</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>UNKNOWN</strong></td>
<td></td>
</tr>
</tbody>
</table>

### DynamicRemoteAccessType

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>STATIC</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>UPNP</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DISABLED</strong></td>
<td></td>
</tr>
</tbody>
</table>

### MinigraphStatus

The status of the minigraph

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>PRE_INIT</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CONNECTING</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CONNECTED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PING_FAILURE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ERROR_RETRYING</strong></td>
<td></td>
</tr>
</tbody>
</table>

### NotificationImportance

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>ALERT</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>INFO</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>WARNING</strong></td>
<td></td>
</tr>
</tbody>
</table>

### NotificationType

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>UNREAD</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ARCHIVE</strong></td>
<td></td>
</tr>
</tbody>
</table>

### OnboardingStatus

The current onboarding status based on completion state and version relationship

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>INCOMPLETE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>UPGRADE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DOWNGRADE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>COMPLETED</strong></td>
<td></td>
</tr>
</tbody>
</table>

### ParityCheckStatus

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>NEVER_RUN</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>RUNNING</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PAUSED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>COMPLETED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CANCELLED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>FAILED</strong></td>
<td></td>
</tr>
</tbody>
</table>

### PluginInstallStatus

Status of a plugin installation operation

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>FAILED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>QUEUED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>RUNNING</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SUCCEEDED</strong></td>
<td></td>
</tr>
</tbody>
</table>

### RegistrationState

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>TRIAL</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>BASIC</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PLUS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PRO</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>STARTER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>UNLEASHED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>LIFETIME</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>EEXPIRED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>EGUID</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>EGUID1</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ETRIAL</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ENOKEYFILE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ENOKEYFILE1</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ENOKEYFILE2</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ENOFLASH</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ENOFLASH1</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ENOFLASH2</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ENOFLASH3</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ENOFLASH4</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ENOFLASH5</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ENOFLASH6</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ENOFLASH7</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>EBLACKLISTED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>EBLACKLISTED1</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>EBLACKLISTED2</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ENOCONN</strong></td>
<td></td>
</tr>
</tbody>
</table>

### Resource

Available resources for permissions

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>ACTIVATION_CODE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>API_KEY</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ARRAY</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CLOUD</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CONFIG</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CONNECT</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CONNECT__REMOTE_ACCESS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CUSTOMIZATIONS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DASHBOARD</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DISK</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DISPLAY</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DOCKER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>FLASH</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>INFO</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>LOGS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ME</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>NETWORK</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>NOTIFICATIONS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ONLINE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>OS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>OWNER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PERMISSION</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>REGISTRATION</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SERVERS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SERVICES</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SHARE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>VARS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>VMS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>WELCOME</strong></td>
<td></td>
</tr>
</tbody>
</table>

### Role

Available roles for API keys and users

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>ADMIN</strong></td>
<td>

Full administrative access to all resources

</td>
</tr>
<tr>
<td valign="top"><strong>CONNECT</strong></td>
<td>

Internal Role for Unraid Connect

</td>
</tr>
<tr>
<td valign="top"><strong>GUEST</strong></td>
<td>

Basic read access to user profile only

</td>
</tr>
<tr>
<td valign="top"><strong>VIEWER</strong></td>
<td>

Read-only access to all resources

</td>
</tr>
</tbody>
</table>

### SensorType

Type of temperature sensor

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>CPU_PACKAGE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CPU_CORE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>MOTHERBOARD</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CHIPSET</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>GPU</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DISK</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>NVME</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>AMBIENT</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>VRM</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CUSTOM</strong></td>
<td></td>
</tr>
</tbody>
</table>

### ServerStatus

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>ONLINE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>OFFLINE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>NEVER_CONNECTED</strong></td>
<td></td>
</tr>
</tbody>
</table>

### Temperature

Temperature unit

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>CELSIUS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>FAHRENHEIT</strong></td>
<td></td>
</tr>
</tbody>
</table>

### TemperatureStatus

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>NORMAL</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>WARNING</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CRITICAL</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>UNKNOWN</strong></td>
<td></td>
</tr>
</tbody>
</table>

### TemperatureUnit

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>CELSIUS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>FAHRENHEIT</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>KELVIN</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>RANKINE</strong></td>
<td></td>
</tr>
</tbody>
</table>

### ThemeName

The theme name

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>azure</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>black</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>gray</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>white</strong></td>
<td></td>
</tr>
</tbody>
</table>

### UPSCableType

UPS cable connection types

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>USB</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SIMPLE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SMART</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ETHER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CUSTOM</strong></td>
<td></td>
</tr>
</tbody>
</table>

### UPSKillPower

Kill UPS power after shutdown option

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>YES</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>NO</strong></td>
<td></td>
</tr>
</tbody>
</table>

### UPSServiceState

Service state for UPS daemon

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>ENABLE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DISABLE</strong></td>
<td></td>
</tr>
</tbody>
</table>

### UPSType

UPS communication protocols

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>USB</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>APCSMART</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>NET</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SNMP</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DUMB</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PCNET</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>MODBUS</strong></td>
<td></td>
</tr>
</tbody>
</table>

### URL_TYPE

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>LAN</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>WIREGUARD</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>WAN</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>MDNS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>OTHER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DEFAULT</strong></td>
<td></td>
</tr>
</tbody>
</table>

### UpdateStatus

Update status of a container.

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>UP_TO_DATE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>UPDATE_AVAILABLE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>REBUILD_READY</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>UNKNOWN</strong></td>
<td></td>
</tr>
</tbody>
</table>

### VmState

The state of a virtual machine

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>NOSTATE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>RUNNING</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>IDLE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PAUSED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SHUTDOWN</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SHUTOFF</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CRASHED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PMSUSPENDED</strong></td>
<td></td>
</tr>
</tbody>
</table>

### WAN_ACCESS_TYPE

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>DYNAMIC</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ALWAYS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DISABLED</strong></td>
<td></td>
</tr>
</tbody>
</table>

### WAN_FORWARD_TYPE

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>UPNP</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>STATIC</strong></td>
<td></td>
</tr>
</tbody>
</table>

### registrationType

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>BASIC</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PLUS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PRO</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>STARTER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>UNLEASHED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>LIFETIME</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>INVALID</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>TRIAL</strong></td>
<td></td>
</tr>
</tbody>
</table>

## Scalars

### BigInt

The `BigInt` scalar type represents non-fractional signed whole numeric values.

### Boolean

The `Boolean` scalar type represents `true` or `false`.

### DateTime

A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format.

### Float

The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point).

### ID

The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.

### Int

The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1.

### JSON

The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).

### Port

A field whose value is a valid TCP port within the range of 0 to 65535: https://en.wikipedia.org/wiki/Transmission_Control_Protocol#TCP_ports

### PrefixedID


### Description:

ID scalar type that prefixes the underlying ID with the server identifier on output and strips it on input.

We use this scalar type to ensure that the ID is unique across all servers, allowing the same underlying resource ID to be used across different server instances.

#### Input Behavior:

When providing an ID as input (e.g., in arguments or input objects), the server identifier prefix ('<serverId>:') is optional.

- If the prefix is present (e.g., '123:456'), it will be automatically stripped, and only the underlying ID ('456') will be used internally.
- If the prefix is absent (e.g., '456'), the ID will be used as-is.

This makes it flexible for clients, as they don't strictly need to know or provide the server ID.

#### Output Behavior:

When an ID is returned in the response (output), it will *always* be prefixed with the current server's unique identifier (e.g., '123:456').

#### Example:

Note: The server identifier is '123' in this example.

##### Input (Prefix Optional):
```graphql
# Both of these are valid inputs resolving to internal ID '456'
{
  someQuery(id: "123:456") { ... }
  anotherQuery(id: "456") { ... }
}
```

##### Output (Prefix Always Added):
```graphql
# Assuming internal ID is '456'
{
  "data": {
    "someResource": {
      "id": "123:456" 
    }
  }
}
```
        

### String

The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.

### URL

A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt.


## Interfaces


### FormSchema

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="formschema.dataschema">dataSchema</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>

The data schema for the form

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="formschema.uischema">uiSchema</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>

The UI schema for the form

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="formschema.values">values</strong></td>
<td valign="top"><a href="#json">JSON</a>!</td>
<td>

The current values of the form

</td>
</tr>
</tbody>
</table>

**Possible Types:** [UnifiedSettings](#unifiedsettings), [ApiKeyFormSettings](#apikeyformsettings)

### Node

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="node.id">id</strong></td>
<td valign="top"><a href="#prefixedid">PrefixedID</a>!</td>
<td></td>
</tr>
</tbody>
</table>

**Possible Types:** [ArrayDisk](#arraydisk), [UnraidArray](#unraidarray), [Share](#share), [Disk](#disk), [Registration](#registration), [Vars](#vars), [ApiKey](#apikey), [Notification](#notification), [Notifications](#notifications), [SsoSettings](#ssosettings), [UnifiedSettings](#unifiedsettings), [ApiKeyFormSettings](#apikeyformsettings), [Settings](#settings), [InfoDisplayCase](#infodisplaycase), [InfoDisplay](#infodisplay), [Config](#config), [InfoGpu](#infogpu), [InfoNetwork](#infonetwork), [InfoPci](#infopci), [InfoUsb](#infousb), [InfoDevices](#infodevices), [CpuPackages](#cpupackages), [CpuUtilization](#cpuutilization), [InfoCpu](#infocpu), [MemoryLayout](#memorylayout), [MemoryUtilization](#memoryutilization), [InfoMemory](#infomemory), [InfoNetworkInterface](#infonetworkinterface), [InfoOs](#infoos), [InfoSystem](#infosystem), [InfoBaseboard](#infobaseboard), [InfoVersions](#infoversions), [Info](#info), [DockerContainer](#dockercontainer), [DockerNetwork](#dockernetwork), [Docker](#docker), [Flash](#flash), [TemperatureSensor](#temperaturesensor), [TemperatureMetrics](#temperaturemetrics), [Metrics](#metrics), [ProfileModel](#profilemodel), [Server](#server), [VmDomain](#vmdomain), [Vms](#vms), [Service](#service), [UserAccount](#useraccount), [ConnectSettings](#connectsettings), [Connect](#connect), [Network](#network)
