import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // e2e/ holds Playwright specs, which run with `npm run test:e2e`.
    exclude: [...configDefaults.exclude, "e2e/**"],
    // JUnit XML for CI (docs/ci-cd-plan.md section 4.1).
    ...(process.env.CI && {
      reporters: ["default", "junit"],
      outputFile: { junit: "reports/junit/vitest.xml" },
    }),
  },
});
