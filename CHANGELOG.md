# Changelog

## [Unreleased]

### Added
- Root-level dynamic route for cleaner URL format: `/{text}?params` (e.g., `/Signature?font=great-vibes`)
- Debounced color picker for improved performance during color selection
- Custom hook `useDebouncedCallback` for performance optimization

### Changed
- ColorPicker component now uses local state with debounced updates (100ms default)
- Optimized preview rendering performance when adjusting colors

### Performance
- **Color Picker Optimization**: Eliminated page stuttering during color dragging by implementing debounced state updates
  - Color picker now shows instant visual feedback in the UI
  - Preview area only re-renders after user stops dragging (100ms delay)
  - Significantly reduces expensive SVG re-generation calls

### API
- New route format: `http://domain.com/Signature?font=sacramento&fontSize=120`
- Maintains backward compatibility with: `http://domain.com/api/sign?text=Signature&font=sacramento&fontSize=120`
- Both routes support all parameters: `font`, `fontSize`, `charSpacing`, `bg`, `texture`, etc.
- All output formats supported: SVG (default), JSON, PNG, GIF

### Testing
- All existing tests pass (52/52)
- Added comprehensive tests for root-level path parameter route
- Updated test timeout for Chinese character tests due to font loading time

## Previous Changes
See git history for previous releases.
