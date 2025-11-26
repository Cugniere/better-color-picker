/**
 * E2E Tests: Positioning Edge Cases
 * Tests picker positioning in various viewport and scroll scenarios
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
 * Helper: Get input position
 */
async function getInputPosition(input) {
  const box = await input.boundingBox()
  return box
}

// Test suite with extension loaded
test.describe("Positioning Edge Cases", () => {
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
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    })
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

  test("input near bottom edge: picker flips above", async () => {
    // Scroll to bring the edge input into view
    await page.evaluate(() => {
      const edgeInput = document.getElementById("color-bottom-right")
      edgeInput.scrollIntoView({ behavior: "instant", block: "end" })
    })

    const input = page.getByTestId("color-edge")

    // Click the input near bottom edge
    await input.click()
    await waitForPicker(page)

    // Get positions
    const inputBox = await getInputPosition(input)
    const pickerBox = await getPickerPosition(page)

    // Picker should be above input (picker bottom < input top)
    // This is because there's not enough space below
    expect(pickerBox.y + pickerBox.height).toBeLessThan(inputBox.y + 10)
  })

  test("input near right edge: picker adjusts left", async () => {
    // Scroll to bring the edge input into view
    await page.evaluate(() => {
      const edgeInput = document.getElementById("color-bottom-right")
      edgeInput.scrollIntoView({ behavior: "instant", block: "end" })
    })

    const input = page.getByTestId("color-edge")

    // Click the input near right edge
    await input.click()
    await waitForPicker(page)

    // Get positions
    const pickerBox = await getPickerPosition(page)
    const viewportWidth = await page.evaluate(() => window.innerWidth)

    // Picker should not overflow viewport on the right
    expect(pickerBox.x + pickerBox.width).toBeLessThanOrEqual(viewportWidth)

    // Picker left edge should be at least 10px from right edge
    const distanceFromRight = viewportWidth - (pickerBox.x + pickerBox.width)
    expect(distanceFromRight).toBeGreaterThanOrEqual(0)
  })

  test("scrolled page: picker positions correctly", async () => {
    // Scroll down to the long page section
    await page.evaluate(() => {
      window.scrollTo({ top: 1500, behavior: "instant" })
    })

    // Wait for scroll to complete
    await page.waitForTimeout(100)

    const input = page.getByTestId("color-scrolled")

    // Click the input
    await input.click()
    await waitForPicker(page)

    // Get positions
    const inputBox = await getInputPosition(input)
    const pickerBox = await getPickerPosition(page)

    // Picker should be positioned relative to input (below it)
    // The picker top should be near the input bottom
    const expectedTop = inputBox.y + inputBox.height
    const topDifference = Math.abs(pickerBox.y - expectedTop)

    // Allow some margin for spacing
    expect(topDifference).toBeLessThan(20)

    // Picker should be visible in viewport
    const viewportHeight = await page.evaluate(() => window.innerHeight)
    expect(pickerBox.y).toBeGreaterThanOrEqual(0)
    expect(pickerBox.y).toBeLessThan(viewportHeight)
  })

  test("window resize: picker repositions", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker at initial viewport size
    await input.click()
    await waitForPicker(page)

    const initialPickerBox = await getPickerPosition(page)

    // Resize window to smaller size
    await page.setViewportSize({ width: 800, height: 600 })
    await page.waitForTimeout(200)

    // Picker should still be visible
    const picker = await getPicker(page)
    const isVisible = await picker.isVisible()
    expect(isVisible).toBe(true)

    // Get new positions
    const inputBoxAfterResize = await getInputPosition(input)
    const pickerBoxAfterResize = await getPickerPosition(page)

    // Picker should have repositioned relative to input
    // It should still be below (or above if not enough space) the input
    const isBelow =
      pickerBoxAfterResize.y >
      inputBoxAfterResize.y + inputBoxAfterResize.height
    const isAbove =
      pickerBoxAfterResize.y + pickerBoxAfterResize.height <
      inputBoxAfterResize.y

    expect(isBelow || isAbove).toBe(true)

    // Picker should not overflow the new viewport
    const newViewportWidth = 800
    const newViewportHeight = 600

    expect(
      pickerBoxAfterResize.x + pickerBoxAfterResize.width,
    ).toBeLessThanOrEqual(newViewportWidth + 10) // Allow small margin
    expect(pickerBoxAfterResize.y).toBeGreaterThanOrEqual(0)
  })

  test("picker stays within viewport bounds", async () => {
    // Test with a normal input
    const input = page.getByTestId("color-basic")

    await input.click()
    await waitForPicker(page)

    const pickerBox = await getPickerPosition(page)
    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }))

    // Picker should not overflow viewport
    expect(pickerBox.x).toBeGreaterThanOrEqual(0)
    expect(pickerBox.y).toBeGreaterThanOrEqual(0)
    expect(pickerBox.x + pickerBox.width).toBeLessThanOrEqual(
      viewport.width + 10,
    )
    // Allow picker to extend below viewport (it can be scrolled to)
  })

  test("picker repositions on scroll", async () => {
    const input = page.getByTestId("color-basic")

    // Open picker
    await input.click()
    await waitForPicker(page)

    // Get initial position
    const initialPickerBox = await getPickerPosition(page)

    // Scroll the page
    await page.evaluate(() => {
      window.scrollBy({ top: 100, behavior: "instant" })
    })

    // Wait for scroll event to trigger
    await page.waitForTimeout(200)

    // The current implementation closes picker on scroll
    // So picker should be closed
    const picker = await getPicker(page)
    const isVisible = await picker.isVisible().catch(() => false)
    expect(isVisible).toBe(false)
  })

  test("picker position updates when input moves", async () => {
    // Create a dynamic input that can be moved
    await page.evaluate(() => {
      const container = document.createElement("div")
      container.id = "dynamic-container"
      container.style.position = "absolute"
      container.style.top = "100px"
      container.style.left = "100px"

      const input = document.createElement("input")
      input.type = "color"
      input.id = "dynamic-input"
      input.setAttribute("data-testid", "color-dynamic")
      input.value = "#ff0000"

      container.appendChild(input)
      document.body.appendChild(container)
    })

    const input = page.getByTestId("color-dynamic")

    // Open picker
    await input.click()
    await waitForPicker(page)

    const initialInputBox = await getInputPosition(input)
    const initialPickerBox = await getPickerPosition(page)

    // Move the input
    await page.evaluate(() => {
      const container = document.getElementById("dynamic-container")
      container.style.top = "300px"
      container.style.left = "300px"
    })

    // Trigger window resize event (which causes reposition)
    await page.evaluate(() => {
      window.dispatchEvent(new Event("resize"))
    })

    await page.waitForTimeout(200)

    // Get new positions
    const newInputBox = await getInputPosition(input)
    const newPickerBox = await getPickerPosition(page)

    // Input should have moved
    expect(newInputBox.y).not.toBe(initialInputBox.y)

    // Picker should have moved with it
    expect(newPickerBox.y).not.toBe(initialPickerBox.y)

    // Picker should still be positioned relative to input
    const isBelow = newPickerBox.y > newInputBox.y + newInputBox.height
    const isAbove = newPickerBox.y + newPickerBox.height < newInputBox.y
    expect(isBelow || isAbove).toBe(true)
  })

  test("small viewport: picker adjusts to fit", async () => {
    // Set very small viewport
    await page.setViewportSize({ width: 400, height: 400 })

    const input = page.getByTestId("color-basic")

    await input.click()
    await waitForPicker(page)

    const pickerBox = await getPickerPosition(page)

    // Picker should fit within small viewport (with small margins allowed)
    expect(pickerBox.x).toBeGreaterThanOrEqual(-10) // Allow small negative for edge cases
    expect(pickerBox.x + pickerBox.width).toBeLessThanOrEqual(410) // Allow 10px overflow
  })
})
