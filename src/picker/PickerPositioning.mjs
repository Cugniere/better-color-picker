/**
 * Handles color picker positioning relative to input elements
 */

export class PickerPositioning {
  static calculatePosition(picker, input) {
    const rect = input.getBoundingClientRect()
    const pickerHeight = picker.offsetHeight
    const pickerWidth = picker.offsetWidth

    let top = rect.bottom + window.scrollY + 5
    let left = rect.left + window.scrollX

    // Check if picker would go off bottom of viewport
    if (rect.bottom + pickerHeight > window.innerHeight) {
      top = rect.top + window.scrollY - pickerHeight - 5
    }

    // Check if picker would go off right of viewport
    if (rect.left + pickerWidth > window.innerWidth) {
      left = window.innerWidth - pickerWidth - 10 + window.scrollX
    }

    return {
      top: Math.max(0, top),
      left: Math.max(0, left),
    }
  }

  static applyPosition(picker, position) {
    picker.style.top = position.top + "px"
    picker.style.left = position.left + "px"
  }

  static positionPicker(picker, input) {
    const position = this.calculatePosition(picker, input)
    this.applyPosition(picker, position)
  }
}
