# Better Color Picker

A Firefox extension that replaces the native OS color picker with a custom, feature-rich color picker inspired by Chrome DevTools.

## Features

- **Custom Color Picker UI**: Professional gradient-based color picker with saturation/lightness area
- **Hue Slider**: Easy hue selection with visual rainbow gradient
- **Hex Input**: Direct hex color input with live validation
- **Recent Colors**: Automatically saves up to 14 recently used colors
- **Universal**: Works on any website with `<input type="color">` elements

## Installation

### Development Installation

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the sidebar
4. Click "Load Temporary Add-on"
5. Navigate to the extension folder and select `manifest.json`

### Testing

Open the included `test.html` file in Firefox to test all features:
- Basic color selection
- Multiple inputs
- Alpha channel support
- Recent colors

## Usage

Simply click any `<input type="color">` element on any webpage. The custom picker will appear instead of the OS native picker.

### Color Picker Features

1. **Saturation/Lightness Area**: Click and drag in the large gradient square to adjust saturation and lightness
2. **Hue Slider**: Drag the slider to change the hue (color)
4. **Hex Input**: Type a hex color code directly (e.g., `#FF5733`)
5. **Recent Colors**: Click any swatch in the recent colors section to quickly reuse a color

## Technical Details

### Files

- `manifest.json`: Extension configuration
- `content.js`: Main logic for intercepting color inputs and rendering the picker
- `picker.css`: Styling for the custom color picker
- `test.html`: Test page with various color input scenarios

### Permissions

- `<all_urls>`: Required for the content script to run on all websites
- `storage`: Required to save recent colors

### Browser Compatibility

- Firefox 78+

### Color Conversion

The extension uses HSV (Hue, Saturation, Value) color space internally for smooth color selection, converting to hex for display and storage.

## Development Notes

### Customization

You can customize the picker appearance by editing `picker.css`:
- Change dimensions, colors, spacing
- Modify the number of recent colors (change `MAX_RECENT_COLORS` in `content.js`)
- Adjust positioning behavior

### Event Handling

The extension properly triggers both `input` and `change` events on the original input element, ensuring compatibility with web applications that listen for these events.

## License

This extension is provided as-is for use and modification.

