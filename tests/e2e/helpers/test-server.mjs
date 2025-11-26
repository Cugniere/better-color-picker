/**
 * Simple HTTP server for serving test pages
 */

import http from "http"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createTestServer(port = 3000) {
  const fixturesDir = path.resolve(__dirname, "../fixtures")

  const server = http.createServer((req, res) => {
    // Default to test-page.html
    let filePath = path.join(
      fixturesDir,
      req.url === "/" ? "test-page.html" : req.url,
    )

    // Security: prevent directory traversal
    if (!filePath.startsWith(fixturesDir)) {
      res.writeHead(403)
      res.end("Forbidden")
      return
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404)
        res.end("Not found")
        return
      }

      // Set content type based on extension
      const ext = path.extname(filePath)
      const contentTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
        ".json": "application/json",
      }

      res.writeHead(200, {
        "Content-Type": contentTypes[ext] || "text/plain",
      })
      res.end(data)
    })
  })

  return {
    start: () =>
      new Promise((resolve) => {
        server.listen(port, () => {
          console.log(`Test server listening on http://localhost:${port}`)
          resolve()
        })
      }),
    stop: () =>
      new Promise((resolve) => {
        server.close(() => {
          console.log("Test server stopped")
          resolve()
        })
      }),
    url: `http://localhost:${port}`,
  }
}
