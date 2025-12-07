
import React, { useState, useEffect } from 'react';
import { MicrophoneIcon, SparklesIcon } from './icons';
import { polishText } from '../services/geminiService';

interface VoiceTextareaProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
}

const VoiceTextarea: React.FC<VoiceTextareaProps> = ({ value, onChange, placeholder, rows = 3, className }) => {
    const [isListening, setIsListening] = useState(false);
    const [isPolishing, setIsPolishing] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const rec = new SpeechRecognition();
            rec.continuous = false; // Stop after one sentence/pause
            rec.interimResults = false;
            rec.lang = 'es-ES';

            rec.onresult = async (event: any) => {
                const transcript = event.results[0][0].transcript;
                setIsListening(false);
                
                // Set raw text immediately
                onChange(transcript);
                
                // Trigger AI Polish
                setIsPolishing(true);
                const polished = await polishText(transcript);
                onChange(polished);
                setIsPolishing(false);
            };

            rec.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            rec.onend = () => {
                setIsListening(false);
            };

            setRecognition(rec);
        }
    }, [onChange]);

    const toggleListening = () => {
        if (!recognition) {
            alert("Tu navegador no soporta reconocimiento de voz.");
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
            setIsListening(true);
        }
    };

    return (
        <div className="relative">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                placeholder={isListening ? "Escuchando..." : placeholder}
                className={`w-full p-3 pr-12 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none transition-all ${className} ${isListening ? 'border-primary ring-2 ring-primary/30' : 'border-secondary/30'}`}
                disabled={isPolishing}
            />
            
            {/* Action Button */}
            <button
                type="button"
                onClick={toggleListening}
                disabled={isPolishing}
                className={`absolute right-2 bottom-2 p-2 rounded-full transition-all flex items-center justify-center
                    ${isListening 
                        ? 'bg-danger text-white animate-pulse' 
                        : isPolishing 
                            ? 'bg-accent/20 text-accent cursor-wait' 
                            : 'bg-secondary/10 text-secondary hover:bg-primary/10 hover:text-primary'
                    }`}
                title={isListening ? "Detener dictado" : "Dictar comentario"}
            >
                {isPolishing ? (
                    <SparklesIcon className="h-5 w-5 animate-spin" />
                ) : (
                    <MicrophoneIcon className="h-5 w-5" />
                )}
            </button>
            
            {isListening && (
                <span className="absolute right-12 bottom-3 text-xs text-primary font-bold animate-pulse">
                    Escuchando...
                </span>
            )}
             {isPolishing && (
                <span className="absolute right-12 bottom-3 text-xs text-accent font-bold animate-pulse">
                    Mejorando texto...
                </span>
            )}
        </div>
    );
};

export default VoiceTextarea;
