import React, { useState, useMemo } from 'react';
import { Question, QuestionType } from '../types';
import QuestionForm from './QuestionForm';
import { PlusIcon, FilterIcon, CheckCircleIcon, XCircleIcon, ImageIcon, VideoIcon, LinkIcon } from './icons';
import { ESPECIALIDADES, DIFICULTADES, TIPOS_PREGUNTA } from '../constants';

const QuestionCard: React.FC<{ question: Question }> = ({ question }) => {
    const typeLabel = TIPOS_PREGUNTA.find(t => t.value === question.tipo_pregunta)?.label || 'Desconocido';
    return (
        <div className="bg-surface rounded-lg shadow-lg p-4 border border-secondary/20 hover:border-primary transition-all duration-200 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold bg-primary/20 text-accent px-2 py-1 rounded">{question.codigo_pregunta}</span>
                    <span className="text-xs text-text-secondary">{typeLabel}</span>
                </div>
                <p className="mt-3 text-text-primary">{question.enunciado}</p>
                
                {question.adjuntos.imagenes?.[0] && (
                    <img src={question.adjuntos.imagenes[0]} alt="Adjunto de pregunta" className="mt-3 rounded-lg max-h-40 w-full object-cover" />
                )}

                {question.tipo_pregunta === QuestionType.MultipleChoice && question.alternativas && (
                    <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                        {question.alternativas.map(alt => (
                            <li key={alt.id} className={`flex items-center space-x-2 ${alt.es_correcta ? 'font-bold text-success' : ''}`}>
                               {alt.es_correcta ? <CheckCircleIcon /> : <XCircleIcon />} <span>{alt.id}) {alt.texto}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="mt-4 pt-3 border-t border-secondary/20 text-xs text-text-secondary flex flex-wrap gap-x-2 gap-y-1 items-center justify-between">
                <div>
                    <span><strong>Docente:</strong> {question.docente_creador}</span>
                    <span className="text-primary mx-1">|</span>
                    <span><strong>Especialidad:</strong> {question.especialidad}</span>
                    <span className="text-primary mx-1">|</span>
                    <span><strong>Dificultad:</strong> {question.dificultad}/5</span>
                </div>
                <div className="flex items-center gap-2 text-accent">
                     {(question.adjuntos.imagenes?.length || 0) > 0 && <ImageIcon />}
                     {(question.adjuntos.videos?.length || 0) > 0 && <VideoIcon />}
                     {(question.adjuntos.links?.length || 0) > 0 && <LinkIcon />}
                </div>
            </div>
        </div>
    );
};


const QuestionBank: React.FC<{ questions: Question[], onAddQuestion: (q: Question) => void }> = ({ questions, onAddQuestion }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        texto: '',
        tipo_pregunta: '',
        especialidad: '',
        dificultad_min: 1,
        dificultad_max: 5,
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isDifficulty = name === 'dificultad_min' || name === 'dificultad_max';
        setFilters(prev => ({ 
            ...prev, 
            [name]: isDifficulty ? parseInt(value, 10) : value 
        }));
    };
    
    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            return (
                (q.enunciado.toLowerCase().includes(filters.texto.toLowerCase())) &&
                (filters.tipo_pregunta ? q.tipo_pregunta === filters.tipo_pregunta : true) &&
                (filters.especialidad ? q.especialidad === filters.especialidad : true) &&
                (q.dificultad >= filters.dificultad_min && q.dificultad <= filters.dificultad_max)
            );
        });
    }, [questions, filters]);
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold">Banco de Preguntas ({questions.length})</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                        <FilterIcon />
                        <span className="hidden md:inline">Filtros</span>
                    </button>
                    <button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark transition-colors font-semibold">
                        <PlusIcon />
                        <span className="hidden md:inline">Nueva Pregunta</span>
                    </button>
                </div>
            </div>

            {isFilterOpen && (
                 <div className="bg-surface p-4 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input type="text" name="texto" placeholder="Buscar en enunciado..." value={filters.texto} onChange={handleFilterChange} className="bg-background border border-secondary/30 rounded p-2 w-full md:col-span-4" />
                    <select name="tipo_pregunta" value={filters.tipo_pregunta} onChange={handleFilterChange} className="bg-background border border-secondary/30 rounded p-2 w-full md:col-span-2">
                        <option value="">Todo tipo</option>
                        {TIPOS_PREGUNTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                     <select name="especialidad" value={filters.especialidad} onChange={handleFilterChange} className="bg-background border border-secondary/30 rounded p-2 w-full md:col-span-2">
                        <option value="">Toda especialidad</option>
                        {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <div className="md:col-span-4 flex items-center gap-4">
                        <label className="text-sm font-medium text-text-secondary whitespace-nowrap">Rango de Dificultad:</label>
                        <select name="dificultad_min" value={filters.dificultad_min} onChange={handleFilterChange} className="bg-background border border-secondary/30 rounded p-2 w-full">
                             {DIFICULTADES.map(d => <option key={`min-${d}`} value={d}>{d}</option>)}
                        </select>
                        <span className="text-text-secondary">-</span>
                        <select name="dificultad_max" value={filters.dificultad_max} onChange={handleFilterChange} className="bg-background border border-secondary/30 rounded p-2 w-full">
                             {DIFICULTADES.map(d => <option key={`max-${d}`} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuestions.map(q => <QuestionCard key={q.codigo_pregunta} question={q} />)}
            </div>

            {isFormOpen && (
                <QuestionForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSave={(newQuestion) => {
                        onAddQuestion(newQuestion);
                        setIsFormOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default QuestionBank;