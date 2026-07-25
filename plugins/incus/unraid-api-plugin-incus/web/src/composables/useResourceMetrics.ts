import { computed, reactive, ref, type Ref } from "vue";
import type { Jail } from "../types";

export interface HistoryPoint { atMs: number; cpuPct: number; memPct: number | null }
interface CpuSample { atMs: number; cpuUsageNs: bigint }

export function useResourceMetrics(jails: Ref<Jail[]>, cpuLimit: () => string) {
  const cpuSamples = reactive(new Map<string, CpuSample>());
  const jailHistory = reactive(new Map<string, HistoryPoint[]>());
  const fleetHistory = ref<HistoryPoint[]>([]);
  const cpuRates = reactive(new Map<string, number>());
  const historyLength = 30;

  const runningJails = computed(() => jails.value.filter((j) => j.status.toLowerCase() === "running"));
  const stoppedJailsCount = computed(() => jails.value.length - runningJails.value.length);
  const totalMemoryUsageBytes = computed(() => runningJails.value.reduce((sum, j) => sum + Number(j.memoryUsageBytes ?? 0), 0));
  const totalCpuUsageNs = computed(() => runningJails.value.reduce((sum, j) => sum + BigInt(j.cpuUsageNs ?? "0"), 0n));

  function formatDuration(ns: number | null | undefined): string {
    if (ns === null || ns === undefined) return "—";
    const totalSeconds = Math.floor(ns / 1e9);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  function formatBytes(bytes: number | null | undefined): string {
    if (bytes === null || bytes === undefined) return "—";
    if (bytes === 0) return "0 B";
    const units = ["B", "KiB", "MiB", "GiB", "TiB"];
    const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** exp;
    return `${value >= 10 || exp === 0 ? Math.round(value) : value.toFixed(1)} ${units[exp]}`;
  }

  function formatMemory(jail: Jail): string {
    if (jail.memoryUsageBytes == null) return "—";
    const used = formatBytes(Number(jail.memoryUsageBytes));
    return jail.memoryTotalBytes ? `${used} / ${formatBytes(Number(jail.memoryTotalBytes))}` : used;
  }

  function memoryFillPct(jail: Jail): number | null {
    if (!jail.memoryTotalBytes || jail.memoryUsageBytes == null) return null;
    return Math.min(100, Math.round((Number(jail.memoryUsageBytes) / Number(jail.memoryTotalBytes)) * 100));
  }

  function coreLimit(): number | null {
    const raw = cpuLimit().trim();
    if (!/^\d+$/.test(raw)) return null;
    const value = Number(raw);
    return value > 0 ? value : null;
  }

  function updateCpuSamplesAndHistory() {
    const now = Date.now();
    let fleetCpuPct = 0;
    let fleetHasRate = false;
    let fleetMemPctSum = 0;
    let fleetMemPctCount = 0;

    for (const jail of jails.value) {
      if (jail.cpuUsageNs == null) {
        cpuSamples.delete(jail.name);
        cpuRates.delete(jail.name);
        continue;
      }
      const cpuNs = BigInt(jail.cpuUsageNs);
      const previous = cpuSamples.get(jail.name);
      if (previous) {
        const deltaNs = cpuNs - previous.cpuUsageNs;
        const deltaMs = now - previous.atMs;
        if (deltaNs >= 0n && deltaMs > 0) {
          const pct = (Number(deltaNs) / (deltaMs * 1e6)) * 100;
          cpuRates.set(jail.name, pct);
          const memPct = memoryFillPct(jail);
          const history = jailHistory.get(jail.name) ?? [];
          history.push({ atMs: now, cpuPct: pct, memPct });
          if (history.length > historyLength) history.shift();
          jailHistory.set(jail.name, history);
          if (jail.status.toLowerCase() === "running") {
            fleetCpuPct += pct;
            fleetHasRate = true;
            if (memPct !== null) { fleetMemPctSum += memPct; fleetMemPctCount++; }
          }
        } else cpuRates.delete(jail.name);
      } else cpuRates.delete(jail.name);
      cpuSamples.set(jail.name, { atMs: now, cpuUsageNs: cpuNs });
    }

    const names = new Set(jails.value.map((j) => j.name));
    for (const map of [cpuSamples, jailHistory, cpuRates]) {
      for (const name of Array.from(map.keys())) if (!names.has(name)) map.delete(name);
    }
    if (fleetHasRate) {
      fleetHistory.value.push({ atMs: now, cpuPct: fleetCpuPct, memPct: fleetMemPctCount ? fleetMemPctSum / fleetMemPctCount : null });
      if (fleetHistory.value.length > historyLength) fleetHistory.value.shift();
    }
  }

  const cpuRateLabel = (jail: Jail) => cpuRates.has(jail.name) ? `${cpuRates.get(jail.name)!.toFixed(cpuRates.get(jail.name)! < 10 ? 1 : 0)}%` : "—";
  const cpuRatePct = (jail: Jail) => {
    const rate = cpuRates.get(jail.name);
    if (rate === undefined) return null;
    return Math.min(100, Math.max(0, Math.round(coreLimit() ? rate / coreLimit()! : rate)));
  };
  const cpuRateSuffix = () => coreLimit() ? `of ${coreLimit()} core${coreLimit() === 1 ? "" : "s"}` : "of 1 core";
  const jailCpuHistory = (name: string) => jailHistory.get(name) ?? [];
  const totalCpuRateLabel = () => fleetHistory.value.length ? `${fleetHistory.value.at(-1)!.cpuPct.toFixed(fleetHistory.value.at(-1)!.cpuPct < 10 ? 1 : 0)}%` : "—";
  const sparklinePoints = (history: HistoryPoint[], key: "cpuPct" | "memPct", width = 80, height = 24) => history
    .map((point, index) => point[key] === null ? null : `${(index * (width / Math.max(1, history.length - 1))).toFixed(1)},${(height - Math.min(100, Math.max(0, point[key]!)) / 100 * height).toFixed(1)}`)
    .filter(Boolean).join(" ");

  return { runningJails, stoppedJailsCount, totalMemoryUsageBytes, totalCpuUsageNs, fleetHistory,
    formatDuration, formatBytes, formatMemory, memoryFillPct, updateCpuSamplesAndHistory,
    cpuRateLabel, cpuRatePct, cpuRateSuffix, jailCpuHistory, totalCpuRateLabel, sparklinePoints };
}
