import { afterEach, describe, it, expect, vi } from "vitest";
import {
  IncusPackageSearchService,
  localMatchScore,
  mergeRanked,
  type PackageSearchResult,
} from "./incus-package-search.service.js";

afterEach(() => vi.unstubAllGlobals());

describe("localMatchScore", () => {
  it("ranks an exact name match above a prefix match", () => {
    const exact = localMatchScore("curl", undefined, "curl");
    const prefix = localMatchScore("curl-extra", undefined, "curl");
    expect(exact).toBeGreaterThan(prefix);
  });

  it("ranks a prefix match above a word-boundary substring match", () => {
    const prefix = localMatchScore("curlish", undefined, "curl");
    const wordBoundary = localMatchScore("lib-curl-tools", undefined, "curl");
    expect(prefix).toBeGreaterThan(wordBoundary);
  });

  it("ranks a word-boundary substring match above a plain substring match", () => {
    const wordBoundary = localMatchScore("lib-curl-tools", undefined, "curl");
    // "libcurl4" contains "curl" but not at a word boundary (preceded by "lib" with no separator)
    const plainSubstring = localMatchScore("libcurl4", undefined, "curl");
    expect(wordBoundary).toBeGreaterThan(plainSubstring);
  });

  it("ranks a plain substring match above a description-only match", () => {
    const plainSubstring = localMatchScore("libcurl4", undefined, "curl");
    const descriptionOnly = localMatchScore("http-toolkit", "a wrapper around curl", "curl");
    expect(plainSubstring).toBeGreaterThan(descriptionOnly);
  });

  it("ranks a description-only match above no match at all", () => {
    const descriptionOnly = localMatchScore("http-toolkit", "a wrapper around curl", "curl");
    const noMatch = localMatchScore("wget", "download files", "curl");
    expect(descriptionOnly).toBeGreaterThan(noMatch);
    expect(noMatch).toBeLessThanOrEqual(0);
  });

  it("applies a small length penalty so shorter exact-ish names win ties", () => {
    const short = localMatchScore("curl", undefined, "curl");
    const long = localMatchScore("curl-but-with-a-much-longer-package-name", undefined, "curl");
    // both start with "curl" -> same tier, but the longer name should score lower
    const shortPrefix = localMatchScore("curl", undefined, "cur");
    const longPrefix = localMatchScore("curl-but-with-a-much-longer-package-name", undefined, "cur");
    expect(shortPrefix).toBeGreaterThan(longPrefix);
    expect(short).toBeGreaterThan(long);
  });
});

describe("mergeRanked", () => {
  it("interleaves and sorts results from multiple ecosystems by computed score, not source order", () => {
    const results: PackageSearchResult[] = [
      // Listed first but should rank lower: only a description hit.
      { ecosystem: "apt", name: "http-toolkit", description: "includes curl support" },
      // Listed last but should rank highest: exact name match.
      { ecosystem: "pypi", name: "curl" },
      // Listed in the middle: prefix match.
      { ecosystem: "brew", name: "curl-extra" },
    ];

    const merged = mergeRanked(results, "curl");

    expect(merged.map((r) => r.name)).toEqual(["curl", "curl-extra", "http-toolkit"]);
  });

  it("ranks npm results (which carry a raw __score) against local-scored results on a comparable scale", () => {
    const results: (PackageSearchResult & { __score?: number })[] = [
      // Weak/unrelated npm hit with a low native search score.
      { ecosystem: "npm", name: "unrelated-npm-pkg", __score: 0.0001 },
      // Strong exact-name local match from apt.
      { ecosystem: "apt", name: "curl" },
    ];

    const merged = mergeRanked(results as PackageSearchResult[], "curl");

    expect(merged[0].name).toBe("curl");
    expect(merged[0].ecosystem).toBe("apt");
  });

  it("strips the internal __score field from npm results before returning", () => {
    const results: (PackageSearchResult & { __score?: number })[] = [
      { ecosystem: "npm", name: "curl-npm-wrapper", __score: 50 },
    ];

    const merged = mergeRanked(results as PackageSearchResult[], "curl");

    expect(merged[0]).not.toHaveProperty("__score");
  });

  it("returns an empty array for an empty input list", () => {
    expect(mergeRanked([], "curl")).toEqual([]);
  });
});

describe("IncusPackageSearchService short-query short-circuit", () => {
  it("search() returns an empty array (not an error) for a query shorter than 2 chars", async () => {
    const service = new IncusPackageSearchService();
    await expect(service.search("npm", "a")).resolves.toEqual([]);
    await expect(service.search("npm", "")).resolves.toEqual([]);
  });

  it("searchAll() returns an empty result set (not an error) for a query shorter than 2 chars", async () => {
    const service = new IncusPackageSearchService();
    const response = await service.searchAll("a");
    expect(response).toEqual({ results: [], errors: [] });
  });

  it("searchAll() treats a whitespace-only query as too short after trimming", async () => {
    const service = new IncusPackageSearchService();
    const response = await service.searchAll("  x ");
    expect(response).toEqual({ results: [], errors: [] });
  });
});

describe("IncusPackageSearchService network behavior", () => {
  it("observes an early npm rejection while sequential catalog searches are still pending", async () => {
    const service = new IncusPackageSearchService();
    let releasePypi!: () => void;
    const pypiPending = new Promise<PackageSearchResult[]>((resolve) => { releasePypi = () => resolve([]); });
    const internals = service as unknown as {
      searchNpm: () => Promise<PackageSearchResult[]>;
      searchPypi: () => Promise<PackageSearchResult[]>;
      searchBrew: () => Promise<PackageSearchResult[]>;
    };
    internals.searchNpm = async () => { throw new Error("npm failed immediately"); };
    internals.searchPypi = () => pypiPending;
    internals.searchBrew = async () => [];
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on("unhandledRejection", onUnhandled);

    try {
      const search = service.searchAll("curl");
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(unhandled).toEqual([]);
      releasePypi();
      await expect(search).resolves.toMatchObject({
        errors: [{ ecosystem: "npm", message: "npm failed immediately" }],
      });
    } finally {
      process.off("unhandledRejection", onUnhandled);
      releasePypi();
    }
  });

  it("deduplicates simultaneous cold npm requests", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      objects: [{ searchScore: 1, package: { name: "curl", version: "1.0.0" } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const service = new IncusPackageSearchService();
    const [first, second] = await Promise.all([service.search("npm", "curl"), service.search("npm", "curl")]);
    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("negative-caches repeated upstream failures", async () => {
    const fetchMock = vi.fn(async () => new Response("no", { status: 503, statusText: "Unavailable" }));
    vi.stubGlobal("fetch", fetchMock);
    const service = new IncusPackageSearchService();
    await expect(service.search("npm", "broken")).rejects.toThrow("503");
    await expect(service.search("npm", "broken")).rejects.toThrow("cached failure");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
