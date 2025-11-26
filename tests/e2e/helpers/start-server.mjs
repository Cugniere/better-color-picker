#!/usr/bin/env node
/**
 * Start test server for Playwright e2e tests
 */

import { createTestServer } from "./test-server.mjs"

const server = createTestServer(3456)
await server.start()

// Keep server running
process.on("SIGINT", async () => {
  await server.stop()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await server.stop()
  process.exit(0)
})
