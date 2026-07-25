export interface PollController {
  stop(): void;
  trigger(): Promise<void>;
}

export const JOB_POLL_INTERVAL_MS = 2_000;

export interface PollContext {
  readonly signal: AbortSignal;
  isActive(): boolean;
}

/**
 * Poll an async task without ever overlapping invocations. The next timer is
 * scheduled only after the current task settles, so a slow API cannot create
 * an ever-growing queue of stale requests.
 */
export function startPolling(
  task: (context: PollContext) => Promise<void>,
  intervalMs: number,
  options: { immediate?: boolean; onError?: (error: unknown) => void } = {}
): PollController {
  let stopped = false;
  let inFlight: Promise<void> | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const abortController = new AbortController();
  const visibilityTarget = typeof document === "undefined" ? null : document;
  const context: PollContext = {
    signal: abortController.signal,
    isActive: () => !stopped && !abortController.signal.aborted,
  };

  const schedule = () => {
    if (stopped) return;
    timer = setTimeout(() => void run(), intervalMs);
  };

  const run = async () => {
    if (stopped) return;
    if (visibilityTarget?.hidden) {
      schedule();
      return;
    }
    if (inFlight) return inFlight;
    inFlight = task(context).catch((error) => {
      if (context.isActive()) options.onError?.(error);
    }).finally(() => {
      inFlight = null;
      schedule();
    });
    return inFlight;
  };

  if (options.immediate) void run();
  else schedule();

  const onVisibilityChange = () => {
    if (!visibilityTarget?.hidden && !stopped && !inFlight) {
      if (timer) clearTimeout(timer);
      timer = null;
      void run();
    }
  };
  visibilityTarget?.addEventListener("visibilitychange", onVisibilityChange);

  return {
    stop() {
      stopped = true;
      abortController.abort();
      if (timer) clearTimeout(timer);
      timer = null;
      visibilityTarget?.removeEventListener("visibilitychange", onVisibilityChange);
    },
    trigger: run,
  };
}
