/**
 * E2E Tests: Multiple Inputs
 * Tests behavior when multiple color inputs are present on the page
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
 * Helper: Get picker position
 */
async function getPickerPosition(page) {
  const picker = await getPicker(page)
  const box = await picker.boundingBox()
  return box
}

/**
 * Helper: Get hex input value from picker
 */
async function getPickerHexValue(page) {
  const picker = await getPicker(page)
  const hexInput = picker.locator(".bcp-hex-input")
  return await hexInput.inputValue()
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
test.describe("Multiple Inputs", () => {
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

  test("page with multiple color inputs", async () => {
    // Verify the test page has multiple color inputs
    const colorInputs = page.locator('input[type="color"]')
    const count = await colorInputs.count()

    // Should have at least 4 color inputs on the test page
    expect(count).toBeGreaterThanOrEqual(4)

    // Verify they all have different test IDs
    const input1 = page.getByTestId("color-basic")
    const input2 = page.getByTestId("color-2")
    const input3 = page.getByTestId("color-3")
    const input4 = page.getByTestId("color-4")

    await expect(input1).toBeVisible()
    await expect(input2).toBeVisible()
    await expect(input3).toBeVisible()
    await expect(input4).toBeVisible()
  })

  test("opening picker for input A, then input B: picker moves", async () => {
    const input1 = page.getByTestId("color-basic")
    const input2 = page.getByTestId("color-2")

    // Open picker for input 1
    await input1.click()
    await waitForPicker(page)

    // Get picker position
    const position1 = await getPickerPosition(page)

    // Verify picker shows input1's color
    let hexValue = await getPickerHexValue(page)
    expect(hexValue.toLowerCase()).toBe("#ff0000") // input1 default value

    // Click input 2 (without closing picker)
    await input2.click()
    await waitForPicker(page)

    // Get new picker position
    const position2 = await getPickerPosition(page)

    // Picker should have moved (different Y position most likely)
    expect(position2.y).not.toBe(position1.y)

    // Verify picker now shows input2's color
    hexValue = await getPickerHexValue(page)
    expect(hexValue.toLowerCase()).toBe("#00ff00") // input2 default value
  })

  test("each input maintains its own value", async () => {
    const input1 = page.getByTestId("color-basic")
    const input2 = page.getByTestId("color-2")
    const input3 = page.getByTestId("color-3")

    // Set different colors for each input
    await input1.click()
    await waitForPicker(page)
    await setPickerHexValue(page, "#111111")
    await page.keyboard.press("Enter")
    await page.waitForTimeout(100)

    await input2.click()
    await waitForPicker(page)
    await setPickerHexValue(page, "#222222")
    await page.keyboard.press("Enter")
    await page.waitForTimeout(100)

    await input3.click()
    await waitForPicker(page)
    await setPickerHexValue(page, "#333333")
    await page.keyboard.press("Enter")
    await page.waitForTimeout(100)

    // Verify each input kept its value
    const value1 = await input1.inputValue()
    const value2 = await input2.inputValue()
    const value3 = await input3.inputValue()

    expect(value1.toLowerCase()).toBe("#111111")
    expect(value2.toLowerCase()).toBe("#222222")
    expect(value3.toLowerCase()).toBe("#333333")
  })

  test("recent colors shared across all inputs", async () => {
    const input1 = page.getByTestId("color-basic")
    const input2 = page.getByTestId("color-2")
    const input3 = page.getByTestId("color-3")

    // Add a color from input1
    await input1.click()
    await waitForPicker(page)
    await setPickerHexValue(page, "#ff0000")
    await page.keyboard.press("Enter")
    await page.waitForTimeout(100)

    // Open picker for input2 and verify recent color is there
    await input2.click()
    await waitForPicker(page)

    let recentCount = await getRecentColorsCount(page)
    expect(recentCount).toBe(1)

    // Add another color from input2
    await setPickerHexValue(page, "#00ff00")
    await page.keyboard.press("Enter")
    await page.waitForTimeout(100)

    // Open picker for input3 and verify both recent colors are there
    await input3.click()
    await waitForPicker(page)

    recentCount = await getRecentColorsCount(page)
    expect(recentCount).toBe(2)

    // All inputs should see the same recent colors
    const swatches = await getRecentSwatches(page)
    const firstColor = await swatches.first().evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    const secondColor = await swatches.nth(1).evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })

    // Most recent should be green
    expect(firstColor).toMatch(/rgb\(0,\s*255,\s*0\)/)
    // Second most recent should be red
    expect(secondColor).toMatch(/rgb\(255,\s*0,\s*0\)/)
  })

  test("switching between inputs updates picker content", async () => {
    const input1 = page.getByTestId("color-basic")
    const input2 = page.getByTestId("color-2")

    // Set specific colors
    await input1.evaluate((el) => {
      el.value = "#ff0000"
    })
    await input2.evaluate((el) => {
      el.value = "#0000ff"
    })

    // Open picker for input1
    await input1.click()
    await waitForPicker(page)

    let hexValue = await getPickerHexValue(page)
    expect(hexValue.toLowerCase()).toBe("#ff0000")

    // Switch to input2
    await input2.click()
    await waitForPicker(page)

    hexValue = await getPickerHexValue(page)
    expect(hexValue.toLowerCase()).toBe("#0000ff")

    // Switch back to input1
    await input1.click()
    await waitForPicker(page)

    hexValue = await getPickerHexValue(page)
    expect(hexValue.toLowerCase()).toBe("#ff0000")
  })

  test("modifying one input does not affect others", async () => {
    const input1 = page.getByTestId("color-basic")
    const input2 = page.getByTestId("color-2")
    const input3 = page.getByTestId("color-3")

    // Set initial values
    await input1.evaluate((el) => {
      el.value = "#111111"
    })
    await input2.evaluate((el) => {
      el.value = "#222222"
    })
    await input3.evaluate((el) => {
      el.value = "#333333"
    })

    // Modify input1
    await input1.click()
    await waitForPicker(page)
    await setPickerHexValue(page, "#ffffff")
    await page.keyboard.press("Enter")
    await page.waitForTimeout(100)

    // Verify input1 changed
    const value1 = await input1.inputValue()
    expect(value1.toLowerCase()).toBe("#ffffff")

    // Verify input2 and input3 unchanged
    const value2 = await input2.inputValue()
    const value3 = await input3.inputValue()
    expect(value2.toLowerCase()).toBe("#222222")
    expect(value3.toLowerCase()).toBe("#333333")
  })

  test("only one picker visible at a time with multiple inputs", async () => {
    const input1 = page.getByTestId("color-basic")
    const input2 = page.getByTestId("color-2")

    // Open picker for input1
    await input1.click()
    await waitForPicker(page)

    // Count pickers
    let pickers = await page.locator(".bcp-color-picker").all()
    expect(pickers.length).toBe(1)

    // Click input2
    await input2.click()
    await waitForPicker(page)

    // Should still only be one picker
    pickers = await page.locator(".bcp-color-picker").all()
    expect(pickers.length).toBe(1)
  })

  test("rapid switching between inputs", async () => {
    const input1 = page.getByTestId("color-basic")
    const input2 = page.getByTestId("color-2")
    const input3 = page.getByTestId("color-3")

    // Set distinct colors
    await input1.evaluate((el) => {
      el.value = "#ff0000"
    })
    await input2.evaluate((el) => {
      el.value = "#00ff00"
    })
    await input3.evaluate((el) => {
      el.value = "#0000ff"
    })

    // Rapidly switch between inputs
    await input1.click()
    await waitForPicker(page, 1000)

    await input2.click()
    await waitForPicker(page, 1000)

    await input3.click()
    await waitForPicker(page, 1000)

    await input1.click()
    await waitForPicker(page, 1000)

    // Picker should show the last clicked input's color (input1)
    const hexValue = await getPickerHexValue(page)
    expect(hexValue.toLowerCase()).toBe("#ff0000")

    // Should still only have one picker
    const pickers = await page.locator(".bcp-color-picker").all()
    expect(pickers.length).toBe(1)
  })
})
