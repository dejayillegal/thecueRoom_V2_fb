"use client";

import { useRef, useEffect, useState } from "react";

interface CanvasEditorProps {
  imageUrl?: string;
  width?: number;
  height?: number;
  onSave?: (dataUrl: string) => void;
}

export default function CanvasEditor({
  imageUrl,
  width = 800,
  height = 600,
  onSave,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [watermarkText, setWatermarkText] = useState("thecueRoom");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0B0B0B";
    ctx.fillRect(0, 0, width, height);

    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        drawWatermark(ctx);
      };
      img.src = imageUrl;
    } else {
      drawWatermark(ctx);
    }
  }, [imageUrl, watermarkText, watermarkOpacity, width, height]);

  function drawWatermark(ctx: CanvasRenderingContext2D) {
    if (!watermarkText) return;

    ctx.save();
    ctx.globalAlpha = watermarkOpacity;
    ctx.fillStyle = "#D7FF3C";
    ctx.font = "bold 24px Inter";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(watermarkText, width - 20, height - 20);
    ctx.restore();
  }

  function handleSave() {
    if (!canvasRef.current || !onSave) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSave(dataUrl);
  }

  function handleDownload() {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "epk-image.png";
    link.click();
  }

  return (
    <div className="space-y-4">
      <div className="dashboard-card p-4">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full border border-[#333] rounded-lg"
        />
      </div>

      <div className="dashboard-card p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#D7FF3C] mb-2">
            Watermark Text
          </label>
          <input
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            className="w-full px-3 py-2 bg-[#0B0B0B] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#9B5CFF]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#D7FF3C] mb-2">
            Opacity: {Math.round(watermarkOpacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={watermarkOpacity}
            onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 py-2 bg-[#D7FF3C] text-[#0B0B0B] rounded-lg hover:bg-[#c8f02e] transition-colors font-medium"
          >
            Download PNG
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-[#9B5CFF] text-white rounded-lg hover:bg-[#8a4dee] transition-colors font-medium"
            >
              Save to Server
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
