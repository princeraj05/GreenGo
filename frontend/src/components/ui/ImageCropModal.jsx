import { useState, useRef, useEffect } from "react";
import { X, RotateCw, ZoomIn, ZoomOut, Save } from "lucide-react";
import Button from "./Button";

export default function ImageCropModal({ isOpen, imageFile, onCancel, onSave }) {
  const [imgSrc, setImgSrc] = useState("");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!imageFile) {
      setImgSrc("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result);
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  if (!isOpen || !imgSrc) return null;

  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
  };

  const rotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSave = () => {
    const img = imageRef.current;
    if (!img) return;

    // We want to generate a crisp 1:1 square crop (800x800 px)
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Fill background with white/transparent
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 800, 800);

    // Apply translations & rotation
    ctx.translate(400, 400);
    ctx.rotate((rotation * Math.PI) / 180);

    // Calculate scaling
    // Find the ratio between the visual box (e.g. 250px) and the canvas export size (800px)
    const displayCropSize = 250;
    const exportScale = 800 / displayCropSize;

    // We need to scale the image based on zoom and its natural scale inside our crop box
    // To match the CSS rendering:
    // Let's determine how the image was sized relative to displayCropSize
    const imgRect = img.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // The scale factor of natural image size to display screen size
    const visualScale = imgRect.width / img.naturalWidth / zoom;
    const finalScale = zoom * visualScale * exportScale;

    // Panning coordinates from screen to canvas coordinates
    const canvasX = position.x * exportScale;
    const canvasY = position.y * exportScale;

    ctx.scale(finalScale, finalScale);
    ctx.drawImage(
      img,
      -img.naturalWidth / 2 + canvasX / finalScale,
      -img.naturalHeight / 2 + canvasY / finalScale
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], imageFile.name, {
            type: "image/jpeg",
            lastModified: Date.now()
          });
          onSave(croppedFile, URL.createObjectURL(croppedFile));
        }
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-850">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Crop & Rotate Photo</h3>
          <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-6 flex flex-col items-center">
          <div
            ref={containerRef}
            className="relative w-[250px] h-[250px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner cursor-move touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* The Image */}
            <img
              ref={imageRef}
              src={imgSrc}
              alt="To Crop"
              className="absolute max-w-none origin-center pointer-events-none select-none"
              style={{
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
                maxHeight: "100%",
                objectFit: "contain",
                transition: isDragging ? "none" : "transform 0.1s ease-out"
              }}
            />

            {/* 1:1 Crop Guide Mask */}
            <div className="absolute inset-0 border-2 border-emerald-500 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(15,23,42,0.5)]"></div>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-3 uppercase tracking-wider">Drag to position | Enforced 1:1 Ratio</p>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 bg-slate-55/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-850 space-y-4">
          {/* Zoom Control */}
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="text-slate-400" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <ZoomIn size={16} className="text-slate-400" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              onClick={rotateRight}
              variant="ghost"
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 gap-2 text-xs font-bold py-2.5"
            >
              <RotateCw size={14} />
              Rotate 90°
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-bold py-2.5"
            >
              <Save size={14} />
              Apply Crop
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
