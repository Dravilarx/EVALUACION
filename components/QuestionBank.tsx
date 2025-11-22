
import React, { useState, useMemo, useEffect } from 'react';
import { Question, QuestionType } from '../types';
import QuestionForm from './QuestionForm';
import { PlusIcon, FilterIcon, ImageIcon, VideoIcon, LinkIcon, EditIcon, StarIcon, TrashIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { ESPECIALIDADES, DIFICULTADES, TIPOS_PREGUNTA } from '../constants';

const ITEMS_PER_PAGE = 12;

const StarRating: React.FC<{ rating: number, onRate: (rating: 1|2|3) => void }> = ({ rating, onRate }) => {
    return (
        <div className="flex items-center gap-0.5 bg-background/50 rounded-full px-1.5 py-0.5 border border-secondary/20">
            {[1, 2, 3].map((star) => (
                <button
                    key={star}
                    onClick={(e) => { e.stopPropagation(); onRate(star as 1|2|3); }}
                    className={`transition-all hover:scale-125 ${star <= rating ? 'text-yellow-400' : 'text-secondary/30 hover:text-yellow-200'}`}
                >
                    <StarIcon className="h-4 w-4 fill-current" />
                </button>
            ))}
        </div>
    );
};

const getTypeStyles = (type: QuestionType) => {
    switch (type) {
        case QuestionType.MultipleChoice:
            return { label: 'Selección Múltiple', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
        case QuestionType.TrueFalse:
            return { label: 'Verdadero/Falso', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' };
        case QuestionType.FreeResponse:
            return { label: 'Respuesta Libre', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' };
        default:
            return { label: 'Otro', bg: 'bg-secondary/10', text: 'text-text-secondary', border: 'border-secondary/20' };
    }
};

interface QuestionCardProps {
    question: Question;
    onEdit: (q: Question) => void;
    onToggleStar: (q: Question, rating: 1|2|3) => void;
    onDelete: (id: string) => void;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onEdit, onToggleStar, onDelete, isSelected, onToggleSelect }) => {
    const typeStyle = getTypeStyles(question.tipo_pregunta);
    
    const handleRate = (newRating: 1|2|3) => {
        onToggleStar(question, newRating);
    };

    return (
        <div 
            className={`group relative flex flex-col bg-surface rounded-xl shadow-sm hover:shadow-xl border transition-all duration-300 overflow-hidden ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-secondary/20 hover:border-primary/50'}`}
            onClick={() => onToggleSelect(question.codigo_pregunta)}
        >
            {/* Selection Overlay/Checkbox */}
            <div className="absolute top-3 right-3 z-10">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'bg-surface border-secondary/40 group-hover:border-primary'}`}>
                    {isSelected && <CheckCircleIcon className="h-4 w-4 text-white" />}
                </div>
            </div>

            {/* Card Header */}
            <div className="p-4 flex justify-between items-start pb-2 pr-10">
                <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                    {typeStyle.label}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                     <StarRating rating={question.rating || 0} onRate={handleRate} />
                </div>
            </div>

            {/* Card Body */}
            <div className="px-4 flex-grow cursor-pointer">
                <div className="mb-3">
                    <span className="text-[10px] font-mono text-text-secondary uppercase tracking-wider">{question.codigo_pregunta}</span>
                    <h4 className="text-text-primary font-medium leading-snug line-clamp-3 min-h-[3rem]">
                        {question.enunciado}
                    </h4>
                </div>
                
                {/* Media Preview & Alternatives */}
                <div className="space-y-3 mb-4">
                    {question.adjuntos.imagenes?.[0] && (
                        <div className="relative h-32 w-full rounded-lg overflow-hidden border border-secondary/20 bg-black/20">
                            <img src={question.adjuntos.imagenes[0]} alt="Adjunto" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-2 right-2 bg-black/60 rounded p-1">
                                <ImageIcon className="h-3 w-3 text-white" />
                            </div>
                        </div>
                    )}

                    {/* Mini Content Preview */}
                    <div className="text-xs text-text-secondary space-y-1">
                        {question.tipo_pregunta === QuestionType.MultipleChoice && (
                             <div className="flex items-center gap-1">
                                <span className="bg-secondary/20 px-1.5 rounded text-[10px]"> {question.alternativas?.length} </span>
                                <span>Alternativas</span>
                             </div>
                        )}
                        <div className="flex items-center gap-3 pt-1">
                            {(question.adjuntos.videos?.length || 0) > 0 && <span className="flex items-center gap-1 text-accent"><VideoIcon className="h-3 w-3" /> Video</span>}
                            {(question.adjuntos.links?.length || 0) > 0 && <span className="flex items-center gap-1 text-accent"><LinkIcon className="h-3 w-3" /> Link</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Footer */}
            <div className="mt-auto bg-secondary/5 border-t border-secondary/20 p-3 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col text-xs text-text-secondary">
                    <span className="font-semibold text-text-primary">{question.especialidad}</span>
                    <div className="flex gap-2">
                         <span>Dif: <span className={(question.dificultad >= 4 ? 'text-warning' : 'text-success')}>{question.dificultad}/5</span></span>
                         <span className="text-text-secondary truncate max-w-[80px]" title={question.docente_creador}>{question.docente_creador}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onEdit(question)}
                        className="p-2 rounded-lg bg-background border border-secondary/20 hover:border-primary hover:text-primary transition-colors"
                        title="Editar"
                    >
                        <EditIcon className="h-4 w-4" />
                    </button>
                    <button 
                        onClick={() => onDelete(question.codigo_pregunta)}
                        className="p-2 rounded-lg bg-background border border-secondary/20 hover:border-danger hover:text-danger transition-colors"
                        title="Eliminar"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};


interface QuestionBankProps {
    questions: Question[];
    onAddQuestion: (q: Question) => void;
    onUpdateQuestion: (q: Question) => void;
    onDeleteQuestion: (id: string) => void;
    onCreateQuiz: (selectedIds: string[]) => void;
}

const QuestionBank: React.FC<QuestionBankProps> = ({ questions, onAddQuestion, onUpdateQuestion, onDeleteQuestion, onCreateQuiz }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | undefined>(undefined);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    
    const [filters, setFilters] = useState({
        texto: '',
        tipo_pregunta: '',
        especialidad: '',
        docente_creador: '',
        dificultad_min: 1,
        dificultad_max: 5,
        min_rating: 0, // 0 means "all", 1-3 filters by rating
    });

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumber = name === 'dificultad_min' || name === 'dificultad_max' || name === 'min_rating';
        setFilters(prev => ({ 
            ...prev, 
            [name]: isNumber ? parseInt(value, 10) : value 
        }));
    };

    const docentes = useMemo(() => [...new Set(questions.map(q => q.docente_creador))], [questions]);
    
    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            const searchText = filters.texto.toLowerCase();
            const textMatch = q.enunciado.toLowerCase().includes(searchText) || 
                              q.codigo_pregunta.toLowerCase().includes(searchText) ||
                              q.docente_creador.toLowerCase().includes(searchText);

            return (
                textMatch &&
                (filters.tipo_pregunta ? q.tipo_pregunta === filters.tipo_pregunta : true) &&
                (filters.especialidad ? q.especialidad === filters.especialidad : true) &&
                (filters.docente_creador ? q.docente_creador === filters.docente_creador : true) &&
                (q.dificultad >= filters.dificultad_min && q.dificultad <= filters.dificultad_max) &&
                (filters.min_rating > 0 ? (q.rating || 0) >= filters.min_rating : true)
            );
        });
    }, [questions, filters]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
    const currentQuestions = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredQuestions, currentPage]);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    const handleEditQuestion = (q: Question) => {
        setEditingQuestion(q);
        setIsFormOpen(true);
    };

    const handleToggleStar = (q: Question, clickedStar: 1|2|3) => {
        const newRating = q.rating === clickedStar ? 0 : clickedStar;
        onUpdateQuestion({ ...q, rating: newRating as 0|1|2|3 });
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingQuestion(undefined);
    };

    const handleToggleSelect = (id: string) => {
        setSelectedQuestionIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAllFiltered = () => {
        if (filteredQuestions.every(q => selectedQuestionIds.has(q.codigo_pregunta))) {
            // Deselect all currently filtered
            setSelectedQuestionIds(prev => {
                const newSet = new Set(prev);
                filteredQuestions.forEach(q => newSet.delete(q.codigo_pregunta));
                return newSet;
            });
        } else {
            // Select all currently filtered
            setSelectedQuestionIds(prev => {
                const newSet = new Set(prev);
                filteredQuestions.forEach(q => newSet.add(q.codigo_pregunta));
                return newSet;
            });
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteConfirm(id);
    };

    const handleConfirmDelete = () => {
        if (deleteConfirm) {
            onDeleteQuestion(deleteConfirm);
            setDeleteConfirm(null);
        }
    };
    
    return (
        <div className="space-y-6 pb-20"> {/* Added padding bottom for floating bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface/30 p-4 rounded-xl border border-secondary/20 backdrop-blur-sm">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Banco de Preguntas</h2>
                    <p className="text-sm text-text-secondary">Gestione y organice el repositorio de evaluaciones ({questions.length})</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors font-medium flex-grow md:flex-grow-0 justify-center ${isFilterOpen ? 'bg-secondary text-white border-secondary' : 'bg-background border-secondary/30 hover:border-primary/50 text-text-secondary'}`}>
                        <FilterIcon />
                        <span>Filtros</span>
                    </button>
                    <button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 transition-all font-semibold flex-grow md:flex-grow-0 justify-center hover:scale-105">
                        <PlusIcon />
                        <span className="hidden sm:inline">Nueva Pregunta</span>
                        <span className="sm:hidden">Nueva</span>
                    </button>
                </div>
            </div>

            {isFilterOpen && (
                 <div className="bg-surface p-5 rounded-xl border border-secondary/20 shadow-lg grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-down">
                    <div className="md:col-span-3">
                         <label className="block text-xs font-semibold text-text-secondary mb-1.5">Búsqueda de texto</label>
                         <input type="text" name="texto" placeholder="Buscar por enunciado, código o docente..." value={filters.texto} onChange={handleFilterChange} className="bg-background border border-secondary/30 rounded-lg p-2.5 w-full focus:ring-2 focus:ring-accent focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Favoritos</label>
                        <select name="min_rating" value={filters.min_rating} onChange={handleFilterChange} className="bg-background border border-secondary/30 rounded-lg p-2.5 w-full font-medium text-yellow-500 focus:ring-2 focus:ring-accent focus:outline-none">
                            <option value="0">⭐ Todos</option>
                            <option value="1">⭐ Favoritos (1+)</option>
                            <option value="2">⭐⭐ Muy Favoritos (2+)</option>
                            <option value="3">⭐⭐⭐ Top (3)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Tipo</label>
                        <select name="tipo_pregunta" value={filters.tipo_pregunta} onChange={handleFilterChange} className="bg-background border border-secondary/30 rounded-lg p-2.5 w-full text-sm focus:ring-2 focus:ring-accent focus:outline-none">
                            <option value="">Todo tipo</option>
                            {TIPOS_PREGUNTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Especialidad</label>
                         <select name="especialidad" value={filters.especialidad} onChange={handleFilterChange} className="bg-background border border-secondary/30 rounded-lg p-2.5 w-full text-sm focus:ring-2 focus:ring-accent focus:outline-none">
                            <option value="">Toda especialidad</option>
                            {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Docente Creador</label>
                        <select name="docente_creador" value={filters.docente_creador} onChange={handleFilterChange} className="bg-background border border-secondary/30 rounded-lg p-2.5 w-full text-sm focus:ring-2 focus:ring-accent focus:outline-none">
                            <option value="">Todo Docente</option>
                            {docentes.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-4 flex items-center gap-4 bg-background/30 p-3 rounded-lg border border-secondary/10">
                        <label className="text-sm font-medium text-text-secondary whitespace-nowrap">Rango de Dificultad:</label>
                        <div className="flex items-center gap-2 flex-grow max-w-xs">
                            <select name="dificultad_min" value={filters.dificultad_min} onChange={handleFilterChange} className="bg-surface border border-secondary/30 rounded p-1.5 text-sm w-full">
                                 {DIFICULTADES.map(d => <option key={`min-${d}`} value={d}>{d}</option>)}
                            </select>
                            <span className="text-text-secondary">-</span>
                            <select name="dificultad_max" value={filters.dificultad_max} onChange={handleFilterChange} className="bg-surface border border-secondary/30 rounded p-1.5 text-sm w-full">
                                 {DIFICULTADES.map(d => <option key={`max-${d}`} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-2 px-2">
                <button onClick={handleSelectAllFiltered} className="text-sm text-accent font-medium hover:underline">
                    {filteredQuestions.every(q => selectedQuestionIds.has(q.codigo_pregunta)) && filteredQuestions.length > 0 ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                </button>
                <span className="text-sm text-text-secondary">
                    {selectedQuestionIds.size} seleccionadas • Mostrando {currentQuestions.length} de {filteredQuestions.length}
                </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentQuestions.map(q => (
                    <QuestionCard 
                        key={q.codigo_pregunta} 
                        question={q} 
                        onEdit={handleEditQuestion}
                        onToggleStar={handleToggleStar}
                        onDelete={handleDeleteClick}
                        isSelected={selectedQuestionIds.has(q.codigo_pregunta)}
                        onToggleSelect={handleToggleSelect}
                    />
                ))}
            </div>

             {/* Pagination Controls */}
             {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-secondary/30 bg-surface hover:bg-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeftIcon />
                    </button>
                    <span className="text-sm font-medium text-text-secondary">
                        Página <span className="text-text-primary">{currentPage}</span> de {totalPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-secondary/30 bg-surface hover:bg-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRightIcon />
                    </button>
                </div>
            )}
            
            {filteredQuestions.length === 0 && (
                <div className="text-center py-12 opacity-50">
                    <p className="text-xl font-semibold">No se encontraron preguntas</p>
                    <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                </div>
            )}

            {isFormOpen && (
                <QuestionForm
                    isOpen={isFormOpen}
                    onClose={handleCloseForm}
                    onSave={(question) => {
                        if (editingQuestion) {
                            onUpdateQuestion(question);
                        } else {
                            onAddQuestion(question);
                        }
                        handleCloseForm();
                    }}
                    initialQuestion={editingQuestion}
                />
            )}

            {/* Floating Action Bar for Creation */}
            {selectedQuestionIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-surface border border-primary/50 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-40 animate-fade-in-up">
                    <span className="font-bold text-text-primary">{selectedQuestionIds.size} preguntas seleccionadas</span>
                    <div className="h-6 w-px bg-secondary/50"></div>
                    <button 
                        onClick={() => onCreateQuiz(Array.from(selectedQuestionIds))}
                        className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <CheckCircleIcon className="h-5 w-5" />
                        Crear Cuestionario
                    </button>
                    <button 
                        onClick={() => setSelectedQuestionIds(new Set())}
                        className="text-text-secondary hover:text-text-primary text-sm ml-2"
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface p-6 rounded-xl shadow-2xl border border-secondary/20 max-w-md w-full text-center">
                        <div className="mx-auto bg-danger/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <TrashIcon className="h-8 w-8 text-danger" />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">¿Eliminar Pregunta?</h3>
                        <p className="text-text-secondary mb-6">
                            Esta acción eliminará permanentemente la pregunta <strong>{deleteConfirm}</strong>. ¿Estás seguro?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button 
                                onClick={() => setDeleteConfirm(null)}
                                className="px-6 py-2 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirmDelete}
                                className="px-6 py-2 rounded-lg bg-danger hover:bg-danger/80 text-white font-bold shadow-lg shadow-danger/20 transition-colors"
                            >
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionBank;
