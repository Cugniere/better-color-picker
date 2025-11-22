/**
 * Helper to load browser extension in Playwright tests
 */

import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const extensionPath = path.resolve(__dirname, "../../../dist")

/**
 * Get browser launch options with extension loaded
 * @param {string} browserName - 'chromium' or 'firefox'
 * @param {boolean} headless - Whether to run in headless mode (default: true)
 * @returns {object} Launch options
 */
export function getExtensionLaunchOptions(browserName, headless = true) {
  if (browserName === "chromium" || browserName === "chrome") {
    return {
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        "--no-sandbox", // Required in some CI environments
      ],
      headless, // New headless mode (Chrome 112+) supports extensions
    }
  }

  if (browserName === "firefox") {
    // Firefox requires a different approach - we'll load the extension after launch
    return {
      headless,
    }
  }

  // Webkit/Safari doesn't support extensions in the same way
  return { headless }
}

/**
 * Load extension in Firefox after browser launch
 * @param {import('@playwright/test').BrowserContext} context
 */
export async function loadFirefoxExtension(context) {
  // Firefox extensions need to be loaded via CDP or manually installed
  // For now, we'll skip Firefox extension loading
  // This would require building a .xpi file and using installAddon
  console.warn("Firefox extension loading not implemented in tests")
}
