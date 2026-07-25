/** @type {import('@stryker-mutator/api/core').StrykerOptions} */
export default {
  testRunner: "vitest",
  vitest: { configFile: "vitest.config.ts" },
  // Keep the mandatory mutation gate focused on the atomic persistence
  // primitive. The wider service suite remains covered by the normal tests;
  // expanding this list is an explicit, measurable follow-up rather than an
  // eight-minute surprise in every local verification run.
  mutate: ["src/json-store.ts"],
  reporters: ["clear-text", "progress"],
  ignorePatterns: ["dist", "dist-web", "dist-web-dashboard", "web", "coverage", ".stryker-tmp"],
  thresholds: { high: 80, low: 60, break: 50 },
  timeoutMS: 10_000,
  concurrency: 2,
  cleanTempDir: true,
};
