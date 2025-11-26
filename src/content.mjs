/**
 * Better Color Picker - Content Script Entry Point
 * Intercepts native color inputs and replaces them with a custom picker
 */

import { PickerController } from "./picker/PickerController.mjs"
import { RecentColorsManager } from "./storage/RecentColors.mjs"
;(async function () {
  "use strict"

  // Initialize recent colors manager
  const recentColorsManager = new RecentColorsManager(14)
  await recentColorsManager.load()

  // Initialize picker controller
  const pickerController = new PickerController(recentColorsManager)

  // Intercept all events that could open the native picker
  ;["mousedown", "click"].forEach((eventType) => {
    document.addEventListener(
      eventType,
      function (e) {
        if (e.target.tagName === "INPUT" && e.target.type === "color") {
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation()
          if (eventType === "click") {
            pickerController.show(e.target)
          }
        }
      },
      true,
    )
  })

  // Handle focus (from label clicks or tab navigation)
  document.addEventListener(
    "focus",
    function (e) {
      if (e.target.tagName === "INPUT" && e.target.type === "color") {
        e.preventDefault()
        pickerController.show(e.target)
      }
    },
    true,
  )
})()
