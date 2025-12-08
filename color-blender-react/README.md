# Color Blender - React + TypeScript

A modern web-based color blending application built with React, TypeScript, and Vite. Upload images, pick colors with an eyedropper tool, and blend them on a 3x3 palette grid.

## Features

- **Image Upload**: Upload any image to use as a color source
- **Eyedropper Tool**: Click on the uploaded image to pick colors
- **3x3 Color Grid**: Nine palette cells, each holding TWO colors for blending
- **Two Palette Modes**:
  - **Manual Palette**: Full control over all cells
  - **Aesthetic Palette**: Auto-generates harmonious palettes from 4 corner colors
- **Two Interaction Modes**:
  - **Color Picking Mode**: Select and assign colors to cells
  - **Blending Mode**: Drag to manually mix colors like paint
- **Smooth Blending**: Clean, solid color blending with median color calculation
- **Mobile Support**: Full touch support for mobile devices
- **Export Options**: Save palette as JSON or export as PNG image

## Tech Stack

- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **HTML5 Canvas API** - Image rendering and color manipulation
- **CSS3** - Responsive design with mobile-first approach

## Project Structure

```
color-blender-react/
├── src/
│   ├── components/           # React components
│   │   ├── ImageUploader.tsx   # Image upload and eyedropper
│   │   ├── PaletteCell.tsx     # Individual palette cell
│   │   ├── PaletteGrid.tsx     # 3x3 grid container
│   │   ├── ModeToggle.tsx      # Mode selection buttons
│   │   └── Instructions.tsx    # Usage instructions
│   ├── utils/               # Utility functions
│   │   ├── colorUtils.ts      # Color conversion and mixing
│   │   ├── canvasUtils.ts     # Canvas drawing operations
│   │   └── exportUtils.ts     # Export functionality
│   ├── types/               # TypeScript definitions
│   │   └── index.ts           # Shared types and interfaces
│   ├── App.tsx              # Main application component
│   ├── App.css              # Application styles
│   └── main.tsx             # Application entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── index.html               # HTML entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or yarn/pnpm)

### Installation

1. Navigate to the project directory:
```bash
cd color-blender-react
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to the URL shown (typically `http://localhost:5173`)

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## How to Use

### Manual Palette Mode

1. Upload an image using the "Choose Image" button
2. Click the image to pick colors with the eyedropper
3. Switch to **Color Picking Mode**
4. Click a cell once to set the first color
5. Pick another color, then click the same cell again to set the second color
6. Switch to **Blending Mode**
7. Drag your mouse/finger across the cell to blend the colors

### Aesthetic Palette Mode

1. Upload an image and pick colors
2. Switch to **Aesthetic Palette** mode
3. In **Color Picking Mode**, click ONLY the 4 corner cells
4. Edge cells auto-fill with 2 colors from adjacent corners
5. Center cell auto-fills with all 4 corner colors
6. Switch to **Blending Mode** to manually blend any cell

## Key Concepts

### Color Blending Algorithm

- **2-color cells**: Calculates the median color `(color1 + color2) / 2`
- **4-color center cell**: Calculates the median of all 4 colors `(c1 + c2 + c3 + c4) / 4`
- **Solid blending**: No gradual mixing, creates clean solid colors
- **Brush-based**: 50px radius circular brush for smooth application

### Aesthetic Palette Auto-Fill

- **Corner cells (0, 2, 6, 8)**: User-controlled
- **Edge cells (1, 3, 5, 7)**: Auto-filled with 2 adjacent corner colors
- **Center cell (4)**: Auto-filled with all 4 corner colors in 2x2 grid

## Component Architecture

### ImageUploader
- Handles file upload
- Renders image on canvas
- Implements eyedropper color picking
- Displays selected color with hex and RGB values

### PaletteCell
- Individual cell with 200x200px canvas
- Handles mouse and touch events for blending
- Supports both picking and blending modes
- Renders 1, 2, or 4 colors based on cell state

### PaletteGrid
- Manages array of 9 cells
- Implements aesthetic palette auto-fill logic
- Handles export and save operations
- Coordinates cell updates

### ModeToggle
- Switches between picking/blending modes
- Switches between manual/aesthetic palette types
- Clear visual indication of active mode

## Mobile Support

Full touch support with:
- Touch events for blending (touchstart, touchmove, touchend)
- Prevented scroll during blending
- 48px minimum touch targets
- Responsive layout for all screen sizes

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

- [ ] Undo/Redo functionality
- [ ] Adjustable brush sizes
- [ ] Color history panel
- [ ] Variable grid sizes (2x2, 4x4, 5x5)
- [ ] Load saved palette JSON files
- [ ] Color palette presets
- [ ] PWA support for offline use

## License

Free to use and modify for personal and commercial projects.

## Development Notes

### Type Safety

All components and utilities are fully typed with TypeScript for:
- Better IDE support
- Compile-time error checking
- Self-documenting code
- Easier refactoring

### Performance

- Canvas contexts use `willReadFrequently: true` for optimized reads
- React hooks properly memoized to prevent unnecessary re-renders
- Event handlers optimized for smooth blending performance

### Code Organization

- **Components**: Reusable UI components
- **Utils**: Pure functions for color/canvas operations
- **Types**: Shared TypeScript interfaces and types
- **Separation of concerns**: Logic separated from presentation

---

Built with React + TypeScript + Vite
