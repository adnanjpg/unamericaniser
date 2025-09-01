# 🌍 Un-American-iser Chrome Extension

A Chrome extension that automatically converts American measurements and terms to their international equivalents on any webpage.

## Features

- **Temperature Conversion**: 70°F → 70°F (21°C)
- **Distance Conversion**: 5 miles → 5 miles (8 km)
- **Speed Conversion**: 60 mph → 60 mph (96 km/h)
- **Weight Conversion**: 150 lbs → 150 lbs (68 kg)
- **Date Formatting**: 03/01/2025 → 03/01/2025 (1 March 2025)
- **Brand Context**: Apple → Apple (US tech company)

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select the extension folder
4. The extension will be installed and ready to use

## Usage

The extension works automatically on any webpage. You can:

- Click the extension icon to see quick toggles for different conversion types
- Right-click the extension icon and select "Options" for full settings
- Enable or disable specific conversion types as needed

## Settings

You can customize which conversions are active through:

- **Popup Interface**: Quick toggles for each conversion type
- **Options Page**: Full settings with detailed descriptions
- **Auto-save**: Settings are automatically saved as you change them

## Technical Details

- **Manifest Version**: 3
- **Permissions**: Storage, Active Tab
- **Content Script**: Automatically injected on all web pages
- **Background Script**: Handles settings and extension lifecycle
- **Options Page**: Full settings interface
- **Popup**: Quick access interface

## File Structure

```
unamericaniser/
├── manifest.json          # Extension manifest
├── content.js             # Main content script
├── background.js          # Background service worker
├── options.html           # Options page
├── options.css            # Options page styles
├── options.js             # Options page logic
├── popup.html             # Popup interface
├── popup.css              # Popup styles
├── popup.js               # Popup logic
├── icons/                 # Extension icons
└── README.md              # This file
```

## Conversion Logic

### Temperature
- Formula: (°F - 32) × 5/9 = °C
- Rounds to nearest whole number

### Distance
- Formula: miles × 1.60934 = km
- Rounds to 2 decimal places

### Weight
- Formula: lbs × 0.453592 = kg
- Rounds to 2 decimal places

### Speed
- Formula: mph × 1.60934 = km/h
- Rounds to nearest whole number

### Dates
- Converts MM/DD/YYYY to "DD Month YYYY" format
- Uses full month names

### Brands
- Adds contextual information about American brands
- Configurable list of major US companies

## Development

The extension is built with vanilla JavaScript and follows Chrome Extension Manifest V3 standards.

### Key Components

1. **Content Script** (`content.js`): Scans and modifies webpage content
2. **Background Script** (`background.js`): Manages extension lifecycle and settings
3. **Options Page** (`options.html/css/js`): Full settings interface
4. **Popup** (`popup.html/css/js`): Quick access interface

### Safety Features

- Non-destructive text replacement
- Excludes form inputs, scripts, and sensitive elements
- Uses mutation observers for dynamic content
- Graceful error handling

## Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Privacy

- No data is sent to external servers
- All processing happens locally
- Settings are stored in Chrome's sync storage

## License

MIT License - Feel free to modify and distribute.

## Contributing

1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Version History

- **v1.0.0**: Initial release with all core features

---

Making the web more international, one conversion at a time! 🌎
