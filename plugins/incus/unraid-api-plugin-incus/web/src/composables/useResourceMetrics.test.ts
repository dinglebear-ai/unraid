import { ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { useResourceMetrics } from "./useResourceMetrics";
import type { Jail } from "../types";

describe("useResourceMetrics", () => {
  it("computes deltas from counters beyond Number.MAX_SAFE_INTEGER", () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(1_000).mockReturnValueOnce(2_000);
    const jails = ref<Jail[]>([{ name: "agent", status: "Running", cpuUsageNs: "90071992547409930" }]);
    const metrics = useResourceMetrics(jails, () => "2");
    metrics.updateCpuSamplesAndHistory();
    jails.value[0].cpuUsageNs = "90071993547409930";
    metrics.updateCpuSamplesAndHistory();
    expect(metrics.cpuRateLabel(jails.value[0])).toBe("100%");
    expect(metrics.cpuRatePct(jails.value[0])).toBe(50);
  });
});
