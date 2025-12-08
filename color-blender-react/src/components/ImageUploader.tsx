import { useRef, ChangeEvent } from 'react';
import { Color } from '../types';
import { getColorFromImageData } from '../utils/colorUtils';

interface ImageUploaderProps {
  onColorPicked: (color: Color) => void;
  selectedColor: Color | null;
}

export function ImageUploader({ onColorPicked, selectedColor }: ImageUploaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

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

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = Math.floor(x * scaleX);
    const canvasY = Math.floor(y * scaleY);

    const imageData = ctx.getImageData(canvasX, canvasY, 1, 1);
    const color = getColorFromImageData(imageData);
    onColorPicked(color);
  };

  return (
    <div className="image-section">
      <h2>Image & Color Picker</h2>
      <div className="upload-area">
        <input
          type="file"
          id="imageUpload"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <label htmlFor="imageUpload" className="upload-label">
          <span>📁 Choose Image</span>
        </label>
      </div>
      <div className="canvas-container">
        <canvas ref={canvasRef} onClick={handleCanvasClick} />
      </div>
      <div className="selected-color-display">
        <div className="color-info">
          <div
            className="color-swatch"
            style={{
              backgroundColor: selectedColor
                ? `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`
                : 'white'
            }}
          />
          <div className="color-values">
            <span>
              {selectedColor
                ? `#${selectedColor.r.toString(16).padStart(2, '0')}${selectedColor.g.toString(16).padStart(2, '0')}${selectedColor.b.toString(16).padStart(2, '0')}`
                : 'No color selected'}
            </span>
            {selectedColor && (
              <span>RGB({selectedColor.r}, {selectedColor.g}, {selectedColor.b})</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
