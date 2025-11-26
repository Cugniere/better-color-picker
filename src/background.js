/**
 * Background service worker for Better Color Picker
 * Handles screenshot capture for eyedropper functionality
 */

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "CAPTURE_SCREENSHOT") {
    return browser.tabs.captureVisibleTab(sender.tab.windowId, {
      format: "png",
    })
  }
})
