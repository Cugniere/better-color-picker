(function () {
  "use strict";

  let currentInput = null;
  let pickerElement = null;
  let recentColors = [];
  const MAX_RECENT_COLORS = 14;

  // Load recent colors from storage
  browser.storage.local.get("recentColors").then((result) => {
    if (result.recentColors) {
      recentColors = result.recentColors;
    }
  });

  // Intercept all events that could open the native picker
  ["mousedown", "click"].forEach((eventType) => {
    document.addEventListener(
      eventType,
      function (e) {
        if (e.target.tagName === "INPUT" && e.target.type === "color") {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          if (eventType === "click") {
            showCustomPicker(e.target);
          }
        }
      },
      true,
    );
  });

  // Handle focus (from label clicks or tab navigation)
  document.addEventListener(
    "focus",
    function (e) {
      if (e.target.tagName === "INPUT" && e.target.type === "color") {
        e.preventDefault();
        showCustomPicker(e.target);
      }
    },
    true,
  );

  function showCustomPicker(inputElement) {
    if (pickerElement && currentInput === inputElement) {
      return; // Already showing for this input
    }

    closeCustomPicker();
    currentInput = inputElement; // Set BEFORE creating picker

    const initialColor = inputElement.value || "#000000";

    pickerElement = createPickerElement(initialColor);
    document.body.appendChild(pickerElement);

    positionPicker(pickerElement, inputElement);

    setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("scroll", closeCustomPicker, true);
      window.addEventListener("resize", handleResize);
      document.addEventListener("keydown", handleKeydown);
    }, 0);
  }

  function handleOutsideClick(e) {
    if (
      pickerElement &&
      !pickerElement.contains(e.target) &&
      e.target !== currentInput
    ) {
      closeCustomPicker();
    }
  }

  function handleResize() {
    if (pickerElement && currentInput) {
      positionPicker(pickerElement, currentInput);
    }
  }

  function handleKeydown(e) {
    if (!pickerElement) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeCustomPicker();
    }
  }

  function closeCustomPicker() {
    if (pickerElement) {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("scroll", closeCustomPicker, true);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeydown);
      pickerElement.remove();
      pickerElement = null;
    }
    currentInput = null;
  }

  function positionPicker(picker, input) {
    const rect = input.getBoundingClientRect();
    const pickerHeight = picker.offsetHeight;
    const pickerWidth = picker.offsetWidth;

    let top = rect.bottom + window.scrollY + 5;
    let left = rect.left + window.scrollX;

    // Check if picker would go off bottom of viewport
    if (rect.bottom + pickerHeight > window.innerHeight) {
      top = rect.top + window.scrollY - pickerHeight - 5;
    }

    // Check if picker would go off right of viewport
    if (rect.left + pickerWidth > window.innerWidth) {
      left = window.innerWidth - pickerWidth - 10 + window.scrollX;
    }

    picker.style.top = Math.max(0, top) + "px";
    picker.style.left = Math.max(0, left) + "px";
  }

  function createPickerElement(initialColor) {
    const container = document.createElement("div");
    container.className = "bcp-color-picker";

    const hsv = hexToHSV(initialColor);
    const rgb = hexToRGB(initialColor);
    const baseColor = hsvToHex({ h: hsv.h, s: 100, v: 100 });

    container.innerHTML = `
      <div class="bcp-picker-content">
        <div class="bcp-saturation-lightness" data-hue="${hsv.h}" style="background-color: ${baseColor}">
          <div class="bcp-sl-overlay-white"></div>
          <div class="bcp-sl-overlay-black"></div>
          <div class="bcp-sl-cursor" style="left: ${hsv.s}%; top: ${100 - hsv.v}%"></div>
        </div>
        
        <div class="bcp-controls">
          <div class="bcp-tool-preview">
            <div class="bcp-tool-preview">
              <div class="bcp-color-preview">
                <div class="bcp-preview-bg"></div>
                <div class="bcp-preview-color" style="background-color: ${initialColor}"></div>
              </div>
            </div>
          </div>

          <div class="bcp-sliders">
            <div class="bcp-slider-row">
              <div class="bcp-hue-slider">
                <div class="bcp-slider-track bcp-hue-track"></div>
                <div class="bcp-slider-thumb" style="left: ${(hsv.h / 360) * 100}%"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bcp-hex-input-row">
          <input type="text" class="bcp-hex-input" value="${initialColor.toUpperCase()}" maxlength="7" />
        </div>

        <div class="bcp-recent-colors"></div>
      </div>
    `;

    setupPickerInteractions(container);
    updateRecentColorsDisplay(container);

    return container;
  }

  function setupPickerInteractions(container) {
    const slArea = container.querySelector(".bcp-saturation-lightness");
    const slCursor = container.querySelector(".bcp-sl-cursor");
    const hueSlider = container.querySelector(".bcp-hue-slider");
    const hueThumb = hueSlider.querySelector(".bcp-slider-thumb");
    const hexInput = container.querySelector(".bcp-hex-input");
    const previewColor = container.querySelector(".bcp-preview-color");

    let currentHSV = { h: 0, s: 100, v: 100 };

    // Initialize from current input value
    const initialColor = currentInput.value || "#000000";
    currentHSV = hexToHSV(initialColor);
    updateColorDisplay();

    // Saturation/Lightness area
    let isDraggingSL = false;
    slArea.addEventListener("mousedown", (e) => {
      isDraggingSL = true;
      updateSL(e);
    });

    document.addEventListener("mousemove", (e) => {
      if (isDraggingSL) updateSL(e);
    });

    document.addEventListener("mouseup", () => {
      isDraggingSL = false;
    });

    function updateSL(e) {
      const rect = slArea.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      x = Math.max(0, Math.min(x, rect.width));
      y = Math.max(0, Math.min(y, rect.height));

      const s = (x / rect.width) * 100;
      const v = 100 - (y / rect.height) * 100;

      currentHSV.s = s;
      currentHSV.v = v;

      slCursor.style.left = s + "%";
      slCursor.style.top = 100 - v + "%";

      updateColorDisplay();
    }

    // Hue slider
    let isDraggingHue = false;
    hueSlider.addEventListener("mousedown", (e) => {
      isDraggingHue = true;
      updateHue(e);
    });

    document.addEventListener("mousemove", (e) => {
      if (isDraggingHue) updateHue(e);
    });

    document.addEventListener("mouseup", () => {
      isDraggingHue = false;
    });

    function updateHue(e) {
      const rect = hueSlider.getBoundingClientRect();
      let x = e.clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));

      const h = (x / rect.width) * 360;
      currentHSV.h = h;

      hueThumb.style.left = (h / 360) * 100 + "%";
      slArea.setAttribute("data-hue", h);

      // Update SL area background
      const baseColor = hsvToHex({ h: h, s: 100, v: 100 });
      slArea.style.backgroundColor = baseColor;

      updateColorDisplay();
    }

    // Hex input
    hexInput.addEventListener("input", (e) => {
      let value = e.target.value;
      if (!value.startsWith("#")) {
        value = "#" + value;
      }

      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        const hsv = hexToHSV(value);
        currentHSV = hsv;

        // Update UI
        slCursor.style.left = hsv.s + "%";
        slCursor.style.top = 100 - hsv.v + "%";
        hueThumb.style.left = (hsv.h / 360) * 100 + "%";
        slArea.setAttribute("data-hue", hsv.h);
        slArea.style.backgroundColor = hsvToHex({ h: hsv.h, s: 100, v: 100 });

        updateColorDisplay(false); // Don't update hex input to avoid cursor jump
      }
    });

    hexInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        closeCustomPicker();
      }
    });

    hexInput.addEventListener("blur", (e) => {
      updateColorDisplay();
    });

    function updateColorDisplay(updateHexInput = true) {
      if (!currentInput) {
        return; // Picker was closed, stop updating
      }

      const hexColor = hsvToHex(currentHSV);

      if (updateHexInput) {
        hexInput.value = hexColor.toUpperCase();
      }

      previewColor.style.backgroundColor = hexColor;

      // Update input value
      if (currentInput) {
        currentInput.value = hexColor;

        // Trigger events
        currentInput.dispatchEvent(new Event("input", { bubbles: true }));
        currentInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  function updateRecentColorsDisplay(container) {
    const recentContainer = container.querySelector(".bcp-recent-colors");

    if (recentColors.length === 0) {
      return;
    }

    recentContainer.innerHTML = '<div class="bcp-recent-label">Recent:</div>';

    const swatchContainer = document.createElement("div");
    swatchContainer.className = "bcp-recent-swatches";

    recentColors.forEach((color) => {
      const swatch = document.createElement("button");
      swatch.className = "bcp-color-swatch";
      swatch.style.backgroundColor = color;
      swatch.title = color;
      swatch.addEventListener("click", () => {
        if (currentInput) {
          currentInput.value = color;
          currentInput.dispatchEvent(new Event("input", { bubbles: true }));
          currentInput.dispatchEvent(new Event("change", { bubbles: true }));
          addRecentColor(color);
          closeCustomPicker();
        }
      });
      swatchContainer.appendChild(swatch);
    });

    recentContainer.appendChild(swatchContainer);
  }

  function addRecentColor(color) {
    // Remove if already exists
    recentColors = recentColors.filter(
      (c) => c.toLowerCase() !== color.toLowerCase(),
    );

    // Add to beginning
    recentColors.unshift(color);

    // Limit size
    if (recentColors.length > MAX_RECENT_COLORS) {
      recentColors = recentColors.slice(0, MAX_RECENT_COLORS);
    }

    // Save to storage
    browser.storage.local.set({ recentColors });
  }

  // Save color when picker closes
  const originalClose = closeCustomPicker;
  closeCustomPicker = function () {
    if (currentInput && currentInput.value) {
      addRecentColor(currentInput.value);
    }
    originalClose();
  };

  // Color conversion utilities
  function hexToRGB(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  function hexToHSV(hex) {
    const rgb = hexToRGB(hex);
    return rgbToHSV(rgb.r, rgb.g, rgb.b);
  }

  function rgbToHSV(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = max === 0 ? 0 : (delta / max) * 100;
    let v = max * 100;

    if (delta !== 0) {
      if (max === r) {
        h = 60 * (((g - b) / delta) % 6);
      } else if (max === g) {
        h = 60 * ((b - r) / delta + 2);
      } else {
        h = 60 * ((r - g) / delta + 4);
      }
    }

    if (h < 0) h += 360;

    return { h, s, v };
  }

  function hsvToRGB(h, s, v) {
    s /= 100;
    v /= 100;

    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r, g, b;

    if (h < 60) {
      [r, g, b] = [c, x, 0];
    } else if (h < 120) {
      [r, g, b] = [x, c, 0];
    } else if (h < 180) {
      [r, g, b] = [0, c, x];
    } else if (h < 240) {
      [r, g, b] = [0, x, c];
    } else if (h < 300) {
      [r, g, b] = [x, 0, c];
    } else {
      [r, g, b] = [c, 0, x];
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }

  function hsvToHex(hsv) {
    const rgb = hsvToRGB(hsv.h, hsv.s, hsv.v);
    return (
      "#" +
      [rgb.r, rgb.g, rgb.b].map((x) => x.toString(16).padStart(2, "0")).join("")
    );
  }
})();
