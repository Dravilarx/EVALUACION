
import React, { useState, useMemo, useEffect } from 'react';
import { Quiz, Question, QuizQuestion } from '../types';
import { CloseIcon, PlusIcon, TrashIcon, SparklesIcon, CheckCircleIcon } from './icons';
import { ESPECIALIDADES, TIPOS_PREGUNTA } from '../constants';

interface QuizFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (quiz: Quiz) => void;
    allQuestions: Question[];
    initialData?: Quiz | null;
    isEditing?: boolean;
}

const QuizForm: React.FC<QuizFormProps> = ({ isOpen, onClose, onSave, allQuestions, initialData, isEditing }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [timeLimit, setTimeLimit] = useState(30);
    const [docente, setDocente] = useState('Equipo Docente');
    const [asignatura, setAsignatura] = useState(ESPECIALIDADES[0]);
    const [selectedQuestions, setSelectedQuestions] = useState<QuizQuestion[]>([]);
    
    // New state for multi-selection and random
    const [checkedBankQuestions, setCheckedBankQuestions] = useState<Set<string>>(new Set());
    const [randomCount, setRandomCount] = useState<number>(5);
    
    const [filters, setFilters] = useState({
        texto: '',
        tipo_pregunta: '',
        especialidad: '',
    });
    
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(isEditing ? initialData.titulo : `Copia de ${initialData.titulo}`);
                setDescription(initialData.descripcion);
                setTimeLimit(initialData.tiempo_limite_minutos);
                setSelectedQuestions(initialData.preguntas);
                setDocente(initialData.docente_creador);
                setAsignatura(initialData.asignatura);
            } else {
                setTitle('');
                setDescription('');
                setTimeLimit(30);
                setSelectedQuestions([]);
                setDocente('Equipo Docente');
                setAsignatura(ESPECIALIDADES[0]);
            }
            setCheckedBankQuestions(new Set());
        }
    }, [initialData, isOpen, isEditing]);


    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        // Clear selection when filters change to avoid confusion
        setCheckedBankQuestions(new Set());
    };

    const availableQuestions = useMemo(() => {
        const selectedIds = new Set(selectedQuestions.map(q => q.codigo_pregunta));
        return allQuestions.filter(q => {
             const notSelected = !selectedIds.has(q.codigo_pregunta);
             
             const searchText = filters.texto.toLowerCase();
             // Search by Enunciado OR Code (Partial or Full)
             const textMatch = q.enunciado.toLowerCase().includes(searchText) || 
                               q.codigo_pregunta.toLowerCase().includes(searchText);

             const typeMatch = filters.tipo_pregunta ? q.tipo_pregunta === filters.tipo_pregunta : true;
             const specialtyMatch = filters.especialidad ? q.especialidad === filters.especialidad : true;

             return notSelected && textMatch && typeMatch && specialtyMatch;
        });
    }, [allQuestions, selectedQuestions, filters]);
    
    const questionsInQuiz = useMemo(() => {
        return selectedQuestions.map(sq => {
            const questionDetails = allQuestions.find(q => q.codigo_pregunta === sq.codigo_pregunta);
            return { ...questionDetails, ...sq };
        }).filter((q): q is Question & QuizQuestion => !!q.codigo_pregunta);
    }, [selectedQuestions, allQuestions]);


    const totalScore = useMemo(() => {
        return selectedQuestions.reduce((sum, q) => sum + (q.puntaje || 0), 0);
    }, [selectedQuestions]);

    if (!isOpen) return null;

    // Single Add
    const handleAddQuestion = (questionCode: string) => {
        const question = allQuestions.find(q => q.codigo_pregunta === questionCode);
        const initialScore = question ? Math.max(1, Math.min(5, question.dificultad)) : 1;
        setSelectedQuestions(prev => [...prev, { codigo_pregunta: questionCode, puntaje: initialScore }]);
        
        // Remove from checked if it was checked
        if (checkedBankQuestions.has(questionCode)) {
            const newChecked = new Set(checkedBankQuestions);
            newChecked.delete(questionCode);
            setCheckedBankQuestions(newChecked);
        }
    };

    // Bulk Add (Selected)
    const handleAddCheckedQuestions = () => {
        const newQuestions: QuizQuestion[] = [];
        checkedBankQuestions.forEach(code => {
             const question = allQuestions.find(q => q.codigo_pregunta === code);
             const initialScore = question ? Math.max(1, Math.min(5, question.dificultad)) : 1;
             newQuestions.push({ codigo_pregunta: code, puntaje: initialScore });
        });
        setSelectedQuestions(prev => [...prev, ...newQuestions]);
        setCheckedBankQuestions(new Set());
    };

    // Random Add
    const handleAddRandom = () => {
        if (availableQuestions.length === 0) return;
        
        const countToAdd = Math.min(randomCount, availableQuestions.length);
        // Shuffle array
        const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, countToAdd);
        
        const newQuestions = selected.map(q => ({
            codigo_pregunta: q.codigo_pregunta,
            puntaje: Math.max(1, Math.min(5, q.dificultad))
        }));
        
        setSelectedQuestions(prev => [...prev, ...newQuestions]);
    };

    const handleRemoveQuestion = (questionCode: string) => {
        setSelectedQuestions(prev => prev.filter(q => q.codigo_pregunta !== questionCode));
    };

    const handlePuntajeChange = (questionCode: string, puntaje: number) => {
        const newPuntaje = Math.max(1, Math.min(5, isNaN(puntaje) ? 1 : puntaje));
        setSelectedQuestions(prev => prev.map(q => q.codigo_pregunta === questionCode ? { ...q, puntaje: newPuntaje } : q));
    };

    // Checkbox Logic
    const toggleQuestionCheck = (code: string) => {
        const newSet = new Set(checkedBankQuestions);
        if (newSet.has(code)) {
            newSet.delete(code);
        } else {
            newSet.add(code);
        }
        setCheckedBankQuestions(newSet);
    };

    const toggleSelectAll = () => {
        if (checkedBankQuestions.size === availableQuestions.length && availableQuestions.length > 0) {
            setCheckedBankQuestions(new Set());
        } else {
            const newSet = new Set<string>();
            availableQuestions.forEach(q => newSet.add(q.codigo_pregunta));
            setCheckedBankQuestions(newSet);
        }
    };

    const handleSave = () => {
        if (!title || selectedQuestions.length === 0) {
            alert("El título y al menos una pregunta son obligatorios.");
            return;
        }
        
        const quizId = isEditing && initialData ? initialData.id_cuestionario : `QUIZ-${String(Date.now()).slice(-4)}`;
        
        const updatedQuiz: Quiz = {
            id_cuestionario: quizId,
            titulo: title,
            descripcion: description,
            preguntas: selectedQuestions,
            creado_desde: isEditing && initialData ? initialData.creado_desde : 'banco',
            alumnos_asignados: isEditing && initialData ? initialData.alumnos_asignados : [],
            tiempo_limite_minutos: timeLimit,
            ventana_disponibilidad: isEditing && initialData ? initialData.ventana_disponibilidad : {
                inicio: new Date().toISOString(),
                fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            link_acceso: `https://app.evaluaciones/quiz/${quizId}`,
            proctoring: { habilitado: false },
            intentos_permitidos: 1,
            docente_creador: docente,
            asignatura: asignatura,
        };
        onSave(updatedQuiz);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-secondary/20 flex justify-between items-center">
                    <h3 className="text-xl font-bold">{isEditing ? 'Editar Cuestionario' : initialData ? 'Duplicar Cuestionario' : 'Crear Nuevo Cuestionario'}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary/50"><CloseIcon /></button>
                </header>
                
                <main className="flex-grow p-6 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Selected Questions & Details */}
                    <div className="flex flex-col space-y-4 overflow-y-auto pr-3">
                        <h4 className="text-lg font-semibold text-accent">Detalles del Cuestionario</h4>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del Cuestionario" className="w-full bg-background border border-secondary/30 rounded p-2" />
                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción" rows={3} className="w-full bg-background border border-secondary/30 rounded p-2" />
                        
                        <div className="grid grid-cols-2 gap-4">
                             <input type="text" value={docente} onChange={e => setDocente(e.target.value)} placeholder="Docente creador" className="w-full bg-background border border-secondary/30 rounded p-2" />
                             <select value={asignatura} onChange={e => setAsignatura(e.target.value)} className="w-full bg-background border border-secondary/30 rounded p-2">
                                 {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                                 <option value="Interdisciplinario">Interdisciplinario</option>
                             </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Tiempo Límite (minutos)</label>
                            <input type="number" value={timeLimit} min="1" onChange={e => setTimeLimit(parseInt(e.target.value, 10))} className="w-full bg-background border border-secondary/30 rounded p-2" />
                        </div>

                        <div className="border-t border-secondary/20 pt-4 flex-grow flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-lg font-semibold text-accent">Preguntas Seleccionadas ({selectedQuestions.length})</h4>
                                <span className="font-bold">Puntaje Total: {totalScore}</span>
                            </div>

                             {questionsInQuiz.length > 0 && (
                                <div className="flex items-center justify-between gap-2 px-3 pb-2 border-b border-secondary/20">
                                    <p className="text-xs font-bold text-text-secondary">PREGUNTA</p>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <p className="w-16 text-center text-xs font-bold text-text-secondary">PUNTAJE</p>
                                        <div className="w-5 h-5"></div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-2 space-y-2 flex-grow overflow-y-auto">
                                {questionsInQuiz.length > 0 ? questionsInQuiz.map((q, index) => (
                                    <div key={q.codigo_pregunta} className="bg-background p-3 rounded-md flex items-center justify-between gap-2 group hover:bg-secondary/10 transition-colors">
                                        <div className="flex-grow overflow-hidden">
                                            <p className="text-sm font-semibold truncate" title={q.enunciado}>{index + 1}. {q.enunciado}</p>
                                            <p className="text-xs text-text-secondary">{q.codigo_pregunta}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <input 
                                                type="number" 
                                                min="1" max="5" 
                                                value={q.puntaje}
                                                onChange={(e) => handlePuntajeChange(q.codigo_pregunta, parseInt(e.target.value, 10))}
                                                className="w-16 bg-surface border border-secondary/30 rounded p-1 text-center focus:ring-2 focus:ring-primary focus:outline-none"
                                            />
                                            <button onClick={() => handleRemoveQuestion(q.codigo_pregunta)} className="text-danger hover:text-danger/80 p-1" aria-label={`Quitar ${q.codigo_pregunta}`}><TrashIcon /></button>
                                        </div>
                                    </div>
                                )) : <div className="text-text-secondary text-center p-4 border-2 border-dashed border-secondary/30 rounded-lg">Añade preguntas desde el banco.</div>}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Question Bank */}
                    <div className="flex flex-col space-y-4 overflow-y-auto border-l border-secondary/20 pl-6 pr-3">
                        <div className="flex justify-between items-end">
                            <h4 className="text-lg font-semibold text-accent">Banco de Preguntas ({availableQuestions.length})</h4>
                            {checkedBankQuestions.size > 0 && (
                                <button 
                                    onClick={handleAddCheckedQuestions} 
                                    className="text-xs bg-primary hover:bg-primary-dark px-3 py-1 rounded font-bold flex items-center gap-1 transition-colors"
                                >
                                    <CheckCircleIcon className="h-4 w-4" /> Añadir ({checkedBankQuestions.size})
                                </button>
                            )}
                        </div>
                        
                        {/* Filters */}
                        <div className="space-y-2">
                            <input 
                                type="text"
                                name="texto"
                                placeholder="Buscar por enunciado o código..."
                                value={filters.texto}
                                onChange={handleFilterChange}
                                className="w-full bg-background border border-secondary/30 rounded p-2"
                            />
                             <div className="grid grid-cols-2 gap-2">
                                <select name="tipo_pregunta" value={filters.tipo_pregunta} onChange={handleFilterChange} className="bg-background border border-secondary/30 rounded p-2 w-full text-sm">
                                    <option value="">Todo tipo</option>
                                    {TIPOS_PREGUNTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <select name="especialidad" value={filters.especialidad} onChange={handleFilterChange} className="bg-background border border-secondary/30 rounded p-2 w-full text-sm">
                                    <option value="">Toda especialidad</option>
                                    {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Bulk & Random Tools */}
                        <div className="bg-surface/50 p-3 rounded border border-secondary/20 flex flex-col sm:flex-row gap-3 justify-between items-center text-sm">
                             <label className="flex items-center gap-2 cursor-pointer select-none hover:text-accent transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={availableQuestions.length > 0 && checkedBankQuestions.size === availableQuestions.length}
                                    onChange={toggleSelectAll}
                                    className="form-checkbox bg-background border-secondary/30 rounded text-primary focus:ring-primary h-4 w-4"
                                />
                                <span>Seleccionar Todo</span>
                            </label>

                            <div className="flex items-center gap-2 bg-background/50 p-1 rounded border border-secondary/20">
                                <span className="text-xs text-text-secondary pl-2">Azar:</span>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max={availableQuestions.length}
                                    value={randomCount}
                                    onChange={e => setRandomCount(parseInt(e.target.value))}
                                    className="w-12 bg-transparent border-b border-secondary/30 text-center focus:outline-none text-sm"
                                />
                                <button onClick={handleAddRandom} disabled={availableQuestions.length === 0} className="p-1 hover:text-accent disabled:opacity-50">
                                    <SparklesIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="space-y-2 flex-grow overflow-y-auto">
                            {availableQuestions.map(q => (
                                <div key={q.codigo_pregunta} className={`bg-background p-3 rounded-md flex items-center justify-between gap-2 border transition-colors ${checkedBankQuestions.has(q.codigo_pregunta) ? 'border-primary bg-primary/5' : 'border-transparent hover:border-secondary/30'}`}>
                                    <div className="flex items-center gap-3 overflow-hidden flex-grow">
                                        <input 
                                            type="checkbox" 
                                            checked={checkedBankQuestions.has(q.codigo_pregunta)}
                                            onChange={() => toggleQuestionCheck(q.codigo_pregunta)}
                                            className="form-checkbox bg-surface border-secondary/30 rounded text-primary focus:ring-primary h-4 w-4 flex-shrink-0"
                                        />
                                        <div className="overflow-hidden cursor-pointer" onClick={() => toggleQuestionCheck(q.codigo_pregunta)}>
                                            <p className="text-sm truncate" title={q.enunciado}>{q.enunciado}</p>
                                            <p className="text-xs text-text-secondary">{q.codigo_pregunta} • {q.especialidad}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleAddQuestion(q.codigo_pregunta)} className="bg-secondary/20 hover:bg-primary hover:text-white text-text-secondary p-2 rounded transition-colors flex-shrink-0" aria-label={`Añadir ${q.codigo_pregunta}`}><PlusIcon className="h-4 w-4" /></button>
                                </div>
                            ))}
                            {availableQuestions.length === 0 && (
                                <div className="text-center py-8 text-text-secondary italic">No se encontraron preguntas con los filtros actuales.</div>
                            )}
                        </div>
                    </div>
                </main>

                <footer className="p-4 border-t border-secondary/20 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark font-semibold transition-colors">Guardar Cuestionario</button>
                </footer>
            </div>
        </div>
    );
};

export default QuizForm;
