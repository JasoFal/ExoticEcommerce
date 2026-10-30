import { setupServer } from "msw/node";

// Tests add their own handlers with `server.use(...)`.
export const server = setupServer();

// The backend URL the unit project sets in vitest.config.ts.
export const BACKEND_URL = "http://medusa.test";
