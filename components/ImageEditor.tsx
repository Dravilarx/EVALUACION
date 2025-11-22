import React, { useRef, useEffect, useState } from 'react';
import { CloseIcon, PencilIcon, ArrowUpRightIcon, TypeIcon, UndoIcon, RedoIcon, TrashIcon } from './icons';

type Tool = 'pencil' | 'arrow' | 'text';

interface ImageEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (imageDataUrl: string) => void;
    imageSrc: string | null;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ isOpen, onClose, onSave, imageSrc }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // Tool states
    const [activeTool, setActiveTool] = useState<Tool>('pencil');
    const [color, setColor] = useState('#ef4444'); // danger red
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

    // Effect to initialize canvas and context
    useEffect(() => {
        if (isOpen && imageSrc && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            setContext(ctx);

            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.src = imageSrc;
            image.onload = () => {
                const aspectRatio = image.width / image.height;
                const maxWidth = window.innerWidth * 0.7;
                const maxHeight = window.innerHeight * 0.7;
                
                let newWidth = maxWidth;
                let newHeight = newWidth / aspectRatio;

                if (newHeight > maxHeight) {
                    newHeight = maxHeight;
                    newWidth = newHeight * aspectRatio;
                }
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx?.drawImage(image, 0, 0, newWidth, newHeight);
                saveToHistory(ctx);
            };
        }
    }, [isOpen, imageSrc]);
    
    const saveToHistory = (ctx: CanvasRenderingContext2D | null) => {
        if (!ctx || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const restoreFromHistory = () => {
        if (!context || historyIndex < 0) return;
        context.putImageData(history[historyIndex], 0, 0);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
        }
    };

    useEffect(() => {
        restoreFromHistory();
    }, [historyIndex]);

    const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getMousePos(e);
        setIsDrawing(true);
        if (activeTool === 'text') {
            const text = prompt('Escribe el texto a añadir:');
            if (text && context) {
                 context.font = '20px Arial';
                 context.fillStyle = color;
                 context.fillText(text, x, y);
                 saveToHistory(context);
            }
            setIsDrawing(false);
        } else {
            context?.beginPath();
            context?.moveTo(x, y);
            setStartPoint({ x, y });
        }
    };
    
    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !context || !startPoint) return;
        const { x, y } = getMousePos(e);
        
        restoreFromHistory(); // Restore previous state before drawing preview

        context.strokeStyle = color;
        context.lineWidth = 3;
        context.lineCap = 'round';
        
        if (activeTool === 'pencil') {
            context.lineTo(x, y);
            context.stroke();
        } else if (activeTool === 'arrow') {
            context.beginPath();
            context.moveTo(startPoint.x, startPoint.y);
            context.lineTo(x, y);
            
            // Draw arrowhead
            const headlen = 10;
            const dx = x - startPoint.x;
            const dy = y - startPoint.y;
            const angle = Math.atan2(dy, dx);
            context.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
            context.moveTo(x, y);
            context.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));

            context.stroke();
        }
    };

    const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !context || !startPoint) return;
        setIsDrawing(false);
        
        // Final draw
        const { x, y } = getMousePos(e);
        restoreFromHistory();
        context.strokeStyle = color;
        context.lineWidth = 3;
        context.lineCap = 'round';

        if (activeTool === 'pencil') {
            context.lineTo(x, y);
            context.stroke();
        } else if (activeTool === 'arrow') {
            context.beginPath();
            context.moveTo(startPoint.x, startPoint.y);
            context.lineTo(x, y);
            const headlen = 10;
            const dx = x - startPoint.x;
            const dy = y - startPoint.y;
            const angle = Math.atan2(dy, dx);
            context.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
            context.moveTo(x, y);
            context.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));
            context.stroke();
        }

        if (activeTool !== 'text') {
            saveToHistory(context);
        }
        setStartPoint(null);
    };

    const handleSave = () => {
        if (canvasRef.current) {
            onSave(canvasRef.current.toDataURL('image/png'));
            onClose();
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-5xl flex flex-col">
                <header className="p-4 border-b border-secondary/20 flex justify-between items-center">
                    <h3 className="text-xl font-bold">Editar Imagen</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary/50"><CloseIcon /></button>
                </header>
                
                <main className="p-4 flex flex-col md:flex-row gap-4 items-center justify-center">
                    <div className="flex md:flex-col gap-2 p-2 bg-background rounded-lg">
                        <button onClick={() => setActiveTool('pencil')} className={`p-2 rounded-md ${activeTool === 'pencil' ? 'bg-primary text-white' : 'hover:bg-secondary'}`}><PencilIcon /></button>
                        <button onClick={() => setActiveTool('arrow')} className={`p-2 rounded-md ${activeTool === 'arrow' ? 'bg-primary text-white' : 'hover:bg-secondary'}`}><ArrowUpRightIcon /></button>
                        <button onClick={() => setActiveTool('text')} className={`p-2 rounded-md ${activeTool === 'text' ? 'bg-primary text-white' : 'hover:bg-secondary'}`}><TypeIcon /></button>
                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 bg-transparent cursor-pointer" />
                        <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-md hover:bg-secondary disabled:opacity-50"><UndoIcon /></button>
                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-md hover:bg-secondary disabled:opacity-50"><RedoIcon /></button>
                    </div>
                    <canvas 
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="cursor-crosshair bg-background rounded-md"
                    />
                </main>

                <footer className="p-4 border-t border-secondary/20 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark font-semibold transition-colors">Guardar Cambios</button>
                </footer>
            </div>
        </div>
    );
};

export default ImageEditor;
