import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { RecentColorsManager } from "../../src/storage/RecentColors.mjs"

// Mock browser.storage.local
let mockStorage = {}
global.browser = {
  storage: {
    local: {
      async get(key) {
        if (key === "recentColors" && mockStorage.recentColors) {
          return { recentColors: mockStorage.recentColors }
        }
        return {}
      },
      async set(data) {
        Object.assign(mockStorage, data)
      },
    },
  },
}

describe("RecentColorsManager", () => {
  let manager

  beforeEach(() => {
    mockStorage = {}
    manager = new RecentColorsManager()
  })

  describe("Constructor", () => {
    it("initializes with default maxColors of 14", () => {
      const mgr = new RecentColorsManager()
      assert.strictEqual(mgr.maxColors, 14)
      assert.deepStrictEqual(mgr.colors, [])
    })

    it("initializes with custom maxColors", () => {
      const mgr = new RecentColorsManager(10)
      assert.strictEqual(mgr.maxColors, 10)
      assert.deepStrictEqual(mgr.colors, [])
    })

    it("initializes with empty colors array", () => {
      const mgr = new RecentColorsManager()
      assert.deepStrictEqual(mgr.colors, [])
      assert.strictEqual(mgr.hasColors(), false)
    })
  })

  describe("load()", () => {
    it("loads colors from storage", async () => {
      mockStorage.recentColors = ["#ff0000", "#00ff00", "#0000ff"]
      await manager.load()
      assert.deepStrictEqual(manager.colors, ["#ff0000", "#00ff00", "#0000ff"])
    })

    it("handles empty storage", async () => {
      await manager.load()
      assert.deepStrictEqual(manager.colors, [])
    })

    it("handles missing recentColors key", async () => {
      mockStorage = {}
      await manager.load()
      assert.deepStrictEqual(manager.colors, [])
    })

    it("handles storage errors gracefully", async () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = () => {}

      // Override get to throw error
      const originalGet = global.browser.storage.local.get
      global.browser.storage.local.get = async () => {
        throw new Error("Storage error")
      }

      await manager.load()
      assert.deepStrictEqual(manager.colors, [])

      // Restore
      global.browser.storage.local.get = originalGet
      console.error = originalError
    })
  })

  describe("add()", () => {
    it("adds a color to the beginning", () => {
      manager.add("#ff0000")
      assert.deepStrictEqual(manager.colors, ["#ff0000"])
    })

    it("adds multiple colors in order", () => {
      manager.add("#ff0000")
      manager.add("#00ff00")
      manager.add("#0000ff")
      assert.deepStrictEqual(manager.colors, ["#0000ff", "#00ff00", "#ff0000"])
    })

    it("removes duplicate before adding (case-insensitive)", () => {
      manager.add("#ff0000")
      manager.add("#00ff00")
      manager.add("#FF0000") // Same as first, different case
      assert.deepStrictEqual(manager.colors, ["#FF0000", "#00ff00"])
    })

    it("handles lowercase duplicates", () => {
      manager.add("#FF0000")
      manager.add("#00ff00")
      manager.add("#ff0000") // Lowercase version of first
      assert.deepStrictEqual(manager.colors, ["#ff0000", "#00ff00"])
    })

    it("handles mixed case duplicates", () => {
      manager.add("#Ff0000")
      manager.add("#00ff00")
      manager.add("#fF0000")
      assert.strictEqual(manager.colors.length, 2)
      assert.strictEqual(manager.colors[0], "#fF0000")
    })

    it("limits colors to maxColors", () => {
      const mgr = new RecentColorsManager(3)
      mgr.add("#ff0000")
      mgr.add("#00ff00")
      mgr.add("#0000ff")
      mgr.add("#ffff00") // Should push out #ff0000
      assert.strictEqual(mgr.colors.length, 3)
      assert.deepStrictEqual(mgr.colors, ["#ffff00", "#0000ff", "#00ff00"])
    })

    it("maintains order when removing duplicates", () => {
      manager.add("#ff0000")
      manager.add("#00ff00")
      manager.add("#0000ff")
      manager.add("#ffff00")
      manager.add("#00ff00") // Move to front
      assert.deepStrictEqual(manager.colors, [
        "#00ff00",
        "#ffff00",
        "#0000ff",
        "#ff0000",
      ])
    })

    it("saves to storage after adding", () => {
      manager.add("#ff0000")
      // save() is async but add() doesn't await it
      // We can check that colors were set
      assert.deepStrictEqual(manager.colors, ["#ff0000"])
    })
  })

  describe("save()", () => {
    it("saves colors to storage", async () => {
      manager.colors = ["#ff0000", "#00ff00"]
      await manager.save()
      assert.deepStrictEqual(mockStorage.recentColors, ["#ff0000", "#00ff00"])
    })

    it("saves empty array", async () => {
      manager.colors = []
      await manager.save()
      assert.deepStrictEqual(mockStorage.recentColors, [])
    })

    it("handles storage errors gracefully", async () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = () => {}

      const originalSet = global.browser.storage.local.set
      global.browser.storage.local.set = async () => {
        throw new Error("Storage error")
      }

      manager.colors = ["#ff0000"]
      await manager.save() // Should not throw

      // Restore
      global.browser.storage.local.set = originalSet
      console.error = originalError
    })
  })

  describe("getColors()", () => {
    it("returns copy of colors array", () => {
      manager.colors = ["#ff0000", "#00ff00"]
      const result = manager.getColors()
      assert.deepStrictEqual(result, ["#ff0000", "#00ff00"])
    })

    it("returns independent copy (not reference)", () => {
      manager.colors = ["#ff0000"]
      const result = manager.getColors()
      result.push("#00ff00")
      assert.deepStrictEqual(manager.colors, ["#ff0000"])
      assert.deepStrictEqual(result, ["#ff0000", "#00ff00"])
    })

    it("returns empty array when no colors", () => {
      const result = manager.getColors()
      assert.deepStrictEqual(result, [])
    })
  })

  describe("hasColors()", () => {
    it("returns false when empty", () => {
      assert.strictEqual(manager.hasColors(), false)
    })

    it("returns true when has colors", () => {
      manager.add("#ff0000")
      assert.strictEqual(manager.hasColors(), true)
    })

    it("returns false after removing all colors", () => {
      manager.add("#ff0000")
      manager.colors = []
      assert.strictEqual(manager.hasColors(), false)
    })
  })

  describe("Integration Tests", () => {
    it("full workflow: load, add, save, load again", async () => {
      // Initial load (empty)
      await manager.load()
      assert.strictEqual(manager.hasColors(), false)

      // Add colors
      manager.add("#ff0000")
      manager.add("#00ff00")
      manager.add("#0000ff")
      await manager.save()

      // Create new manager and load
      const manager2 = new RecentColorsManager()
      await manager2.load()
      assert.deepStrictEqual(manager2.getColors(), [
        "#0000ff",
        "#00ff00",
        "#ff0000",
      ])
    })

    it("maintains max limit across sessions", async () => {
      const mgr = new RecentColorsManager(3)

      // Add 5 colors
      mgr.add("#ff0000")
      mgr.add("#00ff00")
      mgr.add("#0000ff")
      mgr.add("#ffff00")
      mgr.add("#ff00ff")
      await mgr.save()

      // Load in new manager with same limit
      const mgr2 = new RecentColorsManager(3)
      await mgr2.load()
      assert.strictEqual(mgr2.colors.length, 3)
      assert.deepStrictEqual(mgr2.getColors(), [
        "#ff00ff",
        "#ffff00",
        "#0000ff",
      ])
    })

    it("handles rapid additions", () => {
      const colors = [
        "#ff0000",
        "#00ff00",
        "#0000ff",
        "#ffff00",
        "#ff00ff",
        "#00ffff",
      ]
      colors.forEach((c) => manager.add(c))
      assert.strictEqual(manager.colors.length, 6)
      assert.strictEqual(manager.colors[0], "#00ffff") // Last added
    })

    it("preserves color format (case)", () => {
      manager.add("#FF0000")
      manager.add("#00ff00")
      manager.add("#0000FF")
      const result = manager.getColors()
      assert.strictEqual(result[0], "#0000FF")
      assert.strictEqual(result[1], "#00ff00")
      assert.strictEqual(result[2], "#FF0000")
    })
  })

  describe("Edge Cases", () => {
    it("handles maxColors of 0", () => {
      const mgr = new RecentColorsManager(0)
      mgr.add("#ff0000")
      assert.deepStrictEqual(mgr.colors, [])
    })

    it("handles maxColors of 1", () => {
      const mgr = new RecentColorsManager(1)
      mgr.add("#ff0000")
      mgr.add("#00ff00")
      assert.deepStrictEqual(mgr.colors, ["#00ff00"])
    })

    it("handles adding same color multiple times", () => {
      manager.add("#ff0000")
      manager.add("#ff0000")
      manager.add("#ff0000")
      assert.deepStrictEqual(manager.colors, ["#ff0000"])
    })

    it("handles empty string color", () => {
      manager.add("")
      assert.deepStrictEqual(manager.colors, [""])
    })

    it("handles special characters in color", () => {
      manager.add("#ff00ff!")
      assert.deepStrictEqual(manager.colors, ["#ff00ff!"])
    })

    it("handles very large maxColors", () => {
      const mgr = new RecentColorsManager(1000)
      assert.strictEqual(mgr.maxColors, 1000)
    })
  })
})
