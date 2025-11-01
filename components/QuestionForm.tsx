import React, { useState, useEffect } from 'react';
import { Question, QuestionType, Alternative, RubricCriterion } from '../types';
import { CloseIcon, SparklesIcon, PlusIcon, TrashIcon } from './icons';
import { ESPECIALIDADES, DIFICULTADES, TIPOS_PREGUNTA } from '../constants';
import { assistWithQuestionCreation } from '../services/geminiService';

interface QuestionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (question: Question) => void;
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
};

const QuestionForm: React.FC<QuestionFormProps> = ({ isOpen, onClose, onSave }) => {
    const [question, setQuestion] = useState(emptyQuestion);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setQuestion(emptyQuestion); // Reset form on open
            setError(null);
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const finalValue = (name === 'dificultad' || e.target.type === 'number') ? parseInt(value, 10) : value;
        setQuestion(prev => ({ ...prev, [name]: finalValue }));
    };
    
    const handleAlternativeChange = (index: number, text: string) => {
        const newAlts = [...(question.alternativas || [])];
        newAlts[index].texto = text;
        setQuestion(prev => ({ ...prev, alternativas: newAlts }));
    };

    const handleCorrectAlternative = (index: number) => {
        const newAlts = (question.alternativas || []).map((alt, i) => ({
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
        setQuestion(prev => ({ ...prev, criterios_rubrica: (prev.criterios_rubrica || []).filter((_, i) => i !== index) }));
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
            
            setQuestion(prev => ({
                ...prev,
                ...assistedData
            }));

        } catch (e: any) {
            setError(e.message || "Ocurrió un error inesperado con la IA.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = () => {
        if (!question.enunciado) {
            alert("El enunciado es obligatorio.");
            return;
        }
        
        // Validation for required feedbacks on specific question types
        if (
            (question.tipo_pregunta === QuestionType.MultipleChoice || question.tipo_pregunta === QuestionType.TrueFalse) &&
            (!question.feedback_correcto || !question.feedback_incorrecto)
        ) {
            alert("El feedback para respuestas correctas e incorrectas es obligatorio para este tipo de pregunta. Puedes usar la asistencia de IA para generarlo.");
            return;
        }

        const finalQuestion: Question = {
            ...question,
            codigo_pregunta: `${question.especialidad.slice(0, 3).toUpperCase()}-${String(Date.now()).slice(-4)}`,
            fecha_creacion: new Date().toISOString().split('T')[0],
            veces_utilizada: 0,
            etiquetas: typeof question.etiquetas === 'string' ? (question.etiquetas as string).split(',').map(s => s.trim()) : question.etiquetas,
        };
        onSave(finalQuestion);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-secondary/20 flex justify-between items-center">
                    <h3 className="text-xl font-bold">Nueva Pregunta</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary/50"><CloseIcon /></button>
                </header>

                <main className="flex-grow p-6 overflow-y-auto space-y-4">
                    
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select name="tipo_pregunta" value={question.tipo_pregunta} onChange={handleChange} className="w-full bg-background border border-secondary/30 rounded p-2 text-sm md:col-span-2">
                             {TIPOS_PREGUNTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <select name="especialidad" value={question.especialidad} onChange={handleChange} className="w-full bg-background border border-secondary/30 rounded p-2 text-sm">
                            {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <select name="dificultad" value={question.dificultad} onChange={handleChange} className="w-full bg-background border border-secondary/30 rounded p-2 text-sm">
                             {DIFICULTADES.map(d => <option key={d} value={d}>{`Dificultad ${d}`}</option>)}
                        </select>
                    </div>

                    <div className="space-y-4">
                        <input type="text" name="tema" placeholder="Tema Principal (ej: Fisiopatología del Infarto Agudo de Miocardio)" value={question.tema} onChange={handleChange} className="w-full bg-background border border-secondary/30 rounded p-2" />
                        
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Enunciado</label>
                            <textarea name="enunciado" value={question.enunciado} onChange={handleChange} rows={4} className="w-full bg-background border border-secondary/30 rounded p-2" placeholder="Escribe el enunciado de la pregunta aquí..."/>
                        </div>

                        {question.enunciado && (
                            <div className="flex justify-center">
                                <button onClick={handleAIAssist} disabled={isGenerating} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors font-semibold disabled:bg-accent/50">
                                    <SparklesIcon />
                                    {isGenerating ? 'Asistiendo...' : 'Asistir con IA (Mejorar y generar Feedback)'}
                                </button>
                            </div>
                        )}
                        {error && <p className="text-danger text-sm text-center">{error}</p>}
                        
                        {question.tipo_pregunta === QuestionType.MultipleChoice && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-text-secondary">Alternativas (marca la correcta)</label>
                                {question.alternativas?.map((alt, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input type="radio" name="correct_alternative" checked={alt.es_correcta} onChange={() => handleCorrectAlternative(index)} className="form-radio text-primary focus:ring-primary"/>
                                        <input type="text" value={alt.texto} onChange={e => handleAlternativeChange(index, e.target.value)} placeholder={`Texto de la alternativa ${String.fromCharCode(65 + index)}`} className="w-full bg-background border border-secondary/30 rounded p-2" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {question.tipo_pregunta === QuestionType.TrueFalse && (
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Respuesta Correcta</label>
                                <select name="respuesta_correcta_vf" value={question.respuesta_correcta_vf} onChange={handleChange} className="w-full bg-background border border-secondary/30 rounded p-2">
                                    <option value="Verdadero">Verdadero</option>
                                    <option value="Falso">Falso</option>
                                </select>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Feedback (Correcto)</label>
                                <textarea name="feedback_correcto" value={question.feedback_correcto} onChange={handleChange} rows={3} className="w-full bg-background border border-secondary/30 rounded p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Feedback (Incorrecto)</label>
                                <textarea name="feedback_incorrecto" value={question.feedback_incorrecto} onChange={handleChange} rows={3} className="w-full bg-background border border-secondary/30 rounded p-2" />
                            </div>
                        </div>

                    </div>
                </main>
                
                <footer className="p-4 border-t border-secondary/20 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">Cancelar</button>
                    <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark font-semibold transition-colors">Guardar Pregunta</button>
                </footer>
            </div>
        </div>
    );
};

export default QuestionForm;
