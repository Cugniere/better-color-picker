/**
 * E2E Tests: Recent Colors Integration
 * Tests recent color storage, display, and interaction
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
 * Helper: Set hex input value in picker
 */
async function setPickerHexValue(page, value) {
  const picker = await getPicker(page)
  const hexInput = picker.locator(".bcp-hex-input")
  await hexInput.clear()
  await hexInput.fill(value)
}

/**
 * Helper: Get recent color swatches
 */
async function getRecentSwatches(page) {
  const picker = await getPicker(page)
  return picker.locator(".bcp-color-swatch")
}

/**
 * Helper: Get count of recent colors
 */
async function getRecentColorsCount(page) {
  const swatches = await getRecentSwatches(page)
  return await swatches.count()
}

/**
 * Helper: Clear localStorage (to reset recent colors)
 */
async function clearRecentColors(page) {
  await page.evaluate(() => {
    localStorage.removeItem("recentColors")
  })
}

// Test suite with extension loaded
test.describe("Recent Colors Integration", () => {
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

    // Clear recent colors before each test
    await clearRecentColors(page)
  })

  test.afterEach(async () => {
    await context.close()
  })

  test.afterAll(async () => {
    await browser.close()
  })

  test("after selecting color, it appears in recent colors", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)

    // Initially no recent colors
    let count = await getRecentColorsCount(page)
    expect(count).toBe(0)

    // Select a color
    await setPickerHexValue(page, "#ff0000")
    await page.keyboard.press("Enter")

    // Close picker (this saves to recent colors)
    await page.waitForTimeout(100)

    // Reopen picker
    await input.click()
    await waitForPicker(page)

    // Should have 1 recent color
    count = await getRecentColorsCount(page)
    expect(count).toBe(1)

    // Verify it's the correct color
    const swatches = await getRecentSwatches(page)
    const bgColor = await swatches.first().evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    expect(bgColor).toMatch(/rgb\(255,\s*0,\s*0\)/)
  })

  test("clicking recent color applies it to input", async () => {
    const input = page.getByTestId("color-basic")

    // Set up a recent color first
    await input.click()
    await waitForPicker(page)
    await setPickerHexValue(page, "#00ff00")
    await page.keyboard.press("Enter")
    await page.waitForTimeout(100)

    // Set a different color
    await input.evaluate((el) => {
      el.value = "#0000ff"
    })

    // Reopen picker
    await input.click()
    await waitForPicker(page)

    // Click the recent color (green)
    const swatches = await getRecentSwatches(page)
    await swatches.first().click()

    // Wait for update
    await page.waitForTimeout(100)

    // Input should be updated to green
    const inputValue = await input.inputValue()
    expect(inputValue.toLowerCase()).toBe("#00ff00")

    // Picker should be closed after clicking recent color
    const picker = await getPicker(page)
    const isVisible = await picker.isVisible().catch(() => false)
    expect(isVisible).toBe(false)
  })

  test("recent colors persist across picker sessions", async () => {
    const input = page.getByTestId("color-basic")

    // Add 3 colors
    const colors = ["#ff0000", "#00ff00", "#0000ff"]

    for (const color of colors) {
      await input.click()
      await waitForPicker(page)
      await setPickerHexValue(page, color)
      await page.keyboard.press("Enter")
      await page.waitForTimeout(100)
    }

    // Reopen picker
    await input.click()
    await waitForPicker(page)

    // Should have 3 recent colors
    const count = await getRecentColorsCount(page)
    expect(count).toBe(3)

    // Close and reopen again
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)

    await input.click()
    await waitForPicker(page)

    // Should still have 3 recent colors
    const countAfter = await getRecentColorsCount(page)
    expect(countAfter).toBe(3)
  })

  test("recent colors limited to 14 (maxColors)", async () => {
    const input = page.getByTestId("color-basic")

    // Add 16 different colors (more than the limit of 14)
    for (let i = 0; i < 16; i++) {
      const color = `#${i.toString(16).padStart(2, "0")}0000`

      await input.click()
      await waitForPicker(page)
      await setPickerHexValue(page, color)
      await page.keyboard.press("Enter")
      await page.waitForTimeout(50)
    }

    // Reopen picker
    await input.click()
    await waitForPicker(page)

    // Should have exactly 14 recent colors (the limit)
    const count = await getRecentColorsCount(page)
    expect(count).toBe(14)
  })

  test("duplicate colors move to front (not added twice)", async () => {
    const input = page.getByTestId("color-basic")

    // Add 3 different colors
    const colors = ["#ff0000", "#00ff00", "#0000ff"]

    for (const color of colors) {
      await input.click()
      await waitForPicker(page)
      await setPickerHexValue(page, color)
      await page.keyboard.press("Enter")
      await page.waitForTimeout(50)
    }

    // Reopen picker
    await input.click()
    await waitForPicker(page)

    // Should have 3 colors
    let count = await getRecentColorsCount(page)
    expect(count).toBe(3)

    // Get first color (should be blue - most recent)
    let swatches = await getRecentSwatches(page)
    let firstColor = await swatches.first().evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    expect(firstColor).toMatch(/rgb\(0,\s*0,\s*255\)/) // Blue

    // Close picker
    await page.keyboard.press("Escape")
    await page.waitForTimeout(100)

    // Add red again (duplicate)
    await input.click()
    await waitForPicker(page)
    await setPickerHexValue(page, "#ff0000")
    await page.keyboard.press("Enter")
    await page.waitForTimeout(100)

    // Reopen picker
    await input.click()
    await waitForPicker(page)

    // Should still have 3 colors (not 4)
    count = await getRecentColorsCount(page)
    expect(count).toBe(3)

    // First color should now be red (moved to front)
    swatches = await getRecentSwatches(page)
    firstColor = await swatches.first().evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    expect(firstColor).toMatch(/rgb\(255,\s*0,\s*0\)/) // Red
  })

  test("recent colors display is visible when colors exist", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker (no recent colors)
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)
    let recentSection = picker.locator(".bcp-recent-colors")

    // Recent section should be empty/not visible
    const isEmpty = await recentSection.evaluate((el) => {
      return el.children.length === 0
    })
    expect(isEmpty).toBe(true)

    // Close picker
    await page.keyboard.press("Escape")
    await page.waitForTimeout(100)

    // Add a color
    await input.click()
    await waitForPicker(page)
    await setPickerHexValue(page, "#ff0000")
    await page.keyboard.press("Enter")
    await page.waitForTimeout(100)

    // Reopen picker
    await input.click()
    await waitForPicker(page)

    // Recent section should now have content
    recentSection = picker.locator(".bcp-recent-colors")
    const hasContent = await recentSection.evaluate((el) => {
      return el.children.length > 0
    })
    expect(hasContent).toBe(true)

    // Should have "Recent:" label
    const label = picker.locator(".bcp-recent-label")
    const labelCount = await label.count()
    expect(labelCount).toBe(1)
  })

  test("different inputs share same recent colors", async () => {
    const input1 = page.getByTestId("color-basic")
    const input2 = page.getByTestId("color-2")

    // Add color from first input
    await input1.click()
    await waitForPicker(page)
    await setPickerHexValue(page, "#ff0000")
    await page.keyboard.press("Enter")
    await page.waitForTimeout(100)

    // Open picker for second input
    await input2.click()
    await waitForPicker(page)

    // Should see the same recent color
    const count = await getRecentColorsCount(page)
    expect(count).toBe(1)

    // Add another color from second input
    await setPickerHexValue(page, "#00ff00")
    await page.keyboard.press("Enter")
    await page.waitForTimeout(100)

    // Reopen picker for first input
    await input1.click()
    await waitForPicker(page)

    // Should see both recent colors
    const countAfter = await getRecentColorsCount(page)
    expect(countAfter).toBe(2)
  })
})
