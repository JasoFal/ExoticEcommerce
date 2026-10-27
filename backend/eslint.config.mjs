import { defineConfig, globalIgnores } from "eslint/config"
import medusa from "@medusajs/eslint-plugin"

export default defineConfig([
  globalIgnores([".medusa/", "dist/", "build/", "coverage/"]),
  ...medusa.configs.recommended,
])
