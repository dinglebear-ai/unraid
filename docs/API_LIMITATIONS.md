---
title: Unraid API data limitations
created: 2026-10-19
updated: 2026-10-20
---

# Unraid API data limitations

The Python and Rust servers depend on the Unraid GraphQL API. A declared schema
field does not guarantee that the upstream implementation populates it.

## Python array health

Python `system/array` combines array disk status with filesystem capacity alerts.
Its warning and critical thresholds specify the percentage **used**, not drive
failure flags. Capacity is assessed only when valid filesystem size and used
values are available; parity disks do not have filesystem capacity metrics.
This summary does not perform a SMART diagnosis.

Null or zero per-disk thresholds inherit the global display settings. Reading
those defaults requires the API's DISPLAY permission in addition to ARRAY.
If the defaults cannot be read, `summary.capacity_warnings` explains the gap.
Disks without usable thresholds retain their device-status classification;
`overall_health=HEALTHY` does not establish their capacity health in that case.

The separate `health/check` subaction evaluates whether the array is started
or stopped. It does not provide the same capacity assessment.

## Per-disk I/O counters

In Unraid API **4.37.3**, the
[slot parser](https://github.com/unraid/api/blob/v4.37.3/api/src/store/state-parsers/slots.ts#L86-L88)
sets `numReads` and `numWrites` to zero instead of reading the slot counters.
The same parser reads `numErrors` from the slot data. This distinction matters:
the read/write limitation does not make a zero error count unavailable.

On affected API versions, zero read/write counters do **not** prove that a disk
is idle. These fields describe accumulated request counts, not bytes per second.
Do not calculate disk throughput from them. The Unraid webGUI can use a separate
data source, so its live activity display can differ from GraphQL responses.

The servers expose these fields differently:

| Surface | Counter behavior |
| --- | --- |
| Rust MCP `array` and CLI `array --json` | Data-disk objects preserve upstream `numReads`, `numWrites`, and `numErrors`, including zeros. Parity/cache objects select only `numErrors`. |
| Rust human-readable `array` | Does not display I/O counter columns. |
| Python `system/array` | Requests counters but returns an array summary without per-disk I/O counters. |
| Python `disk/disks` and `disk/disk_details` | Do not request these array counters. |

Zero alone cannot identify an affected server: an idle disk or cleared statistics
can legitimately have zero counters. Clients must not replace every zero with
"unavailable" or treat `numErrors=0` as evidence of this read/write defect.

### Upstream tracking

As checked on October 19, 2026, the
[proposed upstream fix](https://github.com/unraid/api/pull/2087) was closed without
merging; the [upstream tracking issue](https://github.com/unraid/api/issues/2086)
remained open. Do not assume that an API upgrade includes this fix without
checking its release source or measuring the returned counters under known I/O.

The downstream report is [issue #396](https://github.com/dinglebear-ai/unraid/issues/396).
This guide documents the limitation; it does not repair the upstream parser or
add direct host access to the GraphQL clients.
