import React, { useState } from 'react';

interface Props {
    src: string;
    alt: string;
    className?: string;
}

/**
 * Image component that shows an animated skeleton placeholder while loading.
 */
const ImageWithSkeleton: React.FC<Props> = ({ src, alt, className = '' }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    return (
        <div className="relative w-full h-full">
            {!loaded && !error && (
                <div className="absolute inset-0 bg-ink/5 animate-pulse rounded" />
            )}
            {error ? (
                <div className="absolute inset-0 bg-ink/5 flex items-center justify-center">
                    <span className="font-mono text-[10px] text-ink/25 uppercase">No image</span>
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                    loading="lazy"
                />
            )}
        </div>
    );
};

export default ImageWithSkeleton;
