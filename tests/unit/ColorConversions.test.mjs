import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  hexToRGB,
  hexToHSV,
  rgbToHSV,
  hsvToRGB,
  hsvToHex,
  rgbToHSL,
  hslToRGB,
  hexToHSL,
  hslToHex,
} from "../../src/utils/ColorConversions.mjs"

function assertHSVClose(actual, expected, tolerance = 0.5) {
  assert.ok(
    Math.abs(actual.h - expected.h) <= tolerance &&
      Math.abs(actual.s - expected.s) <= tolerance &&
      Math.abs(actual.v - expected.v) <= tolerance,
    `Expected HSV close to ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  )
}

function assertHSLClose(actual, expected, tolerance = 0.5) {
  assert.ok(
    Math.abs(actual.h - expected.h) <= tolerance &&
      Math.abs(actual.s - expected.s) <= tolerance &&
      Math.abs(actual.l - expected.l) <= tolerance,
    `Expected HSL close to ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  )
}

describe("hexToRGB", () => {
  describe("Basic Functionality", () => {
    it("converts red color", () => {
      assert.deepStrictEqual(hexToRGB("#FF0000"), { r: 255, g: 0, b: 0 })
    })

    it("converts green color", () => {
      assert.deepStrictEqual(hexToRGB("#00FF00"), { r: 0, g: 255, b: 0 })
    })

    it("converts blue color", () => {
      assert.deepStrictEqual(hexToRGB("#0000FF"), { r: 0, g: 0, b: 255 })
    })

    it("converts black", () => {
      assert.deepStrictEqual(hexToRGB("#000000"), { r: 0, g: 0, b: 0 })
    })

    it("converts white", () => {
      assert.deepStrictEqual(hexToRGB("#FFFFFF"), { r: 255, g: 255, b: 255 })
    })
  })

  describe("Hash Symbol Handling", () => {
    it("converts hex with hash", () => {
      assert.deepStrictEqual(hexToRGB("#3498DB"), { r: 52, g: 152, b: 219 })
    })

    it("converts hex without hash", () => {
      assert.deepStrictEqual(hexToRGB("3498DB"), { r: 52, g: 152, b: 219 })
    })
  })

  describe("Case Sensitivity", () => {
    it("converts lowercase hex", () => {
      assert.deepStrictEqual(hexToRGB("#ff5733"), { r: 255, g: 87, b: 51 })
    })

    it("converts uppercase hex", () => {
      assert.deepStrictEqual(hexToRGB("#FF5733"), { r: 255, g: 87, b: 51 })
    })

    it("converts mixed case hex", () => {
      assert.deepStrictEqual(hexToRGB("#Ff5733"), { r: 255, g: 87, b: 51 })
    })
  })

  describe("Specific Color Values", () => {
    it("converts gray", () => {
      assert.deepStrictEqual(hexToRGB("#808080"), { r: 128, g: 128, b: 128 })
    })

    it("converts cyan", () => {
      assert.deepStrictEqual(hexToRGB("#00FFFF"), { r: 0, g: 255, b: 255 })
    })

    it("converts magenta", () => {
      assert.deepStrictEqual(hexToRGB("#FF00FF"), { r: 255, g: 0, b: 255 })
    })

    it("converts yellow", () => {
      assert.deepStrictEqual(hexToRGB("#FFFF00"), { r: 255, g: 255, b: 0 })
    })

    it("converts custom color", () => {
      assert.deepStrictEqual(hexToRGB("#2ECC71"), { r: 46, g: 204, b: 113 })
    })
  })

  describe("Invalid Input - Malformed Hex", () => {
    it("returns default for too short hex", () => {
      assert.deepStrictEqual(hexToRGB("#FFF"), { r: 0, g: 0, b: 0 })
    })

    it("returns default for too long hex", () => {
      assert.deepStrictEqual(hexToRGB("#FF00FF00"), { r: 0, g: 0, b: 0 })
    })

    it("returns default for invalid characters", () => {
      assert.deepStrictEqual(hexToRGB("#GGGGGG"), { r: 0, g: 0, b: 0 })
    })

    it("returns default for partial hex", () => {
      assert.deepStrictEqual(hexToRGB("#FF00"), { r: 0, g: 0, b: 0 })
    })
  })

  describe("Invalid Input - Edge Cases", () => {
    it("returns default for empty string", () => {
      assert.deepStrictEqual(hexToRGB(""), { r: 0, g: 0, b: 0 })
    })

    it("returns default for just hash", () => {
      assert.deepStrictEqual(hexToRGB("#"), { r: 0, g: 0, b: 0 })
    })

    it("returns default for null", () => {
      assert.deepStrictEqual(hexToRGB(null), { r: 0, g: 0, b: 0 })
    })

    it("returns default for undefined", () => {
      assert.deepStrictEqual(hexToRGB(undefined), { r: 0, g: 0, b: 0 })
    })

    it("returns default for spaces", () => {
      assert.deepStrictEqual(hexToRGB("#FF 00 00"), { r: 0, g: 0, b: 0 })
    })

    it("returns default for special characters", () => {
      assert.deepStrictEqual(hexToRGB("#FF@00!"), { r: 0, g: 0, b: 0 })
    })
  })

  describe("Boundary Tests - Min/Max Values", () => {
    it("handles minimum values per channel", () => {
      assert.deepStrictEqual(hexToRGB("#000000"), { r: 0, g: 0, b: 0 })
    })

    it("handles maximum values per channel", () => {
      assert.deepStrictEqual(hexToRGB("#FFFFFF"), { r: 255, g: 255, b: 255 })
    })

    it("handles min red, max green/blue", () => {
      assert.deepStrictEqual(hexToRGB("#00FFFF"), { r: 0, g: 255, b: 255 })
    })

    it("handles max red, min green/blue", () => {
      assert.deepStrictEqual(hexToRGB("#FF0000"), { r: 255, g: 0, b: 0 })
    })
  })

  describe("Boundary Tests - Hex Letter Range", () => {
    it("handles hex A-F", () => {
      assert.deepStrictEqual(hexToRGB("#ABCDEF"), { r: 171, g: 205, b: 239 })
    })

    it("handles hex with 0-9 only", () => {
      assert.deepStrictEqual(hexToRGB("#123456"), { r: 18, g: 52, b: 86 })
    })
  })
})

describe("hexToHSV", () => {
  describe("Primary Colors", () => {
    it("converts red", () => {
      assertHSVClose(hexToHSV("#FF0000"), { h: 0, s: 100, v: 100 })
    })

    it("converts green", () => {
      assertHSVClose(hexToHSV("#00FF00"), { h: 120, s: 100, v: 100 })
    })

    it("converts blue", () => {
      assertHSVClose(hexToHSV("#0000FF"), { h: 240, s: 100, v: 100 })
    })
  })

  describe("Secondary Colors", () => {
    it("converts cyan", () => {
      assertHSVClose(hexToHSV("#00FFFF"), { h: 180, s: 100, v: 100 })
    })

    it("converts magenta", () => {
      assertHSVClose(hexToHSV("#FF00FF"), { h: 300, s: 100, v: 100 })
    })

    it("converts yellow", () => {
      assertHSVClose(hexToHSV("#FFFF00"), { h: 60, s: 100, v: 100 })
    })
  })

  describe("Achromatic Colors", () => {
    it("converts black", () => {
      assertHSVClose(hexToHSV("#000000"), { h: 0, s: 0, v: 0 })
    })

    it("converts white", () => {
      assertHSVClose(hexToHSV("#FFFFFF"), { h: 0, s: 0, v: 100 })
    })

    it("converts mid gray", () => {
      const result = hexToHSV("#808080")
      assertHSVClose(result, { h: 0, s: 0, v: 50.2 }, 0.5)
    })

    it("converts light gray", () => {
      const result = hexToHSV("#C0C0C0")
      assertHSVClose(result, { h: 0, s: 0, v: 75.3 }, 0.5)
    })

    it("converts dark gray", () => {
      const result = hexToHSV("#404040")
      assertHSVClose(result, { h: 0, s: 0, v: 25.1 }, 0.5)
    })
  })

  describe("Various Hues", () => {
    it("converts orange", () => {
      assertHSVClose(hexToHSV("#FF8000"), { h: 30, s: 100, v: 100 })
    })

    it("converts lime", () => {
      assertHSVClose(hexToHSV("#80FF00"), { h: 90, s: 100, v: 100 })
    })

    it("converts spring green", () => {
      assertHSVClose(hexToHSV("#00FF80"), { h: 150, s: 100, v: 100 })
    })

    it("converts sky blue", () => {
      assertHSVClose(hexToHSV("#0080FF"), { h: 210, s: 100, v: 100 })
    })

    it("converts purple", () => {
      assertHSVClose(hexToHSV("#8000FF"), { h: 270, s: 100, v: 100 })
    })

    it("converts rose", () => {
      assertHSVClose(hexToHSV("#FF0080"), { h: 330, s: 100, v: 100 })
    })
  })

  describe("Saturation Variations", () => {
    it("converts desaturated red", () => {
      const result = hexToHSV("#FF8080")
      assertHSVClose(result, { h: 0, s: 49.8, v: 100 }, 0.5)
    })

    it("converts desaturated green", () => {
      const result = hexToHSV("#80FF80")
      assertHSVClose(result, { h: 120, s: 49.8, v: 100 }, 0.5)
    })

    it("converts desaturated blue", () => {
      const result = hexToHSV("#8080FF")
      assertHSVClose(result, { h: 240, s: 49.8, v: 100 }, 0.5)
    })
  })

  describe("Value/Brightness Variations", () => {
    it("converts dark red", () => {
      const result = hexToHSV("#800000")
      assertHSVClose(result, { h: 0, s: 100, v: 50.2 }, 0.5)
    })

    it("converts dark green", () => {
      const result = hexToHSV("#008000")
      assertHSVClose(result, { h: 120, s: 100, v: 50.2 }, 0.5)
    })

    it("converts dark blue", () => {
      const result = hexToHSV("#000080")
      assertHSVClose(result, { h: 240, s: 100, v: 50.2 }, 0.5)
    })
  })

  describe("Mixed Saturation and Value", () => {
    it("converts olive", () => {
      const result = hexToHSV("#808000")
      assertHSVClose(result, { h: 60, s: 100, v: 50.2 }, 0.5)
    })

    it("converts teal", () => {
      const result = hexToHSV("#008080")
      assertHSVClose(result, { h: 180, s: 100, v: 50.2 }, 0.5)
    })

    it("converts navy", () => {
      const result = hexToHSV("#000080")
      assertHSVClose(result, { h: 240, s: 100, v: 50.2 }, 0.5)
    })
  })

  describe("Complex Colors", () => {
    it("converts custom color 1", () => {
      const result = hexToHSV("#3498DB")
      assertHSVClose(result, { h: 204.4, s: 76.3, v: 85.9 }, 1)
    })

    it("converts custom color 2", () => {
      const result = hexToHSV("#2ECC71")
      assertHSVClose(result, { h: 145.2, s: 77.5, v: 80 }, 1)
    })

    it("converts custom color 3", () => {
      const result = hexToHSV("#E74C3C")
      assertHSVClose(result, { h: 6.2, s: 74, v: 90.6 }, 1)
    })
  })

  describe("Hash Symbol Handling", () => {
    it("converts hex with hash", () => {
      const withHash = hexToHSV("#FF5733")
      const expected = { h: 11.3, s: 80, v: 100 }
      assertHSVClose(withHash, expected, 1)
    })

    it("converts hex without hash", () => {
      const withoutHash = hexToHSV("FF5733")
      const withHash = hexToHSV("#FF5733")
      assert.deepStrictEqual(withoutHash, withHash)
    })
  })

  describe("Case Sensitivity", () => {
    it("converts lowercase hex", () => {
      assertHSVClose(hexToHSV("#ff0000"), { h: 0, s: 100, v: 100 })
    })

    it("converts uppercase hex", () => {
      assertHSVClose(hexToHSV("#FF0000"), { h: 0, s: 100, v: 100 })
    })

    it("converts mixed case hex", () => {
      assertHSVClose(hexToHSV("#Ff0000"), { h: 0, s: 100, v: 100 })
    })
  })

  describe("Invalid Inputs", () => {
    it("returns default for empty string", () => {
      assertHSVClose(hexToHSV(""), { h: 0, s: 0, v: 0 })
    })

    it("returns default for invalid hex", () => {
      assertHSVClose(hexToHSV("#GGGGGG"), { h: 0, s: 0, v: 0 })
    })

    it("returns default for too short hex", () => {
      assertHSVClose(hexToHSV("#FFF"), { h: 0, s: 0, v: 0 })
    })

    it("returns default for null", () => {
      assertHSVClose(hexToHSV(null), { h: 0, s: 0, v: 0 })
    })

    it("returns default for undefined", () => {
      assertHSVClose(hexToHSV(undefined), { h: 0, s: 0, v: 0 })
    })
  })

  describe("Edge Cases - Hue Calculation", () => {
    it("handles hue wrap-around for red", () => {
      const result = hexToHSV("#FF0001")
      // Hue should be very close to 0 or 360
      assert.ok(result.h < 1 || result.h > 359)
    })

    it("handles near-zero saturation", () => {
      const result = hexToHSV("#7F7F80")
      assert.ok(result.s < 1) // Very low saturation
    })

    it("handles near-zero value", () => {
      const result = hexToHSV("#010101")
      assert.ok(result.v < 1) // Very low value
    })
  })
})

describe("rgbToHSV", () => {
  describe("Primary Colors", () => {
    it("converts red RGB", () => {
      assertHSVClose(rgbToHSV(255, 0, 0), { h: 0, s: 100, v: 100 })
    })

    it("converts green RGB", () => {
      assertHSVClose(rgbToHSV(0, 255, 0), { h: 120, s: 100, v: 100 })
    })

    it("converts blue RGB", () => {
      assertHSVClose(rgbToHSV(0, 0, 255), { h: 240, s: 100, v: 100 })
    })
  })

  describe("Secondary Colors", () => {
    it("converts cyan RGB", () => {
      assertHSVClose(rgbToHSV(0, 255, 255), { h: 180, s: 100, v: 100 })
    })

    it("converts magenta RGB", () => {
      assertHSVClose(rgbToHSV(255, 0, 255), { h: 300, s: 100, v: 100 })
    })

    it("converts yellow RGB", () => {
      assertHSVClose(rgbToHSV(255, 255, 0), { h: 60, s: 100, v: 100 })
    })
  })

  describe("Achromatic Colors", () => {
    it("converts black RGB", () => {
      assertHSVClose(rgbToHSV(0, 0, 0), { h: 0, s: 0, v: 0 })
    })

    it("converts white RGB", () => {
      assertHSVClose(rgbToHSV(255, 255, 255), { h: 0, s: 0, v: 100 })
    })

    it("converts gray RGB", () => {
      const result = rgbToHSV(128, 128, 128)
      assert.ok(result.s === 0)
      assertHSVClose(result, { h: 0, s: 0, v: 50.2 }, 0.5)
    })
  })

  describe("Saturation Variations", () => {
    it("converts half saturated red", () => {
      const result = rgbToHSV(255, 128, 128)
      assertHSVClose(result, { h: 0, s: 49.8, v: 100 }, 1)
    })

    it("converts low saturation", () => {
      const result = rgbToHSV(200, 180, 180)
      assert.ok(result.s < 15)
    })

    it("converts full saturation", () => {
      const result = rgbToHSV(255, 0, 0)
      assert.strictEqual(result.s, 100)
    })
  })

  describe("Value/Brightness Variations", () => {
    it("converts dark red", () => {
      const result = rgbToHSV(128, 0, 0)
      assertHSVClose(result, { h: 0, s: 100, v: 50.2 }, 1)
    })

    it("converts very dark color", () => {
      const result = rgbToHSV(10, 10, 10)
      assert.ok(result.v < 5)
    })

    it("converts bright color", () => {
      const result = rgbToHSV(255, 255, 255)
      assert.strictEqual(result.v, 100)
    })
  })

  describe("Edge Cases", () => {
    it("handles maximum RGB values", () => {
      const result = rgbToHSV(255, 255, 255)
      assertHSVClose(result, { h: 0, s: 0, v: 100 })
    })

    it("handles minimum RGB values", () => {
      const result = rgbToHSV(0, 0, 0)
      assertHSVClose(result, { h: 0, s: 0, v: 0 })
    })

    it("handles equal RGB values (gray)", () => {
      const result = rgbToHSV(100, 100, 100)
      assert.strictEqual(result.s, 0)
    })
  })

  describe("Hue Calculation Accuracy", () => {
    it("calculates hue correctly for red-dominant", () => {
      const result = rgbToHSV(255, 100, 50)
      assert.ok(result.h >= 0 && result.h < 60)
    })

    it("calculates hue correctly for green-dominant", () => {
      const result = rgbToHSV(100, 255, 50)
      assert.ok(result.h >= 60 && result.h < 180)
    })

    it("calculates hue correctly for blue-dominant", () => {
      const result = rgbToHSV(50, 100, 255)
      assert.ok(result.h >= 180 && result.h < 300)
    })
  })
})

describe("hsvToRGB", () => {
  describe("Primary Colors", () => {
    it("converts red HSV", () => {
      assert.deepStrictEqual(hsvToRGB(0, 100, 100), { r: 255, g: 0, b: 0 })
    })

    it("converts green HSV", () => {
      assert.deepStrictEqual(hsvToRGB(120, 100, 100), { r: 0, g: 255, b: 0 })
    })

    it("converts blue HSV", () => {
      assert.deepStrictEqual(hsvToRGB(240, 100, 100), { r: 0, g: 0, b: 255 })
    })
  })

  describe("Secondary Colors", () => {
    it("converts cyan HSV", () => {
      assert.deepStrictEqual(hsvToRGB(180, 100, 100), { r: 0, g: 255, b: 255 })
    })

    it("converts magenta HSV", () => {
      assert.deepStrictEqual(hsvToRGB(300, 100, 100), { r: 255, g: 0, b: 255 })
    })

    it("converts yellow HSV", () => {
      assert.deepStrictEqual(hsvToRGB(60, 100, 100), { r: 255, g: 255, b: 0 })
    })
  })

  describe("Achromatic Colors", () => {
    it("converts black HSV", () => {
      assert.deepStrictEqual(hsvToRGB(0, 0, 0), { r: 0, g: 0, b: 0 })
    })

    it("converts white HSV", () => {
      assert.deepStrictEqual(hsvToRGB(0, 0, 100), { r: 255, g: 255, b: 255 })
    })

    it("converts gray HSV (any hue, 0 saturation)", () => {
      const result = hsvToRGB(180, 0, 50)
      assert.ok(result.r === result.g && result.g === result.b)
    })
  })

  describe("Saturation Variations", () => {
    it("converts zero saturation (gray)", () => {
      const result = hsvToRGB(0, 0, 50)
      assert.ok(result.r === result.g && result.g === result.b)
    })

    it("converts 50% saturation", () => {
      const result = hsvToRGB(0, 50, 100)
      assert.ok(result.r === 255)
      assert.ok(result.g === result.b)
      assert.ok(result.g < 255)
    })

    it("converts full saturation", () => {
      const result = hsvToRGB(0, 100, 100)
      assert.deepStrictEqual(result, { r: 255, g: 0, b: 0 })
    })
  })

  describe("Value/Brightness Variations", () => {
    it("converts zero value (black)", () => {
      assert.deepStrictEqual(hsvToRGB(180, 100, 0), { r: 0, g: 0, b: 0 })
    })

    it("converts 50% value", () => {
      const result = hsvToRGB(0, 100, 50)
      assert.ok(result.r < 255)
      assert.strictEqual(result.g, 0)
      assert.strictEqual(result.b, 0)
    })

    it("converts full value", () => {
      const result = hsvToRGB(0, 100, 100)
      assert.strictEqual(result.r, 255)
    })
  })

  describe("Hue Range Coverage", () => {
    it("handles hue 0 (red)", () => {
      const result = hsvToRGB(0, 100, 100)
      assert.strictEqual(result.r, 255)
    })

    it("handles hue 60 (yellow)", () => {
      const result = hsvToRGB(60, 100, 100)
      assert.deepStrictEqual(result, { r: 255, g: 255, b: 0 })
    })

    it("handles hue 120 (green)", () => {
      const result = hsvToRGB(120, 100, 100)
      assert.deepStrictEqual(result, { r: 0, g: 255, b: 0 })
    })

    it("handles hue 180 (cyan)", () => {
      const result = hsvToRGB(180, 100, 100)
      assert.deepStrictEqual(result, { r: 0, g: 255, b: 255 })
    })

    it("handles hue 240 (blue)", () => {
      const result = hsvToRGB(240, 100, 100)
      assert.deepStrictEqual(result, { r: 0, g: 0, b: 255 })
    })

    it("handles hue 300 (magenta)", () => {
      const result = hsvToRGB(300, 100, 100)
      assert.deepStrictEqual(result, { r: 255, g: 0, b: 255 })
    })

    it("handles hue 360 (red, wrap-around)", () => {
      const result360 = hsvToRGB(360, 100, 100)
      const result0 = hsvToRGB(0, 100, 100)
      assert.deepStrictEqual(result360, result0)
    })
  })

  describe("Edge Cases", () => {
    it("handles intermediate hue values", () => {
      const result = hsvToRGB(45, 100, 100)
      assert.ok(result.r > 0 && result.g > 0)
    })

    it("returns values in valid RGB range", () => {
      const result = hsvToRGB(123, 45, 67)
      assert.ok(result.r >= 0 && result.r <= 255)
      assert.ok(result.g >= 0 && result.g <= 255)
      assert.ok(result.b >= 0 && result.b <= 255)
    })
  })

  describe("Round-Trip Conversions", () => {
    it("round-trips primary colors", () => {
      const original = { r: 255, g: 0, b: 0 }
      const hsv = rgbToHSV(original.r, original.g, original.b)
      const result = hsvToRGB(hsv.h, hsv.s, hsv.v)
      assert.deepStrictEqual(result, original)
    })

    it("round-trips complex colors", () => {
      const original = { r: 128, g: 200, b: 75 }
      const hsv = rgbToHSV(original.r, original.g, original.b)
      const result = hsvToRGB(hsv.h, hsv.s, hsv.v)
      // Allow for rounding errors
      assert.ok(Math.abs(result.r - original.r) <= 1)
      assert.ok(Math.abs(result.g - original.g) <= 1)
      assert.ok(Math.abs(result.b - original.b) <= 1)
    })
  })
})

describe("hsvToHex", () => {
  describe("Primary Colors", () => {
    it("converts red HSV to hex", () => {
      assert.strictEqual(hsvToHex({ h: 0, s: 100, v: 100 }), "#ff0000")
    })

    it("converts green HSV to hex", () => {
      assert.strictEqual(hsvToHex({ h: 120, s: 100, v: 100 }), "#00ff00")
    })

    it("converts blue HSV to hex", () => {
      assert.strictEqual(hsvToHex({ h: 240, s: 100, v: 100 }), "#0000ff")
    })
  })

  describe("Secondary Colors", () => {
    it("converts cyan HSV to hex", () => {
      assert.strictEqual(hsvToHex({ h: 180, s: 100, v: 100 }), "#00ffff")
    })

    it("converts magenta HSV to hex", () => {
      assert.strictEqual(hsvToHex({ h: 300, s: 100, v: 100 }), "#ff00ff")
    })

    it("converts yellow HSV to hex", () => {
      assert.strictEqual(hsvToHex({ h: 60, s: 100, v: 100 }), "#ffff00")
    })
  })

  describe("Achromatic Colors", () => {
    it("converts black HSV to hex", () => {
      assert.strictEqual(hsvToHex({ h: 0, s: 0, v: 0 }), "#000000")
    })

    it("converts white HSV to hex", () => {
      assert.strictEqual(hsvToHex({ h: 0, s: 0, v: 100 }), "#ffffff")
    })

    it("converts gray HSV to hex", () => {
      const result = hsvToHex({ h: 0, s: 0, v: 50 })
      // Should be approximately #808080 (128, 128, 128)
      assert.ok(result.startsWith("#"))
      assert.ok(result.length === 7)
    })
  })

  describe("Format Validation", () => {
    it("always starts with hash", () => {
      const result = hsvToHex({ h: 123, s: 45, v: 67 })
      assert.ok(result.startsWith("#"))
    })

    it("always returns 7 characters", () => {
      const result = hsvToHex({ h: 0, s: 0, v: 0 })
      assert.strictEqual(result.length, 7)
    })

    it("always returns lowercase hex", () => {
      const result = hsvToHex({ h: 200, s: 75, v: 90 })
      assert.strictEqual(result, result.toLowerCase())
    })

    it("pads single digit hex values with zero", () => {
      const result = hsvToHex({ h: 0, s: 0, v: 1 })
      assert.match(result, /^#[0-9a-f]{6}$/)
    })
  })

  describe("Round-Trip Conversions", () => {
    it("round-trips with hexToHSV for primary colors", () => {
      const original = "#ff0000"
      const hsv = hexToHSV(original)
      const result = hsvToHex(hsv)
      assert.strictEqual(result, original)
    })

    it("round-trips with hexToHSV for complex colors", () => {
      const original = "#3498db"
      const hsv = hexToHSV(original)
      const result = hsvToHex(hsv)
      assert.strictEqual(result, original)
    })

    it("round-trips achromatic colors", () => {
      const original = "#ffffff"
      const hsv = hexToHSV(original)
      const result = hsvToHex(hsv)
      assert.strictEqual(result, original)
    })
  })

  describe("Edge Cases", () => {
    it("handles maximum HSV values", () => {
      const result = hsvToHex({ h: 359, s: 100, v: 100 })
      assert.ok(result.startsWith("#"))
      assert.strictEqual(result.length, 7)
    })

    it("handles minimum HSV values", () => {
      const result = hsvToHex({ h: 0, s: 0, v: 0 })
      assert.strictEqual(result, "#000000")
    })

    it("handles fractional HSV values", () => {
      const result = hsvToHex({ h: 123.456, s: 78.9, v: 45.6 })
      assert.ok(result.startsWith("#"))
      assert.strictEqual(result.length, 7)
    })
  })
})

describe("rgbToHSL", () => {
  describe("Primary Colors", () => {
    it("converts red RGB", () => {
      assertHSLClose(rgbToHSL(255, 0, 0), { h: 0, s: 100, l: 50 })
    })

    it("converts green RGB", () => {
      assertHSLClose(rgbToHSL(0, 255, 0), { h: 120, s: 100, l: 50 })
    })

    it("converts blue RGB", () => {
      assertHSLClose(rgbToHSL(0, 0, 255), { h: 240, s: 100, l: 50 })
    })
  })

  describe("Secondary Colors", () => {
    it("converts cyan RGB", () => {
      assertHSLClose(rgbToHSL(0, 255, 255), { h: 180, s: 100, l: 50 })
    })

    it("converts magenta RGB", () => {
      assertHSLClose(rgbToHSL(255, 0, 255), { h: 300, s: 100, l: 50 })
    })

    it("converts yellow RGB", () => {
      assertHSLClose(rgbToHSL(255, 255, 0), { h: 60, s: 100, l: 50 })
    })
  })

  describe("Achromatic Colors", () => {
    it("converts black RGB", () => {
      assertHSLClose(rgbToHSL(0, 0, 0), { h: 0, s: 0, l: 0 })
    })

    it("converts white RGB", () => {
      assertHSLClose(rgbToHSL(255, 255, 255), { h: 0, s: 0, l: 100 })
    })

    it("converts gray RGB", () => {
      const result = rgbToHSL(128, 128, 128)
      assert.ok(result.s === 0)
      assertHSLClose(result, { h: 0, s: 0, l: 50.2 }, 0.5)
    })
  })

  describe("Lightness Variations", () => {
    it("converts light red", () => {
      const result = rgbToHSL(255, 128, 128)
      assertHSLClose(result, { h: 0, s: 100, l: 75.1 }, 1)
    })

    it("converts dark red", () => {
      const result = rgbToHSL(128, 0, 0)
      assertHSLClose(result, { h: 0, s: 100, l: 25.1 }, 1)
    })

    it("converts very light color", () => {
      const result = rgbToHSL(240, 240, 240)
      assert.ok(result.l > 90)
    })

    it("converts very dark color", () => {
      const result = rgbToHSL(10, 10, 10)
      assert.ok(result.l < 5)
    })
  })

  describe("Saturation Variations", () => {
    it("converts desaturated red", () => {
      const result = rgbToHSL(200, 150, 150)
      assert.ok(result.h >= 0 && result.h <= 1)
      assert.ok(result.s < 50)
    })

    it("converts low saturation", () => {
      const result = rgbToHSL(100, 95, 95)
      assert.ok(result.s < 10)
    })

    it("converts full saturation", () => {
      const result = rgbToHSL(255, 0, 0)
      assert.strictEqual(result.s, 100)
    })
  })

  describe("Edge Cases", () => {
    it("handles maximum RGB values", () => {
      const result = rgbToHSL(255, 255, 255)
      assertHSLClose(result, { h: 0, s: 0, l: 100 })
    })

    it("handles minimum RGB values", () => {
      const result = rgbToHSL(0, 0, 0)
      assertHSLClose(result, { h: 0, s: 0, l: 0 })
    })

    it("handles equal RGB values (gray)", () => {
      const result = rgbToHSL(100, 100, 100)
      assert.strictEqual(result.s, 0)
    })
  })

  describe("Hue Calculation Accuracy", () => {
    it("calculates hue correctly for red-dominant", () => {
      const result = rgbToHSL(255, 100, 50)
      assert.ok(result.h >= 0 && result.h < 60)
    })

    it("calculates hue correctly for green-dominant", () => {
      const result = rgbToHSL(100, 255, 50)
      assert.ok(result.h >= 60 && result.h < 180)
    })

    it("calculates hue correctly for blue-dominant", () => {
      const result = rgbToHSL(50, 100, 255)
      assert.ok(result.h >= 180 && result.h < 300)
    })
  })
})

describe("hslToRGB", () => {
  describe("Primary Colors", () => {
    it("converts red HSL", () => {
      assert.deepStrictEqual(hslToRGB(0, 100, 50), { r: 255, g: 0, b: 0 })
    })

    it("converts green HSL", () => {
      assert.deepStrictEqual(hslToRGB(120, 100, 50), { r: 0, g: 255, b: 0 })
    })

    it("converts blue HSL", () => {
      assert.deepStrictEqual(hslToRGB(240, 100, 50), { r: 0, g: 0, b: 255 })
    })
  })

  describe("Secondary Colors", () => {
    it("converts cyan HSL", () => {
      assert.deepStrictEqual(hslToRGB(180, 100, 50), { r: 0, g: 255, b: 255 })
    })

    it("converts magenta HSL", () => {
      assert.deepStrictEqual(hslToRGB(300, 100, 50), { r: 255, g: 0, b: 255 })
    })

    it("converts yellow HSL", () => {
      assert.deepStrictEqual(hslToRGB(60, 100, 50), { r: 255, g: 255, b: 0 })
    })
  })

  describe("Achromatic Colors", () => {
    it("converts black HSL", () => {
      assert.deepStrictEqual(hslToRGB(0, 0, 0), { r: 0, g: 0, b: 0 })
    })

    it("converts white HSL", () => {
      assert.deepStrictEqual(hslToRGB(0, 0, 100), { r: 255, g: 255, b: 255 })
    })

    it("converts gray HSL (any hue, 0 saturation)", () => {
      const result = hslToRGB(180, 0, 50)
      assert.ok(result.r === result.g && result.g === result.b)
    })
  })

  describe("Lightness Variations", () => {
    it("converts lightness 0% (black)", () => {
      assert.deepStrictEqual(hslToRGB(180, 100, 0), { r: 0, g: 0, b: 0 })
    })

    it("converts lightness 25%", () => {
      const result = hslToRGB(0, 100, 25)
      assert.ok(result.r < 255)
      assert.strictEqual(result.g, 0)
      assert.strictEqual(result.b, 0)
    })

    it("converts lightness 50%", () => {
      const result = hslToRGB(0, 100, 50)
      assert.strictEqual(result.r, 255)
      assert.strictEqual(result.g, 0)
      assert.strictEqual(result.b, 0)
    })

    it("converts lightness 75%", () => {
      const result = hslToRGB(0, 100, 75)
      assert.ok(result.r === 255)
      assert.ok(result.g > 0)
      assert.ok(result.b > 0)
    })

    it("converts lightness 100% (white)", () => {
      assert.deepStrictEqual(hslToRGB(0, 100, 100), { r: 255, g: 255, b: 255 })
    })
  })

  describe("Saturation Variations", () => {
    it("converts zero saturation (gray)", () => {
      const result = hslToRGB(0, 0, 50)
      assert.ok(result.r === result.g && result.g === result.b)
    })

    it("converts 50% saturation", () => {
      const result = hslToRGB(0, 50, 50)
      assert.ok(result.r > result.g && result.r > result.b)
    })

    it("converts full saturation", () => {
      const result = hslToRGB(0, 100, 50)
      assert.deepStrictEqual(result, { r: 255, g: 0, b: 0 })
    })
  })

  describe("Hue Range Coverage", () => {
    it("handles hue 0 (red)", () => {
      const result = hslToRGB(0, 100, 50)
      assert.strictEqual(result.r, 255)
      assert.strictEqual(result.g, 0)
      assert.strictEqual(result.b, 0)
    })

    it("handles hue 60 (yellow)", () => {
      assert.deepStrictEqual(hslToRGB(60, 100, 50), { r: 255, g: 255, b: 0 })
    })

    it("handles hue 120 (green)", () => {
      assert.deepStrictEqual(hslToRGB(120, 100, 50), { r: 0, g: 255, b: 0 })
    })

    it("handles hue 180 (cyan)", () => {
      assert.deepStrictEqual(hslToRGB(180, 100, 50), { r: 0, g: 255, b: 255 })
    })

    it("handles hue 240 (blue)", () => {
      assert.deepStrictEqual(hslToRGB(240, 100, 50), { r: 0, g: 0, b: 255 })
    })

    it("handles hue 300 (magenta)", () => {
      assert.deepStrictEqual(hslToRGB(300, 100, 50), { r: 255, g: 0, b: 255 })
    })

    it("handles hue 360 (red, wrap-around)", () => {
      const result360 = hslToRGB(360, 100, 50)
      const result0 = hslToRGB(0, 100, 50)
      assert.deepStrictEqual(result360, result0)
    })
  })

  describe("Round-Trip Conversions", () => {
    it("round-trips primary colors", () => {
      const original = { r: 255, g: 0, b: 0 }
      const hsl = rgbToHSL(original.r, original.g, original.b)
      const result = hslToRGB(hsl.h, hsl.s, hsl.l)
      assert.deepStrictEqual(result, original)
    })

    it("round-trips complex colors", () => {
      const original = { r: 128, g: 200, b: 75 }
      const hsl = rgbToHSL(original.r, original.g, original.b)
      const result = hslToRGB(hsl.h, hsl.s, hsl.l)
      // Allow for rounding errors
      assert.ok(Math.abs(result.r - original.r) <= 1)
      assert.ok(Math.abs(result.g - original.g) <= 1)
      assert.ok(Math.abs(result.b - original.b) <= 1)
    })

    it("round-trips achromatic colors", () => {
      const original = { r: 128, g: 128, b: 128 }
      const hsl = rgbToHSL(original.r, original.g, original.b)
      const result = hslToRGB(hsl.h, hsl.s, hsl.l)
      assert.ok(Math.abs(result.r - original.r) <= 1)
      assert.ok(Math.abs(result.g - original.g) <= 1)
      assert.ok(Math.abs(result.b - original.b) <= 1)
    })
  })

  describe("Edge Cases", () => {
    it("handles intermediate hue values", () => {
      const result = hslToRGB(45, 100, 50)
      assert.ok(result.r > 0 && result.g > 0)
    })

    it("returns values in valid RGB range", () => {
      const result = hslToRGB(123, 45, 67)
      assert.ok(result.r >= 0 && result.r <= 255)
      assert.ok(result.g >= 0 && result.g <= 255)
      assert.ok(result.b >= 0 && result.b <= 255)
    })
  })
})

describe("hexToHSL", () => {
  describe("Primary Colors", () => {
    it("converts red", () => {
      assertHSLClose(hexToHSL("#FF0000"), { h: 0, s: 100, l: 50 })
    })

    it("converts green", () => {
      assertHSLClose(hexToHSL("#00FF00"), { h: 120, s: 100, l: 50 })
    })

    it("converts blue", () => {
      assertHSLClose(hexToHSL("#0000FF"), { h: 240, s: 100, l: 50 })
    })
  })

  describe("Secondary Colors", () => {
    it("converts cyan", () => {
      assertHSLClose(hexToHSL("#00FFFF"), { h: 180, s: 100, l: 50 })
    })

    it("converts magenta", () => {
      assertHSLClose(hexToHSL("#FF00FF"), { h: 300, s: 100, l: 50 })
    })

    it("converts yellow", () => {
      assertHSLClose(hexToHSL("#FFFF00"), { h: 60, s: 100, l: 50 })
    })
  })

  describe("Achromatic Colors", () => {
    it("converts black", () => {
      assertHSLClose(hexToHSL("#000000"), { h: 0, s: 0, l: 0 })
    })

    it("converts white", () => {
      assertHSLClose(hexToHSL("#FFFFFF"), { h: 0, s: 0, l: 100 })
    })

    it("converts mid gray", () => {
      const result = hexToHSL("#808080")
      assertHSLClose(result, { h: 0, s: 0, l: 50.2 }, 0.5)
    })
  })

  describe("Hash Symbol Handling", () => {
    it("converts hex with hash", () => {
      const withHash = hexToHSL("#FF5733")
      const expected = { h: 11.3, s: 100, l: 60 }
      assertHSLClose(withHash, expected, 1)
    })

    it("converts hex without hash", () => {
      const withoutHash = hexToHSL("FF5733")
      const withHash = hexToHSL("#FF5733")
      assert.deepStrictEqual(withoutHash, withHash)
    })
  })

  describe("Case Sensitivity", () => {
    it("converts lowercase hex", () => {
      assertHSLClose(hexToHSL("#ff0000"), { h: 0, s: 100, l: 50 })
    })

    it("converts uppercase hex", () => {
      assertHSLClose(hexToHSL("#FF0000"), { h: 0, s: 100, l: 50 })
    })

    it("converts mixed case hex", () => {
      assertHSLClose(hexToHSL("#Ff0000"), { h: 0, s: 100, l: 50 })
    })
  })
})

describe("hslToHex", () => {
  describe("Primary Colors", () => {
    it("converts red HSL to hex", () => {
      assert.strictEqual(hslToHex({ h: 0, s: 100, l: 50 }), "#ff0000")
    })

    it("converts green HSL to hex", () => {
      assert.strictEqual(hslToHex({ h: 120, s: 100, l: 50 }), "#00ff00")
    })

    it("converts blue HSL to hex", () => {
      assert.strictEqual(hslToHex({ h: 240, s: 100, l: 50 }), "#0000ff")
    })
  })

  describe("Secondary Colors", () => {
    it("converts cyan HSL to hex", () => {
      assert.strictEqual(hslToHex({ h: 180, s: 100, l: 50 }), "#00ffff")
    })

    it("converts magenta HSL to hex", () => {
      assert.strictEqual(hslToHex({ h: 300, s: 100, l: 50 }), "#ff00ff")
    })

    it("converts yellow HSL to hex", () => {
      assert.strictEqual(hslToHex({ h: 60, s: 100, l: 50 }), "#ffff00")
    })
  })

  describe("Achromatic Colors", () => {
    it("converts black HSL to hex", () => {
      assert.strictEqual(hslToHex({ h: 0, s: 0, l: 0 }), "#000000")
    })

    it("converts white HSL to hex", () => {
      assert.strictEqual(hslToHex({ h: 0, s: 0, l: 100 }), "#ffffff")
    })

    it("converts gray HSL to hex", () => {
      const result = hslToHex({ h: 0, s: 0, l: 50 })
      assert.ok(result.startsWith("#"))
      assert.ok(result.length === 7)
    })
  })

  describe("Format Validation", () => {
    it("always starts with hash", () => {
      const result = hslToHex({ h: 123, s: 45, l: 67 })
      assert.ok(result.startsWith("#"))
    })

    it("always returns 7 characters", () => {
      const result = hslToHex({ h: 0, s: 0, l: 0 })
      assert.strictEqual(result.length, 7)
    })

    it("always returns lowercase hex", () => {
      const result = hslToHex({ h: 200, s: 75, l: 60 })
      assert.strictEqual(result, result.toLowerCase())
    })

    it("pads single digit hex values with zero", () => {
      const result = hslToHex({ h: 0, s: 0, l: 1 })
      assert.match(result, /^#[0-9a-f]{6}$/)
    })
  })

  describe("Round-Trip Conversions", () => {
    it("round-trips with hexToHSL for primary colors", () => {
      const original = "#ff0000"
      const hsl = hexToHSL(original)
      const result = hslToHex(hsl)
      assert.strictEqual(result, original)
    })

    it("round-trips with hexToHSL for complex colors", () => {
      const original = "#3498db"
      const hsl = hexToHSL(original)
      const result = hslToHex(hsl)
      assert.strictEqual(result, original)
    })

    it("round-trips achromatic colors", () => {
      const original = "#ffffff"
      const hsl = hexToHSL(original)
      const result = hslToHex(hsl)
      assert.strictEqual(result, original)
    })
  })

  describe("Edge Cases", () => {
    it("handles maximum HSL values", () => {
      const result = hslToHex({ h: 359, s: 100, l: 50 })
      assert.ok(result.startsWith("#"))
      assert.strictEqual(result.length, 7)
    })

    it("handles minimum HSL values", () => {
      const result = hslToHex({ h: 0, s: 0, l: 0 })
      assert.strictEqual(result, "#000000")
    })

    it("handles fractional HSL values", () => {
      const result = hslToHex({ h: 123.456, s: 78.9, l: 45.6 })
      assert.ok(result.startsWith("#"))
      assert.strictEqual(result.length, 7)
    })
  })
})
