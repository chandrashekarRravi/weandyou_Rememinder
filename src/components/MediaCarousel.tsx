import React, { useState } from 'react';

interface MediaCarouselProps {
    filePaths: string[];
    mediaId?: string;
    onImageClick?: (url: string) => void;
    className?: string;
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({ filePaths, mediaId = '', onImageClick, className = '' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    if (!filePaths || filePaths.length === 0) return null;

    const currentPath = filePaths[currentIndex];
    const isVideo = mediaId.startsWith('vid') || currentPath.match(/\.(mp4|webm|ogg)$/i);

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex(prev => (prev + 1) % filePaths.length);
    };

    const handlePrev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex(prev => (prev - 1 + filePaths.length) % filePaths.length);
    };

    const minSwipeDistance = 50;

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        if (isLeftSwipe) {
            handleNext();
        }
        if (isRightSwipe) {
            handlePrev();
        }
    };

    return (
        <div 
            className={`relative group w-full h-full flex items-center justify-center touch-pan-y ${className}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {isVideo ? (
                <video src={currentPath} controls className="w-full h-auto block max-h-full object-contain" />
            ) : (
                <img
                    src={currentPath}
                    alt="Creative"
                    className="w-full h-auto block max-h-full object-contain cursor-pointer transition-transform hover:scale-[1.02]"
                    onClick={() => onImageClick && onImageClick(currentPath)}
                />
            )}

            {filePaths.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/80 text-white rounded-full hidden sm:flex items-center justify-center z-20 transition-opacity opacity-100`}
                    >
                        &larr;
                    </button>
                    <button
                        onClick={handleNext}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/80 text-white rounded-full hidden sm:flex items-center justify-center z-20 transition-opacity opacity-100`}
                    >
                        &rarr;
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20 bg-black/20 px-2 py-1 rounded-full">
                        {filePaths.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default MediaCarousel;
