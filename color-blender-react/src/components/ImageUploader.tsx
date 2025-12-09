import { useRef, ChangeEvent, useState } from 'react';
import { Color } from '../types';
import { getColorFromImageData } from '../utils/colorUtils';

interface ImageUploaderProps {
  onColorPicked: (color: Color) => void;
  selectedColor: Color | null;
}

export function ImageUploader({ onColorPicked, selectedColor }: ImageUploaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverColor, setHoverColor] = useState<Color | null>(null);
  const [isUsingTouch, setIsUsingTouch] = useState(false);

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

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
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

    // Check if coordinates are within canvas bounds
    if (canvasX >= 0 && canvasX < canvas.width && canvasY >= 0 && canvasY < canvas.height) {
      const imageData = ctx.getImageData(canvasX, canvasY, 1, 1);
      const color = getColorFromImageData(imageData);
      setHoverColor(color);
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoverColor(null);
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsUsingTouch(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = Math.floor(x * scaleX);
    const canvasY = Math.floor(y * scaleY);

    // Check if coordinates are within canvas bounds
    if (canvasX >= 0 && canvasX < canvas.width && canvasY >= 0 && canvasY < canvas.height) {
      const imageData = ctx.getImageData(canvasX, canvasY, 1, 1);
      const color = getColorFromImageData(imageData);
      setHoverColor(color);
    }
  };

  const handleCanvasTouchEnd = () => {
    // On mobile, select the last color that was previewed (where finger lifted)
    if (hoverColor) {
      onColorPicked(hoverColor);
    }
    setHoverColor(null);
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsUsingTouch(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = Math.floor(x * scaleX);
    const canvasY = Math.floor(y * scaleY);

    // Check if coordinates are within canvas bounds
    if (canvasX >= 0 && canvasX < canvas.width && canvasY >= 0 && canvasY < canvas.height) {
      const imageData = ctx.getImageData(canvasX, canvasY, 1, 1);
      const color = getColorFromImageData(imageData);
      // Just show preview on touch start
      setHoverColor(color);
    }
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
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleCanvasTouchEnd}
          onTouchCancel={handleCanvasTouchEnd}
        />
      </div>
      <div className="selected-color-display">
        {/* Desktop: Show separate Preview and Selected */}
        {!isUsingTouch && hoverColor && (
          <div className="color-info">
            <div
              className="color-swatch"
              style={{
                backgroundColor: `rgb(${hoverColor.r}, ${hoverColor.g}, ${hoverColor.b})`
              }}
            />
            <div className="color-values">
              <span className="color-label">Preview:</span>
              <span>
                #{hoverColor.r.toString(16).padStart(2, '0')}{hoverColor.g.toString(16).padStart(2, '0')}{hoverColor.b.toString(16).padStart(2, '0')}
              </span>
              <span>RGB({hoverColor.r}, {hoverColor.g}, {hoverColor.b})</span>
            </div>
          </div>
        )}

        {/* Mobile: Show live-updating Selected Color */}
        <div className="color-info">
          <div
            className="color-swatch"
            style={{
              backgroundColor: (isUsingTouch && hoverColor)
                ? `rgb(${hoverColor.r}, ${hoverColor.g}, ${hoverColor.b})`
                : selectedColor
                ? `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`
                : 'white'
            }}
          />
          <div className="color-values">
            <span className="color-label">Selected Color:</span>
            <span>
              {(isUsingTouch && hoverColor)
                ? `#${hoverColor.r.toString(16).padStart(2, '0')}${hoverColor.g.toString(16).padStart(2, '0')}${hoverColor.b.toString(16).padStart(2, '0')}`
                : selectedColor
                ? `#${selectedColor.r.toString(16).padStart(2, '0')}${selectedColor.g.toString(16).padStart(2, '0')}${selectedColor.b.toString(16).padStart(2, '0')}`
                : 'No color selected'}
            </span>
            {((isUsingTouch && hoverColor) || selectedColor) && (
              <span>RGB({((isUsingTouch && hoverColor) || selectedColor)!.r}, {((isUsingTouch && hoverColor) || selectedColor)!.g}, {((isUsingTouch && hoverColor) || selectedColor)!.b})</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
