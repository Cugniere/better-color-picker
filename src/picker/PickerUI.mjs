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

    container.innerHTML = `
      <div class="bcp-picker-content">
        <div class="bcp-saturation-lightness" data-hue="${hsv.h}" style="background-color: ${baseColor}">
          <div class="bcp-sl-overlay-white"></div>
          <div class="bcp-sl-overlay-black"></div>
          <div class="bcp-sl-cursor" style="left: ${hsv.s}%; top: ${100 - hsv.v}%"></div>
        </div>

        <div class="bcp-controls">
          <div class="bcp-tool-preview">
            <div class="bcp-tool-preview">
              <div class="bcp-color-preview">
                <div class="bcp-preview-bg"></div>
                <div class="bcp-preview-color" style="background-color: ${initialColor}"></div>
              </div>
            </div>
          </div>

          <div class="bcp-sliders">
            <div class="bcp-slider-row">
              <div class="bcp-hue-slider">
                <div class="bcp-slider-track bcp-hue-track"></div>
                <div class="bcp-slider-thumb" style="left: ${(hsv.h / 360) * 100}%"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bcp-hex-input-row">
          <input type="text" class="bcp-hex-input" value="${initialColor.toUpperCase()}" maxlength="7" />
        </div>

        <div class="bcp-recent-colors"></div>
      </div>
    `

    return container
  }

  static updateRecentColorsDisplay(container, recentColors, onColorClick) {
    const recentContainer = container.querySelector(".bcp-recent-colors")

    if (!recentColors || recentColors.length === 0) {
      return
    }

    recentContainer.innerHTML = '<div class="bcp-recent-label">Recent:</div>'

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
