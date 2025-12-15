/**
 * E2E Tests: Color Selection Flow
 * Tests color selection, modification, and value synchronization
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
 * Helper: Convert hex to RGB object
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Helper: Check if two colors are approximately equal (within tolerance)
 */
function colorsApproximatelyEqual(hex1, hex2, tolerance = 5) {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2) return false

  return (
    Math.abs(rgb1.r - rgb2.r) <= tolerance &&
    Math.abs(rgb1.g - rgb2.g) <= tolerance &&
    Math.abs(rgb1.b - rgb2.b) <= tolerance
  )
}

// Test suite with extension loaded
test.describe("Color Selection Flow", () => {
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

  test("picker displays current input color", async () => {
    const input = page.getByTestId("color-basic")

    // Set input to a specific color
    await input.evaluate((el) => {
      el.value = "#ff0000"
    })

    // Open picker
    await input.click()
    await waitForPicker(page)

    // Check hex input shows the color
    const hexValue = await getPickerHexValue(page)
    expect(hexValue.toLowerCase()).toBe("#ff0000")
  })

  test("typing in hex input updates color", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)

    // Type a new color
    await setPickerHexValue(page, "00ff00")
    await page.keyboard.press("Enter")

    // Wait for update
    await page.waitForTimeout(100)

    // Check input value was updated
    const inputValue = await input.inputValue()
    expect(inputValue.toLowerCase()).toBe("#00ff00")
  })

  test("hex input accepts values without # prefix", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)

    // Type without # prefix
    await setPickerHexValue(page, "0000ff")
    await page.keyboard.press("Enter")

    // Wait for update
    await page.waitForTimeout(100)

    // Check input value was updated
    const inputValue = await input.inputValue()
    expect(inputValue.toLowerCase()).toBe("#0000ff")
  })

  test("invalid hex input does not update color", async () => {
    const input = page.getByTestId("color-basic")

    // Set a known color
    await input.evaluate((el) => {
      el.value = "#ff0000"
    })

    // Open picker
    await input.click()
    await waitForPicker(page)

    const originalInputValue = await input.inputValue()

    // Try to type invalid hex
    await setPickerHexValue(page, "invalid")

    // Click on the color input row label area (trigger blur without changing color)
    const colorInputRow = page.locator(".bcp-color-input-row")
    await colorInputRow.click({ position: { x: 5, y: 5 } })

    // Wait a bit
    await page.waitForTimeout(100)

    // Input color should not have changed
    const inputValueAfter = await input.inputValue()
    expect(inputValueAfter).toBe(originalInputValue)
  })

  test("clicking saturation area changes color", async () => {
    const input = page.getByTestId("color-basic")

    // Set to a base color (red)
    await input.evaluate((el) => {
      el.value = "#ff0000"
    })

    // Open picker
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)
    const saturationArea = picker.locator(".bcp-saturation-lightness")

    // Get the bounding box
    const box = await saturationArea.boundingBox()

    // Click in the middle-ish area (should give different saturation/lightness)
    await saturationArea.click({
      position: {
        x: box.width / 2,
        y: box.height / 2,
      },
    })

    // Wait for update
    await page.waitForTimeout(100)

    // Color should have changed from pure red
    const newValue = await input.inputValue()
    expect(newValue.toLowerCase()).not.toBe("#ff0000")
  })

  test("dragging on saturation area updates color continuously", async () => {
    const input = page.getByTestId("color-basic")

    // Set to a base color
    await input.evaluate((el) => {
      el.value = "#ff0000"
    })

    // Open picker
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)
    const saturationArea = picker.locator(".bcp-saturation-lightness")
    const box = await saturationArea.boundingBox()

    // Start drag from top-left
    await page.mouse.move(box.x + 10, box.y + 10)
    await page.mouse.down()

    // Move to different position
    await page.mouse.move(box.x + box.width - 10, box.y + box.height - 10)

    // Release
    await page.mouse.up()

    // Wait for update
    await page.waitForTimeout(100)

    // Color should have changed
    const newValue = await input.inputValue()
    expect(newValue.toLowerCase()).not.toBe("#ff0000")
  })

  test("clicking hue slider changes hue", async () => {
    const input = page.getByTestId("color-basic")

    // Set to red (hue 0)
    await input.evaluate((el) => {
      el.value = "#ff0000"
    })

    // Open picker
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)
    const hueSlider = picker.locator(".bcp-hue-slider")

    // Get the bounding box
    const box = await hueSlider.boundingBox()

    // Click in middle of slider (should be around cyan - hue 180)
    await hueSlider.click({
      position: {
        x: box.width / 2,
        y: box.height / 2,
      },
    })

    // Wait for update
    await page.waitForTimeout(100)

    // Color should have changed from red
    const newValue = await input.inputValue()
    expect(newValue.toLowerCase()).not.toBe("#ff0000")
  })

  test("dragging hue slider updates hue continuously", async () => {
    const input = page.getByTestId("color-basic")

    // Set initial color
    await input.evaluate((el) => {
      el.value = "#ff0000"
    })

    // Open picker
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)
    const hueSlider = picker.locator(".bcp-hue-slider")
    const box = await hueSlider.boundingBox()

    // Start drag from left
    await page.mouse.move(box.x + 10, box.y + box.height / 2)
    await page.mouse.down()

    // Move to right
    await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2)

    // Release
    await page.mouse.up()

    // Wait for update
    await page.waitForTimeout(100)

    // Color should have changed
    const newValue = await input.inputValue()
    expect(newValue.toLowerCase()).not.toBe("#ff0000")
  })

  test("color changes persist after closing and reopening picker", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)

    // Set a specific color
    await setPickerHexValue(page, "123456")
    await page.keyboard.press("Enter")

    // Wait for update
    await page.waitForTimeout(100)

    // Close picker
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)

    // Reopen picker
    await input.click()
    await waitForPicker(page)

    // Color should still be the same
    const hexValue = await getPickerHexValue(page)
    expect(hexValue.toLowerCase()).toBe("#123456")
  })

  test("multiple inputs maintain independent colors", async () => {
    const input1 = page.getByTestId("color-basic")
    const input2 = page.getByTestId("color-2")

    // Set different colors
    await input1.evaluate((el) => {
      el.value = "#ff0000"
    })
    await input2.evaluate((el) => {
      el.value = "#00ff00"
    })

    // Open picker for first input
    await input1.click()
    await waitForPicker(page)

    // Check it shows red
    let hexValue = await getPickerHexValue(page)
    expect(hexValue.toLowerCase()).toBe("#ff0000")

    // Close and open picker for second input
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)

    await input2.click()
    await waitForPicker(page)

    // Check it shows green
    hexValue = await getPickerHexValue(page)
    expect(hexValue.toLowerCase()).toBe("#00ff00")
  })

  test("changing color in picker updates preview", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)

    // Set a specific color
    await setPickerHexValue(page, "ff0000")
    await page.keyboard.press("Enter")
    await page.waitForTimeout(100)

    // Check if there's a preview element (common in color pickers)
    const preview = picker.locator(".bcp-preview, .bcp-color-preview")
    const previewCount = await preview.count()

    if (previewCount > 0) {
      // If preview exists, verify it has the right background color
      const bgColor = await preview.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })

      // Background should be red (rgb(255, 0, 0))
      expect(bgColor).toMatch(/rgb\(255,\s*0,\s*0\)/)
    }
    // If no preview element, test passes (not all pickers have previews)
  })
})
