<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { init, Terminal as GhosttyTerminal, FitAddon, type IDisposable } from "ghostty-web";
import { gql } from "../graphql-client";
import { subscribe } from "../graphql-ws-client";
import { Button } from "./ui";

const props = defineProps<{ jailName: string }>();
const emit = defineEmits<{ close: [] }>();

const START_MUTATION = `
  mutation($name: String!, $cols: Int!, $rows: Int!) { startJailExec(name: $name, cols: $cols, rows: $rows) }
`;
const INPUT_MUTATION = `
  mutation($sessionId: String!, $data: String!) { sendJailExecInput(sessionId: $sessionId, data: $data) }
`;
const RESIZE_MUTATION = `
  mutation($sessionId: String!, $cols: Int!, $rows: Int!) { resizeJailExec(sessionId: $sessionId, cols: $cols, rows: $rows) }
`;
const STOP_MUTATION = `mutation($sessionId: String!) { stopJailExec(sessionId: $sessionId) }`;
const OUTPUT_SUBSCRIPTION = `subscription($sessionId: String!) { jailExecOutput(sessionId: $sessionId) }`;

const containerEl = ref<HTMLDivElement | null>(null);
const dialogEl = ref<HTMLDivElement | null>(null);
const error = ref<string | null>(null);
const status = ref<"connecting" | "connected" | "disconnected">("connecting");
let transportErrorShown = false;

let term: GhosttyTerminal | null = null;
let fitAddon: FitAddon | null = null;
let sessionId: string | null = null;
let unsubscribe: (() => void) | null = null;
let onDataDisposable: IDisposable | null = null;
let onResizeDisposable: IDisposable | null = null;
let active = true;
let cleanedUp = false;
let previouslyFocused: HTMLElement | null = null;

/**
 * Canvas fillStyle/strokeStyle needs a resolved color, not a `var()`
 * reference — resolve the host page's Unraid tokens at runtime rather than
 * shipping a second palette that can leak into the light-DOM host page.
 */
function hostColor(name: string, fallback: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return fallback;
  return /^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%$/.test(raw) ? `hsl(${raw})` : raw;
}

function terminalTheme() {
  const background = hostColor("--background", "#111111");
  const foreground = hostColor("--foreground", "#f5f5f5");
  const accent = hostColor("--primary", "#ff8c2f");
  return {
    background,
    foreground,
    cursor: accent,
    selectionBackground: `color-mix(in srgb, ${accent} 22%, transparent)`,
    black: background,
    red: hostColor("--destructive", "#c0392b"),
    green: hostColor("--color-unraid-green", "#63a659"),
    yellow: hostColor("--color-yellow-accent", "#e9bf41"),
    blue: hostColor("--color-primary-500", "#ff8c2f"),
    magenta: "#c084fc",
    cyan: accent,
    white: foreground,
    brightBlack: hostColor("--muted-foreground", "#999999"),
    brightRed: "#ef6b6b",
    brightGreen: "#7db474",
    brightYellow: "#f0cf6a",
    brightBlue: "#fb923c",
    brightMagenta: "#d8b4fe",
    brightCyan: "#fdba74",
    brightWhite: "#ffffff",
  };
}

async function start() {
  if (!containerEl.value) return;

  // ghostty-web's WASM VT100 parser must be loaded once before any Terminal
  // is constructed — it's the same emulator core the native Ghostty app
  // uses, not a JS reimplementation like xterm.js.
  await init();
  if (!active || !containerEl.value) return;

  term = new GhosttyTerminal({
    cols: 80,
    rows: 24,
    fontSize: 13,
    fontFamily: "JetBrains Mono, IBM Plex Mono, ui-monospace, Menlo, monospace",
    theme: terminalTheme(),
  });

  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.open(containerEl.value);
  fitAddon.fit();
  // Built into FitAddon — sets up its own ResizeObserver and re-fits
  // automatically, so we don't need to manage one ourselves.
  fitAddon.observeResize();

  try {
    const data = await gql<{ startJailExec: string }>(START_MUTATION, {
      name: props.jailName,
      cols: term.cols,
      rows: term.rows,
    });
    sessionId = data.startJailExec;
    if (!active) {
      const orphanedSessionId = sessionId;
      sessionId = null;
      await gql(STOP_MUTATION, { sessionId: orphanedSessionId }).catch(() => {});
      disposeClientResources();
      return;
    }
  } catch (e) {
    if (!active) return;
    error.value = e instanceof Error ? e.message : String(e);
    status.value = "disconnected";
    return;
  }

  status.value = "connected";
  unsubscribe = subscribe<{ jailExecOutput: string }>(
    OUTPUT_SUBSCRIPTION,
    { sessionId },
    (data) => term?.write(data.jailExecOutput),
    (e) => {
      error.value = e instanceof Error ? e.message : String(e);
      status.value = "disconnected";
    }
  );

  onDataDisposable = term.onData((data) => {
    if (sessionId) void gql(INPUT_MUTATION, { sessionId, data }).catch(handleTransportError);
  });

  onResizeDisposable = term.onResize(({ cols, rows }) => {
    if (sessionId) void gql(RESIZE_MUTATION, { sessionId, cols, rows }).catch(handleTransportError);
  });
}

function handleTransportError(value: unknown) {
  if (transportErrorShown) return;
  transportErrorShown = true;
  error.value = value instanceof Error ? value.message : String(value);
  status.value = "disconnected";
}

async function stop() {
  active = false;
  if (cleanedUp) return;
  cleanedUp = true;
  const stoppingSessionId = sessionId;
  sessionId = null;
  disposeClientResources();
  if (stoppingSessionId) {
    await gql(STOP_MUTATION, { sessionId: stoppingSessionId }).catch(handleTransportError);
  }
}

function disposeClientResources() {
  onDataDisposable?.dispose();
  onResizeDisposable?.dispose();
  fitAddon?.dispose();
  unsubscribe?.();
  term?.dispose();
  onDataDisposable = null;
  onResizeDisposable = null;
  fitAddon = null;
  unsubscribe = null;
  term = null;
}

function handleDialogKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
    return;
  }
  if (event.key !== "Tab" || !dialogEl.value) return;
  const focusable = Array.from(dialogEl.value.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ));
  if (focusable.length === 0) {
    event.preventDefault();
    dialogEl.value.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable.at(-1)!;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

onMounted(async () => {
  active = true;
  previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  await nextTick();
  dialogEl.value?.focus();
  void start().catch(handleTransportError);
});
onBeforeUnmount(() => {
  void stop();
  previouslyFocused?.focus();
});

function close() {
  emit("close");
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <div
      ref="dialogEl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terminal-dialog-title"
      tabindex="-1"
      @keydown="handleDialogKeydown"
      class="flex w-[90vw] max-w-4xl flex-col overflow-hidden"
      style="
        border: 1px solid hsl(var(--border));
        border-radius: var(--radius);
        background: hsl(var(--background));
        box-shadow: 0 20px 38px rgba(0, 0, 0, 0.26);
      "
    >
      <!-- Title bar inherits the active Unraid host theme. -->
      <div
        class="flex shrink-0 items-center gap-2.5"
        style="
          height: 42px;
          padding: 0 14px;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--card));
        "
      >
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden="true" class="shrink-0 text-primary">
          <path d="M5 0L9 2.5L5 5L1 2.5Z" fill="currentColor" opacity="0.95" />
          <path d="M5 3L9 5.5L5 8L1 5.5Z" fill="currentColor" opacity="0.75" />
          <path d="M5 6L9 8.5L5 11L1 8.5Z" fill="currentColor" opacity="0.5" />
          <path d="M5 9L9 11.5L5 14L1 11.5Z" fill="currentColor" opacity="0.28" />
        </svg>
        <span
          id="terminal-dialog-title"
          class="min-w-0 flex-1 truncate text-muted-foreground font-mono text-xs font-medium"
        >
          {{ jailName }}
        </span>
        <span
          style="
            padding: 3px 7px;
            border: 1px solid hsl(var(--primary) / 0.35);
            border-radius: 4px;
            background: hsl(var(--primary) / 0.12);
            color: hsl(var(--foreground));
            font-family: ui-monospace, monospace;
            font-size: 10.5px;
            font-weight: 600;
          "
        >ghostty-web</span>
        <div class="ml-auto flex items-center gap-1.5 text-muted-foreground text-xs" aria-live="polite">
          <span
            style="width: 7px; height: 7px; border-radius: 999px"
            :style="{
              background: status === 'connected' ? 'var(--color-unraid-green, #63a659)' : status === 'connecting' ? 'var(--color-yellow-accent, #e9bf41)' : 'hsl(var(--destructive))',
            }"
          />
          <span>{{ status === "connected" ? "Connected" : status === "connecting" ? "Connecting…" : "Disconnected" }}</span>
        </div>
        <Button size="sm" variant="outline" @click="close">Close</Button>
      </div>

      <div
        v-if="error"
        role="alert"
        class="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive"
      >
        {{ error }}
      </div>

      <div class="bg-background p-4">
        <div ref="containerEl" class="h-[60vh] w-full overflow-hidden"></div>
      </div>
    </div>
  </div>
</template>
