/**
 * Orchestrates the color picker lifecycle and coordinates all modules
 */

import { PickerUI } from "./PickerUI.mjs"
import { PickerInteractions } from "./PickerInteractions.mjs"
import { PickerPositioning } from "./PickerPositioning.mjs"

export class PickerController {
  constructor(recentColorsManager) {
    this.recentColorsManager = recentColorsManager
    this.currentInput = null
    this.pickerElement = null
    this.interactions = null

    // Bound event handlers
    this.boundHandlers = {
      outsideClick: this._handleOutsideClick.bind(this),
      scroll: this.close.bind(this),
      resize: this._handleResize.bind(this),
      keydown: this._handleKeydown.bind(this),
    }
  }

  show(inputElement) {
    if (this.pickerElement && this.currentInput === inputElement) {
      return // Already showing for this input
    }

    this.close()
    this.currentInput = inputElement

    const initialColor = inputElement.value || "#000000"

    // Create picker UI
    this.pickerElement = PickerUI.createPickerElement(initialColor)
    document.body.appendChild(this.pickerElement)

    // Setup interactions
    this.interactions = new PickerInteractions(
      this.pickerElement,
      this.currentInput,
      this._handleColorChange.bind(this),
    )
    this.interactions.setup()

    // Update recent colors display
    PickerUI.updateRecentColorsDisplay(
      this.pickerElement,
      this.recentColorsManager.getColors(),
      this._handleRecentColorClick.bind(this),
    )

    // Position picker
    PickerPositioning.positionPicker(this.pickerElement, inputElement)

    // Setup global event listeners
    setTimeout(() => {
      document.addEventListener("mousedown", this.boundHandlers.outsideClick)
      document.addEventListener("scroll", this.boundHandlers.scroll, true)
      window.addEventListener("resize", this.boundHandlers.resize)
      document.addEventListener("keydown", this.boundHandlers.keydown)
    }, 0)
  }

  close() {
    if (this.pickerElement) {
      // Save current color to recent colors
      if (this.currentInput && this.currentInput.value) {
        this.recentColorsManager.add(this.currentInput.value)
      }

      // Cleanup interactions
      if (this.interactions) {
        this.interactions.cleanup()
        this.interactions = null
      }

      // Remove global event listeners
      document.removeEventListener("mousedown", this.boundHandlers.outsideClick)
      document.removeEventListener("scroll", this.boundHandlers.scroll, true)
      window.removeEventListener("resize", this.boundHandlers.resize)
      document.removeEventListener("keydown", this.boundHandlers.keydown)

      // Remove picker element
      this.pickerElement.remove()
      this.pickerElement = null
    }

    this.currentInput = null
  }

  _handleOutsideClick(e) {
    if (
      this.pickerElement &&
      !this.pickerElement.contains(e.target) &&
      e.target !== this.currentInput
    ) {
      this.close()
    }
  }

  _handleResize() {
    if (this.pickerElement && this.currentInput) {
      PickerPositioning.positionPicker(this.pickerElement, this.currentInput)
    }
  }

  _handleKeydown(e) {
    if (!this.pickerElement) return

    if (e.key === "Escape") {
      e.preventDefault()
      this.close()
    }
  }

  _handleColorChange(action) {
    if (action === "close") {
      this.close()
    }
  }

  _handleRecentColorClick(color) {
    if (this.currentInput) {
      this.currentInput.value = color
      this.currentInput.dispatchEvent(new Event("input", { bubbles: true }))
      this.currentInput.dispatchEvent(new Event("change", { bubbles: true }))
      this.recentColorsManager.add(color)
      this.close()
    }
  }
}
