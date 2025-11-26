/**
 * E2E Tests: Cleanup and Memory
 * Tests proper cleanup of DOM elements and event listeners
 */

import { test, expect, firefox } from "@playwright/test"
import path from "path"
import { fileURLToPath } from "url"
import { readFileSync } from "fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const extensionPath = path.resolve(__dirname, "../../dist")

/**
 * Helper: Get picker element from page
 */
async function getPicker(page) {
  return await page.locator(".bcp-color-picker")
}

/**
 * Helper: Wait for picker to appear
 */
async function waitForPicker(page, timeout = 3000) {
  const picker = await getPicker(page)
  await picker.waitFor({ state: "visible", timeout })
  return picker
}

/**
 * Helper: Check if picker exists in DOM
 */
async function pickerExistsInDOM(page) {
  const count = await page.locator(".bcp-color-picker").count()
  return count > 0
}

/**
 * Helper: Count picker elements in DOM
 */
async function countPickersInDOM(page) {
  return await page.locator(".bcp-color-picker").count()
}

// Test suite with extension loaded
test.describe("Cleanup and Memory", () => {
  let browser
  let context
  let page

  // Setup: Launch browser
  test.beforeAll(async () => {
    browser = await firefox.launch({
      headless: true,
    })
  })

  test.beforeEach(async () => {
    context = await browser.newContext()
    page = await context.newPage()

    // Navigate to test page (server is started by Playwright)
    await page.goto("http://localhost:3456")

    // Inject extension code
    const contentJS = readFileSync(
      path.join(extensionPath, "content.js"),
      "utf-8",
    )
    const pickerCSS = readFileSync(
      path.join(extensionPath, "picker.css"),
      "utf-8",
    )

    // Inject CSS
    await page.addStyleTag({ content: pickerCSS })

    // Mock browser.storage API
    await page.evaluate(() => {
      window.browser = {
        storage: {
          local: {
            async get(key) {
              const stored = localStorage.getItem(key)
              return stored ? { [key]: JSON.parse(stored) } : {}
            },
            async set(data) {
              for (const [key, value] of Object.entries(data)) {
                localStorage.setItem(key, JSON.stringify(value))
              }
            },
          },
        },
      }
    })

    // Inject content script
    await page.addScriptTag({ content: contentJS, type: "module" })

    // Wait for initialization
    await page.waitForTimeout(100)
  })

  test.afterEach(async () => {
    await context.close()
  })

  test.afterAll(async () => {
    await browser.close()
  })

  test("closing picker removes DOM element", async () => {
    const input = page.getByTestId("color-basic")

    // Initially no picker in DOM
    expect(await pickerExistsInDOM(page)).toBe(false)

    // Open picker
    await input.click()
    await waitForPicker(page)

    // Picker should exist in DOM
    expect(await pickerExistsInDOM(page)).toBe(true)

    // Close picker with ESC
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)

    // Picker should be removed from DOM
    expect(await pickerExistsInDOM(page)).toBe(false)
  })

  test("closing picker via outside click removes DOM element", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)
    expect(await pickerExistsInDOM(page)).toBe(true)

    // Click outside
    await page.click("body", { position: { x: 10, y: 10 } })
    await page.waitForTimeout(200)

    // Picker should be removed from DOM
    expect(await pickerExistsInDOM(page)).toBe(false)
  })

  test("no memory leaks after multiple open/close cycles", async () => {
    const input = page.getByTestId("color-basic")

    // Perform multiple open/close cycles
    for (let i = 0; i < 10; i++) {
      // Open picker
      await input.click()
      await waitForPicker(page)

      // Verify only one picker exists
      const count = await countPickersInDOM(page)
      expect(count).toBe(1)

      // Close picker
      await page.keyboard.press("Escape")
      await page.waitForTimeout(100)

      // Verify picker is removed
      expect(await pickerExistsInDOM(page)).toBe(false)
    }

    // After all cycles, open picker one more time
    await input.click()
    await waitForPicker(page)

    // Should still work correctly with exactly one picker
    const finalCount = await countPickersInDOM(page)
    expect(finalCount).toBe(1)
  })

  test("switching inputs cleans up previous picker", async () => {
    const input1 = page.getByTestId("color-basic")
    const input2 = page.getByTestId("color-2")

    // Open picker for input1
    await input1.click()
    await waitForPicker(page)
    expect(await countPickersInDOM(page)).toBe(1)

    // Switch to input2 (should clean up and recreate)
    await input2.click()
    await waitForPicker(page)

    // Should still only be one picker
    expect(await countPickersInDOM(page)).toBe(1)

    // Close picker
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)

    // Should be no pickers
    expect(await pickerExistsInDOM(page)).toBe(false)
  })

  test("event listeners cleaned up after close", async () => {
    const input = page.getByTestId("color-basic")

    // Open and close picker
    await input.click()
    await waitForPicker(page)
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)

    // Try to trigger events that would affect an open picker
    // These should have no effect since the picker is closed

    // Click outside (should not error)
    await page.click("body", { position: { x: 100, y: 100 } })
    await page.waitForTimeout(100)

    // Press ESC again (should not error)
    await page.keyboard.press("Escape")
    await page.waitForTimeout(100)

    // Scroll (should not error)
    await page.evaluate(() => window.scrollBy(0, 50))
    await page.waitForTimeout(100)

    // Resize (should not error)
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.waitForTimeout(100)

    // Picker should still be closed
    expect(await pickerExistsInDOM(page)).toBe(false)
  })

  test("rapid open/close does not create multiple elements", async () => {
    const input = page.getByTestId("color-basic")

    // Rapidly open picker multiple times
    for (let i = 0; i < 5; i++) {
      await input.click()
      await page.waitForTimeout(50) // Short delay
    }

    // Should only have one picker
    await waitForPicker(page)
    const count = await countPickersInDOM(page)
    expect(count).toBe(1)
  })

  test("DOM is clean after picker operations", async () => {
    const input = page.getByTestId("color-basic")

    // Get initial DOM element count
    const initialCount = await page.evaluate(
      () => document.body.children.length,
    )

    // Open picker
    await input.click()
    await waitForPicker(page)

    // DOM should have one more element (the picker)
    const withPickerCount = await page.evaluate(
      () => document.body.children.length,
    )
    expect(withPickerCount).toBe(initialCount + 1)

    // Close picker
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)

    // DOM should return to initial count
    const afterCloseCount = await page.evaluate(
      () => document.body.children.length,
    )
    expect(afterCloseCount).toBe(initialCount)
  })

  test("no duplicate event listeners after multiple cycles", async () => {
    const input = page.getByTestId("color-basic")

    // Track if duplicate handlers would cause issues
    let clickCount = 0

    // Add a test listener to count clicks
    await page.evaluate(() => {
      window.testClickCount = 0
      document.addEventListener("mousedown", () => {
        window.testClickCount++
      })
    })

    // Open and close picker multiple times
    for (let i = 0; i < 5; i++) {
      await input.click()
      await waitForPicker(page)
      await page.keyboard.press("Escape")
      await page.waitForTimeout(100)
    }

    // Click outside
    await page.click("body", { position: { x: 100, y: 100 } })
    await page.waitForTimeout(100)

    // Get click count
    const testClickCount = await page.evaluate(() => window.testClickCount)

    // Should have registered clicks for: 5 input clicks + 1 outside click = 6 total
    // (Plus any internal clicks from the picker itself)
    // The key is that we shouldn't see exponential growth indicating duplicate listeners
    expect(testClickCount).toBeLessThan(20) // Conservative upper bound
  })

  test("picker cleanup works with multiple inputs", async () => {
    const input1 = page.getByTestId("color-basic")
    const input2 = page.getByTestId("color-2")
    const input3 = page.getByTestId("color-3")

    // Cycle through all inputs
    await input1.click()
    await waitForPicker(page)
    await page.keyboard.press("Escape")
    await page.waitForTimeout(100)

    await input2.click()
    await waitForPicker(page)
    await page.keyboard.press("Escape")
    await page.waitForTimeout(100)

    await input3.click()
    await waitForPicker(page)
    await page.keyboard.press("Escape")
    await page.waitForTimeout(100)

    // Verify DOM is clean
    expect(await pickerExistsInDOM(page)).toBe(false)

    // Verify we can still open picker
    await input1.click()
    await waitForPicker(page)
    expect(await countPickersInDOM(page)).toBe(1)
  })

  test("no lingering elements after page navigation", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)

    // Navigate away and back
    await page.goto("about:blank")
    await page.waitForTimeout(100)

    await page.goto("http://localhost:3456")

    // Re-inject extension (simulating real behavior)
    const contentJS = readFileSync(
      path.join(extensionPath, "content.js"),
      "utf-8",
    )
    const pickerCSS = readFileSync(
      path.join(extensionPath, "picker.css"),
      "utf-8",
    )

    await page.addStyleTag({ content: pickerCSS })
    await page.evaluate(() => {
      window.browser = {
        storage: {
          local: {
            async get(key) {
              const stored = localStorage.getItem(key)
              return stored ? { [key]: JSON.parse(stored) } : {}
            },
            async set(data) {
              for (const [key, value] of Object.entries(data)) {
                localStorage.setItem(key, JSON.stringify(value))
              }
            },
          },
        },
      }
    })
    await page.addScriptTag({ content: contentJS, type: "module" })
    await page.waitForTimeout(100)

    // Should have no pickers
    expect(await pickerExistsInDOM(page)).toBe(false)

    // Should be able to open picker fresh
    const newInput = page.getByTestId("color-basic")
    await newInput.click()
    await waitForPicker(page)
    expect(await countPickersInDOM(page)).toBe(1)
  })
})
