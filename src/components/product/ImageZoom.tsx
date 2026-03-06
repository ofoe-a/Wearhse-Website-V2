import React, { useState, useRef, useCallback } from 'react';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * ASOS-style image zoom:
 * - Click to zoom in (2.5x)
 * - Move mouse to pan around the zoomed image
 * - Click again to zoom out
 * - Mobile: pinch to zoom, drag to pan
 */
const ImageZoom: React.FC<ImageZoomProps> = ({ src, alt, className = '' }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [backgroundPos, setBackgroundPos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Mobile state
  const [touchDistance, setTouchDistance] = useState(0);
  const [mobileZoom, setMobileZoom] = useState(1);
  const [mobileOffset, setMobileOffset] = useState({ x: 0, y: 0 });
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const ZOOM_FACTOR = 2.5;

  // ─── Desktop: click to toggle zoom ───
  const handleClick = useCallback(() => {
    if (window.innerWidth < 1024) return;
    setIsZoomed(prev => !prev);
  }, []);

  // ─── Desktop: mouse move pans the zoomed image ───
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isZoomed || !containerRef.current || window.innerWidth < 1024) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setBackgroundPos({ x, y });
    },
    [isZoomed]
  );

  const handleMouseLeave = useCallback(() => {
    if (isZoomed) {
      setIsZoomed(false);
      setBackgroundPos({ x: 50, y: 50 });
    }
  }, [isZoomed]);

  // ─── Mobile: pinch to zoom + drag to pan ───
  const getTouchDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[1].clientX - touches[0].clientX,
      touches[1].clientY - touches[0].clientY
    );
  };

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      setTouchDistance(getTouchDistance(e.touches));
    } else if (e.touches.length === 1 && mobileZoom > 1) {
      setIsDragging(true);
      setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, [mobileZoom]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const newDist = getTouchDistance(e.touches);
        if (touchDistance > 0) {
          const scale = newDist / touchDistance;
          setMobileZoom(prev => Math.min(3, Math.max(1, prev * scale)));
        }
        setTouchDistance(newDist);
      } else if (e.touches.length === 1 && isDragging && mobileZoom > 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - lastTouch.x;
        const dy = e.touches[0].clientY - lastTouch.y;
        setMobileOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    },
    [touchDistance, isDragging, lastTouch, mobileZoom]
  );

  const handleTouchEnd = useCallback(() => {
    setTouchDistance(0);
    setIsDragging(false);
    if (mobileZoom <= 1.05) {
      setMobileZoom(1);
      setMobileOffset({ x: 0, y: 0 });
    }
  }, [mobileZoom]);

  // Mobile: double tap to toggle zoom
  const lastTapRef = useRef(0);
  const handleDoubleTap = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      e.preventDefault();
      if (mobileZoom > 1) {
        setMobileZoom(1);
        setMobileOffset({ x: 0, y: 0 });
      } else {
        setMobileZoom(ZOOM_FACTOR);
      }
    }
    lastTapRef.current = now;
  }, [mobileZoom]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-[#e8e8e4] select-none ${
        isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
      }`}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={(e) => { handleDoubleTap(e); handleTouchStart(e); }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Normal image (hidden when desktop-zoomed) */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-contain mix-blend-multiply filter contrast-110 grayscale-[10%] transition-opacity duration-200 ${className} ${
          isZoomed ? 'opacity-0' : 'opacity-100'
        }`}
        style={
          mobileZoom > 1
            ? {
                transform: `scale(${mobileZoom}) translate(${mobileOffset.x / mobileZoom}px, ${mobileOffset.y / mobileZoom}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }
            : undefined
        }
        draggable={false}
      />

      {/* Desktop: zoomed background-image view (covers container, pans with mouse) */}
      {isZoomed && window.innerWidth >= 1024 && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: `${ZOOM_FACTOR * 100}%`,
            backgroundPosition: `${backgroundPos.x}% ${backgroundPos.y}%`,
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#e8e8e4',
          }}
        />
      )}
    </div>
  );
};

export default ImageZoom;
