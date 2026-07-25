<script setup lang="ts">
/**
 * Compact Main → Dashboard status tile. Self-contained and dependency-light
 * (no Tailwind / component kit) since it ships in its own minimal bundle that
 * loads on every dashboard view. Live status is pushed over the nchan
 * "unraid_mcp" channel — with buffer_length=1 the last status arrives the
 * moment we subscribe, so there is no polling and no initial fetch. Inline
 * styles keep it readable in any Unraid webGUI theme.
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

interface Status {
  running: boolean;
  pid: number;
  cpu: number;
  memMB: number;
  uptime: number;
  version: string;
}

const status = ref<Status | null>(null);
const connected = ref(false);
let es: EventSource | null = null;

const uptimeText = computed(() => {
  const s = status.value?.uptime ?? 0;
  if (!s || !status.value?.running) return "—";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
});

function connect() {
  es = new EventSource("/sub/unraid_mcp");
  es.onopen = () => (connected.value = true);
  es.onmessage = (e) => {
    try {
      const d = JSON.parse(e.data) as Partial<Status>;
      // Validate before trusting fields the template calls .toFixed() on — a
      // future publisher change or partial frame must not throw in render.
      if (typeof d.running !== "boolean") return;
      status.value = {
        running: d.running,
        pid: Number(d.pid) || 0,
        cpu: Number(d.cpu) || 0,
        memMB: Number(d.memMB) || 0,
        uptime: Number(d.uptime) || 0,
        version: typeof d.version === "string" ? d.version : "unknown",
      };
    } catch {
      /* ignore malformed frames */
    }
  };
  es.onerror = () => {
    connected.value = false; // EventSource auto-reconnects
  };
}

onMounted(connect);
onBeforeUnmount(() => es?.close());
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 6px; padding: 4px 2px; font-size: 1.3rem">
    <div style="display: flex; align-items: center; gap: 8px">
      <span
        :style="{
          display: 'inline-block',
          width: '9px',
          height: '9px',
          borderRadius: '50%',
          background: status?.running ? '#63a659' : '#8a8a8a',
        }"
      ></span>
      <strong>{{ status?.running ? "Running" : status ? "Stopped" : "Connecting…" }}</strong>
      <span v-if="status" style="opacity: 0.7">v{{ status.version }}</span>
      <a href="/Settings/UnraidMCP" style="margin-left: auto; font-size: 1.15rem">Settings ›</a>
    </div>

    <div v-if="status?.running" style="display: flex; gap: 18px; opacity: 0.9">
      <span><b>{{ status.cpu.toFixed(1) }}%</b> cpu</span>
      <span><b>{{ status.memMB }}</b> MB</span>
      <span><b>{{ uptimeText }}</b> up</span>
      <span style="opacity: 0.6">pid {{ status.pid }}</span>
    </div>
    <div v-else-if="status" style="opacity: 0.7">Service is not running.</div>
  </div>
</template>
