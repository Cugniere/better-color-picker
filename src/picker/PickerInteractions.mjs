/**
 * Handles all user interactions with the color picker
 */

import {
  hexToHSV,
  hsvToHex,
  hexToRGB,
  hsvToRGB,
  hexToHSL,
  hslToHex,
  rgbToHSL,
} from "../utils/ColorConversions.mjs"

export class PickerInteractions {
  constructor(container, currentInput, onColorChange) {
    this.container = container
    this.currentInput = currentInput
    this.onColorChange = onColorChange
    this.currentHSV = { h: 0, s: 100, v: 100 }
    this.currentFormat = "hex" // 'hex' or 'rgb'

    // DOM elements
    this.slArea = container.querySelector(".bcp-saturation-lightness")
    this.slCursor = container.querySelector(".bcp-sl-cursor")
    this.hueSlider = container.querySelector(".bcp-hue-slider")
    this.hueThumb = this.hueSlider.querySelector(".bcp-slider-thumb")
    this.hexInput = container.querySelector(".bcp-hex-input")
    this.rgbInputR = container.querySelectorAll(".bcp-rgb-input")[0]
    this.rgbInputG = container.querySelectorAll(".bcp-rgb-input")[1]
    this.rgbInputB = container.querySelectorAll(".bcp-rgb-input")[2]
    this.hslInputH = container.querySelectorAll(".bcp-hsl-input")[0]
    this.hslInputS = container.querySelectorAll(".bcp-hsl-input")[1]
    this.hslInputL = container.querySelectorAll(".bcp-hsl-input")[2]
    this.formatToggle = container.querySelector(".bcp-format-toggle")
    this.hexContainer = container.querySelector(".bcp-hex-container")
    this.rgbContainer = container.querySelector(".bcp-rgb-container")
    this.hslContainer = container.querySelector(".bcp-hsl-container")
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
      rgbInput: this._handleRGBInput.bind(this),
      rgbKeydown: this._handleRGBKeydown.bind(this),
      hslInput: this._handleHSLInput.bind(this),
      hslKeydown: this._handleHSLKeydown.bind(this),
      formatToggleClick: this._handleFormatToggle.bind(this),
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
    this.rgbInputR.addEventListener("input", this.boundHandlers.rgbInput)
    this.rgbInputG.addEventListener("input", this.boundHandlers.rgbInput)
    this.rgbInputB.addEventListener("input", this.boundHandlers.rgbInput)
    this.rgbInputR.addEventListener("keydown", this.boundHandlers.rgbKeydown)
    this.rgbInputG.addEventListener("keydown", this.boundHandlers.rgbKeydown)
    this.rgbInputB.addEventListener("keydown", this.boundHandlers.rgbKeydown)
    this.hslInputH.addEventListener("input", this.boundHandlers.hslInput)
    this.hslInputS.addEventListener("input", this.boundHandlers.hslInput)
    this.hslInputL.addEventListener("input", this.boundHandlers.hslInput)
    this.hslInputH.addEventListener("keydown", this.boundHandlers.hslKeydown)
    this.hslInputS.addEventListener("keydown", this.boundHandlers.hslKeydown)
    this.hslInputL.addEventListener("keydown", this.boundHandlers.hslKeydown)
    this.formatToggle.addEventListener(
      "click",
      this.boundHandlers.formatToggleClick,
    )
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
    this.rgbInputR.removeEventListener("input", this.boundHandlers.rgbInput)
    this.rgbInputG.removeEventListener("input", this.boundHandlers.rgbInput)
    this.rgbInputB.removeEventListener("input", this.boundHandlers.rgbInput)
    this.rgbInputR.removeEventListener("keydown", this.boundHandlers.rgbKeydown)
    this.rgbInputG.removeEventListener("keydown", this.boundHandlers.rgbKeydown)
    this.rgbInputB.removeEventListener("keydown", this.boundHandlers.rgbKeydown)
    this.hslInputH.removeEventListener("input", this.boundHandlers.hslInput)
    this.hslInputS.removeEventListener("input", this.boundHandlers.hslInput)
    this.hslInputL.removeEventListener("input", this.boundHandlers.hslInput)
    this.hslInputH.removeEventListener("keydown", this.boundHandlers.hslKeydown)
    this.hslInputS.removeEventListener("keydown", this.boundHandlers.hslKeydown)
    this.hslInputL.removeEventListener("keydown", this.boundHandlers.hslKeydown)
    this.formatToggle.removeEventListener(
      "click",
      this.boundHandlers.formatToggleClick,
    )
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

  _handleRGBInput() {
    const r = parseInt(this.rgbInputR.value) || 0
    const g = parseInt(this.rgbInputG.value) || 0
    const b = parseInt(this.rgbInputB.value) || 0

    // Clamp values
    const rClamped = Math.max(0, Math.min(255, r))
    const gClamped = Math.max(0, Math.min(255, g))
    const bClamped = Math.max(0, Math.min(255, b))

    // Convert RGB to HSV
    const hexColor =
      "#" +
      [rClamped, gClamped, bClamped]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("")

    const hsv = hexToHSV(hexColor)
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

    this._updateColorDisplay(false) // Don't update RGB inputs to avoid cursor jump
  }

  _handleRGBKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (this.onColorChange) {
        this.onColorChange("close")
      }
    }
  }

  _handleHSLInput() {
    const h = parseInt(this.hslInputH.value) || 0
    const s = parseInt(this.hslInputS.value) || 0
    const l = parseInt(this.hslInputL.value) || 0

    // Clamp values
    const hClamped = Math.max(0, Math.min(360, h))
    const sClamped = Math.max(0, Math.min(100, s))
    const lClamped = Math.max(0, Math.min(100, l))

    // Convert HSL to hex
    const hexColor = hslToHex({ h: hClamped, s: sClamped, l: lClamped })

    const hsv = hexToHSV(hexColor)
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

    this._updateColorDisplay(false) // Don't update HSL inputs to avoid cursor jump
  }

  _handleHSLKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (this.onColorChange) {
        this.onColorChange("close")
      }
    }
  }

  _handleFormatToggle() {
    if (this.currentFormat === "hex") {
      // Switch to RGB
      this.currentFormat = "rgb"
      this.formatToggle.textContent = "RGB"
      this.hexContainer.classList.add("bcp-hidden")
      this.rgbContainer.classList.remove("bcp-hidden")
      this.hslContainer.classList.add("bcp-hidden")
    } else if (this.currentFormat === "rgb") {
      // Switch to HSL
      this.currentFormat = "hsl"
      this.formatToggle.textContent = "HSL"
      this.hexContainer.classList.add("bcp-hidden")
      this.rgbContainer.classList.add("bcp-hidden")
      this.hslContainer.classList.remove("bcp-hidden")
    } else {
      // Switch to HEX
      this.currentFormat = "hex"
      this.formatToggle.textContent = "HEX"
      this.hexContainer.classList.remove("bcp-hidden")
      this.rgbContainer.classList.add("bcp-hidden")
      this.hslContainer.classList.add("bcp-hidden")
    }
    this._updateColorDisplay()
  }

  _updateColorDisplay(updateInputs = true) {
    if (!this.currentInput) {
      return // Picker was closed, stop updating
    }

    const hexColor = hsvToHex(this.currentHSV)
    const rgb = hsvToRGB(
      this.currentHSV.h,
      this.currentHSV.s,
      this.currentHSV.v,
    )
    const hsl = rgbToHSL(rgb.r, rgb.g, rgb.b)

    if (updateInputs) {
      // Update hex input
      this.hexInput.value = hexColor.toUpperCase()

      // Update RGB inputs
      this.rgbInputR.value = rgb.r
      this.rgbInputG.value = rgb.g
      this.rgbInputB.value = rgb.b

      // Update HSL inputs
      this.hslInputH.value = Math.round(hsl.h)
      this.hslInputS.value = Math.round(hsl.s)
      this.hslInputL.value = Math.round(hsl.l)
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

    // Update hex input
    this.hexInput.value = hexColor.toUpperCase()

    // Update RGB inputs
    const rgb = hsvToRGB(hsv.h, hsv.s, hsv.v)
    this.rgbInputR.value = rgb.r
    this.rgbInputG.value = rgb.g
    this.rgbInputB.value = rgb.b

    // Update HSL inputs
    const hsl = rgbToHSL(rgb.r, rgb.g, rgb.b)
    this.hslInputH.value = Math.round(hsl.h)
    this.hslInputS.value = Math.round(hsl.s)
    this.hslInputL.value = Math.round(hsl.l)

    // Update preview
    this.previewColor.style.backgroundColor = hexColor
  }
}
