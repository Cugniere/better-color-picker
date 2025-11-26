/**
 * Handles color picker DOM creation and UI updates
 */

import { hexToHSV, hexToRGB, hsvToHex } from "../utils/ColorConversions.mjs"

export class PickerUI {
  static createPickerElement(initialColor) {
    const container = document.createElement("div")
    container.className = "bcp-color-picker"

    const hsv = hexToHSV(initialColor)
    const rgb = hexToRGB(initialColor)
    const baseColor = hsvToHex({ h: hsv.h, s: 100, v: 100 })

    // Create main content container
    const content = document.createElement("div")
    content.className = "bcp-picker-content"

    // Create saturation-lightness area
    const slArea = document.createElement("div")
    slArea.className = "bcp-saturation-lightness"
    slArea.setAttribute("data-hue", hsv.h.toString())
    slArea.style.backgroundColor = baseColor

    const slWhiteOverlay = document.createElement("div")
    slWhiteOverlay.className = "bcp-sl-overlay-white"
    slArea.appendChild(slWhiteOverlay)

    const slBlackOverlay = document.createElement("div")
    slBlackOverlay.className = "bcp-sl-overlay-black"
    slArea.appendChild(slBlackOverlay)

    const slCursor = document.createElement("div")
    slCursor.className = "bcp-sl-cursor"
    slCursor.style.left = `${hsv.s}%`
    slCursor.style.top = `${100 - hsv.v}%`
    slArea.appendChild(slCursor)

    content.appendChild(slArea)

    // Create controls container
    const controls = document.createElement("div")
    controls.className = "bcp-controls"

    // Create preview container
    const toolPreviewOuter = document.createElement("div")
    toolPreviewOuter.className = "bcp-tool-preview"

    const toolPreviewInner = document.createElement("div")
    toolPreviewInner.className = "bcp-tool-preview"

    const colorPreview = document.createElement("div")
    colorPreview.className = "bcp-color-preview"

    const previewBg = document.createElement("div")
    previewBg.className = "bcp-preview-bg"
    colorPreview.appendChild(previewBg)

    const previewColor = document.createElement("div")
    previewColor.className = "bcp-preview-color"
    previewColor.style.backgroundColor = initialColor
    colorPreview.appendChild(previewColor)

    toolPreviewInner.appendChild(colorPreview)
    toolPreviewOuter.appendChild(toolPreviewInner)
    controls.appendChild(toolPreviewOuter)

    // Create sliders container
    const sliders = document.createElement("div")
    sliders.className = "bcp-sliders"

    const sliderRow = document.createElement("div")
    sliderRow.className = "bcp-slider-row"

    const hueSlider = document.createElement("div")
    hueSlider.className = "bcp-hue-slider"

    const sliderTrack = document.createElement("div")
    sliderTrack.className = "bcp-slider-track bcp-hue-track"
    hueSlider.appendChild(sliderTrack)

    const sliderThumb = document.createElement("div")
    sliderThumb.className = "bcp-slider-thumb"
    sliderThumb.style.left = `${(hsv.h / 360) * 100}%`
    hueSlider.appendChild(sliderThumb)

    sliderRow.appendChild(hueSlider)
    sliders.appendChild(sliderRow)
    controls.appendChild(sliders)

    content.appendChild(controls)

    // Create hex input row
    const hexInputRow = document.createElement("div")
    hexInputRow.className = "bcp-hex-input-row"

    const hexInput = document.createElement("input")
    hexInput.type = "text"
    hexInput.className = "bcp-hex-input"
    hexInput.value = initialColor.toUpperCase()
    hexInput.maxLength = 7
    hexInputRow.appendChild(hexInput)

    content.appendChild(hexInputRow)

    // Create recent colors container
    const recentColors = document.createElement("div")
    recentColors.className = "bcp-recent-colors"
    content.appendChild(recentColors)

    container.appendChild(content)

    return container
  }

  static updateRecentColorsDisplay(container, recentColors, onColorClick) {
    const recentContainer = container.querySelector(".bcp-recent-colors")

    if (!recentColors || recentColors.length === 0) {
      return
    }

    // Clear existing content
    recentContainer.textContent = ""

    // Create label
    const label = document.createElement("div")
    label.className = "bcp-recent-label"
    label.textContent = "Recent:"
    recentContainer.appendChild(label)

    // Create swatch container
    const swatchContainer = document.createElement("div")
    swatchContainer.className = "bcp-recent-swatches"

    recentColors.forEach((color) => {
      const swatch = document.createElement("button")
      swatch.className = "bcp-color-swatch"
      swatch.style.backgroundColor = color
      swatch.title = color
      swatch.addEventListener("click", () => onColorClick(color))
      swatchContainer.appendChild(swatch)
    })

    recentContainer.appendChild(swatchContainer)
  }
}
