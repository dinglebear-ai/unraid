<script setup lang="ts">
// Deliberately its own small entry point (see dashboard-main.ts / the sibling
// vite.dashboard.config.ts build), not part of the main incus-settings.js
// bundle — that one pulls in Tailwind, Terminal.vue, ghostty-web, reka-ui,
// etc. (~850KB) which would otherwise load on every Main/Dashboard view for
// every user just to show a status count.
import { ref, computed, onMounted, onUnmounted } from "vue";
import { gql } from "./graphql-client.js";
import { startPolling, type PollController } from "./lib/polling.js";

interface Jail {
  name: string;
  status: string;
}

const healthy = ref<boolean | null>(null);
const jails = ref<Jail[]>([]);
const error = ref<string | null>(null);

const STATUS_QUERY = `query { incusHealthy jails { name status } }`;

async function refresh() {
  try {
    const data = await gql<{ incusHealthy: boolean; jails: Jail[] }>(STATUS_QUERY);
    healthy.value = data.incusHealthy;
    jails.value = data.jails;
    error.value = null;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

const running = computed(() => jails.value.filter((j) => j.status.toLowerCase() === "running").length);
const stopped = computed(() => jails.value.filter((j) => j.status.toLowerCase() === "stopped").length);
// Anything else (Frozen, Error, Starting, ...) — don't lump these in with
// "stopped", that misleads an admin into thinking a frozen/errored jail just
// needs starting when it actually needs attention.
const other = computed(() => jails.value.length - running.value - stopped.value);

let poller: PollController | undefined;
onMounted(() => {
  poller = startPolling(refresh, 15_000, { immediate: true });
});
onUnmounted(() => poller?.stop());
</script>

<template>
  <div class="incus-dashboard-tile">
    <div class="incus-tile-title">Incus Jails</div>
    <div v-if="error" class="incus-tile-error">incusd unreachable</div>
    <div v-else-if="healthy === null" class="incus-tile-loading">…</div>
    <div v-else-if="!healthy" class="incus-tile-error">incusd unreachable</div>
    <div v-else class="incus-tile-summary">
      {{ jails.length }} jail{{ jails.length === 1 ? "" : "s" }}
      (<span class="incus-tile-running">{{ running }} running</span>,
      <span class="incus-tile-stopped">{{ stopped }} stopped</span>
      <template v-if="other > 0">, <span class="incus-tile-other">{{ other }} other</span></template>)
    </div>
  </div>
</template>

<style scoped>
.incus-dashboard-tile {
  padding: 8px 12px;
  font-family: inherit;
  font-size: 13px;
}
.incus-tile-title {
  font-weight: 600;
  margin-bottom: 4px;
}
.incus-tile-loading {
  color: var(--text-muted, var(--secondary, #888));
}
.incus-tile-error {
  color: var(--error, var(--red-on, #c0392b));
}
.incus-tile-running {
  color: var(--success, var(--green-on, #27ae60));
}
.incus-tile-stopped {
  color: var(--text-muted, var(--secondary, #888));
}
.incus-tile-other {
  color: var(--warning, var(--orange-on, #c6a36b));
}
</style>
