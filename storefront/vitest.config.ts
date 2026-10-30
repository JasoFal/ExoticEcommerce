import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // JUnit XML for CI (docs/ci-cd-plan.md section 4.1).
    ...(process.env.CI && {
      reporters: ["default", "junit"],
      outputFile: { junit: "reports/junit/vitest.xml" },
    }),
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["**/*.test.ts"],
          // e2e/ holds Playwright specs, which run with `npm run test:e2e`.
          exclude: [...configDefaults.exclude, "e2e/**"],
          // Mocks the Medusa API at the SDK boundary (MSW).
          setupFiles: ["./test/msw-setup.ts"],
          env: {
            MEDUSA_BACKEND_URL: "http://medusa.test",
            MEDUSA_PUBLISHABLE_KEY: "pk_test",
          },
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          environment: "jsdom",
          include: ["**/*.test.tsx"],
          exclude: [...configDefaults.exclude, "e2e/**"],
          setupFiles: ["./test/dom-setup.ts"],
        },
      },
    ],
  },
});
