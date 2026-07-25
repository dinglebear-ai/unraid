# Unraid API Schema Changes

> Generated on 2026-06-25T12:11:09+00:00
> Source: docs/unraid/UNRAID-API-INTROSPECTION.json
> Rendered by graphql-markdown / GraphQL Inspector — do not edit by hand.

```text
[log]
Detected the following changes (23) between schemas:

[log] ⚠  Argument skipCache: Boolean! (with default value) added to field Docker.containers
[log] ⚠  Argument skipCache: Boolean! (with default value) added to field Docker.networks
[log] ⚠  Argument skipCache: Boolean! (with default value) added to field Docker.organizer
[log] ⚠  Argument skipCache: Boolean! (with default value) added to field Docker.portConflicts
[log] ✔  Field restart was added to object type DockerMutations
[log] ✔  Field duplex was added to object type InfoNetworkInterface
[log] ✔  Field internal was added to object type InfoNetworkInterface
[log] ✔  Field ipv4Addresses was added to object type InfoNetworkInterface
[log] ✔  Field ipv6Addresses was added to object type InfoNetworkInterface
[log] ✔  Field mtu was added to object type InfoNetworkInterface
[log] ✔  Field operstate was added to object type InfoNetworkInterface
[log] ✔  Field speed was added to object type InfoNetworkInterface
[log] ✔  Field type was added to object type InfoNetworkInterface
[log] ✔  Field virtual was added to object type InfoNetworkInterface
[log] ✔  Field vlanId was added to object type InfoNetworkInterface
[log] ✔  Type InfoNetworkIpv4Address was added
[log] ✔  Type InfoNetworkIpv6Address was added
[log] ✔  Field network was added to object type Metrics
[log] ✔  Type NetworkMetrics was added
[log] ✔  Field driveWarnings was added to object type OnboardingInternalBootContext
[log] ✔  Type OnboardingInternalBootDriveWarning was added
[log] ✔  Field networkInterfaces was added to object type Query
[log] ✔  Field systemMetricsNetwork was added to object type Subscription
[success] No breaking changes detected
```
