// Global state
let selectedColor = null;
let currentPaletteCell = null;
let imageCanvas = null;
let imageCtx = null;
let paletteCells = [];
let currentMode = 'picking'; // 'picking' or 'blending'
let paletteType = 'manual'; // 'manual' or 'aesthetic'

// Aesthetic palette corner indices
const AESTHETIC_CORNERS = [0, 2, 6, 8]; // top-left, top-right, bottom-left, bottom-right
const AESTHETIC_EDGES = {
    1: [0, 2],    // top edge: corners 0 and 2
    3: [0, 6],    // left edge: corners 0 and 6
    5: [2, 8],    // right edge: corners 2 and 8
    7: [6, 8]     // bottom edge: corners 6 and 8
};
const AESTHETIC_CENTER = 4; // center cell gets all 4 corners

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeImageCanvas();
    initializePaletteGrid();
    setupEventListeners();
    setupModeToggle();
    setupPaletteTypeToggle();
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

// Setup palette type toggle
function setupPaletteTypeToggle() {
    const manualBtn = document.getElementById('manualPalette');
    const aestheticBtn = document.getElementById('aestheticPalette');

    manualBtn.addEventListener('click', () => {
        paletteType = 'manual';
        manualBtn.classList.add('active');
        aestheticBtn.classList.remove('active');
        clearAllCells(); // Reset when switching modes
    });

    aestheticBtn.addEventListener('click', () => {
        paletteType = 'aesthetic';
        aestheticBtn.classList.add('active');
        manualBtn.classList.remove('active');
        clearAllCells(); // Reset when switching modes
    });
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

    // Click handler - mode and palette type dependent
    container.addEventListener('click', (e) => {
        // PICKING MODE
        if (currentMode === 'picking') {
            if (!selectedColor) {
                alert('Please select a color from the image first!');
                return;
            }

            // AESTHETIC PALETTE MODE
            if (paletteType === 'aesthetic') {
                // Only allow clicking on corner cells
                if (!AESTHETIC_CORNERS.includes(index)) {
                    alert('In Aesthetic Palette mode, only click on corner cells! Edge and center cells auto-fill.');
                    return;
                }

                // Set the corner color
                cell.color1 = { ...selectedColor };
                ctx.fillStyle = `rgb(${cell.color1.r}, ${cell.color1.g}, ${cell.color1.b})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Auto-fill all connected cells
                updateAestheticPalette();
            }
            // MANUAL PALETTE MODE
            else {
                // If no colors set yet, set color1
                if (!cell.color1) {
                    cell.color1 = { ...selectedColor };
                    ctx.fillStyle = `rgb(${cell.color1.r}, ${cell.color1.g}, ${cell.color1.b})`;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    setActiveCell(index);
                }
                // If color1 exists but not color2, set color2
                else if (!cell.color2) {
                    cell.color2 = { ...selectedColor };
                    ctx.fillStyle = `rgb(${cell.color2.r}, ${cell.color2.g}, ${cell.color2.b})`;
                    ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
                }
                // If both colors exist, replace color2 with new selection
                else {
                    cell.color2 = { ...selectedColor };
                    ctx.fillStyle = `rgb(${cell.color1.r}, ${cell.color1.g}, ${cell.color1.b})`;
                    ctx.fillRect(0, 0, canvas.width / 2, canvas.height);
                    ctx.fillStyle = `rgb(${cell.color2.r}, ${cell.color2.g}, ${cell.color2.b})`;
                    ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
                }
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

// Update aesthetic palette - auto-fill edge and center cells
function updateAestheticPalette() {
    // Update edge cells (each gets 2 adjacent corner colors)
    Object.keys(AESTHETIC_EDGES).forEach(edgeIndex => {
        const index = parseInt(edgeIndex);
        const [corner1Index, corner2Index] = AESTHETIC_EDGES[edgeIndex];
        const corner1 = paletteCells[corner1Index];
        const corner2 = paletteCells[corner2Index];
        const edgeCell = paletteCells[index];

        // Only fill if both corners have colors
        if (corner1.color1 && corner2.color1) {
            edgeCell.color1 = { ...corner1.color1 };
            edgeCell.color2 = { ...corner2.color1 };

            // Draw left half with corner1, right half with corner2
            const { ctx, canvas } = edgeCell;
            ctx.fillStyle = `rgb(${edgeCell.color1.r}, ${edgeCell.color1.g}, ${edgeCell.color1.b})`;
            ctx.fillRect(0, 0, canvas.width / 2, canvas.height);
            ctx.fillStyle = `rgb(${edgeCell.color2.r}, ${edgeCell.color2.g}, ${edgeCell.color2.b})`;
            ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
        }
    });

    // Update center cell (gets all 4 corner colors)
    const centerCell = paletteCells[AESTHETIC_CENTER];
    const allCornersHaveColors = AESTHETIC_CORNERS.every(idx => paletteCells[idx].color1);

    if (allCornersHaveColors) {
        // Store all 4 colors in the center cell
        const cornerColors = AESTHETIC_CORNERS.map(idx => paletteCells[idx].color1);
        centerCell.color1 = { ...cornerColors[0] }; // top-left
        centerCell.color2 = { ...cornerColors[1] }; // top-right
        // Store additional colors for the center cell
        centerCell.color3 = { ...cornerColors[2] }; // bottom-left
        centerCell.color4 = { ...cornerColors[3] }; // bottom-right
        centerCell.hasAllFourColors = true; // Flag to indicate this cell has 4 colors

        // Draw a 2x2 grid with all 4 colors
        const { ctx, canvas } = centerCell;
        const halfW = canvas.width / 2;
        const halfH = canvas.height / 2;

        // Top-left corner color (index 0)
        ctx.fillStyle = `rgb(${cornerColors[0].r}, ${cornerColors[0].g}, ${cornerColors[0].b})`;
        ctx.fillRect(0, 0, halfW, halfH);

        // Top-right corner color (index 2)
        ctx.fillStyle = `rgb(${cornerColors[1].r}, ${cornerColors[1].g}, ${cornerColors[1].b})`;
        ctx.fillRect(halfW, 0, halfW, halfH);

        // Bottom-left corner color (index 6)
        ctx.fillStyle = `rgb(${cornerColors[2].r}, ${cornerColors[2].g}, ${cornerColors[2].b})`;
        ctx.fillRect(0, halfH, halfW, halfH);

        // Bottom-right corner color (index 8)
        ctx.fillStyle = `rgb(${cornerColors[3].r}, ${cornerColors[3].g}, ${cornerColors[3].b})`;
        ctx.fillRect(halfW, halfH, halfW, halfH);
    }
}

// Draw blend - mixes the two colors together where you drag
function drawBlend(cell, x, y) {
    if (!cell.color1 || !cell.color2) return;

    const { ctx, canvas } = cell;
    const brushSize = 50;

    let targetColor;

    // CENTER CELL WITH 4 COLORS - calculate the median/center color of all 4
    if (cell.hasAllFourColors) {
        // Simple average of all 4 colors for clean, solid blending
        targetColor = {
            r: Math.round((cell.color1.r + cell.color2.r + cell.color3.r + cell.color4.r) / 4),
            g: Math.round((cell.color1.g + cell.color2.g + cell.color3.g + cell.color4.g) / 4),
            b: Math.round((cell.color1.b + cell.color2.b + cell.color3.b + cell.color4.b) / 4)
        };
    }
    // NORMAL 2-COLOR CELL - calculate the median/center color of both
    else {
        // Simple average of both colors for clean, solid blending
        targetColor = {
            r: Math.round((cell.color1.r + cell.color2.r) / 2),
            g: Math.round((cell.color1.g + cell.color2.g) / 2),
            b: Math.round((cell.color1.b + cell.color2.b) / 2)
        };
    }

    // Paint with solid color (no smudging, no gradual mixing)
    ctx.fillStyle = `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})`;
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
    if (paletteType === 'aesthetic' && !confirm('Are you sure you want to clear all palette cells?')) return;
    if (paletteType === 'manual' && !confirm('Are you sure you want to clear all palette cells?')) return;

    paletteCells.forEach(cell => {
        cell.ctx.fillStyle = 'white';
        cell.ctx.fillRect(0, 0, cell.canvas.width, cell.canvas.height);
        cell.color1 = null;
        cell.color2 = null;
        cell.color3 = null;
        cell.color4 = null;
        cell.hasAllFourColors = false;
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
