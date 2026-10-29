import { defineConfig, devices } from "@playwright/test";

// E2E tests run against an already running stack: the seeded backend on :9000
// and a production build of the storefront on :3000. CI starts both
// (.github/workflows/e2e.yml); locally, start them yourself first.
export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  // A flaky test is a failing test (docs/ci-cd-plan.md Phase 4).
  retries: 0,
  // JUnit XML for CI (docs/ci-cd-plan.md section 4.1). JUnit merges retried
  // runs of a test, which is fine while retries stay at 0.
  reporter: process.env.CI
    ? [["dot"], ["junit", { outputFile: "reports/junit/playwright.xml" }]]
    : "list",
  use: {
    baseURL: process.env.STOREFRONT_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
