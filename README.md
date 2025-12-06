# Color Blender

A web-based color blending application that allows you to pick colors from images and blend them on a 3x3 palette grid.

## Features

- **Image Upload**: Upload any image to use as a color source
- **Eyedropper Tool**: Click on the uploaded image to pick colors
- **3x3 Color Grid**: Nine palette cells, each holding TWO colors for blending
- **Two-Color System**: Each cell can hold two different colors
- **Smooth Blending**: Click and drag within cells to smoothly blend the two colors together
- **Gradient Blending**: Blending transitions from the first color to the second color
- **Contained Blending**: Blending stays within each cell's boundaries
- **Color Information**: View hex and RGB values of selected colors
- **Visual Indicators**: See which colors are loaded in each cell
- **Save Palette**: Export your palette data as JSON
- **Export Image**: Export your palette as a PNG image

## How to Use

1. **Open the Application**
   - Simply double-click `index.html` to open it in your web browser
   - Or right-click and choose "Open with" and select your preferred browser

2. **Upload an Image**
   - Click the "Choose Image" button
   - Select any image from your computer

3. **Pick Colors**
   - Click anywhere on the uploaded image to pick a color
   - The selected color will appear in the "Selected Color" display
   - You'll see the color's hex code (e.g., #FF5733) and RGB values

4. **Set Two Colors Per Cell**
   - Click on a palette cell ONCE to set the FIRST color (fills the whole cell)
   - Pick a different color from the image
   - Click the SAME cell again to set the SECOND color (appears on right half)
   - Small color indicators appear in the top-right corner showing both colors
   - Click a third time to replace the second color

5. **Blend Colors**
   - Once both colors are set, click and drag your mouse within the cell to blend them
   - The blending smoothly transitions from the first color to the second color
   - Left side blends more of color 1, right side blends more of color 2
   - Blending is smooth and gradual (not instant)
   - Blending stays within the cell boundaries (won't affect neighboring cells)

6. **Save Your Work**
   - **Save Palette**: Downloads a JSON file with your palette data
   - **Export as Image**: Downloads a PNG image of your 3x3 palette grid
   - **Clear Palette**: Removes all colors from the grid

## Technical Details

- **Built with**: HTML5, CSS3, JavaScript
- **No dependencies**: Runs entirely in the browser, no installation needed
- **Canvas API**: Used for image rendering and color blending

## Browser Compatibility

Works in all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## Future Enhancements (Ideas)

- Adjustable grid sizes (4x4, 5x5, etc.)
- Undo/Redo functionality
- Different brush sizes for blending
- Color history
- Mobile app version

## Tips

- For best results, use high-quality images with distinct colors
- Each cell needs TWO colors before you can blend - pick contrasting colors for best effect
- The blending is gradual - drag over the same area multiple times for stronger color mixing
- Try picking complementary colors (like blue and orange) for interesting gradients
- Drag horizontally across a cell to see the full color transition
- Use the export feature to save your favorite palettes
- The small color indicators in the corner help you remember which colors are loaded

## Troubleshooting

**Image won't upload**
- Make sure the file is a valid image format (JPG, PNG, GIF, etc.)
- Try a smaller image if the file is very large

**Colors not blending smoothly**
- Try dragging more slowly
- Make sure you've selected a color first (click the image)

**Can't blend in a cell**
- Make sure you've set BOTH colors in the cell first (you'll see two color indicators in the corner)
- You need to pick and click twice on the same cell to set both colors

**Colors not showing in cell**
- Make sure you've picked a color from the image first by clicking on it
- Check that the "Selected Color" display shows your picked color

**Interface becomes unresponsive**
- Refresh the page to reset everything

## License

Free to use and modify for personal and commercial projects.

---

Enjoy creating beautiful color palettes!