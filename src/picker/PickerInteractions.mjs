/**
 * Handles all user interactions with the color picker
 */

import { hexToHSV, hsvToHex } from "../utils/ColorConversions.mjs"

export class PickerInteractions {
  constructor(container, currentInput, onColorChange) {
    this.container = container
    this.currentInput = currentInput
    this.onColorChange = onColorChange
    this.currentHSV = { h: 0, s: 100, v: 100 }

    // DOM elements
    this.slArea = container.querySelector(".bcp-saturation-lightness")
    this.slCursor = container.querySelector(".bcp-sl-cursor")
    this.hueSlider = container.querySelector(".bcp-hue-slider")
    this.hueThumb = this.hueSlider.querySelector(".bcp-slider-thumb")
    this.hexInput = container.querySelector(".bcp-hex-input")
    this.previewColor = container.querySelector(".bcp-preview-color")

    // Dragging state
    this.isDraggingSL = false
    this.isDraggingHue = false

    // Bound event handlers
    this.boundHandlers = {
      slMouseDown: this._handleSLMouseDown.bind(this),
      hueMouseDown: this._handleHueMouseDown.bind(this),
      hexInput: this._handleHexInput.bind(this),
      hexKeydown: this._handleHexKeydown.bind(this),
      hexBlur: this._handleHexBlur.bind(this),
      mouseMove: this._handleMouseMove.bind(this),
      mouseUp: this._handleMouseUp.bind(this),
    }
  }

  setup() {
    // Initialize from current input value
    const initialColor = this.currentInput.value || "#000000"
    this.currentHSV = hexToHSV(initialColor)
    this._updateColorDisplay()

    // Setup event listeners
    this.slArea.addEventListener("mousedown", this.boundHandlers.slMouseDown)
    this.hueSlider.addEventListener(
      "mousedown",
      this.boundHandlers.hueMouseDown,
    )
    this.hexInput.addEventListener("input", this.boundHandlers.hexInput)
    this.hexInput.addEventListener("keydown", this.boundHandlers.hexKeydown)
    this.hexInput.addEventListener("blur", this.boundHandlers.hexBlur)
    document.addEventListener("mousemove", this.boundHandlers.mouseMove)
    document.addEventListener("mouseup", this.boundHandlers.mouseUp)
  }

  cleanup() {
    this.slArea.removeEventListener("mousedown", this.boundHandlers.slMouseDown)
    this.hueSlider.removeEventListener(
      "mousedown",
      this.boundHandlers.hueMouseDown,
    )
    this.hexInput.removeEventListener("input", this.boundHandlers.hexInput)
    this.hexInput.removeEventListener("keydown", this.boundHandlers.hexKeydown)
    this.hexInput.removeEventListener("blur", this.boundHandlers.hexBlur)
    document.removeEventListener("mousemove", this.boundHandlers.mouseMove)
    document.removeEventListener("mouseup", this.boundHandlers.mouseUp)
  }

  _handleSLMouseDown(e) {
    this.isDraggingSL = true
    this._updateSL(e)
  }

  _handleHueMouseDown(e) {
    this.isDraggingHue = true
    this._updateHue(e)
  }

  _handleMouseMove(e) {
    if (this.isDraggingSL) {
      this._updateSL(e)
    } else if (this.isDraggingHue) {
      this._updateHue(e)
    }
  }

  _handleMouseUp() {
    this.isDraggingSL = false
    this.isDraggingHue = false
  }

  _updateSL(e) {
    const rect = this.slArea.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top

    x = Math.max(0, Math.min(x, rect.width))
    y = Math.max(0, Math.min(y, rect.height))

    const s = (x / rect.width) * 100
    const v = 100 - (y / rect.height) * 100

    this.currentHSV.s = s
    this.currentHSV.v = v

    this.slCursor.style.left = s + "%"
    this.slCursor.style.top = 100 - v + "%"

    this._updateColorDisplay()
  }

  _updateHue(e) {
    const rect = this.hueSlider.getBoundingClientRect()
    let x = e.clientX - rect.left
    x = Math.max(0, Math.min(x, rect.width))

    const h = (x / rect.width) * 360
    this.currentHSV.h = h

    this.hueThumb.style.left = (h / 360) * 100 + "%"
    this.slArea.setAttribute("data-hue", h)

    // Update SL area background
    const baseColor = hsvToHex({ h: h, s: 100, v: 100 })
    this.slArea.style.backgroundColor = baseColor

    this._updateColorDisplay()
  }

  _handleHexInput(e) {
    let value = e.target.value
    if (!value.startsWith("#")) {
      value = "#" + value
    }

    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      const hsv = hexToHSV(value)
      this.currentHSV = hsv

      // Update UI
      this.slCursor.style.left = hsv.s + "%"
      this.slCursor.style.top = 100 - hsv.v + "%"
      this.hueThumb.style.left = (hsv.h / 360) * 100 + "%"
      this.slArea.setAttribute("data-hue", hsv.h)
      this.slArea.style.backgroundColor = hsvToHex({
        h: hsv.h,
        s: 100,
        v: 100,
      })

      this._updateColorDisplay(false) // Don't update hex input to avoid cursor jump
    }
  }

  _handleHexKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (this.onColorChange) {
        this.onColorChange("close")
      }
    }
  }

  _handleHexBlur() {
    this._updateColorDisplay()
  }

  _updateColorDisplay(updateHexInput = true) {
    if (!this.currentInput) {
      return // Picker was closed, stop updating
    }

    const hexColor = hsvToHex(this.currentHSV)

    if (updateHexInput) {
      this.hexInput.value = hexColor.toUpperCase()
    }

    this.previewColor.style.backgroundColor = hexColor

    // Update input value and trigger events
    if (this.currentInput) {
      this.currentInput.value = hexColor
      this.currentInput.dispatchEvent(new Event("input", { bubbles: true }))
      this.currentInput.dispatchEvent(new Event("change", { bubbles: true }))
    }
  }

  /**
   * Update picker UI from a hex color (for eyedropper, recent colors, etc.)
   * @param {string} hexColor - Hex color value
   */
  updateFromHex(hexColor) {
    const hsv = hexToHSV(hexColor)
    this.currentHSV = hsv

    // Update saturation/lightness cursor position
    this.slCursor.style.left = hsv.s + "%"
    this.slCursor.style.top = 100 - hsv.v + "%"

    // Update hue slider position
    this.hueThumb.style.left = (hsv.h / 360) * 100 + "%"

    // Update saturation/lightness area background
    const baseColor = hsvToHex({ h: hsv.h, s: 100, v: 100 })
    this.slArea.style.backgroundColor = baseColor
    this.slArea.setAttribute("data-hue", hsv.h)

    // Update hex input and preview
    this.hexInput.value = hexColor.toUpperCase()
    this.previewColor.style.backgroundColor = hexColor
  }
}
