
import React, { useState, useRef, useEffect } from 'react';
import { SunIcon, StackIcon, ZoomInIcon, ZoomOutIcon, RefreshIcon } from './icons';

interface DicomViewerProps {
    frames: string[]; // Array of image URLs
    initialWindow?: 'bone' | 'lung' | 'soft';
}

const DicomViewer: React.FC<DicomViewerProps> = ({ frames, initialWindow = 'soft' }) => {
    const [currentSlice, setCurrentSlice] = useState(Math.floor(frames.length / 2));
    const [windowPreset, setWindowPreset] = useState<'bone' | 'lung' | 'soft'>(initialWindow);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Simulated Window Levels using CSS Filters
    const getFilter = () => {
        switch (windowPreset) {
            case 'bone': return 'contrast(150%) brightness(130%) grayscale(100%)';
            case 'lung': return 'contrast(200%) brightness(60%) grayscale(100%)';
            case 'soft': 
            default: return 'contrast(110%) brightness(100%) grayscale(100%)';
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        // Prevent default page scroll if inside container (needs native event listener for full prevention usually, but React synthetic helps logic)
        if (frames.length <= 1) return;
        
        const delta = Math.sign(e.deltaY);
        setCurrentSlice(prev => {
            const next = prev + delta;
            return Math.max(0, Math.min(frames.length - 1, next));
        });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setLastMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - lastMousePosition.x;
        const deltaY = e.clientY - lastMousePosition.y;
        setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        setLastMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsDragging(false);

    return (
        <div className="flex flex-col bg-black rounded-xl overflow-hidden border border-secondary/30 shadow-2xl">
            {/* Toolbar */}
            <div className="bg-surface/10 p-2 flex justify-between items-center text-white backdrop-blur-md">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setWindowPreset('soft')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${windowPreset === 'soft' ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                        Partes Blandas
                    </button>
                    <button 
                        onClick={() => setWindowPreset('bone')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${windowPreset === 'bone' ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                        Hueso
                    </button>
                    <button 
                        onClick={() => setWindowPreset('lung')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${windowPreset === 'lung' ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                        Pulmón
                    </button>
                </div>
                <div className="flex gap-2 text-text-secondary">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="p-1 hover:text-white"><ZoomOutIcon className="h-5 w-5"/></button>
                    <span className="text-xs font-mono w-8 text-center pt-1">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1 hover:text-white"><ZoomInIcon className="h-5 w-5"/></button>
                    <button onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className="p-1 hover:text-white ml-2"><RefreshIcon className="h-5 w-5"/></button>
                </div>
            </div>

            {/* Viewport */}
            <div 
                ref={containerRef}
                className="relative h-[400px] w-full bg-black cursor-crosshair overflow-hidden group"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Image Stack */}
                <div 
                    className="w-full h-full flex items-center justify-center transition-transform duration-75"
                    style={{ 
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` 
                    }}
                >
                    <img 
                        src={frames[currentSlice]} 
                        alt={`Slice ${currentSlice}`}
                        className="max-w-full max-h-full object-contain pointer-events-none select-none"
                        style={{ filter: getFilter() }}
                        draggable={false}
                    />
                </div>

                {/* Overlays */}
                <div className="absolute top-4 left-4 text-xs font-mono text-cyan-400 drop-shadow-md pointer-events-none">
                    <p>PACs SIMULATOR v1.0</p>
                    <p className="mt-1">Im: {currentSlice + 1} / {frames.length}</p>
                    <p>Win: {windowPreset.toUpperCase()}</p>
                </div>

                <div className="absolute bottom-4 right-4 text-xs text-white/50 pointer-events-none flex items-center gap-2">
                    <StackIcon className="h-4 w-4"/> Scroll para navegar
                </div>

                {/* Scrollbar Indicator */}
                <div className="absolute right-2 top-10 bottom-10 w-1 bg-white/20 rounded-full">
                    <div 
                        className="w-full bg-accent rounded-full transition-all duration-75"
                        style={{ 
                            height: `${(1 / frames.length) * 100}%`, 
                            top: `${(currentSlice / (frames.length - 1)) * 95}%`, // 95 to keep inside
                            position: 'absolute'
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default DicomViewer;
