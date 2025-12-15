# Changelog

## [1.0.2] - 2025-12-15

### Added

- RGB color format support with toggle button
- HSL color format support
- Format toggle cycles between HEX → RGB → HSL
- Iframe support (`all_frames: true`)
- GitHub Actions CI/CD workflow (build, unit tests, e2e tests)
- HSL color conversion functions (`rgbToHSL`, `hslToRGB`, `hexToHSL`, `hslToHex`)
- 83 new HSL-related unit tests

### Changed

- CSS refactored with variables, consolidated dark mode, shared button styles
- Reduced CSS from 573 to 524 lines
- Test script fixed to properly run all unit test files

### Fixed

- E2E test class name reference after CSS refactoring
