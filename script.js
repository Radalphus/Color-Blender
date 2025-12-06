// Global state
let selectedColor = null;
let currentPaletteCell = null;
let imageCanvas = null;
let imageCtx = null;
let paletteCells = [];
let currentMode = 'picking'; // 'picking' or 'blending'

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeImageCanvas();
    initializePaletteGrid();
    setupEventListeners();
    setupModeToggle();
});

// Initialize the image canvas for eyedropper
function initializeImageCanvas() {
    imageCanvas = document.getElementById('imageCanvas');
    imageCtx = imageCanvas.getContext('2d', { willReadFrequently: true });
}

// Create the 3x3 palette grid
function initializePaletteGrid() {
    const grid = document.getElementById('paletteGrid');

    for (let i = 0; i < 9; i++) {
        const cellContainer = document.createElement('div');
        cellContainer.className = 'palette-cell';
        cellContainer.dataset.index = i;

        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        cellContainer.appendChild(canvas);
        grid.appendChild(cellContainer);

        paletteCells.push({
            container: cellContainer,
            canvas: canvas,
            ctx: ctx,
            color1: null,
            color2: null,
            isDrawing: false
        });

        setupPaletteCellEvents(paletteCells[i], i);
    }
}

// Setup mode toggle
function setupModeToggle() {
    const pickingBtn = document.getElementById('pickingMode');
    const blendingBtn = document.getElementById('blendingMode');

    pickingBtn.addEventListener('click', () => {
        currentMode = 'picking';
        pickingBtn.classList.add('active');
        blendingBtn.classList.remove('active');
    });

    blendingBtn.addEventListener('click', () => {
        currentMode = 'blending';
        blendingBtn.classList.add('active');
        pickingBtn.classList.remove('active');
    });
}

// Setup event listeners
function setupEventListeners() {
    const imageUpload = document.getElementById('imageUpload');
    imageUpload.addEventListener('change', handleImageUpload);

    imageCanvas.addEventListener('click', handleEyedropper);

    document.getElementById('clearGrid').addEventListener('click', clearAllCells);
    document.getElementById('savePalette').addEventListener('click', savePalette);
    document.getElementById('exportPalette').addEventListener('click', exportPalette);
}

// Handle image upload
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // Calculate canvas size to fit the image
            const maxWidth = 600;
            const maxHeight = 400;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }

            if (height > maxHeight) {
                width = (maxHeight / height) * width;
                height = maxHeight;
            }

            imageCanvas.width = width;
            imageCanvas.height = height;
            imageCtx.drawImage(img, 0, 0, width, height);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Eyedropper tool - pick color from image
function handleEyedropper(e) {
    const rect = imageCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Scale coordinates to canvas size
    const scaleX = imageCanvas.width / rect.width;
    const scaleY = imageCanvas.height / rect.height;
    const canvasX = Math.floor(x * scaleX);
    const canvasY = Math.floor(y * scaleY);

    const imageData = imageCtx.getImageData(canvasX, canvasY, 1, 1);
    const pixel = imageData.data;

    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    selectedColor = { r, g, b };
    updateSelectedColorDisplay();
}

// Update the selected color display
function updateSelectedColorDisplay() {
    if (!selectedColor) return;

    const { r, g, b } = selectedColor;
    const hex = rgbToHex(r, g, b);

    document.getElementById('selectedColorSwatch').style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    document.getElementById('hexValue').textContent = hex;
    document.getElementById('rgbValue').textContent = `RGB(${r}, ${g}, ${b})`;
}

// Convert RGB to Hex
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// Setup palette cell events
function setupPaletteCellEvents(cell, index) {
    const { container, canvas, ctx } = cell;

    // Click handler - mode dependent
    container.addEventListener('click', (e) => {
        // PICKING MODE: Set colors
        if (currentMode === 'picking') {
            if (!selectedColor) {
                alert('Please select a color from the image first!');
                return;
            }

            // If no colors set yet, set color1
            if (!cell.color1) {
                cell.color1 = { ...selectedColor };
                // Fill entire cell with color1
                ctx.fillStyle = `rgb(${cell.color1.r}, ${cell.color1.g}, ${cell.color1.b})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                setActiveCell(index);
            }
            // If color1 exists but not color2, set color2
            else if (!cell.color2) {
                cell.color2 = { ...selectedColor };
                // Fill right half with color2
                ctx.fillStyle = `rgb(${cell.color2.r}, ${cell.color2.g}, ${cell.color2.b})`;
                ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
            }
            // If both colors exist, replace color2 with new selection
            else {
                cell.color2 = { ...selectedColor };
                // Redraw: left half = color1, right half = color2
                ctx.fillStyle = `rgb(${cell.color1.r}, ${cell.color1.g}, ${cell.color1.b})`;
                ctx.fillRect(0, 0, canvas.width / 2, canvas.height);
                ctx.fillStyle = `rgb(${cell.color2.r}, ${cell.color2.g}, ${cell.color2.b})`;
                ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
            }
        }
        // BLENDING MODE: Do nothing on click, only drag to blend
        else if (currentMode === 'blending') {
            if (!cell.color1 || !cell.color2) {
                alert('Please set both colors first (switch to Color Picking Mode)!');
                return;
            }
            // Click does nothing in blending mode - user must drag to blend
        }
    });

    // Mouse down to start painting in blending mode
    canvas.addEventListener('mousedown', (e) => {
        if (currentMode !== 'blending') return;
        if (!cell.color1 || !cell.color2) return;

        cell.isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        drawBlend(cell, x, y);
    });

    // Mouse move for painting
    canvas.addEventListener('mousemove', (e) => {
        if (!cell.isDrawing || currentMode !== 'blending') return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        drawBlend(cell, x, y);
    });

    // Mouse up to stop painting
    canvas.addEventListener('mouseup', () => {
        cell.isDrawing = false;
    });

    canvas.addEventListener('mouseleave', () => {
        cell.isDrawing = false;
    });
}

// Draw blend - mixes the two colors together where you drag
function drawBlend(cell, x, y) {
    if (!cell.color1 || !cell.color2) return;

    const { ctx, canvas } = cell;
    const brushSize = 40;

    // Get the current pixel color at brush position
    const imageData = ctx.getImageData(
        Math.max(0, Math.floor(x)),
        Math.max(0, Math.floor(y)),
        1,
        1
    );
    const currentPixel = imageData.data;
    const currentColor = {
        r: currentPixel[0],
        g: currentPixel[1],
        b: currentPixel[2]
    };

    // Calculate mixed color: blend current color with both cell colors
    // This creates a true mixing effect
    let mixedColor;

    // If current color is close to color1, mix towards color2
    // If current color is close to color2, mix towards color1
    // Otherwise, mix both colors together

    const dist1 = colorDistance(currentColor, cell.color1);
    const dist2 = colorDistance(currentColor, cell.color2);

    if (dist1 < 30) {
        // Close to color1, mix with color2
        mixedColor = mixColors(currentColor, cell.color2, 0.3);
    } else if (dist2 < 30) {
        // Close to color2, mix with color1
        mixedColor = mixColors(currentColor, cell.color1, 0.3);
    } else {
        // In between or neutral, mix with both
        const temp = mixColors(cell.color1, cell.color2, 0.5);
        mixedColor = mixColors(currentColor, temp, 0.3);
    }

    // Paint with solid color (no gradient brush)
    ctx.fillStyle = `rgb(${mixedColor.r}, ${mixedColor.g}, ${mixedColor.b})`;
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
}

// Helper: Calculate color distance
function colorDistance(c1, c2) {
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Helper: Mix two colors with a ratio
function mixColors(c1, c2, ratio) {
    return {
        r: Math.round(c1.r * (1 - ratio) + c2.r * ratio),
        g: Math.round(c1.g * (1 - ratio) + c2.g * ratio),
        b: Math.round(c1.b * (1 - ratio) + c2.b * ratio)
    };
}

// Set active cell
function setActiveCell(index) {
    paletteCells.forEach((cell, i) => {
        if (i === index) {
            cell.container.classList.add('active');
        } else {
            cell.container.classList.remove('active');
        }
    });
    currentPaletteCell = index;
}

// Clear all cells
function clearAllCells() {
    if (!confirm('Are you sure you want to clear all palette cells?')) return;

    paletteCells.forEach(cell => {
        cell.ctx.fillStyle = 'white';
        cell.ctx.fillRect(0, 0, cell.canvas.width, cell.canvas.height);
        cell.color1 = null;
        cell.color2 = null;
        cell.container.classList.remove('active');
    });
    currentPaletteCell = null;
}

// Save palette (store color data)
function savePalette() {
    const paletteData = paletteCells.map(cell => {
        if (!cell.color1) return null;

        const imageData = cell.ctx.getImageData(0, 0, cell.canvas.width, cell.canvas.height);
        return {
            color1: cell.color1,
            color2: cell.color2,
            imageData: Array.from(imageData.data)
        };
    });

    const jsonData = JSON.stringify(paletteData);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `color-palette-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
    alert('Palette saved successfully!');
}

// Export palette as image
function exportPalette() {
    const exportCanvas = document.createElement('canvas');
    const cellSize = 200;
    const gap = 10;
    const gridSize = 3;

    exportCanvas.width = (cellSize * gridSize) + (gap * (gridSize + 1));
    exportCanvas.height = (cellSize * gridSize) + (gap * (gridSize + 1));

    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    paletteCells.forEach((cell, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        const x = gap + (col * (cellSize + gap));
        const y = gap + (row * (cellSize + gap));

        exportCtx.drawImage(cell.canvas, x, y, cellSize, cellSize);
    });

    exportCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `color-palette-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        alert('Palette exported successfully!');
    });
}
