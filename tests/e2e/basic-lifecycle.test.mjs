/**
 * E2E Tests: Basic Picker Lifecycle
 * Tests the fundamental open/close behavior of the color picker
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
 * Helper: Check if picker is visible
 */
async function isPickerVisible(page) {
  const picker = await getPicker(page)
  return await picker.isVisible().catch(() => false)
}

/**
 * Helper: Get picker position
 */
async function getPickerPosition(page) {
  const picker = await getPicker(page)
  const box = await picker.boundingBox()
  return box
}

/**
 * Helper: Get input position
 */
async function getInputPosition(page, selector) {
  const input = await page.locator(selector)
  const box = await input.boundingBox()
  return box
}

// Test suite with extension loaded
test.describe("Basic Picker Lifecycle", () => {
  let browser
  let context
  let page

  // Setup: Launch browser
  test.beforeAll(async () => {
    // Launch Firefox browser
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

  test("clicking color input shows picker", async () => {
    const input = page.getByTestId("color-basic")

    // Initially picker should not exist
    expect(await isPickerVisible(page)).toBe(false)

    // Click the input
    await input.click()

    // Picker should appear
    const picker = await waitForPicker(page)
    expect(await picker.isVisible()).toBe(true)
  })

  test("picker is positioned below input", async () => {
    const input = page.getByTestId("color-basic")

    // Click to open picker
    await input.click()
    await waitForPicker(page)

    // Get positions
    const inputBox = await getInputPosition(page, '[data-testid="color-basic"]')
    const pickerBox = await getPickerPosition(page)

    // Picker should be below input (top of picker > bottom of input)
    expect(pickerBox.y).toBeGreaterThan(inputBox.y + inputBox.height)

    // Picker should be roughly aligned to left edge of input
    expect(Math.abs(pickerBox.x - inputBox.x)).toBeLessThan(10)
  })

  test("picker contains color controls", async () => {
    const input = page.getByTestId("color-basic")
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)

    // Check for main color picker components
    const hueSlider = picker.locator(".bcp-hue-slider")
    const saturationArea = picker.locator(".bcp-saturation-lightness")
    const hexInput = picker.locator(".bcp-hex-input")

    // Verify components exist
    await expect(hueSlider).toBeVisible()
    await expect(saturationArea).toBeVisible()
    await expect(hexInput).toBeVisible()
  })

  test("clicking outside picker closes it", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)
    expect(await isPickerVisible(page)).toBe(true)

    // Click outside (on the body, away from picker and input)
    await page.click("body", {
      position: { x: 10, y: 10 },
    })

    // Wait a bit for close animation
    await page.waitForTimeout(200)

    // Picker should be closed
    expect(await isPickerVisible(page)).toBe(false)
  })

  test("pressing ESC closes picker", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)
    expect(await isPickerVisible(page)).toBe(true)

    // Press ESC
    await page.keyboard.press("Escape")

    // Wait a bit for close animation
    await page.waitForTimeout(200)

    // Picker should be closed
    expect(await isPickerVisible(page)).toBe(false)
  })

  test("clicking input again reopens picker", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)
    expect(await isPickerVisible(page)).toBe(true)

    // Close picker
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)
    expect(await isPickerVisible(page)).toBe(false)

    // Reopen picker
    await input.click()
    await waitForPicker(page)
    expect(await isPickerVisible(page)).toBe(true)
  })

  test("clicking input when picker is open keeps it open", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)
    expect(await isPickerVisible(page)).toBe(true)

    // Click input again
    await input.click()
    await page.waitForTimeout(200)

    // Picker should still be visible
    expect(await isPickerVisible(page)).toBe(true)
  })

  test("only one picker visible at a time", async () => {
    const input1 = page.getByTestId("color-basic")
    const input2 = page.getByTestId("color-2")

    // Open picker for first input
    await input1.click()
    await waitForPicker(page)

    // Get all pickers
    const pickers = await page.locator(".bcp-color-picker").all()

    // Should only be one picker
    expect(pickers.length).toBe(1)

    // Open picker for second input
    await input2.click()
    await page.waitForTimeout(200)

    // Should still only be one picker
    const pickersAfter = await page.locator(".bcp-color-picker").all()
    expect(pickersAfter.length).toBe(1)
  })

  test("picker reopens after scroll", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)
    expect(await isPickerVisible(page)).toBe(true)

    // Scroll the page
    await page.evaluate(() => window.scrollBy(0, 100))

    // In current implementation, scroll closes the picker
    await page.waitForTimeout(200)
    expect(await isPickerVisible(page)).toBe(false)

    // Should be able to reopen
    await input.click()
    await waitForPicker(page)
    expect(await isPickerVisible(page)).toBe(true)
  })

  test("picker reopens after window resize", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)
    expect(await isPickerVisible(page)).toBe(true)

    // Get initial position
    const initialBox = await getPickerPosition(page)

    // Resize window
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.waitForTimeout(200)

    // Picker should still be visible and repositioned
    expect(await isPickerVisible(page)).toBe(true)

    // Position may have changed
    const newBox = await getPickerPosition(page)
    // Just verify it has valid position
    expect(newBox.x).toBeGreaterThanOrEqual(0)
    expect(newBox.y).toBeGreaterThanOrEqual(0)
  })
})
