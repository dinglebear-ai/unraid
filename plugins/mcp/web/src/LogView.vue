<script setup lang="ts">
/**
 * Server log viewer — a self-contained Aurora-dark terminal panel. It owns its
 * own palette (Aurora dark tokens, https://aurora.tootie.tv) and stays dark
 * regardless of the surrounding Unraid webGUI theme, the way a terminal should.
 * Lines are tokenized and colorized by severity, timestamp, HTTP status, and
 * logger name.
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Button, Switch } from "./components/ui";
import { fetchLogs } from "./lib/config-client";

const raw = ref("");
const logError = ref("");
const auto = ref(true); // Follow on by default
const loading = ref(false);
const lineCount = ref(300);
const search = ref("");
const minLevel = ref(""); // "" = all; else DEBUG|INFO|WARNING|ERROR
const LEVEL_RANK: Record<string, number> = {
  DEBUG: 10,
  INFO: 20,
  NOTICE: 20,
  WARNING: 30,
  WARN: 30,
  ERROR: 40,
  CRITICAL: 50,
  FATAL: 50,
};
const pane = ref<HTMLElement | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;
let fails = 0;
const MAX_FOLLOW_FAILS = 5;

// Aurora dark tokens (registry/aurora/styles/aurora.css) + CLI violet.
const C = {
  ts: "#7c93a1",
  msg: "#e6f4fb",
  debug: "#6f8492",
  info: "#72c8f5",
  notice: "#67cbfa",
  warn: "#c6a36b",
  error: "#c78490",
  critical: "#d9909a",
  module: "#a78bfa",
  ok: "#7dd3c7",
};

type Level = "DEBUG" | "INFO" | "NOTICE" | "WARNING" | "WARN" | "ERROR" | "CRITICAL" | "FATAL";
const LEVEL_COLOR: Record<Level, string> = {
  DEBUG: C.debug,
  INFO: C.info,
  NOTICE: C.notice,
  WARNING: C.warn,
  WARN: C.warn,
  ERROR: C.error,
  CRITICAL: C.critical,
  FATAL: C.critical,
};
const BOLD: ReadonlySet<string> = new Set(["ERROR", "CRITICAL", "FATAL"]);

interface Seg {
  t: string;
  c?: string;
  b?: boolean;
}

// One combined scanner with named groups; classify each match by which fired.
// The http-status branch captures its `"<space>` prefix separately (emitted as
// message text) instead of a lookbehind, so the pattern parses on older
// engines too.
const TOKEN_RE =
  /(?<ts>\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?)|\b(?<lvl>DEBUG|INFO|NOTICE|WARNING|WARN|ERROR|CRITICAL|FATAL)\b|(?<pre>"\s+)(?<status>[1-5]\d{2})\b|\b(?<mod>(?:unraid_mcp|rc\.unraid-mcp|uvicorn|fastmcp)[\w.-]*)/g;

function tokenize(line: string): Seg[] {
  const segs: Seg[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(line)) !== null) {
    const g = m.groups!;
    if (m.index > last) segs.push({ t: line.slice(last, m.index), c: C.msg });
    if (g.ts) {
      segs.push({ t: g.ts, c: C.ts });
    } else if (g.lvl) {
      segs.push({ t: g.lvl, c: LEVEL_COLOR[g.lvl as Level], b: BOLD.has(g.lvl) });
    } else if (g.status) {
      segs.push({ t: g.pre, c: C.msg }); // the "<space> prefix, uncolored
      const code = Number(g.status);
      const col = code < 300 ? C.ok : code < 400 ? C.info : code < 500 ? C.warn : C.error;
      segs.push({ t: g.status, c: col, b: code >= 500 });
    } else if (g.mod) {
      segs.push({ t: g.mod, c: C.module });
    }
    last = m.index + m[0].length;
  }
  if (last < line.length) segs.push({ t: line.slice(last), c: C.msg });
  if (segs.length === 0) segs.push({ t: line || " ", c: C.msg });
  return segs;
}

/** Severity of a whole line, for the left accent rail. */
function lineLevel(line: string): string {
  const m = line.match(/\b(DEBUG|INFO|NOTICE|WARNING|WARN|ERROR|CRITICAL|FATAL)\b/);
  return m ? LEVEL_COLOR[m[1] as Level] : "transparent";
}

/** Numeric severity of a line for the min-level filter (0 = none detected). */
function lineRank(line: string): number {
  const m = line.match(/\b(DEBUG|INFO|NOTICE|WARNING|WARN|ERROR|CRITICAL|FATAL)\b/);
  return m ? (LEVEL_RANK[m[1]] ?? 0) : 0;
}

const lines = computed(() => {
  const text = raw.value.replace(/\n+$/, "");
  if (!text) return [];
  const q = search.value.trim().toLowerCase();
  const floor = minLevel.value ? LEVEL_RANK[minLevel.value] : 0;
  return text
    .split("\n")
    .filter((l) => {
      if (q && !l.toLowerCase().includes(q)) return false;
      // Level filter keeps matching lines plus continuation lines (rank 0),
      // so a wrapped multi-line record isn't chopped mid-entry.
      if (floor && lineRank(l) !== 0 && lineRank(l) < floor) return false;
      return true;
    })
    .map((l) => ({ rail: lineLevel(l), segs: tokenize(l) }));
});

// Count the same population `lines` splits from (no Boolean filter), so the
// filtered "showing N of M" can never report N > M.
const totalLines = computed(() => {
  const text = raw.value.replace(/\n+$/, "");
  return text ? text.split("\n").length : 0;
});

async function refresh(scroll = true) {
  // Drop overlapping ticks: only one request is ever in flight, which also
  // rules out an older response clobbering a newer one. The next Follow tick
  // retries in 3s.
  if (loading.value) return;
  loading.value = true;
  try {
    raw.value = (await fetchLogs(lineCount.value)) || "(log is empty)";
    logError.value = "";
    fails = 0;
  } catch (e) {
    // Keep the last-good logs on screen; surface the failure as a banner.
    logError.value = `failed to fetch log: ${e instanceof Error ? e.message : e}`;
    // Stop hammering a dead endpoint (expired session / service down) forever.
    if (auto.value && ++fails >= MAX_FOLLOW_FAILS) setAuto(false);
  } finally {
    loading.value = false;
  }
  if (scroll && pane.value) {
    const el = pane.value;
    requestAnimationFrame(() => (el.scrollTop = el.scrollHeight));
  }
}

function setAuto(on: boolean) {
  auto.value = on;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (on) {
    fails = 0;
    void refresh();
    timer = setInterval(() => void refresh(), 3000);
  }
}

onMounted(() => setAuto(true)); // start following immediately
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="flex flex-col gap-2 rounded-lg border p-3 h-full" style="background: #07131c; border-color: #1d3d4e; min-height: 320px">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-[11px] font-semibold tracking-[0.08em] uppercase" style="color: #a7bcc9">Server log</span>
        <span class="font-mono text-xs" style="color: #7c93a1">/var/log/unraid-mcp/server.log</span>
      </div>
      <div class="flex items-center gap-3">
        <input
          v-model="search"
          type="search"
          placeholder="filter…"
          class="h-7 w-40 rounded-md border bg-transparent px-2 text-xs"
          style="border-color: #1d3d4e; color: #e6f4fb"
        />
        <select
          v-model="minLevel"
          class="h-7 rounded-md border bg-transparent px-1.5 text-xs"
          style="border-color: #1d3d4e; color: #e6f4fb"
          title="Minimum severity"
        >
          <option value="">all levels</option>
          <option value="INFO">info+</option>
          <option value="WARNING">warning+</option>
          <option value="ERROR">error+</option>
        </select>
        <label class="flex items-center gap-1.5 text-xs" style="color: #a7bcc9">
          lines
          <select
            v-model.number="lineCount"
            class="h-7 rounded-md border bg-transparent px-1.5 text-xs"
            style="border-color: #1d3d4e; color: #e6f4fb"
            @change="refresh()"
          >
            <option value="100">100</option>
            <option value="300">300</option>
            <option value="1000">1000</option>
          </select>
        </label>
        <div class="flex items-center gap-1.5">
          <Switch :model-value="auto" @update:model-value="setAuto($event)" />
          <span class="text-xs" style="color: #a7bcc9">Follow</span>
        </div>
        <Button size="sm" variant="ghost" class="px-2" :disabled="loading" @click="refresh()">
          {{ loading ? "…" : "Refresh" }}
        </Button>
      </div>
    </div>

    <div
      v-if="logError"
      role="alert"
      class="rounded-md px-2.5 py-1.5 text-xs"
      style="background: #2a1720; border: 1px solid #6e3a46; color: #d9909a"
    >
      {{ logError }}
    </div>

    <div
      ref="pane"
      class="flex-1 min-h-0 overflow-auto rounded-md font-mono text-xs leading-relaxed"
      style="background: #07111a; border: 1px solid #142a37"
    >
      <div
        v-for="(ln, i) in lines"
        :key="i"
        class="flex gap-2 px-2 py-[1px] whitespace-pre-wrap break-words hover:bg-[#0c1a24]"
        style="border-left: 2px solid"
        :style="{ borderLeftColor: ln.rail }"
      >
        <code class="flex-1">
          <span v-for="(s, j) in ln.segs" :key="j" :style="{ color: s.c, fontWeight: s.b ? 600 : 400 }">{{ s.t }}</span>
        </code>
      </div>
      <div v-if="lines.length === 0" class="px-2 py-1" style="color: #7c93a1">
        {{ totalLines === 0 ? "(log is empty)" : "no lines match the filter" }}
      </div>
    </div>

    <p v-if="search || minLevel" class="text-xs" style="color: #7c93a1">
      showing {{ lines.length }} of {{ totalLines }} lines
    </p>
  </div>
</template>
