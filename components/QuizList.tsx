
import React, { useState, useMemo, useEffect } from 'react';
import { Quiz, Question, Student } from '../types';
import QuizForm from './QuizForm';
import QuizAssignmentForm from './QuizAssignmentForm';
import { PlayIcon, PlusIcon, AssignUserIcon, DuplicateIcon, FilterIcon, EditIcon, TrashIcon } from './icons';

interface QuizCardProps {
    quiz: Quiz;
    onStart: (id: string) => void;
    onAssign: (quiz: Quiz) => void;
    onDuplicate: (quiz: Quiz) => void;
    onEdit: (quiz: Quiz) => void;
    onDelete: (id: string) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onStart, onAssign, onDuplicate, onEdit, onDelete }) => {
    const isAvailable = new Date(quiz.ventana_disponibilidad.fin) > new Date();
    
    return (
        <div className={`bg-surface rounded-lg shadow-lg p-4 border border-secondary/20 transition-all duration-200 flex flex-col ${!isAvailable ? 'opacity-60' : 'hover:border-primary'}`}>
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">{quiz.titulo}</h3>
                        <p className="text-sm text-text-secondary">{quiz.preguntas.length} pregunta(s) - {quiz.tiempo_limite_minutos} min</p>
                    </div>
                    <span className="text-xs font-semibold bg-primary/20 text-accent px-2 py-1 rounded">{quiz.id_cuestionario}</span>
                </div>
                <p className="mt-2 text-sm text-text-secondary">{quiz.descripcion}</p>
                
                <div className="mt-4 pt-3 border-t border-secondary/20 text-xs text-text-secondary flex flex-wrap gap-x-4 gap-y-2 items-center">
                    <span><strong>Asignatura:</strong> {quiz.asignatura}</span>
                    <span><strong>Docente:</strong> {quiz.docente_creador}</span>
                    <span><strong>Asignados:</strong> {quiz.alumnos_asignados.length}</span>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                 <button onClick={() => onDelete(quiz.id_cuestionario)} className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-danger/10 text-danger hover:bg-danger/20 transition-colors">
                    <TrashIcon /> <span className="hidden sm:inline">Eliminar</span>
                </button>
                 <button onClick={() => onEdit(quiz)} className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-secondary hover:bg-secondary/80 transition-colors">
                    <EditIcon /> <span className="hidden sm:inline">Editar</span>
                </button>
                 <button onClick={() => onDuplicate(quiz)} className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-secondary hover:bg-secondary/80 transition-colors">
                    <DuplicateIcon /> <span className="hidden sm:inline">Duplicar</span>
                </button>
                 <button onClick={() => onAssign(quiz)} className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-secondary hover:bg-secondary/80 transition-colors">
                    <AssignUserIcon /> <span className="hidden sm:inline">Asignar</span>
                </button>
                <button 
                    onClick={() => onStart(quiz.id_cuestionario)} 
                    disabled={!isAvailable}
                    className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-md bg-primary hover:bg-primary-dark font-semibold transition-colors disabled:bg-secondary/50 disabled:cursor-not-allowed"
                >
                    <PlayIcon /> Iniciar
                </button>
            </div>
        </div>
    );
};


interface QuizListProps {
    quizzes: Quiz[];
    onStartQuiz: (quizId: string) => void;
    onAddQuiz: (newQuiz: Quiz) => void;
    onUpdateQuiz: (updatedQuiz: Quiz) => void;
    onDeleteQuiz: (id: string) => void;
    allQuestions: Question[];
    allStudents: Student[];
    onSaveAssignment: (quizId: string, updatedData: Partial<Quiz>) => void;
    initialDraft?: Quiz | null;
    onClearDraft?: () => void;
}

const QuizList: React.FC<QuizListProps> = ({ quizzes, onStartQuiz, onAddQuiz, onUpdateQuiz, onDeleteQuiz, allQuestions, allStudents, onSaveAssignment, initialDraft, onClearDraft }) => {
    const [isQuizFormOpen, setIsQuizFormOpen] = useState(false);
    const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [duplicatingQuiz, setDuplicatingQuiz] = useState<Quiz | null>(null);
    const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    
    // If an initial draft is passed (from QuestionBank), open the form with it
    useEffect(() => {
        if (initialDraft) {
            setEditingQuiz(initialDraft);
            setIsQuizFormOpen(true);
            if (onClearDraft) onClearDraft();
        }
    }, [initialDraft, onClearDraft]);
    
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [filterDocente, setFilterDocente] = useState('');
    const [filterAsignatura, setFilterAsignatura] = useState('');

    const docentes = useMemo(() => [...new Set(quizzes.map(q => q.docente_creador))], [quizzes]);
    const asignaturas = useMemo(() => [...new Set(quizzes.map(q => q.asignatura))], [quizzes]);

    const filteredQuizzes = useMemo(() => {
        return quizzes.filter(quiz => {
            const searchText = filterText.toLowerCase();
            const textMatch = searchText === '' ||
                quiz.titulo.toLowerCase().includes(searchText) ||
                quiz.docente_creador.toLowerCase().includes(searchText) ||
                quiz.asignatura.toLowerCase().includes(searchText);

            const docenteMatch = filterDocente === '' || quiz.docente_creador === filterDocente;
            const asignaturaMatch = filterAsignatura === '' || quiz.asignatura === filterAsignatura;

            return textMatch && docenteMatch && asignaturaMatch;
        });
    }, [quizzes, filterText, filterDocente, filterAsignatura]);


    const handleOpenAssignment = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setIsAssignmentFormOpen(true);
    };

    const handleOpenEdit = (quiz: Quiz) => {
        setEditingQuiz(quiz);
        setDuplicatingQuiz(null);
        setIsQuizFormOpen(true);
    };

    const handleDuplicateQuiz = (quiz: Quiz) => {
        setDuplicatingQuiz(quiz);
        setEditingQuiz(null);
        setIsQuizFormOpen(true);
    };

    const handleCloseForms = () => {
        setIsQuizFormOpen(false);
        setIsAssignmentFormOpen(false);
        setSelectedQuiz(null);
        setDuplicatingQuiz(null);
        setEditingQuiz(null);
    };

    const handleSaveQuiz = (quizData: Quiz) => {
        // Check if we are editing an existing quiz (has ID) or creating a new one (from scratch or from draft)
        // If editingQuiz has an empty ID, it's a draft from the bank, so treat as new
        if (editingQuiz && editingQuiz.id_cuestionario !== "") {
            onUpdateQuiz(quizData);
        } else {
            onAddQuiz(quizData);
        }
        handleCloseForms();
    };

    const handleDeleteClick = (id: string) => {
        setDeleteConfirm(id);
    };

    const handleConfirmDelete = () => {
        if (deleteConfirm) {
            onDeleteQuiz(deleteConfirm);
            setDeleteConfirm(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold">Cuestionarios Disponibles ({filteredQuizzes.length})</h2>
                 <div className="flex items-center gap-2">
                    <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                        <FilterIcon />
                        <span className="hidden md:inline">Filtros</span>
                    </button>
                    <button onClick={() => { setDuplicatingQuiz(null); setEditingQuiz(null); setIsQuizFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark transition-colors font-semibold">
                        <PlusIcon />
                        <span className="hidden md:inline">Crear Cuestionario</span>
                    </button>
                </div>
            </div>

            {isFilterOpen && (
                <div className="bg-surface p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input 
                        type="text" 
                        placeholder="Buscar por título, docente, asignatura..." 
                        value={filterText}
                        onChange={e => setFilterText(e.target.value)}
                        className="w-full bg-background border border-secondary/30 rounded p-2 md:col-span-3" 
                    />
                    <select value={filterDocente} onChange={e => setFilterDocente(e.target.value)} className="w-full bg-background border border-secondary/30 rounded p-2">
                        <option value="">Todo Docente</option>
                        {docentes.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                     <select value={filterAsignatura} onChange={e => setFilterAsignatura(e.target.value)} className="w-full bg-background border border-secondary/30 rounded p-2">
                        <option value="">Toda Asignatura</option>
                        {asignaturas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuizzes.map(q => (
                    <QuizCard 
                        key={q.id_cuestionario} 
                        quiz={q} 
                        onStart={onStartQuiz} 
                        onAssign={handleOpenAssignment} 
                        onDuplicate={handleDuplicateQuiz}
                        onEdit={handleOpenEdit} 
                        onDelete={handleDeleteClick}
                    />
                ))}
            </div>

            {isQuizFormOpen && (
                <QuizForm
                    isOpen={isQuizFormOpen}
                    onClose={handleCloseForms}
                    onSave={handleSaveQuiz}
                    allQuestions={allQuestions}
                    initialData={editingQuiz || duplicatingQuiz}
                    isEditing={!!editingQuiz && editingQuiz.id_cuestionario !== ""}
                />
            )}
            
            {isAssignmentFormOpen && selectedQuiz && (
                <QuizAssignmentForm
                    isOpen={isAssignmentFormOpen}
                    onClose={handleCloseForms}
                    onSave={onSaveAssignment}
                    quiz={selectedQuiz}
                    allStudents={allStudents}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                     <div className="bg-surface p-6 rounded-xl shadow-2xl border border-secondary/20 max-w-md w-full text-center">
                        <div className="mx-auto bg-danger/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <TrashIcon className="h-8 w-8 text-danger" />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">¿Eliminar Cuestionario?</h3>
                        <p className="text-text-secondary mb-6">
                            Esta acción eliminará permanentemente el cuestionario <strong>{deleteConfirm}</strong> y no se puede deshacer.
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

export default QuizList;
