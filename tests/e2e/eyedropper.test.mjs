/**
 * E2E Tests: Eyedropper Functionality
 * Tests eyedropper activation, color selection, and picker integration
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
 * Helper: Create a mock screenshot data URL with a specific color at a point
 */
function createMockScreenshot(width, height, color = "#ff0000") {
  const canvas = `
    const canvas = document.createElement('canvas');
    canvas.width = ${width};
    canvas.height = ${height};
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '${color}';
    ctx.fillRect(0, 0, ${width}, ${height});
    return canvas.toDataURL();
  `
  return canvas
}

// Test suite with extension loaded
test.describe("Eyedropper Functionality", () => {
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

    // Mock browser APIs
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
        runtime: {
          // Mock sendMessage for screenshot capture
          async sendMessage(message) {
            if (message.type === "CAPTURE_SCREENSHOT") {
              // Create a mock screenshot with a known color
              const canvas = document.createElement("canvas")
              canvas.width = window.innerWidth * window.devicePixelRatio
              canvas.height = window.innerHeight * window.devicePixelRatio
              const ctx = canvas.getContext("2d")

              // Fill with a test color (blue #0000ff)
              ctx.fillStyle = "#0000ff"
              ctx.fillRect(0, 0, canvas.width, canvas.height)

              return canvas.toDataURL()
            }
            return null
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

  test("eyedropper button exists in picker", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)
    const eyedropperBtn = picker.locator(".bcp-eyedropper-btn")

    // Check button exists
    await expect(eyedropperBtn).toBeVisible()

    // Check button has proper attributes
    const title = await eyedropperBtn.getAttribute("title")
    expect(title).toBe("Pick color from page")
  })

  test("eyedropper button has SVG icon", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)
    const eyedropperBtn = picker.locator(".bcp-eyedropper-btn")
    const svg = eyedropperBtn.locator("svg")

    // Check SVG exists
    await expect(svg).toBeVisible()

    // Check SVG has paths (the icon)
    const paths = svg.locator("path")
    const pathCount = await paths.count()
    expect(pathCount).toBeGreaterThan(0)
  })

  test("clicking eyedropper button opens overlay", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)
    const eyedropperBtn = picker.locator(".bcp-eyedropper-btn")

    // Click eyedropper button
    await eyedropperBtn.click()

    // Wait for overlay to appear
    await page.waitForTimeout(200)

    // Check overlay exists
    const overlay = page.locator(".bcp-eyedropper-overlay")
    await expect(overlay).toBeVisible()

    // Check overlay has screenshot canvas
    const canvas = overlay.locator("canvas").first()
    await expect(canvas).toBeVisible()
  })

  test("eyedropper overlay shows zoom preview on mousemove", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)
    const eyedropperBtn = picker.locator(".bcp-eyedropper-btn")

    // Click eyedropper button
    await eyedropperBtn.click()
    await page.waitForTimeout(200)

    const overlay = page.locator(".bcp-eyedropper-overlay")

    // Move mouse over overlay
    const box = await overlay.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(100)

    // Check preview appears
    const preview = page.locator(".bcp-eyedropper-preview")
    await expect(preview).toBeVisible()

    // Check preview has zoom canvas
    const zoomCanvas = preview.locator(".bcp-eyedropper-zoom-canvas")
    await expect(zoomCanvas).toBeVisible()

    // Check preview has color preview element
    const previewColor = preview.locator(".bcp-eyedropper-preview-color")
    await expect(previewColor).toBeVisible()

    // Check preview has text (hex value)
    const previewText = preview.locator(".bcp-eyedropper-preview-text")
    await expect(previewText).toBeVisible()
    const text = await previewText.textContent()
    expect(text).toMatch(/^#[0-9A-F]{6}$/)
  })

  test("clicking eyedropper overlay selects color", async () => {
    const input = page.getByTestId("color-basic")

    // Set initial color
    await input.evaluate((el) => {
      el.value = "#ff0000"
    })

    // Open picker
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)
    const eyedropperBtn = picker.locator(".bcp-eyedropper-btn")

    // Click eyedropper button
    await eyedropperBtn.click()
    await page.waitForTimeout(200)

    const overlay = page.locator(".bcp-eyedropper-overlay")

    // Click on overlay to select color
    const box = await overlay.boundingBox()
    await overlay.click({
      position: {
        x: box.width / 2,
        y: box.height / 2,
      },
    })

    // Wait for update
    await page.waitForTimeout(200)

    // Overlay should be gone
    await expect(overlay).not.toBeVisible()

    // Picker should still be visible
    await expect(picker).toBeVisible()

    // Color should have changed (mock screenshot returns blue #0000ff)
    const inputValue = await input.inputValue()
    expect(inputValue.toLowerCase()).toBe("#0000ff")
  })

  test("eyedropper updates picker UI after color selection", async () => {
    const input = page.getByTestId("color-basic")

    // Set initial color
    await input.evaluate((el) => {
      el.value = "#ff0000"
    })

    // Open picker
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)
    const eyedropperBtn = picker.locator(".bcp-eyedropper-btn")

    // Click eyedropper button
    await eyedropperBtn.click()
    await page.waitForTimeout(200)

    const overlay = page.locator(".bcp-eyedropper-overlay")

    // Click to select color
    await overlay.click({ position: { x: 100, y: 100 } })
    await page.waitForTimeout(200)

    // Check hex input was updated
    const hexValue = await getPickerHexValue(page)
    expect(hexValue.toLowerCase()).toBe("#0000ff")

    // Check color preview was updated
    const preview = picker.locator(".bcp-preview-color")
    const bgColor = await preview.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    expect(bgColor).toMatch(/rgb\(0,\s*0,\s*255\)/)
  })

  test("pressing Escape cancels eyedropper", async () => {
    const input = page.getByTestId("color-basic")

    // Set initial color
    await input.evaluate((el) => {
      el.value = "#ff0000"
    })

    // Open picker
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)
    const eyedropperBtn = picker.locator(".bcp-eyedropper-btn")

    // Click eyedropper button
    await eyedropperBtn.click()
    await page.waitForTimeout(200)

    const overlay = page.locator(".bcp-eyedropper-overlay")
    await expect(overlay).toBeVisible()

    // Press Escape
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)

    // Overlay should be gone
    await expect(overlay).not.toBeVisible()

    // Picker should still be visible
    await expect(picker).toBeVisible()

    // Color should not have changed
    const inputValue = await input.inputValue()
    expect(inputValue.toLowerCase()).toBe("#ff0000")
  })

  test("eyedropper overlay has correct z-index", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)
    const eyedropperBtn = picker.locator(".bcp-eyedropper-btn")

    // Click eyedropper button
    await eyedropperBtn.click()
    await page.waitForTimeout(200)

    const overlay = page.locator(".bcp-eyedropper-overlay")

    // Check z-index is maximum (same as picker)
    const zIndex = await overlay.evaluate((el) => {
      return window.getComputedStyle(el).zIndex
    })
    expect(zIndex).toBe("2147483647")
  })

  test("eyedropper zoom preview has correct dimensions", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)
    const eyedropperBtn = picker.locator(".bcp-eyedropper-btn")

    // Click eyedropper button
    await eyedropperBtn.click()
    await page.waitForTimeout(200)

    const overlay = page.locator(".bcp-eyedropper-overlay")

    // Move mouse to show preview
    const box = await overlay.boundingBox()
    await page.mouse.move(box.x + 100, box.y + 100)
    await page.waitForTimeout(100)

    const zoomCanvas = page.locator(".bcp-eyedropper-zoom-canvas")
    await expect(zoomCanvas).toBeVisible()

    // Check dimensions (should be around 126-134px including borders/padding)
    const canvasBox = await zoomCanvas.boundingBox()
    expect(canvasBox.width).toBeGreaterThanOrEqual(126)
    expect(canvasBox.width).toBeLessThanOrEqual(140)
    expect(canvasBox.height).toBeGreaterThanOrEqual(126)
    expect(canvasBox.height).toBeLessThanOrEqual(140)

    // Check it's circular (border-radius: 50%)
    const borderRadius = await zoomCanvas.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius
    })
    expect(borderRadius).toMatch(/50%|63px/)
  })

  test("multiple eyedropper activations work correctly", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)

    const picker = await getPicker(page)
    const eyedropperBtn = picker.locator(".bcp-eyedropper-btn")

    // First activation
    await eyedropperBtn.click()
    await page.waitForTimeout(200)

    let overlay = page.locator(".bcp-eyedropper-overlay")
    await expect(overlay).toBeVisible()

    // Cancel with Escape
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)
    await expect(overlay).not.toBeVisible()

    // Second activation
    await eyedropperBtn.click()
    await page.waitForTimeout(200)

    overlay = page.locator(".bcp-eyedropper-overlay")
    await expect(overlay).toBeVisible()

    // Select color this time
    await overlay.click({ position: { x: 100, y: 100 } })
    await page.waitForTimeout(200)

    // Overlay should be gone
    await expect(overlay).not.toBeVisible()

    // Color should be updated
    const inputValue = await input.inputValue()
    expect(inputValue.toLowerCase()).toBe("#0000ff")
  })
})
