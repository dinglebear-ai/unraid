import { Injectable, Logger } from "@nestjs/common";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import { Worker } from "node:worker_threads";

export type PackageEcosystem = "apt" | "npm" | "pypi" | "brew";

export interface PackageSearchResult {
  ecosystem: PackageEcosystem;
  name: string;
  description?: string;
  version?: string;
}

export interface PackageSearchError {
  ecosystem: PackageEcosystem;
  message: string;
}

export interface PackageSearchResponse {
  results: PackageSearchResult[];
  errors: PackageSearchError[];
}

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

interface FailureEntry {
  message: string;
  failedAt: number;
}

const SUCCESS_TTL_MS = 6 * 60 * 60 * 1000; // 6h — these indices update roughly daily
const FAILURE_TTL_MS = 60 * 1000; // 1m — short backoff so one bad fetch doesn't retry-storm, but recovers fast
const RESULTS_PER_SOURCE = 30;
const MERGED_RESULTS_CAP = 40;
const FETCH_TIMEOUT_MS = 10_000;
const INDEX_FETCH_TIMEOUT_MS = 30_000; // the multi-MB catalog downloads (pypi/brew/apt) need more room
const MAX_APT_CACHE_ENTRIES = 8;
const MAX_FAILURE_ENTRIES = 100;
const gunzipAsync = promisify(gunzip);

/** Debian/Ubuntu mirror + suite, matching the same mirrors used for actual builds in incus-image-builder.service.ts. */
const APT_MIRRORS: Record<string, string> = {
  debian: "https://deb.debian.org/debian",
  ubuntu: "http://archive.ubuntu.com/ubuntu",
};

/**
 * Live package search across four real, no-auth-required public catalogs, so the Builder
 * tab's package picker can be "search and click" instead of a fixed checkbox list.
 *
 * - npm: registry.npmjs.org's own search API — live, relevance-ranked by npm itself
 *   (downloads/quality/maintenance), includes descriptions. We trust npm's own ranking
 *   rather than re-deriving one.
 * - PyPI: no official search API (removed years ago); the simple index
 *   (pypi.org/simple, ~844k names) is fetched once and cached, then relevance-scored
 *   locally — real package names, but no descriptions/versions available this way.
 * - Homebrew: the full formula catalog (formulae.brew.sh/api/formula.json, ~8.5k formulae)
 *   is fetched once and cached, then relevance-scored on name+description.
 * - apt: Debian/Ubuntu's Packages.gz index for `main` only (not universe/multiverse for
 *   Ubuntu) is fetched per distro+release and cached, then parsed and relevance-scored.
 *   Only debian/ubuntu are supported — apk/dnf/yum have entirely different index formats
 *   and aren't implemented here.
 *
 * Every external call has a timeout, and `searchAll()` runs all sources in parallel via
 * Promise.allSettled — one source failing (timeout, 5xx, network) degrades gracefully:
 * the other sources' results still come back, with the failure reported separately in
 * `errors` rather than the whole search throwing.
 */
@Injectable()
export class IncusPackageSearchService {
  private readonly logger = new Logger(IncusPackageSearchService.name);
  private readonly pypiCache = new Map<string, CacheEntry<string[]>>();
  private readonly brewCache = new Map<string, CacheEntry<PackageSearchResult[]>>();
  private readonly aptCache = new Map<string, CacheEntry<PackageSearchResult[]>>();
  private readonly recentFailures = new Map<string, FailureEntry>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  /**
   * Collapses concurrent callers for the same cache key onto one in-flight fetch —
   * frontend debounce reduces trigger frequency, but doesn't guarantee only one request
   * is ever outstanding (two browser tabs, a distro switch racing a still-pending
   * search, etc). Without this, N concurrent misses for the same key would each start
   * their own multi-MB download to the same upstream instead of sharing one.
   */
  private dedupeInFlight<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      this.logger.debug(`Joining in-flight fetch for ${key} instead of starting a duplicate`);
      return existing as Promise<T>;
    }
    const promise = fetcher().finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, promise);
    return promise;
  }

  /** Search one ecosystem. Kept for callers that only care about a single source. */
  async search(
    ecosystem: PackageEcosystem,
    query: string,
    distro?: string,
    release?: string
  ): Promise<PackageSearchResult[]> {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    switch (ecosystem) {
      case "npm":
        return this.searchNpm(q);
      case "pypi":
        return this.searchPypi(q);
      case "brew":
        return this.searchBrew(q);
      case "apt":
        if (!distro || !release) {
          throw new Error("apt search requires distro and release");
        }
        return this.searchApt(distro, release, q);
    }
  }

  /**
   * Search apt + npm + PyPI + Homebrew concurrently and merge into one relevance-ranked
   * list. apt is silently skipped (not an error) when distro/release aren't debian/ubuntu
   * — that's an expected, common case (e.g. the user has Fedora selected), not a failure.
   */
  async searchAll(query: string, distro?: string, release?: string): Promise<PackageSearchResponse> {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return { results: [], errors: [] };

    this.logger.log(`searchAll query="${q}" distro=${distro ?? "-"} release=${release ?? "-"}`);

    const sources: Array<{ ecosystem: PackageEcosystem; run: () => Promise<PackageSearchResult[]> }> = [
      { ecosystem: "npm", run: () => this.searchNpm(q) },
      { ecosystem: "pypi", run: () => this.searchPypi(q) },
      { ecosystem: "brew", run: () => this.searchBrew(q) },
    ];
    if (distro && release && APT_MIRRORS[distro]) {
      sources.push({ ecosystem: "apt", run: () => this.searchApt(distro, release, q) });
    }

    // npm is a small query response and may run alongside one catalog load.
    // The large PyPI/Homebrew/apt catalogs are intentionally loaded one at a
    // time so their download/decode/worker heaps never peak simultaneously.
    const settled: Array<PromiseSettledResult<PackageSearchResult[]>> = [];
    // Convert npm to a settled outcome immediately. Holding the raw promise
    // while awaiting the large catalogs below leaves its rejection temporarily
    // unobserved, which Node may report as an unhandled rejection before this
    // method eventually reaches the later await/catch.
    const npm: Promise<PromiseSettledResult<PackageSearchResult[]>> = sources[0].run().then(
      (value): PromiseSettledResult<PackageSearchResult[]> => ({ status: "fulfilled", value }),
      (reason): PromiseSettledResult<PackageSearchResult[]> => ({ status: "rejected", reason }),
    );
    for (let index = 1; index < sources.length; index++) {
      try {
        settled[index] = { status: "fulfilled", value: await sources[index].run() };
      } catch (reason) {
        settled[index] = { status: "rejected", reason };
      }
    }
    settled[0] = await npm;

    const results: PackageSearchResult[] = [];
    const errors: PackageSearchError[] = [];
    settled.forEach((outcome, i) => {
      const ecosystem = sources[i].ecosystem;
      if (outcome.status === "fulfilled") {
        results.push(...outcome.value);
      } else {
        const message = outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
        this.logger.warn(`searchAll: ${ecosystem} search failed, degrading gracefully: ${message}`);
        errors.push({ ecosystem, message });
      }
    });

    const merged = mergeRanked(results, q).slice(0, MERGED_RESULTS_CAP);
    this.logger.debug(
      `searchAll query="${q}": ${merged.length} merged results from ${results.length} raw, ${errors.length} source error(s)`
    );
    return { results: merged, errors };
  }

  private async fetchWithTimeout(url: string, timeoutMs: number, init?: RequestInit): Promise<Response> {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(`${url} responded ${res.status} ${res.statusText}`);
    return res;
  }

  /** Short-lived negative cache so a single flaky fetch doesn't get retried on every
   * keystroke — but recovers within a minute once the remote is healthy again. */
  private checkRecentFailure(key: string): void {
    const failure = this.recentFailures.get(key);
    if (failure && Date.now() - failure.failedAt >= FAILURE_TTL_MS) this.recentFailures.delete(key);
    if (failure && Date.now() - failure.failedAt < FAILURE_TTL_MS) {
      throw new Error(`${failure.message} (cached failure, retrying automatically in a moment)`);
    }
  }

  private recordFailure(key: string, err: unknown): never {
    const message = err instanceof Error ? err.message : String(err);
    this.recentFailures.set(key, { message, failedAt: Date.now() });
    while (this.recentFailures.size > MAX_FAILURE_ENTRIES) this.recentFailures.delete(this.recentFailures.keys().next().value!);
    throw err instanceof Error ? err : new Error(message);
  }

  private async searchNpm(query: string): Promise<PackageSearchResult[]> {
    // Keyed per-query (not a blanket "npm:live") so a failure/in-flight request for one
    // search term doesn't block or dedupe-collide with an unrelated concurrent one.
    const cacheKey = `npm:${query}`;
    this.checkRecentFailure(cacheKey);
    return this.dedupeInFlight(cacheKey, async () => {
      try {
        const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${RESULTS_PER_SOURCE}`;
        const res = await this.fetchWithTimeout(url, FETCH_TIMEOUT_MS);
        const data = (await res.json()) as {
          objects: Array<{ searchScore: number; package: { name: string; description?: string; version: string } }>;
        };
        return data.objects.map((o) => ({
          ecosystem: "npm" as const,
          name: o.package.name,
          description: o.package.description,
          version: o.package.version,
          // stash npm's own relevance score for merge-ranking; not part of the public shape
          __score: o.searchScore,
        })) as PackageSearchResult[];
      } catch (err) {
        this.logger.warn(`npm search failed for "${query}": ${(err as Error).message}`);
        this.recordFailure(cacheKey, err);
      }
    });
  }

  private async getPypiIndex(): Promise<string[]> {
    const cacheKey = "pypi:index";
    const cached = this.pypiCache.get("all");
    if (cached && Date.now() - cached.fetchedAt < SUCCESS_TTL_MS) return cached.data;
    this.checkRecentFailure(cacheKey);

    return this.dedupeInFlight(cacheKey, async () => {
      try {
        this.logger.log("Fetching PyPI simple index (~40MB, cached 6h)…");
        const res = await this.fetchWithTimeout("https://pypi.org/simple/", INDEX_FETCH_TIMEOUT_MS, {
          headers: { Accept: "application/vnd.pypi.simple.v1+json" },
        });
        const names = await this.parseCatalog<string[]>("pypi", await res.arrayBuffer());
        this.pypiCache.set("all", { data: names, fetchedAt: Date.now() });
        this.logger.log(`PyPI index cached: ${names.length} package names`);
        return names;
      } catch (err) {
        this.logger.warn(`PyPI index fetch failed: ${(err as Error).message}`);
        this.recordFailure(cacheKey, err);
      }
    });
  }

  private async searchPypi(query: string): Promise<PackageSearchResult[]> {
    const names = await this.getPypiIndex();
    const results: PackageSearchResult[] = [];
    for (const name of names) {
      if (name.toLowerCase().includes(query)) {
        results.push({ ecosystem: "pypi", name });
        if (results.length >= RESULTS_PER_SOURCE * 3) break; // over-collect; mergeRanked trims after scoring
      }
    }
    return results;
  }

  private async getBrewIndex(): Promise<PackageSearchResult[]> {
    const cacheKey = "brew:index";
    const cached = this.brewCache.get("all");
    if (cached && Date.now() - cached.fetchedAt < SUCCESS_TTL_MS) return cached.data;
    this.checkRecentFailure(cacheKey);

    return this.dedupeInFlight(cacheKey, async () => {
      try {
        this.logger.log("Fetching Homebrew formula catalog (~30MB, cached 6h)…");
        const res = await this.fetchWithTimeout("https://formulae.brew.sh/api/formula.json", INDEX_FETCH_TIMEOUT_MS);
        const formulae = await this.parseCatalog<PackageSearchResult[]>("brew", await res.arrayBuffer());
        this.brewCache.set("all", { data: formulae, fetchedAt: Date.now() });
        this.logger.log(`Homebrew catalog cached: ${formulae.length} formulae`);
        return formulae;
      } catch (err) {
        this.logger.warn(`Homebrew catalog fetch failed: ${(err as Error).message}`);
        this.recordFailure(cacheKey, err);
      }
    });
  }

  private async searchBrew(query: string): Promise<PackageSearchResult[]> {
    const formulae = await this.getBrewIndex();
    const results: PackageSearchResult[] = [];
    for (const f of formulae) {
      if (f.name.toLowerCase().includes(query) || f.description?.toLowerCase().includes(query)) {
        results.push(f);
        if (results.length >= RESULTS_PER_SOURCE * 3) break;
      }
    }
    return results;
  }

  private async getAptIndex(distro: string, release: string): Promise<PackageSearchResult[]> {
    const mirror = APT_MIRRORS[distro];
    if (!mirror) throw new Error(`apt search only supports debian/ubuntu, got "${distro}"`);

    const cacheKey = `apt:${distro}:${release}`;
    const cached = this.aptCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < SUCCESS_TTL_MS) return cached.data;
    this.checkRecentFailure(cacheKey);

    const url = `${mirror}/dists/${release}/main/binary-amd64/Packages.gz`;
    return this.dedupeInFlight(cacheKey, async () => {
      try {
        this.logger.log(`Fetching apt Packages index for ${distro}:${release} (~15MB, cached 6h)…`);
        const res = await this.fetchWithTimeout(url, INDEX_FETCH_TIMEOUT_MS);
        const gz = Buffer.from(await res.arrayBuffer());
        const inflated = await gunzipAsync(gz);
        const bytes = Uint8Array.from(inflated).buffer;
        const packages = await this.parseCatalog<PackageSearchResult[]>("apt", bytes);
        this.aptCache.set(cacheKey, { data: packages, fetchedAt: Date.now() });
        while (this.aptCache.size > MAX_APT_CACHE_ENTRIES) this.aptCache.delete(this.aptCache.keys().next().value!);
        this.logger.log(`apt index cached for ${distro}:${release}: ${packages.length} packages`);
        return packages;
      } catch (err) {
        this.logger.warn(`apt Packages index fetch failed for ${distro}:${release} (${url}): ${(err as Error).message}`);
        this.recordFailure(cacheKey, err);
      }
    });
  }

  private async searchApt(distro: string, release: string, query: string): Promise<PackageSearchResult[]> {
    const packages = await this.getAptIndex(distro, release);
    const results: PackageSearchResult[] = [];
    for (const p of packages) {
      if (p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query)) {
        results.push(p);
        if (results.length >= RESULTS_PER_SOURCE * 3) break;
      }
    }
    return results;
  }

  private parseCatalog<T>(kind: "pypi" | "brew" | "apt", bytes: ArrayBuffer): Promise<T> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL("./package-catalog.worker.js", import.meta.url));
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        void worker.terminate();
        callback();
      };
      worker.once("message", (message: { result?: T; error?: string }) => {
        finish(() => {
          if (message.error) reject(new Error(message.error));
          else resolve(message.result as T);
        });
      });
      worker.once("error", (error) => finish(() => reject(error)));
      worker.once("exit", (code) => {
        if (!settled) finish(() => reject(new Error(`Catalog parser worker exited before replying (code ${code})`)));
      });
      worker.postMessage({ kind, bytes }, [bytes]);
    });
  }
}

/**
 * Relevance score for sources with no native ranking (apt/PyPI/Homebrew): exact name
 * match beats prefix beats word-boundary substring beats plain substring beats a
 * description-only hit, with a small penalty for longer names (a package named exactly
 * "curl" is a better match for "curl" than "libcurl4-gnutls-dev-transitional-compat").
 */
export function localMatchScore(name: string, description: string | undefined, query: string): number {
  const n = name.toLowerCase();
  let score: number;
  if (n === query) score = 100;
  else if (n.startsWith(query)) score = 80;
  else if (new RegExp(`\\b${escapeRegExp(query)}`).test(n)) score = 60;
  else if (n.includes(query)) score = 40;
  else if (description?.toLowerCase().includes(query)) score = 20;
  else score = 0;
  return score - Math.min(15, n.length * 0.15);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Merge results from all sources into one ranked list. npm's own `searchScore` (a
 * relevance signal npm computes server-side from downloads/quality/maintenance — a much
 * better signal than anything derivable locally) is normalized against the local
 * match-quality scores used for the other three sources, so a strong exact-name apt/PyPI
 * match can still outrank a weak/unrelated npm result instead of npm always winning by
 * virtue of being listed first.
 */
export function mergeRanked(results: PackageSearchResult[], query: string): PackageSearchResult[] {
  const scored = results.map((r) => {
    const npmScore = (r as PackageSearchResult & { __score?: number }).__score;
    const score = npmScore !== undefined ? Math.min(100, Math.log10(npmScore + 1) * 30) : localMatchScore(r.name, r.description, query);
    const { ...clean } = r;
    delete (clean as Record<string, unknown>).__score;
    return { result: clean, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.result);
}
