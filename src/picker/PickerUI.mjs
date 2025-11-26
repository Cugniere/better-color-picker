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

    // Create preview container with eyedropper
    const toolPreviewOuter = document.createElement("div")
    toolPreviewOuter.className = "bcp-tool-preview"

    const toolPreviewInner = document.createElement("div")
    toolPreviewInner.className = "bcp-tool-preview-inner"

    // Create eyedropper button
    const eyedropperBtn = document.createElement("button")
    eyedropperBtn.type = "button"
    eyedropperBtn.className = "bcp-eyedropper-btn"
    eyedropperBtn.title = "Pick color from page"
    eyedropperBtn.setAttribute("aria-label", "Pick color from page")

    // Create eyedropper icon (SVG)
    const iconSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    )
    iconSvg.setAttribute("viewBox", "0 0 24 24")
    iconSvg.setAttribute("width", "24")
    iconSvg.setAttribute("height", "24")
    iconSvg.setAttribute("fill", "none")

    const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path1.setAttribute(
      "d",
      "M7 13.161L12.4644 7.6966C12.8549 7.30607 13.4881 7.30607 13.8786 7.6966L15.9999 9.81792C16.3904 10.2084 16.3904 10.8416 15.9999 11.2321L14.0711 13.161M7 13.161L4.82764 15.3334C4.73428 15.4267 4.66034 15.5376 4.61007 15.6597L3.58204 18.1563C3.07438 19.3892 4.30728 20.6221 5.54018 20.1145L8.03681 19.0865C8.1589 19.0362 8.26981 18.9622 8.36317 18.8689L14.0711 13.161M7 13.161H14.0711",
    )
    path1.setAttribute("stroke", "currentColor")
    path1.setAttribute("stroke-width", "1.5")
    path1.setAttribute("stroke-linecap", "round")
    path1.setAttribute("stroke-linejoin", "round")

    const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path2.setAttribute(
      "d",
      "M13.878 3.45401L15.9993 5.57533M20.242 9.81798L18.1206 7.69666M15.9993 5.57533L17.4135 4.16112C17.8041 3.7706 18.4372 3.7706 18.8277 4.16112L19.5349 4.86823C19.9254 5.25875 19.9254 5.89192 19.5349 6.28244L18.1206 7.69666M15.9993 5.57533L18.1206 7.69666",
    )
    path2.setAttribute("stroke", "currentColor")
    path2.setAttribute("stroke-width", "1.5")
    path2.setAttribute("stroke-linecap", "round")
    path2.setAttribute("stroke-linejoin", "round")

    iconSvg.appendChild(path1)
    iconSvg.appendChild(path2)
    eyedropperBtn.appendChild(iconSvg)
    toolPreviewInner.appendChild(eyedropperBtn)

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
