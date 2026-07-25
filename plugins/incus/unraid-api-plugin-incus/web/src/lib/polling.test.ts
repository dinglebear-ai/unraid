import { describe, expect, it, vi } from "vitest";
import { JOB_POLL_INTERVAL_MS, startPolling } from "./polling";

describe("startPolling", () => {
  it("keeps background job polling at a bounded two-second cadence", () => {
    expect(JOB_POLL_INTERVAL_MS).toBe(2_000);
  });
  it("does not overlap slow executions", async () => {
    vi.useFakeTimers();
    let resolveTask!: () => void;
    const task = vi.fn(() => new Promise<void>((resolve) => { resolveTask = resolve; }));
    const poller = startPolling(task, 100, { immediate: true });

    await vi.advanceTimersByTimeAsync(500);
    expect(task).toHaveBeenCalledTimes(1);

    resolveTask();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(99);
    expect(task).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(task).toHaveBeenCalledTimes(2);

    poller.stop();
    vi.useRealTimers();
  });

  it("stops future schedules", async () => {
    vi.useFakeTimers();
    const task = vi.fn(async () => {});
    const poller = startPolling(task, 100);
    poller.stop();
    await vi.advanceTimersByTimeAsync(500);
    expect(task).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("invalidates an in-flight task when stopped", async () => {
    let resolveTask!: () => void;
    let activeAfterAwait = true;
    const poller = startPolling(async (context) => {
      await new Promise<void>((resolve) => { resolveTask = resolve; });
      activeAfterAwait = context.isActive();
    }, 100, { immediate: true });

    poller.stop();
    resolveTask();
    await Promise.resolve();
    await Promise.resolve();
    expect(activeAfterAwait).toBe(false);
  });
});
