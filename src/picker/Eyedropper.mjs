/**
 * Eyedropper tool for selecting colors from the page
 * Uses screenshot capture to read pixel colors
 */

export class Eyedropper {
  /**
   * Activate eyedropper and return selected color
   * @returns {Promise<string|null>} Hex color or null if cancelled
   */
  static async activate() {
    try {
      // Request screenshot from background service worker
      const screenshotUrl = await browser.runtime.sendMessage({
        type: "CAPTURE_SCREENSHOT",
      })

      if (!screenshotUrl) {
        return null
      }

      // Create overlay and wait for color selection
      return await this.createOverlay(screenshotUrl)
    } catch (error) {
      console.error("Eyedropper error:", error)
      return null
    }
  }

  /**
   * Create fullscreen overlay with screenshot
   * @param {string} screenshotUrl - Data URL of screenshot
   * @returns {Promise<string|null>} Selected color or null
   */
  static createOverlay(screenshotUrl) {
    return new Promise((resolve) => {
      // Create overlay container
      const overlay = document.createElement("div")
      overlay.className = "bcp-eyedropper-overlay"
      overlay.tabIndex = -1

      // Create canvas
      const canvas = document.createElement("canvas")
      canvas.width = window.innerWidth * window.devicePixelRatio
      canvas.height = window.innerHeight * window.devicePixelRatio
      canvas.style.width = "100%"
      canvas.style.height = "100%"

      const ctx = canvas.getContext("2d", { willReadFrequently: true })

      // Create color preview element
      const preview = document.createElement("div")
      preview.className = "bcp-eyedropper-preview"
      preview.style.display = "none"

      // Create zoom canvas for magnified preview
      const zoomCanvas = document.createElement("canvas")
      zoomCanvas.className = "bcp-eyedropper-zoom-canvas"
      zoomCanvas.width = 126
      zoomCanvas.height = 126
      const zoomCtx = zoomCanvas.getContext("2d", { willReadFrequently: true })

      const previewColor = document.createElement("div")
      previewColor.className = "bcp-eyedropper-preview-color"

      const previewText = document.createElement("div")
      previewText.className = "bcp-eyedropper-preview-text"

      preview.appendChild(zoomCanvas)
      preview.appendChild(previewColor)
      preview.appendChild(previewText)

      // Load screenshot onto canvas
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = screenshotUrl

      // Mouse move handler - update preview
      const handleMouseMove = (e) => {
        const x = Math.floor(e.clientX * window.devicePixelRatio)
        const y = Math.floor(e.clientY * window.devicePixelRatio)

        const color = this.getColorAtPoint(ctx, x, y)

        if (color) {
          preview.style.display = "flex"
          previewColor.style.backgroundColor = color
          previewText.textContent = color.toUpperCase()

          // Draw zoomed preview
          this.drawZoomPreview(ctx, zoomCtx, x, y, zoomCanvas.width)

          // Position preview dynamically to keep it on screen
          const offset = 20
          const padding = 10
          const previewRect = preview.getBoundingClientRect()
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight

          let left = e.clientX + offset
          let top = e.clientY + offset

          // Check if preview goes off the right edge
          if (left + previewRect.width + padding > viewportWidth) {
            // Position to the left of cursor instead
            left = e.clientX - previewRect.width - offset
          }

          // Check if preview goes off the bottom edge
          if (top + previewRect.height + padding > viewportHeight) {
            // Position above cursor instead
            top = e.clientY - previewRect.height - offset
          }

          // Ensure preview doesn't go off the left edge
          if (left < padding) {
            left = padding
          }

          // Ensure preview doesn't go off the top edge
          if (top < padding) {
            top = padding
          }

          preview.style.left = left + "px"
          preview.style.top = top + "px"
        }
      }

      // Click handler - select color
      const handleClick = (e) => {
        const x = Math.floor(e.clientX * window.devicePixelRatio)
        const y = Math.floor(e.clientY * window.devicePixelRatio)

        const color = this.getColorAtPoint(ctx, x, y)
        cleanup()
        resolve(color)
      }

      // Escape handler - cancel
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault()
          e.stopPropagation()
          cleanup()
          resolve(null)
        }
      }

      // Cleanup function
      const cleanup = () => {
        overlay.removeEventListener("mousemove", handleMouseMove)
        overlay.removeEventListener("click", handleClick)
        overlay.removeEventListener("keydown", handleKeyDown)
        overlay.remove()
      }

      // Attach event listeners
      overlay.addEventListener("mousemove", handleMouseMove)
      overlay.addEventListener("click", handleClick)
      overlay.addEventListener("keydown", handleKeyDown)

      // Build and attach overlay
      overlay.appendChild(canvas)
      overlay.appendChild(preview)
      document.body.appendChild(overlay)
      overlay.focus()
    })
  }

  /**
   * Get color at specific point on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {string|null} Hex color
   */
  static getColorAtPoint(ctx, x, y) {
    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data

      return `#${[pixel[0], pixel[1], pixel[2]]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")}`
    } catch (error) {
      console.error("Error reading pixel:", error)
      return null
    }
  }

  /**
   * Draw zoomed preview of area around cursor
   * @param {CanvasRenderingContext2D} sourceCtx - Source canvas context
   * @param {CanvasRenderingContext2D} zoomCtx - Zoom canvas context
   * @param {number} x - X coordinate to center on
   * @param {number} y - Y coordinate to center on
   * @param {number} size - Size of zoom canvas
   */
  static drawZoomPreview(sourceCtx, zoomCtx, x, y, size) {
    // Zoom level (how many source pixels to show)
    const zoomFactor = 21
    const halfZoom = Math.floor(zoomFactor / 2)

    // Calculate source area to copy
    const sourceX = x - halfZoom
    const sourceY = y - halfZoom

    try {
      // Get the source pixels
      const imageData = sourceCtx.getImageData(
        sourceX,
        sourceY,
        zoomFactor,
        zoomFactor,
      )

      // Clear the zoom canvas
      zoomCtx.clearRect(0, 0, size, size)

      // Disable image smoothing for crisp pixel preview
      zoomCtx.imageSmoothingEnabled = false

      // Create temporary canvas for scaling
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = zoomFactor
      tempCanvas.height = zoomFactor
      const tempCtx = tempCanvas.getContext("2d")
      tempCtx.putImageData(imageData, 0, 0)

      // Draw scaled up to zoom canvas
      zoomCtx.drawImage(
        tempCanvas,
        0,
        0,
        zoomFactor,
        zoomFactor,
        0,
        0,
        size,
        size,
      )

      // Draw center crosshair
      const center = size / 2
      const crosshairSize = size / zoomFactor / 2

      zoomCtx.strokeStyle = "rgba(255, 255, 255, 0.8)"
      zoomCtx.lineWidth = 2
      zoomCtx.beginPath()
      zoomCtx.rect(
        center - crosshairSize,
        center - crosshairSize,
        crosshairSize * 2,
        crosshairSize * 2,
      )
      zoomCtx.stroke()

      // Draw black outline for contrast
      zoomCtx.strokeStyle = "rgba(0, 0, 0, 0.6)"
      zoomCtx.lineWidth = 1
      zoomCtx.beginPath()
      zoomCtx.rect(
        center - crosshairSize - 1,
        center - crosshairSize - 1,
        crosshairSize * 2 + 2,
        crosshairSize * 2 + 2,
      )
      zoomCtx.stroke()
    } catch (error) {
      console.error("Error drawing zoom preview:", error)
    }
  }
}
