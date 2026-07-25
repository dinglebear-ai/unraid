import { beforeEach, describe, expect, it, vi } from "vitest";
import { gql, isRetrySafeOperation } from "./graphql-client";

describe("GraphQL client retry policy", () => {
  beforeEach(() => {
    window.csrf_token = "csrf";
  });

  it("classifies only queries as replay-safe", () => {
    expect(isRetrySafeOperation("query { jails { name } }")).toBe(true);
    expect(isRetrySafeOperation("{ incusHealthy }")).toBe(true);
    expect(isRetrySafeOperation("mutation { deleteStoppedJails }")).toBe(false);
  });

  it("retries a query once after an HTTP transport failure", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { incusHealthy: true } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }));

    await expect(gql<{ incusHealthy: boolean }>("query { incusHealthy }")).resolves.toEqual({ incusHealthy: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("never replays a mutation after an ambiguous failure", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("response lost"));
    await expect(gql("mutation { deleteStoppedJails }")).rejects.toThrow("response lost");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
