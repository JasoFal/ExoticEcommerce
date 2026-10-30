import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./msw-server";

// Any request without a handler fails the test, so a test can't quietly
// reach a real backend.
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
