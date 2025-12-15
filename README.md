<p align="center">
  <img src="public/icons/icon.svg" alt="Better Color Picker screenshot" width="160">
</p>

<h1 align="center">Better Color Picker</h1>
<p align="center">
  Replaces Firefox's native color picker for <code>&lt;input type="color"&gt;</code> with a modern interface.
</p>
<p align="center">
  <img src="assets/media/cover.png" alt="Better Color Picker screenshot">
</p>

## Features

- Gradient-based saturation/lightness selector
- Hue slider with rainbow gradient
- Multiple color formats (HEX, RGB, HSL) with toggle button
- Eyedropper tool to pick colors from the page
- Recent colors (automatically saves up to 14)
- Dark mode support
- Works on all websites with `<input type="color">`

## Installation

### From Firefox Add-ons

[Install from addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/better-color-picker)

## Development

1. Clone this repository
2. Run the following commands

```bash
npm install
npm run build
```

3. Navigate to `about:debugging` in Firefox
4. Select `dist/manifest.json`

To run tests:

```bash
npm run test:unit # Run unit tests
npm run test:e2e  # Run e2e tests
```

## Requirements

- Firefox 109+
- Manifest V3

## License

MIT
