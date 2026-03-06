import React, { useState, useRef, useCallback } from 'react';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

const ImageZoom: React.FC<ImageZoomProps> = ({ src, alt, className = '' }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [lensPos, setLensPos] = useState({ top: 0, left: 0 });
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const [touchDistance, setTouchDistance] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const ZOOM_FACTOR = 2.25;
  const LENS_SIZE = 200;

  // Desktop hover zoom handlers
  const handleMouseEnter = useCallback(() => {
    if (window.innerWidth >= 1024) {
      setIsZoomed(true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsZoomed(false);
    setMousePos({ x: 0, y: 0 });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isZoomed || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMousePos({ x, y });

      // Calculate lens position
      let lensX = x - LENS_SIZE / 2;
      let lensY = y - LENS_SIZE / 2;

      lensX = Math.max(0, Math.min(lensX, rect.width - LENS_SIZE));
      lensY = Math.max(0, Math.min(lensY, rect.height - LENS_SIZE));

      setLensPos({ top: lensY, left: lensX });

      // Calculate image position for zoom
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;

      setImgPos({ x: xPercent, y: yPercent });
    },
    [isZoomed]
  );

  // Mobile pinch zoom handlers
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setTouchDistance(distance);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2 && !isZoomed) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (touchDistance > 0) {
          const scale = distance / touchDistance;
          const newZoom = Math.min(ZOOM_FACTOR, Math.max(1, zoomLevel * scale));
          setZoomLevel(newZoom);

          if (newZoom > 1.2) {
            setIsZoomed(true);
          }
        }
        setTouchDistance(distance);
      }
    },
    [touchDistance, zoomLevel, isZoomed]
  );

  const handleTouchEnd = useCallback(() => {
    setTouchDistance(0);
    if (zoomLevel <= 1) {
      setIsZoomed(false);
      setZoomLevel(1);
    }
  }, [zoomLevel]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-[#e8e8e4] cursor-zoom-in ${isZoomed ? 'cursor-zoom-out' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main image */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-contain mix-blend-multiply filter contrast-110 grayscale-[10%] transition-opacity duration-500 ${className} ${
          isZoomed ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          transform: `scale(${zoomLevel})`,
        }}
      />

      {/* Desktop zoom lens - magnifying glass effect */}
      {isZoomed && window.innerWidth >= 1024 && (
        <>
          {/* Lens window */}
          <div
            className="absolute border-2 border-ink/40 pointer-events-none"
            style={{
              width: `${LENS_SIZE}px`,
              height: `${LENS_SIZE}px`,
              top: `${lensPos.top}px`,
              left: `${lensPos.left}px`,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'brightness(1.1)',
              boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.1)',
            }}
          />

          {/* Zoomed image in lens */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: `${LENS_SIZE}px`,
              height: `${LENS_SIZE}px`,
              top: `${lensPos.top}px`,
              left: `${lensPos.left}px`,
              overflow: 'hidden',
              border: '2px solid transparent',
            }}
          >
            <img
              src={src}
              alt={alt}
              className="absolute w-full h-full object-contain mix-blend-multiply filter contrast-110 grayscale-[10%]"
              style={{
                transform: `scale(${ZOOM_FACTOR})`,
                transformOrigin: `${imgPos.x}% ${imgPos.y}%`,
                width: '100%',
                height: '100%',
              }}
            />
          </div>

          {/* Crosshair indicator */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              width: '12px',
              height: '12px',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="absolute inset-0 border border-ink/30 rounded-full" />
            <div className="absolute top-1/2 left-1/2 w-px h-2 bg-ink/20 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-2 h-px bg-ink/20 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </>
      )}

      {/* Mobile pinch zoom overlay */}
      {zoomLevel > 1.2 && window.innerWidth < 1024 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-60">
            <p className="font-mono text-[10px] text-ink/40 uppercase tracking-[0.2em]">
              {Math.round(zoomLevel * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* Desktop hint text */}
      {!isZoomed && window.innerWidth >= 1024 && (
        <div className="absolute top-3 right-3 opacity-0 hover:opacity-100 transition-opacity duration-200">
          <p className="font-mono text-[9px] text-ink/20 uppercase tracking-[0.2em] bg-bone/60 px-2 py-1 backdrop-blur-sm border border-ink/5">
            Hover to zoom
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageZoom;
