/**
 * Manages recent color history with browser storage persistence
 */

export class RecentColorsManager {
  constructor(maxColors = 14) {
    this.maxColors = maxColors
    this.colors = []
  }

  async load() {
    try {
      const result = await browser.storage.local.get("recentColors")
      if (result.recentColors) {
        this.colors = result.recentColors
      }
    } catch (error) {
      console.error("Failed to load recent colors:", error)
    }
  }

  add(color) {
    // Remove if already exists (case-insensitive)
    this.colors = this.colors.filter(
      (c) => c.toLowerCase() !== color.toLowerCase(),
    )

    // Add to beginning
    this.colors.unshift(color)

    // Limit size
    if (this.colors.length > this.maxColors) {
      this.colors = this.colors.slice(0, this.maxColors)
    }

    // Save to storage
    this.save()
  }

  async save() {
    try {
      await browser.storage.local.set({ recentColors: this.colors })
    } catch (error) {
      console.error("Failed to save recent colors:", error)
    }
  }

  getColors() {
    return [...this.colors]
  }

  hasColors() {
    return this.colors.length > 0
  }
}
