import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { PickerPositioning } from "../../src/picker/PickerPositioning.mjs"

// Mock DOM elements and window properties
function createMockInput(rect) {
  return {
    getBoundingClientRect: () => rect,
  }
}

function createMockPicker(width, height) {
  const styles = {}
  return {
    offsetWidth: width,
    offsetHeight: height,
    style: new Proxy(styles, {
      get: (target, prop) => target[prop],
      set: (target, prop, value) => {
        target[prop] = value
        return true
      },
    }),
  }
}

function setupWindow(config) {
  global.window = {
    innerWidth: config.innerWidth || 1024,
    innerHeight: config.innerHeight || 768,
    scrollX: config.scrollX || 0,
    scrollY: config.scrollY || 0,
  }
}

describe("PickerPositioning", () => {
  beforeEach(() => {
    // Reset window to default state
    setupWindow({
      innerWidth: 1024,
      innerHeight: 768,
      scrollX: 0,
      scrollY: 0,
    })
  })

  describe("calculatePosition()", () => {
    describe("Default Positioning (Below Input)", () => {
      it("positions picker below input with 5px gap", () => {
        const input = createMockInput({
          top: 100,
          bottom: 130,
          left: 200,
          right: 300,
        })
        const picker = createMockPicker(300, 400)

        const position = PickerPositioning.calculatePosition(picker, input)

        assert.strictEqual(position.top, 135) // 130 + 0 + 5
        assert.strictEqual(position.left, 200) // left edge of input
      })

      it("aligns picker to left edge of input", () => {
        const input = createMockInput({
          top: 50,
          bottom: 80,
          left: 150,
          right: 250,
        })
        const picker = createMockPicker(200, 300)

        const position = PickerPositioning.calculatePosition(picker, input)

        assert.strictEqual(position.left, 150)
      })

      it("uses different input positions", () => {
        const input = createMockInput({
          top: 300,
          bottom: 330,
          left: 500,
          right: 600,
        })
        const picker = createMockPicker(300, 400)

        const position = PickerPositioning.calculatePosition(picker, input)

        assert.strictEqual(position.top, 335) // 330 + 5
        assert.strictEqual(position.left, 500)
      })
    })

    describe("Scroll Offset Handling", () => {
      it("includes vertical scroll offset in top position", () => {
        setupWindow({ scrollX: 0, scrollY: 100 })

        const input = createMockInput({
          top: 100,
          bottom: 130,
          left: 200,
          right: 300,
        })
        const picker = createMockPicker(300, 400)

        const position = PickerPositioning.calculatePosition(picker, input)

        assert.strictEqual(position.top, 235) // 130 + 100 + 5
      })

      it("includes horizontal scroll offset in left position", () => {
        setupWindow({ scrollX: 50, scrollY: 0 })

        const input = createMockInput({
          top: 100,
          bottom: 130,
          left: 200,
          right: 300,
        })
        const picker = createMockPicker(300, 400)

        const position = PickerPositioning.calculatePosition(picker, input)

        assert.strictEqual(position.left, 250) // 200 + 50
      })

      it("includes both scroll offsets", () => {
        setupWindow({ scrollX: 75, scrollY: 150 })

        const input = createMockInput({
          top: 100,
          bottom: 130,
          left: 200,
          right: 300,
        })
        const picker = createMockPicker(300, 400)

        const position = PickerPositioning.calculatePosition(picker, input)

        assert.strictEqual(position.top, 285) // 130 + 150 + 5
        assert.strictEqual(position.left, 275) // 200 + 75
      })

      it("handles large scroll offsets", () => {
        setupWindow({ scrollX: 1000, scrollY: 2000 })

        const input = createMockInput({
          top: 100,
          bottom: 130,
          left: 200,
          right: 300,
        })
        const picker = createMockPicker(300, 400)

        const position = PickerPositioning.calculatePosition(picker, input)

        assert.strictEqual(position.top, 2135) // 130 + 2000 + 5
        assert.strictEqual(position.left, 1200) // 200 + 1000
      })
    })

    describe("Bottom Edge Detection", () => {
      it("positions above input when picker would overflow bottom", () => {
        setupWindow({ innerHeight: 500 })

        const input = createMockInput({
          top: 400,
          bottom: 430, // 430 + 400 = 830 > 500
          left: 200,
          right: 300,
        })
        const picker = createMockPicker(300, 400)

        const position = PickerPositioning.calculatePosition(picker, input)

        // Should be above: top - height - 5 = 400 - 400 - 5 = -5, then max(0, -5) = 0
        assert.strictEqual(position.top, 0)
      })

      it("positions above input with proper gap", () => {
        setupWindow({ innerHeight: 500 })

        const input = createMockInput({
          top: 450,
          bottom: 480,
          left: 200,
          right: 300,
        })
        const picker = createMockPicker(300, 200)

        const position = PickerPositioning.calculatePosition(picker, input)

        // Should be above: 450 - 200 - 5 = 245
        assert.strictEqual(position.top, 245)
      })

      it("keeps below when picker fits in viewport", () => {
        setupWindow({ innerHeight: 1000 })

        const input = createMockInput({
          top: 100,
          bottom: 130,
          left: 200,
          right: 300,
        })
        const picker = createMockPicker(300, 400)

        const position = PickerPositioning.calculatePosition(picker, input)

        // Should stay below: 130 + 5 = 135
        assert.strictEqual(position.top, 135)
      })

      it("handles edge case at exact viewport boundary", () => {
        setupWindow({ innerHeight: 530 })

        const input = createMockInput({
          top: 100,
          bottom: 130,
          left: 200,
          right: 300,
        })
        const picker = createMockPicker(300, 400)

        const position = PickerPositioning.calculatePosition(picker, input)

        // 130 + 400 = 530, equals innerHeight, should stay below
        assert.strictEqual(position.top, 135)
      })
    })

    describe("Right Edge Detection", () => {
      it("adjusts left position when picker would overflow right", () => {
        setupWindow({ innerWidth: 600 })

        const input = createMockInput({
          top: 100,
          bottom: 130,
          left: 500, // 500 + 300 = 800 > 600
          right: 600,
        })
        const picker = createMockPicker(300, 400)

        const position = PickerPositioning.calculatePosition(picker, input)

        // Should be: innerWidth - pickerWidth - 10 = 600 - 300 - 10 = 290
        assert.strictEqual(position.left, 290)
      })

      it("includes scroll offset in right edge adjustment", () => {
        setupWindow({ innerWidth: 600, scrollX: 100 })

        const input = createMockInput({
          top: 100,
          bottom: 130,
          left: 500,
          right: 600,
        })
        const picker = createMockPicker(300, 400)

        const position = PickerPositioning.calculatePosition(picker, input)

        // Should be: (600 - 300 - 10) + 100 = 390
        assert.strictEqual(position.left, 390)
      })

      it("keeps left aligned when picker fits in viewport", () => {
        setupWindow({ innerWidth: 1024 })

        const input = createMockInput({
          top: 100,
          bottom: 130,
          left: 200,
          right: 300,
        })
        const picker = createMockPicker(300, 400)

        const position = PickerPositioning.calculatePosition(picker, input)

        assert.strictEqual(position.left, 200)
      })

      it("handles edge case at exact viewport boundary", () => {
        setupWindow({ innerWidth: 500 })

        const input = createMockInput({
          top: 100,
          bottom: 130,
          left: 200,
          right: 300,
        })
        const picker = createMockPicker(300, 400)

        const position = PickerPositioning.calculatePosition(picker, input)

        // 200 + 300 = 500, equals innerWidth, should keep original left
        assert.strictEqual(position.left, 200)
      })
    })

    describe("Combined Edge Cases", () => {
      it("handles both bottom and right edge overflow", () => {
        setupWindow({ innerWidth: 600, innerHeight: 500 })

        const input = createMockInput({
          top: 400,
          bottom: 430,
          left: 500,
          right: 600,
        })
        const picker = createMockPicker(300, 200)

        const position = PickerPositioning.calculatePosition(picker, input)

        // Top: above input = 400 - 200 - 5 = 195
        assert.strictEqual(position.top, 195)
        // Left: adjusted = 600 - 300 - 10 = 290
        assert.strictEqual(position.left, 290)
      })

      it("handles bottom overflow with scroll", () => {
        setupWindow({ innerHeight: 500, scrollY: 100 })

        const input = createMockInput({
          top: 400,
          bottom: 430,
          left: 200,
          right: 300,
        })
        const picker = createMockPicker(300, 200)

        const position = PickerPositioning.calculatePosition(picker, input)

        // Should flip to above: (400 + 100) - 200 - 5 = 295
        assert.strictEqual(position.top, 295)
      })
    })

    describe("Negative Position Prevention", () => {
      it("prevents negative top position", () => {
        const input = createMockInput({
          top: 10,
          bottom: 40,
          left: 200,
          right: 300,
        })
        const picker = createMockPicker(300, 100)

        setupWindow({ innerHeight: 100 }) // Force flip to above

        const position = PickerPositioning.calculatePosition(picker, input)

        // Would be negative: 10 - 100 - 5 = -95, but max(0, -95) = 0
        assert.strictEqual(position.top, 0)
      })

      it("prevents negative left position", () => {
        setupWindow({ scrollX: -50 }) // Negative scroll (edge case)

        const input = createMockInput({
          top: 100,
          bottom: 130,
          left: 10,
          right: 110,
        })
        const picker = createMockPicker(300, 400)

        const position = PickerPositioning.calculatePosition(picker, input)

        // Would be negative after scroll offset
        assert.ok(position.left >= 0)
      })

      it("handles zero input position", () => {
        const input = createMockInput({
          top: 0,
          bottom: 30,
          left: 0,
          right: 100,
        })
        const picker = createMockPicker(300, 400)

        const position = PickerPositioning.calculatePosition(picker, input)

        assert.strictEqual(position.top, 35) // 30 + 5
        assert.strictEqual(position.left, 0)
      })
    })

    describe("Various Picker Sizes", () => {
      it("handles small picker", () => {
        const input = createMockInput({
          top: 100,
          bottom: 130,
          left: 200,
          right: 300,
        })
        const picker = createMockPicker(100, 100)

        const position = PickerPositioning.calculatePosition(picker, input)

        assert.strictEqual(position.top, 135)
        assert.strictEqual(position.left, 200)
      })

      it("handles large picker", () => {
        const input = createMockInput({
          top: 450,
          bottom: 480,
          left: 800,
          right: 900,
        })
        const picker = createMockPicker(800, 600)

        setupWindow({ innerWidth: 1024, innerHeight: 768 })

        const position = PickerPositioning.calculatePosition(picker, input)

        // Should flip to above: 450 - 600 - 5 = -155 -> max(0, -155) = 0
        assert.strictEqual(position.top, 0)
        // Should adjust right: 1024 - 800 - 10 = 214
        assert.strictEqual(position.left, 214)
      })

      it("handles zero-height picker", () => {
        const input = createMockInput({
          top: 100,
          bottom: 130,
          left: 200,
          right: 300,
        })
        const picker = createMockPicker(300, 0)

        const position = PickerPositioning.calculatePosition(picker, input)

        assert.strictEqual(position.top, 135)
        assert.strictEqual(position.left, 200)
      })
    })
  })

  describe("applyPosition()", () => {
    it("applies top position to picker style", () => {
      const picker = createMockPicker(300, 400)

      PickerPositioning.applyPosition(picker, { top: 150, left: 200 })

      assert.strictEqual(picker.style.top, "150px")
    })

    it("applies left position to picker style", () => {
      const picker = createMockPicker(300, 400)

      PickerPositioning.applyPosition(picker, { top: 150, left: 200 })

      assert.strictEqual(picker.style.left, "200px")
    })

    it("applies zero positions", () => {
      const picker = createMockPicker(300, 400)

      PickerPositioning.applyPosition(picker, { top: 0, left: 0 })

      assert.strictEqual(picker.style.top, "0px")
      assert.strictEqual(picker.style.left, "0px")
    })

    it("applies large positions", () => {
      const picker = createMockPicker(300, 400)

      PickerPositioning.applyPosition(picker, { top: 5000, left: 3000 })

      assert.strictEqual(picker.style.top, "5000px")
      assert.strictEqual(picker.style.left, "3000px")
    })

    it("overwrites existing position", () => {
      const picker = createMockPicker(300, 400)

      PickerPositioning.applyPosition(picker, { top: 100, left: 200 })
      assert.strictEqual(picker.style.top, "100px")
      assert.strictEqual(picker.style.left, "200px")

      PickerPositioning.applyPosition(picker, { top: 300, left: 400 })
      assert.strictEqual(picker.style.top, "300px")
      assert.strictEqual(picker.style.left, "400px")
    })
  })

  describe("positionPicker() - Integration", () => {
    it("calculates and applies position in one call", () => {
      const input = createMockInput({
        top: 100,
        bottom: 130,
        left: 200,
        right: 300,
      })
      const picker = createMockPicker(300, 400)

      PickerPositioning.positionPicker(picker, input)

      assert.strictEqual(picker.style.top, "135px")
      assert.strictEqual(picker.style.left, "200px")
    })

    it("handles edge overflow in integration", () => {
      setupWindow({ innerWidth: 600, innerHeight: 500 })

      const input = createMockInput({
        top: 400,
        bottom: 430,
        left: 500,
        right: 600,
      })
      const picker = createMockPicker(300, 200)

      PickerPositioning.positionPicker(picker, input)

      assert.strictEqual(picker.style.top, "195px")
      assert.strictEqual(picker.style.left, "290px")
    })

    it("handles scroll offsets in integration", () => {
      setupWindow({ scrollX: 100, scrollY: 200 })

      const input = createMockInput({
        top: 100,
        bottom: 130,
        left: 200,
        right: 300,
      })
      const picker = createMockPicker(300, 400)

      PickerPositioning.positionPicker(picker, input)

      assert.strictEqual(picker.style.top, "335px") // 130 + 200 + 5
      assert.strictEqual(picker.style.left, "300px") // 200 + 100
    })
  })

  describe("Edge Cases and Boundary Conditions", () => {
    it("handles very small viewport", () => {
      setupWindow({ innerWidth: 100, innerHeight: 100 })

      const input = createMockInput({
        top: 50,
        bottom: 80,
        left: 50,
        right: 100,
      })
      const picker = createMockPicker(300, 400)

      const position = PickerPositioning.calculatePosition(picker, input)

      // Should handle gracefully even if picker is larger than viewport
      assert.ok(position.top >= 0)
      assert.ok(position.left >= 0)
    })

    it("handles input at viewport edges", () => {
      setupWindow({ innerWidth: 1024, innerHeight: 768 })

      const input = createMockInput({
        top: 0,
        bottom: 30,
        left: 0,
        right: 100,
      })
      const picker = createMockPicker(300, 400)

      const position = PickerPositioning.calculatePosition(picker, input)

      assert.strictEqual(position.top, 35)
      assert.strictEqual(position.left, 0)
    })

    it("handles input at bottom right corner", () => {
      setupWindow({ innerWidth: 1024, innerHeight: 768 })

      const input = createMockInput({
        top: 738,
        bottom: 768,
        left: 924,
        right: 1024,
      })
      const picker = createMockPicker(300, 400)

      const position = PickerPositioning.calculatePosition(picker, input)

      // Should flip to above and adjust left
      assert.strictEqual(position.top, 333) // 738 - 400 - 5
      assert.strictEqual(position.left, 714) // 1024 - 300 - 10
    })

    it("handles fractional coordinates from getBoundingClientRect", () => {
      const input = createMockInput({
        top: 100.5,
        bottom: 130.75,
        left: 200.25,
        right: 300.5,
      })
      const picker = createMockPicker(300, 400)

      const position = PickerPositioning.calculatePosition(picker, input)

      // Should handle fractional values
      assert.strictEqual(position.top, 135.75) // 130.75 + 5
      assert.strictEqual(position.left, 200.25)
    })
  })
})
