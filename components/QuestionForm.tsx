
import React, { useState, useEffect, useRef } from 'react';
import { Question, QuestionType, Alternative, RubricCriterion, Attachment } from '../types';
import { CloseIcon, SparklesIcon, PlusIcon, TrashIcon, ImageIcon, VideoIcon, LinkIcon, EditIcon, StarIcon } from './icons';
import { ESPECIALIDADES, DIFICULTADES, TIPOS_PREGUNTA } from '../constants';
import { assistWithQuestionCreation } from '../services/geminiService';
import ImageEditor from './ImageEditor';

interface QuestionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (question: Question) => void;
    initialQuestion?: Question;
}

const emptyQuestion: Omit<Question, 'codigo_pregunta' | 'fecha_creacion' | 'veces_utilizada'> = {
    tipo_pregunta: QuestionType.MultipleChoice,
    enunciado: '',
    alternativas: [
        { id: 'A', texto: '', es_correcta: true },
        { id: 'B', texto: '', es_correcta: false },
        { id: 'C', texto: '', es_correcta: false },
        { id: 'D', texto: '', es_correcta: false },
    ],
    respuesta_correcta_vf: 'Verdadero',
    criterios_rubrica: [{ criterio: '', max_puntos: 1, descriptor: '' }],
    feedback_correcto: '',
    feedback_incorrecto: '',
    adjuntos: {},
    docente_creador: 'Marcelo Avila', // Mocked, could be from user session
    especialidad: ESPECIALIDADES[0],
    dificultad: 3,
    tema: '',
    subtema: '',
    etiquetas: [],
    tiene_multimedia: false,
    rating: 0,
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const validateUrl = (url: string): boolean => {
    const pattern = /^(https?:\/\/)/i;
    return pattern.test(url);
};

const QuestionForm: React.FC<QuestionFormProps> = ({ isOpen, onClose, onSave, initialQuestion }) => {
    const [question, setQuestion] = useState<any>(emptyQuestion);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // State for image editor
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
    
    // State for drag & drop
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const [isDraggingVideo, setIsDraggingVideo] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    
    // State for URL inputs
    const [imageUrl, setImageUrl] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [urlError, setUrlError] = useState<string | null>(null);

    // State for Feedback Confirmation
    const [pendingFeedback, setPendingFeedback] = useState<{ correct: string; incorrect: string } | null>(null);


    useEffect(() => {
        if (isOpen) {
            if (initialQuestion) {
                setQuestion(initialQuestion);
            } else {
                setQuestion(emptyQuestion);
            }
            setError(null);
            setImageUrl('');
            setVideoUrl('');
            setUrlError(null);
            setPendingFeedback(null);
        }
    }, [isOpen, initialQuestion]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const finalValue = (name === 'dificultad' || e.target.type === 'number') ? parseInt(value, 10) : value;
        setQuestion(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleRatingChange = (rating: 0 | 1 | 2 | 3) => {
        setQuestion(prev => ({ ...prev, rating }));
    };
    
    const handleAlternativeChange = (index: number, text: string) => {
        const newAlts = [...(question.alternativas || [])];
        newAlts[index].texto = text;
        setQuestion(prev => ({ ...prev, alternativas: newAlts }));
    };

    const handleCorrectAlternative = (index: number) => {
        const newAlts = (question.alternativas || []).map((alt: Alternative, i: number) => ({
            ...alt,
            es_correcta: i === index,
        }));
        setQuestion(prev => ({ ...prev, alternativas: newAlts }));
    };
    
    const handleRubricChange = (index: number, field: keyof RubricCriterion, value: string | number) => {
        const newRubric = [...(question.criterios_rubrica || [])];
        (newRubric[index] as any)[field] = value;
        setQuestion(prev => ({ ...prev, criterios_rubrica: newRubric }));
    };
    
    const addRubricCriterion = () => {
        setQuestion(prev => ({ ...prev, criterios_rubrica: [...(prev.criterios_rubrica || []), { criterio: '', max_puntos: 1, descriptor: '' }]}));
    };
    
    const removeRubricCriterion = (index: number) => {
        setQuestion(prev => ({ ...prev, criterios_rubrica: (prev.criterios_rubrica || []).filter((_: any, i: number) => i !== index) }));
    };

    // Generic handlers for links
    const handleLinkChange = (index: number, value: string) => {
        setQuestion(prev => {
            const newLinks = [...(prev.adjuntos.links || [])];
            newLinks[index] = value;
            return {
                ...prev,
                adjuntos: { ...prev.adjuntos, links: newLinks }
            };
        });
    };
    
    const addLink = () => {
        setQuestion(prev => ({ ...prev, adjuntos: { ...prev.adjuntos, links: [...(prev.adjuntos.links || []), ''] } }));
    };

    const removeLink = (index: number) => {
        setQuestion(prev => ({ ...prev, adjuntos: { ...prev.adjuntos, links: (prev.adjuntos.links || []).filter((_: any, i: number) => i !== index) }}));
    };

    // Handlers for Images
    const handleImageFileSelect = async (files: FileList | null) => {
        if (!files) return;
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        try {
            const base64Promises = imageFiles.map(fileToBase64);
            const base64Images = await Promise.all(base64Promises);
            setQuestion(prev => ({ ...prev, adjuntos: { ...prev.adjuntos, imagenes: [...(prev.adjuntos.imagenes || []), ...base64Images] } }));
        } catch (err) { setError("Hubo un error al procesar las imágenes."); }
    };
    
    const handleImageDrag = (e: React.DragEvent<HTMLDivElement>, dragging: boolean) => { e.preventDefault(); e.stopPropagation(); setIsDraggingImage(dragging); };
    const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => { handleImageDrag(e, false); handleImageFileSelect(e.dataTransfer.files); };
    const removeImage = (indexToRemove: number) => {
        setQuestion(prev => ({ ...prev, adjuntos: { ...prev.adjuntos, imagenes: (prev.adjuntos.imagenes || []).filter((_: any, index: number) => index !== indexToRemove) } }));
    };
    const addImageFromUrl = () => {
        if (!imageUrl.trim()) return;
        if (!validateUrl(imageUrl)) {
            setUrlError("La URL de la imagen debe comenzar con 'http://' o 'https://'");
            return;
        }
        setQuestion(prev => ({ ...prev, adjuntos: { ...prev.adjuntos, imagenes: [...(prev.adjuntos.imagenes || []), imageUrl] } }));
        setImageUrl('');
        setUrlError(null);
    };
    const openImageEditor = (index: number) => {
        setEditingImageIndex(index);
        setIsEditorOpen(true);
    };
    const handleSaveEditedImage = (editedImage: string) => {
        if (editingImageIndex !== null) {
            setQuestion(prev => {
                const newImages = [...(prev.adjuntos.imagenes || [])];
                newImages[editingImageIndex] = editedImage;
                return { ...prev, adjuntos: { ...prev.adjuntos, imagenes: newImages } };
            });
        }
        setIsEditorOpen(false);
        setEditingImageIndex(null);
    };
    
    // Handlers for Videos
    const handleVideoFileSelect = async (files: FileList | null) => {
        if (!files) return;
        const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));
        if (videoFiles.length === 0) return;

        try {
            const base64Promises = videoFiles.map(fileToBase64);
            const base64Videos = await Promise.all(base64Promises);
            setQuestion(prev => ({ ...prev, adjuntos: { ...prev.adjuntos, videos: [...(prev.adjuntos.videos || []), ...base64Videos] } }));
        } catch (err) { setError("Hubo un error al procesar los videos."); }
    };
    const handleVideoDrag = (e: React.DragEvent<HTMLDivElement>, dragging: boolean) => { e.preventDefault(); e.stopPropagation(); setIsDraggingVideo(dragging); };
    const handleVideoDrop = (e: React.DragEvent<HTMLDivElement>) => { handleVideoDrag(e, false); handleVideoFileSelect(e.dataTransfer.files); };
    const removeVideo = (indexToRemove: number) => {
        setQuestion(prev => ({ ...prev, adjuntos: { ...prev.adjuntos, videos: (prev.adjuntos.videos || []).filter((_: any, index: number) => index !== indexToRemove) } }));
    };
    const addVideoFromUrl = () => {
        if (!videoUrl.trim()) return;
        if (!validateUrl(videoUrl)) {
            setUrlError("La URL del video debe comenzar con 'http://' o 'https://'");
            return;
        }
        setQuestion(prev => ({ ...prev, adjuntos: { ...prev.adjuntos, videos: [...(prev.adjuntos.videos || []), videoUrl] } }));
        setVideoUrl('');
        setUrlError(null);
    };


    const handleAIAssist = async () => {
        if (!question.enunciado) {
            setError("Por favor, escribe al menos el enunciado de la pregunta antes de usar la asistencia de IA.");
            return;
        }
        setIsGenerating(true);
        setError(null);
        try {
            const draft = { ...question };
            const assistedData = await assistWithQuestionCreation(draft);
            
            const { feedback_correcto, feedback_incorrecto, ...otherData } = assistedData;
            
            // Apply non-feedback data immediately
            setQuestion(prev => ({ ...prev, ...otherData }));

            // Prompt for feedback if it exists
            if (feedback_correcto || feedback_incorrecto) {
                 setPendingFeedback({
                    correct: feedback_correcto || '',
                    incorrect: feedback_incorrecto || ''
                 });
            }

        } catch (e: any) {
            setError(e.message || "Ocurrió un error inesperado con la IA.");
        } finally {
            setIsGenerating(false);
        }
    };

    const confirmFeedback = () => {
        if (pendingFeedback) {
             setQuestion(prev => ({
                ...prev,
                feedback_correcto: pendingFeedback.correct || prev.feedback_correcto,
                feedback_incorrecto: pendingFeedback.incorrect || prev.feedback_incorrecto
            }));
        }
        setPendingFeedback(null);
    };

    const discardFeedback = () => {
        setPendingFeedback(null);
    };

    const handleSubmit = () => {
        if (!question.enunciado) {
            alert("El enunciado es obligatorio.");
            return;
        }
        
        if (
            (question.tipo_pregunta === QuestionType.MultipleChoice || question.tipo_pregunta === QuestionType.TrueFalse) &&
            (!question.feedback_correcto || !question.feedback_incorrecto)
        ) {
            alert("El feedback para respuestas correctas e incorrectas es obligatorio para este tipo de pregunta. Puedes usar la asistencia de IA para generarlo.");
            return;
        }
        
        const tiene_multimedia = (question.adjuntos?.imagenes?.length ?? 0) > 0 ||
                                 (question.adjuntos?.videos?.length ?? 0) > 0 ||
                                 (question.adjuntos?.links?.length ?? 0) > 0;

        const finalQuestion: Question = {
            ...question,
            adjuntos: {
                imagenes: question.adjuntos.imagenes?.filter((i: string) => i.trim() !== ''),
                videos: question.adjuntos.videos?.filter((v: string) => v.trim() !== ''),
                links: question.adjuntos.links?.filter((l: string) => l.trim() !== ''),
            },
            tiene_multimedia,
            codigo_pregunta: initialQuestion?.codigo_pregunta || `${question.especialidad.slice(0, 3).toUpperCase()}-${String(Date.now()).slice(-4)}`,
            fecha_creacion: initialQuestion?.fecha_creacion || new Date().toISOString().split('T')[0],
            veces_utilizada: initialQuestion?.veces_utilizada || 0,
            etiquetas: typeof question.etiquetas === 'string' ? (question.etiquetas as string).split(',').map((s: string) => s.trim()) : question.etiquetas,
            rating: question.rating || 0,
        };
        onSave(finalQuestion);
    };

    if (!isOpen) return null;

    const editingImageSrc = editingImageIndex !== null ? question.adjuntos.imagenes?.[editingImageIndex] || null : null;

    // Common styles
    const inputClass = "w-full bg-background/50 border border-secondary/30 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent transition-all outline-none placeholder-secondary/50";
    const labelClass = "block text-sm font-semibold text-text-secondary mb-1.5";
    const sectionClass = "bg-surface/50 p-6 rounded-xl border border-secondary/20 space-y-4";

    return (
        <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col border border-secondary/20">
                    <header className="px-6 py-4 border-b border-secondary/20 flex justify-between items-center bg-surface/80 backdrop-blur-md rounded-t-2xl z-10">
                        <div>
                            <h3 className="text-2xl font-bold text-text-primary">{initialQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}</h3>
                            <p className="text-sm text-text-secondary">Configure los detalles y el contenido de la evaluación.</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary/50 transition-colors text-text-secondary hover:text-text-primary"><CloseIcon /></button>
                    </header>

                    <main className="flex-grow p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-secondary/30 scrollbar-track-transparent">
                        
                        {/* CONFIGURATION SECTION */}
                        <div className={sectionClass}>
                            <h4 className="text-sm font-bold text-accent uppercase tracking-wider border-b border-secondary/20 pb-2">Configuración General</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className={labelClass}>Tipo de Pregunta</label>
                                    <select name="tipo_pregunta" value={question.tipo_pregunta} onChange={handleChange} className={inputClass}>
                                        {TIPOS_PREGUNTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Especialidad</label>
                                    <select name="especialidad" value={question.especialidad} onChange={handleChange} className={inputClass}>
                                        {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Dificultad / Puntaje</label>
                                    <select name="dificultad" value={question.dificultad} onChange={handleChange} className={inputClass}>
                                        {DIFICULTADES.map(d => <option key={d} value={d}>{`Nivel ${d} (${d} punto${d !== 1 ? 's' : ''})`}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-grow">
                                    <label className={labelClass}>Tema Principal</label>
                                    <input type="text" name="tema" placeholder="Ej: Fisiopatología del Infarto Agudo de Miocardio" value={question.tema} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                     <label className={labelClass}>Marcar como Favorito</label>
                                     <div className="flex items-center gap-2 mt-2 px-3 py-1 border border-secondary/30 rounded-lg bg-background/50">
                                        {[1, 2, 3].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => handleRatingChange(question.rating === star ? 0 : star as 1|2|3)}
                                                className={`transition-colors hover:scale-110 ${star <= (question.rating || 0) ? 'text-yellow-400' : 'text-secondary/40 hover:text-yellow-200'}`}
                                            >
                                                <StarIcon className="h-6 w-6 fill-current" />
                                            </button>
                                        ))}
                                        <span className="text-xs text-text-secondary ml-1">({question.rating || 0}/3)</span>
                                     </div>
                                </div>
                            </div>
                            
                            {/* NEW TAGS INPUT */}
                            <div>
                                <label className={labelClass}>Etiquetas <span className="text-xs font-normal opacity-70">(Separadas por coma)</span></label>
                                <input
                                    type="text"
                                    name="etiquetas"
                                    placeholder="Ej: anatomía, fisiología, urgencias"
                                    value={Array.isArray(question.etiquetas) ? question.etiquetas.join(', ') : question.etiquetas}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* CONTENT SECTION */}
                        <div className={sectionClass}>
                             <div className="flex justify-between items-center border-b border-secondary/20 pb-2">
                                <h4 className="text-sm font-bold text-accent uppercase tracking-wider">Contenido</h4>
                                <button 
                                    onClick={handleAIAssist} 
                                    disabled={isGenerating} 
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SparklesIcon className="h-4 w-4" />
                                    {isGenerating ? 'Generando...' : 'Asistente IA'}
                                </button>
                            </div>

                            <div>
                                <label className={labelClass}>Enunciado de la Pregunta</label>
                                <textarea name="enunciado" value={question.enunciado} onChange={handleChange} rows={4} className={`${inputClass} resize-none text-lg`} placeholder="Escribe el enunciado aquí..."/>
                            </div>
                             {error && <div className="bg-danger/10 border border-danger/20 text-danger text-sm p-3 rounded-lg">{error}</div>}

                            {/* QUESTION TYPE SPECIFIC FIELDS */}
                            {question.tipo_pregunta === QuestionType.MultipleChoice && (
                                <div className="space-y-3">
                                    <label className={labelClass}>Alternativas <span className="text-xs font-normal opacity-70">(Seleccione la correcta)</span></label>
                                    <div className="space-y-2">
                                        {question.alternativas?.map((alt: Alternative, index: number) => (
                                            <div key={index} className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${alt.es_correcta ? 'bg-success/10 border-success/50' : 'bg-background border-transparent hover:border-secondary/30'}`}>
                                                <input 
                                                    type="radio" 
                                                    name="correct_alternative" 
                                                    checked={alt.es_correcta} 
                                                    onChange={() => handleCorrectAlternative(index)} 
                                                    className="w-5 h-5 text-success focus:ring-success border-secondary/50 cursor-pointer"
                                                />
                                                <div className="w-8 text-center font-bold text-secondary">{String.fromCharCode(65 + index)}</div>
                                                <input 
                                                    type="text" 
                                                    value={alt.texto} 
                                                    onChange={e => handleAlternativeChange(index, e.target.value)} 
                                                    placeholder={`Opción ${String.fromCharCode(65 + index)}`} 
                                                    className="flex-grow bg-transparent border-none focus:ring-0 text-text-primary placeholder-secondary/50" 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {question.tipo_pregunta === QuestionType.TrueFalse && (
                                <div>
                                    <label className={labelClass}>Respuesta Correcta</label>
                                    <div className="flex gap-4 mt-2">
                                        {['Verdadero', 'Falso'].map((opt) => (
                                            <label key={opt} className={`flex-1 cursor-pointer border rounded-lg p-4 text-center transition-all ${question.respuesta_correcta_vf === opt ? 'bg-primary text-white border-primary shadow-lg' : 'bg-background border-secondary/30 hover:border-primary/50'}`}>
                                                <input type="radio" name="respuesta_correcta_vf" value={opt} checked={question.respuesta_correcta_vf === opt} onChange={handleChange} className="hidden" />
                                                <span className="font-bold text-lg">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* MULTIMEDIA SECTION */}
                        <div className={sectionClass}>
                            <h4 className="text-sm font-bold text-accent uppercase tracking-wider border-b border-secondary/20 pb-2">Multimedia y Adjuntos</h4>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* IMAGES */}
                                <div className="space-y-3">
                                    <label className={labelClass}><ImageIcon className="inline mr-2 mb-1" /> Imágenes</label>
                                    <input type="file" multiple accept="image/*" ref={imageInputRef} className="hidden" onChange={(e) => handleImageFileSelect(e.target.files)} />
                                    
                                    <div 
                                        onDragEnter={e=>handleImageDrag(e,true)} onDragLeave={e=>handleImageDrag(e,false)} onDragOver={e=>handleImageDrag(e,true)} onDrop={handleImageDrop} onClick={() => imageInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${isDraggingImage ? 'border-primary bg-primary/5' : 'border-secondary/30 hover:border-primary/50 hover:bg-surface'}`}
                                    >
                                        <ImageIcon className="h-8 w-8 text-secondary mb-2" />
                                        <span className="text-sm text-text-secondary">Arrastra imágenes o <span className="text-primary font-semibold">haz clic</span></span>
                                    </div>

                                    <div className="flex gap-2">
                                        <input type="text" value={imageUrl} onChange={e => { setImageUrl(e.target.value); setUrlError(null); }} placeholder="https://..." className={inputClass} />
                                        <button onClick={addImageFromUrl} className="px-4 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors">Añadir</button>
                                    </div>
                                    {urlError && imageUrl && !validateUrl(imageUrl) && <p className="text-xs text-danger mt-1">{urlError}</p>}

                                    {(question.adjuntos.imagenes?.length || 0) > 0 && (
                                        <div className="grid grid-cols-4 gap-3 mt-4">
                                            {question.adjuntos.imagenes?.map((imgSrc: string, index: number) => (
                                                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-secondary/20">
                                                    <img src={imgSrc} alt="adjunto" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button onClick={(e) => {e.stopPropagation(); openImageEditor(index)}} className="text-white p-1.5 rounded-full hover:bg-white/20"><EditIcon className="h-4 w-4" /></button>
                                                        <button onClick={(e) => {e.stopPropagation(); removeImage(index)}} className="text-danger p-1.5 rounded-full hover:bg-white/20"><TrashIcon className="h-4 w-4" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* VIDEOS & LINKS */}
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className={labelClass}><VideoIcon className="inline mr-2 mb-1" /> Videos</label>
                                        <input type="file" multiple accept="video/*" ref={videoInputRef} className="hidden" onChange={(e) => handleVideoFileSelect(e.target.files)} />
                                        
                                        <div className="flex gap-2">
                                            <input type="text" value={videoUrl} onChange={e => { setVideoUrl(e.target.value); setUrlError(null); }} placeholder="URL de video (mp4, webm...)" className={inputClass} />
                                            <button onClick={addVideoFromUrl} className="px-4 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors">Añadir</button>
                                        </div>
                                         {urlError && videoUrl && !validateUrl(videoUrl) && <p className="text-xs text-danger mt-1">{urlError}</p>}

                                        {(question.adjuntos.videos?.length || 0) > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {question.adjuntos.videos?.map((_: string, index: number) => (
                                                    <div key={index} className="bg-background px-3 py-1.5 rounded-full flex items-center gap-2 border border-secondary/20 text-sm">
                                                        <VideoIcon className="h-3 w-3" /> <span>Video {index + 1}</span>
                                                        <button onClick={() => removeVideo(index)} className="text-danger hover:text-danger/80"><CloseIcon className="h-3 w-3" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className={labelClass}><LinkIcon className="inline mr-2 mb-1" /> Enlaces Externos</label>
                                            <button onClick={addLink} className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1"><PlusIcon className="h-3 w-3" /> Añadir URL</button>
                                        </div>
                                        <div className="space-y-2">
                                            {question.adjuntos.links?.map((url: string, index: number) => (
                                                <div key={`link-${index}`} className="flex gap-2 group">
                                                     <div className="flex-grow relative">
                                                        <input 
                                                            type="text" 
                                                            value={url} 
                                                            onChange={e => handleLinkChange(index, e.target.value)} 
                                                            placeholder="https://ejemplo.com/recurso" 
                                                            className={`${inputClass} ${url && !validateUrl(url) ? 'border-danger text-danger' : ''}`} 
                                                        />
                                                        {url && !validateUrl(url) && <span className="absolute right-3 top-3 text-danger"><CloseIcon className="h-4 w-4" /></span>}
                                                     </div>
                                                    <button onClick={() => removeLink(index)} className="px-3 text-secondary hover:text-danger transition-colors border border-secondary/30 hover:border-danger rounded-lg"><TrashIcon className="h-4 w-4" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FEEDBACK SECTION */}
                        <div className={sectionClass}>
                            <h4 className="text-sm font-bold text-accent uppercase tracking-wider border-b border-secondary/20 pb-2">Retroalimentación Pedagógica</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={`${labelClass} text-success`}>Feedback Respuesta Correcta</label>
                                    <textarea name="feedback_correcto" value={question.feedback_correcto} onChange={handleChange} rows={4} className={`${inputClass} bg-success/5 border-success/20 focus:ring-success`} placeholder="Explica por qué es correcta..." />
                                </div>
                                <div className="space-y-2">
                                    <label className={`${labelClass} text-danger`}>Feedback Respuesta Incorrecta</label>
                                    <textarea name="feedback_incorrecto" value={question.feedback_incorrecto} onChange={handleChange} rows={4} className={`${inputClass} bg-danger/5 border-danger/20 focus:ring-danger`} placeholder="Explica el error conceptual..." />
                                </div>
                            </div>
                        </div>

                    </main>
                    
                    <footer className="p-6 border-t border-secondary/20 bg-surface/80 backdrop-blur-md rounded-b-2xl flex justify-end gap-4">
                        <button onClick={onClose} className="px-6 py-2.5 rounded-lg bg-transparent border border-secondary/30 hover:bg-secondary/10 transition-colors font-medium">Cancelar</button>
                        <button onClick={handleSubmit} className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/20 transition-all transform hover:scale-105">Guardar Pregunta</button>
                    </footer>
                </div>
            </div>
            
             {isEditorOpen && (
                <ImageEditor
                    isOpen={isEditorOpen}
                    onClose={() => { setIsEditorOpen(false); setEditingImageIndex(null); }}
                    onSave={handleSaveEditedImage}
                    imageSrc={editingImageSrc}
                />
            )}

            {pendingFeedback && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-surface p-6 rounded-2xl shadow-2xl max-w-lg w-full border border-primary/50 animate-fade-in-up">
                        <h3 className="text-xl font-bold text-accent mb-4 flex items-center gap-2">
                            <SparklesIcon /> Sugerencia de IA
                        </h3>
                        <p className="mb-4 text-text-secondary">La IA ha generado una propuesta de retroalimentación para mejorar el aprendizaje del alumno.</p>
                        
                        <div className="space-y-4 mb-8 max-h-[50vh] overflow-y-auto pr-2">
                            <div className="bg-success/10 p-4 rounded-xl border border-success/20">
                                <p className="text-xs font-bold text-success mb-2 uppercase tracking-wider">Feedback Correcto (Sugerido)</p>
                                <p className="text-sm leading-relaxed">{pendingFeedback.correct || "(Sin cambios)"}</p>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-xl border border-danger/20">
                                <p className="text-xs font-bold text-danger mb-2 uppercase tracking-wider">Feedback Incorrecto (Sugerido)</p>
                                <p className="text-sm leading-relaxed">{pendingFeedback.incorrect || "(Sin cambios)"}</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={discardFeedback}
                                className="px-4 py-2 rounded-lg text-text-secondary hover:bg-secondary/10 transition-colors font-medium"
                            >
                                Descartar
                            </button>
                            <button 
                                onClick={confirmFeedback}
                                className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/20 transition-all"
                            >
                                Aplicar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default QuestionForm;
