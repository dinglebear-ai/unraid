<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { Badge, Button, HelpText, Input, Label, Select, Switch } from "./components/ui";
import { SECTIONS, type FieldDef, type Section } from "./fields";
import LogView from "./LogView.vue";
import {
  checkUpdate,
  fetchStats,
  loadConfig,
  resetServer,
  revealSecret,
  saveConfig,
  serviceAction,
  updateServer,
  type ConfigPayload,
  type ServiceOp,
} from "./lib/config-client";

type Tab = "dashboard" | "settings";
const tab = ref<Tab>("dashboard");

const payload = ref<ConfigPayload | null>(null);
const form = reactive<Record<string, string>>({});
const secretEdits = reactive<
  Record<string, { value: string; clear: boolean; show: boolean; original: string | null }>
>({});
const loading = ref(true);
const saving = ref(false);
const busy = ref(false);
const error = ref("");
const savedFlash = ref(false);
const copied = ref(false);
let statsTimer: ReturnType<typeof setInterval> | null = null;
let statsBusy = false;
let statFails = 0;
const statsStale = ref(false);
const latestVersion = ref("");
const checkingUpdate = ref(false);
const updating = ref(false);
const copiedConfig = ref(false);
const initialSnapshot = ref(""); // form state at last load, for dirty detection
const cpuHist = ref<number[]>([]); // rolling samples for sparklines
const memHist = ref<number[]>([]);
const gateOpen = reactive<Record<string, boolean>>({}); // opted-in gated sections
const TABS: Tab[] = ["dashboard", "settings"];

const secretKeys = SECTIONS.flatMap((s) => s.fields)
  .filter((f) => f.kind === "secret")
  .map((f) => f.key);

function hydrate(p: ConfigPayload) {
  payload.value = p;
  for (const section of SECTIONS) {
    for (const f of section.fields) {
      if (f.kind === "secret") {
        if (!secretEdits[f.key]) {
          secretEdits[f.key] = { value: "", clear: false, show: false, original: null };
        } else {
          secretEdits[f.key].value = "";
          secretEdits[f.key].clear = false;
          secretEdits[f.key].show = false;
          secretEdits[f.key].original = null;
        }
      } else {
        form[f.key] = String(p.config[f.key] ?? "");
      }
    }
  }
  initialSnapshot.value = JSON.stringify(form);
}

function secretConfigured(key: string): boolean {
  return Boolean(payload.value?.config[`${key}_configured`]);
}

// ── Dirty tracking + validation ───────────────────────────────────────────
const dirty = computed(() => {
  // Before the first successful load, form is {} and the snapshot is "" — that
  // mismatch would spuriously read as dirty (and enable Apply on an empty form).
  if (!payload.value) return false;
  if (JSON.stringify(form) !== initialSnapshot.value) return true;
  return secretKeys.some((k) => {
    const e = secretEdits[k];
    return Boolean(e && (e.clear || (e.value !== "" && e.value !== e.original)));
  });
});

const URL_KEYS = new Set(["UNRAID_API_URL", "UNRAID_MCP_GOOGLE_BASE_URL"]);
function fieldError(key: string): string {
  const v = form[key] ?? "";
  if (v === "") return "";
  if (key === "UNRAID_MCP_PORT") {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 65535) return "Port must be 1–65535";
  }
  if (URL_KEYS.has(key) && !/^https?:\/\/.+/i.test(v)) return "Must start with http:// or https://";
  return "";
}
// Only validate sections whose fields are actually visible — otherwise an
// invalid value inside a collapsed/gated section could disable Apply globally
// with no error text on screen to explain why.
const hasErrors = computed(() =>
  SECTIONS.some((s) => sectionShowsFields(s) && s.fields.some((f) => fieldError(f.key) !== "")),
);

// ── Google OAuth gate: keep the section compact until opted in ─────────────
const oauthConfigured = computed(
  () => Boolean(form.UNRAID_MCP_GOOGLE_CLIENT_ID) || secretConfigured("UNRAID_MCP_GOOGLE_CLIENT_SECRET"),
);
function sectionShowsFields(section: Section): boolean {
  if (!section.gated) return true;
  return Boolean(gateOpen[section.title]) || oauthConfigured.value;
}

// ── Sparklines: normalise a rolling series to a 100×24 polyline ────────────
function sparkPoints(hist: number[]): string {
  if (hist.length < 2) return "";
  const max = Math.max(...hist, 1);
  const n = hist.length;
  return hist.map((v, i) => `${(i / (n - 1)) * 100},${23 - (v / max) * 21}`).join(" ");
}

const apiKeyMissing = computed(() => {
  if (!payload.value) return false;
  const edit = secretEdits.UNRAID_API_KEY;
  if (edit?.value && !edit.clear) return false; // a key was typed but not yet saved
  return !secretConfigured("UNRAID_API_KEY");
});

const service = computed(() => payload.value?.service ?? { enabled: false, running: false });
const tailscale = computed(
  () => payload.value?.tailscale ?? { available: false, dnsName: "", serveActive: false },
);
const version = computed(() => payload.value?.version ?? { installed: "unknown", overlay: false });
const proc = computed(() => payload.value?.process ?? { pid: 0, cpu: 0, memMB: 0, uptime: 0 });
const updateAvailable = computed(() => {
  const l = latestVersion.value.replace(/^v/, "");
  return l !== "" && l !== version.value.installed;
});

const uptimeText = computed(() => {
  const s = proc.value.uptime;
  if (!s || !service.value.running) return "—";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
});

const endpoint = computed(() => {
  if (form.UNRAID_MCP_TRANSPORT === "stdio") return "";
  const port = form.UNRAID_MCP_PORT || "6970";
  if (boolVal("UNRAID_MCP_TAILSCALE_SERVE") && tailscale.value.dnsName) {
    return `https://${tailscale.value.dnsName}:${port}/mcp`;
  }
  const host =
    !form.UNRAID_MCP_HOST || form.UNRAID_MCP_HOST === "0.0.0.0"
      ? window.location.hostname
      : form.UNRAID_MCP_HOST;
  return `http://${host}:${port}/mcp`;
});

async function copyEndpoint() {
  if (!endpoint.value) return;
  try {
    await navigator.clipboard.writeText(endpoint.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    /* clipboard unavailable over plain http */
  }
}

/** Copy a ready-to-paste MCP client config (mcpServers block) with the token. */
async function copyConfig() {
  if (!endpoint.value) return;
  let token = "<your bearer token>";
  // Prefer an unsaved edit so the copied config matches what's in the field,
  // not the last-persisted value.
  const edit = secretEdits.UNRAID_MCP_BEARER_TOKEN;
  if (edit?.value && !edit.clear) {
    token = edit.value;
  } else if (!edit?.clear && secretConfigured("UNRAID_MCP_BEARER_TOKEN")) {
    try {
      token = await revealSecret("UNRAID_MCP_BEARER_TOKEN");
    } catch {
      /* fall back to the placeholder */
    }
  }
  const cfg = {
    mcpServers: {
      unraid: { url: endpoint.value, headers: { Authorization: `Bearer ${token}` } },
    },
  };
  try {
    await navigator.clipboard.writeText(JSON.stringify(cfg, null, 2));
    copiedConfig.value = true;
    setTimeout(() => (copiedConfig.value = false), 1800);
  } catch {
    /* clipboard unavailable over plain http */
  }
}

function boolVal(key: string): boolean {
  return (form[key] ?? "").toLowerCase() === "true";
}
function setBool(key: string, v: boolean) {
  form[key] = v ? "true" : "false";
}
function fieldDisabled(field: FieldDef): boolean {
  return field.key === "UNRAID_MCP_TAILSCALE_SERVE" && !tailscale.value.available;
}

async function run(fn: () => Promise<ConfigPayload>) {
  error.value = "";
  try {
    hydrate(await fn());
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function apply() {
  saving.value = true;
  const changes: Record<string, string> = { ...form };
  for (const key of secretKeys) {
    const edit = secretEdits[key];
    if (edit?.clear) changes[key] = "";
    else if (edit?.value && edit.value !== edit.original) changes[key] = edit.value;
  }
  await run(() => saveConfig(changes));
  saving.value = false;
  if (!error.value) {
    savedFlash.value = true;
    setTimeout(() => (savedFlash.value = false), 2500);
  }
}

async function toggleSecret(key: string) {
  const edit = secretEdits[key];
  if (!edit) return;
  if (edit.show) {
    edit.show = false;
    if (edit.value === edit.original) {
      edit.value = "";
      edit.original = null;
    }
    return;
  }
  if (!edit.value && secretConfigured(key)) {
    try {
      const v = await revealSecret(key);
      edit.value = v;
      edit.original = v;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      return;
    }
  }
  edit.show = true;
}

async function svc(op: ServiceOp) {
  busy.value = true;
  await run(() => serviceAction(op));
  busy.value = false;
}

async function doCheckUpdate() {
  checkingUpdate.value = true;
  error.value = "";
  try {
    latestVersion.value = await checkUpdate();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
  checkingUpdate.value = false;
}
async function doUpdate() {
  updating.value = true;
  await run(() => updateServer(latestVersion.value.replace(/^v/, "")));
  updating.value = false;
}
async function doReset() {
  updating.value = true;
  await run(() => resetServer());
  updating.value = false;
}

/** Poll cheap process stats while the dashboard is visible. */
async function pollStats() {
  if (statsBusy) return; // drop overlapping ticks
  statsBusy = true;
  try {
    const s = await fetchStats();
    if (payload.value) {
      payload.value.service = s.service;
      if (s.process) payload.value.process = s.process;
    }
    if (s.process && s.service.running) {
      cpuHist.value = [...cpuHist.value, s.process.cpu].slice(-40);
      memHist.value = [...memHist.value, s.process.memMB].slice(-40);
    } else if (!s.service.running) {
      // Drop history on stop so a later restart doesn't draw a line bridging
      // the gap as if it were a continuous trend.
      cpuHist.value = [];
      memHist.value = [];
    }
    statFails = 0;
    statsStale.value = false;
  } catch {
    // A single miss is a blip; after a few, mark the tiles stale so they stop
    // asserting live values the poll can no longer verify.
    if (++statFails >= 3) statsStale.value = true;
  } finally {
    statsBusy = false;
  }
}
function setStatsPolling(on: boolean) {
  if (statsTimer) {
    clearInterval(statsTimer);
    statsTimer = null;
  }
  if (on) statsTimer = setInterval(pollStats, 3000);
}

function switchTab(t: Tab) {
  // Guard against silently discarding edits (Apply restarts the service).
  if (tab.value === "settings" && t !== "settings" && dirty.value && payload.value) {
    if (!window.confirm("Discard unsaved settings changes?")) return;
    hydrate(payload.value); // revert form to last-loaded config
  }
  tab.value = t;
  setStatsPolling(t === "dashboard");
}

function onTabKey(e: KeyboardEvent, current: Tab) {
  const i = TABS.indexOf(current);
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    switchTab(TABS[(i + 1) % TABS.length]);
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    switchTab(TABS[(i + TABS.length - 1) % TABS.length]);
  }
}

onMounted(async () => {
  await run(() => loadConfig());
  loading.value = false;
  void doCheckUpdate();
  setStatsPolling(true);
});
onBeforeUnmount(() => {
  setStatsPolling(false);
});
</script>

<template>
  <div class="unapi @container w-full text-foreground flex flex-col gap-3 pb-4">
    <!-- Tab bar -->
    <div role="tablist" aria-label="Unraid MCP sections" class="flex items-center gap-1 border-b border-border">
      <button
        v-for="t in TABS"
        :id="`tab-${t}`"
        :key="t"
        type="button"
        role="tab"
        :aria-selected="tab === t"
        :tabindex="tab === t ? 0 : -1"
        class="px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-sm flex items-center gap-1.5"
        :class="tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="switchTab(t)"
        @keydown="onTabKey($event, t)"
      >
        {{ t }}
        <span v-if="t === 'settings' && dirty" class="h-1.5 w-1.5 rounded-full bg-primary" title="Unsaved changes"></span>
      </button>
    </div>

    <div v-if="error" role="alert" class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {{ error }}
    </div>

    <div v-if="loading" class="text-sm text-muted-foreground">Loading…</div>

    <!-- ── DASHBOARD (status cards + live log, one viewport) ─────── -->
    <template v-else-if="tab === 'dashboard'">
      <div
        class="flex flex-col @min-[900px]:flex-row gap-3"
        style="height: calc(100vh - 150px); min-height: 420px"
      >
        <!-- LEFT: status cards (scroll internally if short viewport) -->
        <div class="flex flex-col gap-3 overflow-auto @min-[900px]:w-[430px] @min-[900px]:shrink-0">
          <section class="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-semibold">Server</h3>
              <Badge :variant="service.running ? 'green' : 'gray'" size="sm">
                {{ service.running ? "Running" : "Stopped" }}
              </Badge>
              <Badge v-if="boolVal('UNRAID_MCP_TAILSCALE_SERVE') && tailscale.available" variant="orange" size="sm">tailnet</Badge>
            </div>
            <div class="flex items-center gap-2">
              <Button size="sm" variant="outline" :disabled="busy" @click="svc(service.running ? 'stop' : 'start')">
                {{ service.running ? "Stop" : "Start" }}
              </Button>
              <Button size="sm" variant="outline" :disabled="busy || !service.running" @click="svc('restart')">Restart</Button>
              <div class="ms-auto flex items-center gap-1.5" :title="service.enabled ? 'Starts with the array' : 'Does not start with the array'">
                <Switch :model-value="service.enabled" :disabled="busy" @update:model-value="svc($event ? 'enable' : 'disable')" />
                <span class="text-sm text-muted-foreground">Autostart</span>
              </div>
            </div>
          </section>

          <section class="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
            <h3 class="text-base font-semibold">Connection</h3>
            <button
              v-if="endpoint"
              type="button"
              class="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-sm text-muted-foreground hover:text-foreground hover:border-primary/60 transition-colors w-full"
              :title="copied ? 'Copied' : 'Copy endpoint'"
              @click="copyEndpoint"
            >
              <span class="truncate flex-1 text-start">{{ endpoint }}</span>
              <span class="text-xs uppercase tracking-wide shrink-0" :class="copied ? 'text-unraid-green-500' : 'text-primary'">{{ copied ? "copied" : "copy" }}</span>
            </button>
            <span v-else class="text-sm text-muted-foreground">stdio transport — no network endpoint</span>
            <div v-if="endpoint" class="flex items-center gap-2">
              <Button size="sm" variant="outline" @click="copyConfig">
                {{ copiedConfig ? "Config copied" : "Copy MCP client config" }}
              </Button>
              <span class="text-xs text-muted-foreground">mcpServers block with your bearer token, ready to paste</span>
            </div>
            <p class="text-xs text-muted-foreground">
              Transport <span class="font-mono text-foreground">{{ form.UNRAID_MCP_TRANSPORT }}</span>
            </p>
          </section>

          <section class="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
            <h3 class="text-base font-semibold">Resources</h3>
            <div class="grid grid-cols-3 gap-2">
              <div class="rounded-md bg-background border border-border p-2 text-center flex flex-col gap-1">
                <div class="text-lg font-semibold tabular-nums">{{ service.running ? proc.cpu.toFixed(1) + "%" : "—" }}</div>
                <svg v-if="cpuHist.length > 1" viewBox="0 0 100 24" preserveAspectRatio="none" class="h-5 w-full">
                  <polyline :points="sparkPoints(cpuHist)" fill="none" stroke="#29b6f6" stroke-width="1.5" vector-effect="non-scaling-stroke" />
                </svg>
                <div class="text-xs text-muted-foreground">CPU</div>
              </div>
              <div class="rounded-md bg-background border border-border p-2 text-center flex flex-col gap-1">
                <div class="text-lg font-semibold tabular-nums">{{ service.running ? proc.memMB.toFixed(0) + " MB" : "—" }}</div>
                <svg v-if="memHist.length > 1" viewBox="0 0 100 24" preserveAspectRatio="none" class="h-5 w-full">
                  <polyline :points="sparkPoints(memHist)" fill="none" stroke="#a78bfa" stroke-width="1.5" vector-effect="non-scaling-stroke" />
                </svg>
                <div class="text-xs text-muted-foreground">Memory</div>
              </div>
              <div class="rounded-md bg-background border border-border p-2 text-center flex flex-col justify-center">
                <div class="text-lg font-semibold tabular-nums">{{ uptimeText }}</div>
                <div class="text-xs text-muted-foreground">Uptime</div>
              </div>
            </div>
            <p class="text-xs text-muted-foreground">
              PID {{ proc.pid || "—" }} ·
              <span :style="statsStale ? 'color:#c6a36b' : ''">{{ statsStale ? "stale — can't reach server" : "updates live" }}</span>
            </p>
          </section>

          <section class="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-semibold">Version</h3>
              <span class="font-mono text-sm">{{ version.installed }}</span>
              <Badge v-if="version.overlay" variant="gray" size="sm">updated</Badge>
              <Badge v-if="updateAvailable" variant="orange" size="sm">update available</Badge>
            </div>
            <p v-if="latestVersion" class="text-xs text-muted-foreground">
              latest release <span class="font-mono text-foreground">{{ latestVersion.replace(/^v/, "") }}</span>
            </p>
            <div class="flex items-center gap-2">
              <Button size="sm" variant="ghost" class="px-2" :disabled="checkingUpdate || updating" @click="doCheckUpdate">
                {{ checkingUpdate ? "Checking…" : "Check" }}
              </Button>
              <Button v-if="updateAvailable" size="sm" :disabled="updating" @click="doUpdate">
                {{ updating ? "Updating…" : `Update to ${latestVersion.replace(/^v/, "")}` }}
              </Button>
              <Button v-if="version.overlay" size="sm" variant="outline" :disabled="updating" @click="doReset">Revert to bundled</Button>
            </div>
          </section>
        </div>

        <!-- RIGHT: live log fills the remaining width + full height -->
        <LogView class="flex-1 min-w-0 min-h-0" />
      </div>
    </template>

    <!-- ── SETTINGS ──────────────────────────────────────────────── -->
    <template v-else>
      <div
        v-if="apiKeyMissing"
        class="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm"
      >
        No Unraid API key is set — the server can't reach the Unraid API. Auto-provisioning may have
        failed at install; generate one with
        <span class="font-mono">unraid-api apikey --create --name unraidmcp -r admin --json</span>
        and paste it below.
      </div>

      <div class="flex items-center justify-end gap-3">
        <span v-if="savedFlash" class="text-sm text-unraid-green-500">Saved — restarted</span>
        <span v-else-if="dirty" class="text-sm text-muted-foreground">Unsaved changes</span>
        <Button size="sm" :disabled="saving || !dirty || hasErrors" @click="apply">
          {{ saving ? "Applying…" : "Apply" }}
        </Button>
      </div>

      <!-- Three independent columns so each stacks freely (no row-alignment
           gaps); Google OAuth lives in the third column. -->
      <div class="grid gap-3 @min-[700px]:grid-cols-2 @min-[1100px]:grid-cols-3 items-start">
        <div v-for="col in (['a', 'b', 'c'] as const)" :key="col" class="flex flex-col gap-3 min-w-0">
          <component
            :is="section.collapsed ? 'details' : 'section'"
            v-for="section in SECTIONS.filter((s) => s.col === col)"
            :key="section.title"
            class="rounded-lg border border-border bg-card p-3 flex flex-col gap-2 min-w-0"
          >
            <summary
              v-if="section.collapsed"
              class="cursor-pointer select-none text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground marker:text-primary"
            >
              {{ section.title }}
            </summary>
            <h3 v-else class="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">
              {{ section.title }}
            </h3>

            <!-- Gated section (Google OAuth): compact until enabled. -->
            <div v-if="!sectionShowsFields(section)" class="flex items-center gap-2 mt-1">
              <Switch :model-value="false" @update:model-value="gateOpen[section.title] = $event" />
              <span class="text-sm text-muted-foreground">Enable — optional, for claude.ai web connector</span>
            </div>

            <div
              v-if="sectionShowsFields(section)"
              class="grid grid-cols-[9.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2"
              :class="section.collapsed ? 'mt-2' : ''"
            >
              <template v-for="field in section.fields" :key="field.key">
                <Label :for="field.key" class="text-sm self-center leading-tight">{{ field.label }}</Label>

                <div v-if="field.kind === 'secret'" class="flex items-center gap-1.5 min-w-0">
                  <Input
                    :id="field.key"
                    v-model="secretEdits[field.key].value"
                    :type="secretEdits[field.key].show ? 'text' : 'password'"
                    class="h-8 font-mono text-sm flex-1 min-w-0"
                    :placeholder="secretConfigured(field.key) ? '•••••• configured' : 'not set'"
                    :disabled="secretEdits[field.key].clear"
                    autocomplete="new-password"
                    data-1p-ignore
                    data-lpignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                  />
                  <Button size="sm" variant="ghost" class="px-2" @click="toggleSecret(field.key)">
                    {{ secretEdits[field.key].show ? "Hide" : "Show" }}
                  </Button>
                  <Button
                    v-if="secretConfigured(field.key)"
                    size="sm"
                    :variant="secretEdits[field.key].clear ? 'destructive' : 'ghost'"
                    class="px-2"
                    @click="secretEdits[field.key].clear = !secretEdits[field.key].clear"
                  >
                    {{ secretEdits[field.key].clear ? "Will clear" : "Clear" }}
                  </Button>
                </div>

                <div v-else-if="field.kind === 'toggle'" class="flex items-center gap-2">
                  <Switch :id="field.key" :model-value="boolVal(field.key)" :disabled="fieldDisabled(field)" @update:model-value="setBool(field.key, $event)" />
                  <span v-if="fieldDisabled(field)" class="text-xs text-muted-foreground">Tailscale plugin not detected</span>
                </div>

                <Select v-else-if="field.kind === 'select'" :id="field.key" v-model="form[field.key]" class="[&>select]:h-8 [&>select]:py-1">
                  <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
                </Select>

                <Input
                  v-else
                  :id="field.key"
                  v-model="form[field.key]"
                  :type="field.kind === 'number' ? 'number' : 'text'"
                  class="h-8 text-sm"
                  :class="field.mono ? 'font-mono' : ''"
                  :placeholder="field.placeholder ?? ''"
                />

                <div class="col-span-2">
                  <p v-if="fieldError(field.key)" class="text-xs text-destructive mb-0.5">{{ fieldError(field.key) }}</p>
                  <HelpText>{{ field.help }}</HelpText>
                </div>
              </template>
            </div>
          </component>
        </div>
      </div>

      <p v-if="payload && Object.keys(payload.extra).length" class="text-xs text-muted-foreground px-1">
        Also in <span class="font-mono">/boot/config/plugins/unraid-mcp/.env</span> (preserved on save):
        <span class="font-mono">{{ Object.keys(payload.extra).join(", ") }}</span>
      </p>
    </template>
  </div>
</template>
