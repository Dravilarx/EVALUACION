
import React, { useState, useMemo, useEffect } from 'react';
import { ChartBarIcon, CheckCircleIcon, UsersIcon, BookOpenIcon, PlusIcon, XCircleIcon, SparklesIcon, EditIcon, TrashIcon } from './icons';
import { COMPETENCIES_LIST, EVALUATION_SCALE } from '../constants';
import { Student, Subject, CompetencyEvaluation } from '../types';
import { StudentService, SubjectService, CompetencyService } from '../services/dataService';
import { generateEvaluationScores } from '../services/geminiService';
import VoiceTextarea from './VoiceTextarea';

interface SurveysModuleProps {
    currentUserId: string;
    initialStudentId?: string;
    initialSubjectId?: string;
    onClearParams?: () => void;
}

const SurveysModule: React.FC<SurveysModuleProps> = ({ currentUserId, initialStudentId, initialSubjectId, onClearParams }) => {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [evaluations, setEvaluations] = useState<CompetencyEvaluation[]>([]);
    
    // Form State
    const [currentEvaluationId, setCurrentEvaluationId] = useState<string | null>(null);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [scores, setScores] = useState<Record<number, number>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [missingItems, setMissingItems] = useState<number[]>([]); // Track missing questions
    
    // Additional comments (not in original mock but good to have)
    const [generalComments, setGeneralComments] = useState('');

    const isAdmin = currentUserId === 'DOCENTE';

    useEffect(() => {
        const loadData = async () => {
            const [stData, subData, evalData] = await Promise.all([
                StudentService.getAll(),
                SubjectService.getAll(),
                CompetencyService.getAll()
            ]);
            setStudents(stData);
            setSubjects(subData);
            setEvaluations(evalData);
        };
        loadData();
    }, []);

    // Handle deep linking from TeachersFolder
    useEffect(() => {
        if (initialStudentId && initialSubjectId && students.length > 0 && subjects.length > 0) {
            handleNewEvaluation(); // Reset form
            setSelectedStudent(initialStudentId);
            setSelectedSubject(initialSubjectId);
            setView('form');
            if(onClearParams) onClearParams();
        }
    }, [initialStudentId, initialSubjectId, students, subjects]);

    // Initialize form based on user role (if not deep linked)
    useEffect(() => {
        if (view === 'form' && !isAdmin && !initialStudentId && !selectedStudent) {
            setSelectedStudent(currentUserId);
        }
    }, [view, isAdmin, currentUserId, initialStudentId]);

    // --- EVOLUTION COMPARISON LOGIC ---
    // Find the previous evaluation for the same student (any subject, latest one before current)
    const previousEvaluation = useMemo(() => {
        if (!selectedStudent) return null;
        
        // Filter evaluations for this student, excluding the one currently being edited (if any)
        const studentEvals = evaluations.filter(e => 
            e.studentId === selectedStudent && 
            e.id !== currentEvaluationId
        );

        if (studentEvals.length === 0) return null;

        // Sort by date descending to find the latest previous one
        return studentEvals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    }, [selectedStudent, evaluations, currentEvaluationId]);


    const handleScoreSelect = (itemId: number, score: number) => {
        setScores(prev => ({
            ...prev,
            [itemId]: score
        }));
        // Remove from missing items if it was there
        setMissingItems(prev => prev.filter(id => id !== itemId));
    };

    const handleAIAutofill = async () => {
        if (!selectedStudent) {
            alert("Seleccione un alumno primero.");
            return;
        }
        setIsAutoFilling(true);
        try {
            const studentName = getStudentName(selectedStudent);
            const aiScores = await generateEvaluationScores('competency', studentName);
            setScores(aiScores);
            setMissingItems([]); // Clear errors
        } catch (error) {
            console.error(error);
            alert("No se pudo autocompletar con IA.");
        } finally {
            setIsAutoFilling(false);
        }
    };

    const average = useMemo(() => {
        const values = Object.values(scores) as number[];
        if (values.length === 0) return 0;
        const sum = values.reduce((a, b) => a + b, 0);
        return sum / values.length;
    }, [scores]);

    const progress = Math.round((Object.keys(scores).length / COMPETENCIES_LIST.length) * 100);

    const getAverageColor = (val: number) => {
        if (val >= 6) return "text-success";
        if (val >= 4) return "text-primary";
        return "text-danger";
    };

    const handleNewEvaluation = () => {
        setCurrentEvaluationId(null);
        setSelectedStudent('');
        setSelectedSubject('');
        setScores({});
        setMissingItems([]);
        setGeneralComments('');
        setView('form');
    };

    const handleEdit = (evaluation: CompetencyEvaluation) => {
        setCurrentEvaluationId(evaluation.id);
        setSelectedStudent(evaluation.studentId);
        setSelectedSubject(evaluation.subjectId);
        setScores(evaluation.scores);
        setMissingItems([]);
        // Mock comments load, assuming they might exist in a real scenario or handled elsewhere
        setGeneralComments(''); 
        setView('form');
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta evaluación?")) {
            try {
                await CompetencyService.delete(id);
                setEvaluations(prev => prev.filter(e => e.id !== id));
            } catch (error) {
                console.error("Error deleting evaluation", error);
            }
        }
    };

    const handleSave = async () => {
        // Reset errors
        setMissingItems([]);

        if (!selectedStudent || !selectedSubject) {
            alert("Debe seleccionar un alumno y una asignatura.");
            return;
        }

        // Check for missing items
        const missing = COMPETENCIES_LIST.filter(item => !scores[item.id]).map(item => item.id);
        if (missing.length > 0) {
            setMissingItems(missing);
            alert(`Faltan ${missing.length} ítem(s) por evaluar. Están marcados en rojo.`);
            return;
        }

        setIsSaving(true);
        
        try {
            const evalData: CompetencyEvaluation = {
                id: currentEvaluationId || `COMP-${Date.now()}`,
                studentId: selectedStudent,
                teacherId: currentUserId, // Records who performed the evaluation
                subjectId: selectedSubject,
                date: new Date().toISOString(),
                scores: scores,
                average: parseFloat(average.toFixed(2))
                // Note: generalComments would be saved here in a real schema update
            };

            if (currentEvaluationId) {
                await CompetencyService.update(evalData);
                setEvaluations(prev => prev.map(e => e.id === currentEvaluationId ? evalData : e));
            } else {
                const saved = await CompetencyService.create(evalData);
                setEvaluations(prev => [saved, ...prev]);
            }
            
            alert("Evaluación registrada exitosamente.");
            setView('list');
            handleNewEvaluation(); // Reset form
        } catch (error) {
            console.error(error);
            alert("Error al guardar.");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredEvaluations = useMemo(() => {
        if (isAdmin) return evaluations;
        return evaluations.filter(e => e.studentId === currentUserId);
    }, [evaluations, isAdmin, currentUserId]);

    const getStudentName = (id: string) => students.find(s => s.id === id)?.name || id;
    const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

    return (
        <div className="space-y-6 animate-fade-in-up pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                        <ChartBarIcon className="h-8 w-8 text-primary" /> Competencias Personales
                    </h2>
                    <p className="text-text-secondary">Registro y seguimiento de habilidades blandas.</p>
                </div>
                
                {view === 'list' && (
                    <button 
                        onClick={handleNewEvaluation}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition-all"
                    >
                        <PlusIcon className="h-5 w-5" /> Nueva Evaluación
                    </button>
                )}
                {view === 'form' && (
                    <button 
                        onClick={() => setView('list')}
                        className="text-text-secondary hover:text-primary font-medium"
                    >
                        Cancelar y Volver
                    </button>
                )}
            </div>

            {view === 'list' && (
                <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-secondary/10 text-text-secondary font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4">Alumno</th>
                                    <th className="p-4">Evaluador</th>
                                    <th className="p-4">Asignatura</th>
                                    <th className="p-4 text-center">Nota Promedio</th>
                                    <th className="p-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary/10">
                                {filteredEvaluations.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-text-secondary">No hay evaluaciones registradas.</td></tr>
                                ) : (
                                    filteredEvaluations.map(ev => (
                                        <tr key={ev.id} className="hover:bg-background/50 group">
                                            <td className="p-4 font-mono text-text-secondary">{new Date(ev.date).toLocaleDateString()}</td>
                                            <td className="p-4 font-bold text-text-primary">{getStudentName(ev.studentId)}</td>
                                            <td className="p-4 text-text-secondary text-xs">
                                                {ev.teacherId === ev.studentId ? <span className="bg-accent/10 text-accent px-2 py-0.5 rounded">Autoevaluación</span> : (ev.teacherId === 'DOCENTE' ? 'Docente Coordinador' : ev.teacherId)}
                                            </td>
                                            <td className="p-4 text-text-secondary">{getSubjectName(ev.subjectId)}</td>
                                            <td className="p-4 text-center">
                                                <span className={`font-bold px-2 py-1 rounded ${getAverageColor(ev.average)} bg-surface border border-secondary/10`}>
                                                    {ev.average.toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(ev)} className="p-1.5 hover:bg-primary/20 rounded text-primary" title="Editar">
                                                        <EditIcon className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(ev.id)} className="p-1.5 hover:bg-danger/20 rounded text-danger" title="Eliminar">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'form' && (
                <div className="space-y-6">
                    {/* Header Selection */}
                    <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/20 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider flex items-center gap-1">
                                <UsersIcon className="h-4 w-4" /> Alumno
                            </label>
                            <select 
                                value={selectedStudent} 
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                className={`w-full bg-background border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary ${!isAdmin ? 'opacity-70 cursor-not-allowed border-secondary/20' : 'border-secondary/30'}`}
                                disabled={!isAdmin || !!initialStudentId} // Lock if passed via props
                            >
                                <option value="">Seleccione Alumno...</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider flex items-center gap-1">
                                <BookOpenIcon className="h-4 w-4" /> Asignatura
                            </label>
                            <select 
                                value={selectedSubject} 
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary"
                                disabled={!!initialSubjectId} // Lock if passed via props
                            >
                                <option value="">Seleccione Asignatura...</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Previous Evaluation Comparison Banner */}
                    {previousEvaluation && (
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-4">
                            <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                                <SparklesIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-purple-800 text-sm">Modo Comparativo Activado</h4>
                                <p className="text-xs text-purple-700 mt-1">
                                    Se muestran marcas grises (<span className="inline-block w-2 h-2 rounded-full bg-gray-300 mx-1"></span>) indicando el puntaje de la evaluación anterior ({new Date(previousEvaluation.date).toLocaleDateString()}). 
                                    Use esto para medir el progreso del residente.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Progress Card */}
                    <div className="flex items-center gap-6 bg-surface border border-secondary/20 p-4 rounded-xl shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-surface/90">
                        <div className="text-right">
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Promedio</p>
                            <p className={`text-3xl font-bold ${getAverageColor(average)}`}>{average.toFixed(2)}</p>
                        </div>
                        <div className="w-px h-10 bg-secondary/20"></div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Completado</p>
                            <p className="text-xl font-bold text-text-primary">{progress}%</p>
                        </div>
                        <div className="flex-grow"></div>
                        
                        <button 
                            onClick={handleAIAutofill}
                            disabled={isAutoFilling || isSaving || !selectedStudent}
                            className="hidden sm:flex items-center gap-2 bg-accent/10 text-accent hover:bg-accent hover:text-white px-4 py-2 rounded-lg font-bold transition-all mr-2 disabled:opacity-50 text-sm"
                        >
                            <SparklesIcon className={`h-4 w-4 ${isAutoFilling ? 'animate-pulse' : ''}`} />
                            {isAutoFilling ? 'Generando...' : 'Autocompletar'}
                        </button>

                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg shadow-lg flex items-center gap-2 disabled:opacity-50 text-sm"
                        >
                            <CheckCircleIcon className="h-5 w-5" /> {isSaving ? "Guardando..." : "Guardar"}
                        </button>
                    </div>

                    {/* Rubric Table */}
                    <div className="bg-surface rounded-xl shadow-md border border-secondary/20 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-secondary/10 border-b border-secondary/20">
                                    <tr>
                                        <th className="p-4 text-left min-w-[300px] text-text-primary font-bold">Criterio / Competencia</th>
                                        {EVALUATION_SCALE.map(s => (
                                            <th key={s.value} className="p-2 text-center min-w-[80px]">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-lg font-bold text-text-primary">{s.value}</span>
                                                    <span className="text-[10px] uppercase text-text-secondary font-medium">{s.label}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary/10">
                                    {COMPETENCIES_LIST.map((item, index) => {
                                        const isMissing = missingItems.includes(item.id);
                                        const previousScore = previousEvaluation?.scores[item.id];

                                        return (
                                            <tr key={item.id} className={`transition-colors ${isMissing ? 'bg-danger/5' : index % 2 === 0 ? 'bg-surface' : 'bg-background/30'}`}>
                                                <td className="p-4 relative">
                                                    {isMissing && <div className="absolute left-0 top-0 bottom-0 w-1 bg-danger"></div>}
                                                    <p className={`font-bold text-base mb-1 ${isMissing ? 'text-danger' : 'text-text-primary'}`}>
                                                        {item.id}. {item.title} {isMissing && <span className="text-xs text-danger ml-2">(Requerido)</span>}
                                                    </p>
                                                    <p className="text-text-secondary text-xs leading-relaxed">{item.description}</p>
                                                </td>
                                                {EVALUATION_SCALE.map(s => {
                                                    const isSelected = scores[item.id] === s.value;
                                                    const isPrevious = previousScore === s.value;
                                                    
                                                    return (
                                                        <td key={s.value} className="p-2 text-center relative">
                                                            <div className="flex items-center justify-center relative w-10 h-10 mx-auto">
                                                                {/* SHADOW INDICATOR (Previous Score) */}
                                                                {isPrevious && !isSelected && (
                                                                    <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-gray-200 opacity-60 flex items-center justify-center border border-gray-300" title="Puntaje anterior">
                                                                        <span className="text-gray-400 text-xs font-bold">{s.value}</span>
                                                                    </div>
                                                                )}

                                                                <button
                                                                    onClick={() => handleScoreSelect(item.id, s.value)}
                                                                    className={`
                                                                        w-10 h-10 rounded-lg border-2 transition-all duration-200 flex items-center justify-center font-bold relative z-10
                                                                        ${isSelected 
                                                                            ? 'bg-primary border-primary text-white scale-110 shadow-lg' 
                                                                            : 'bg-transparent border-secondary/20 text-text-secondary hover:border-primary/50 hover:bg-primary/5'
                                                                        }
                                                                        ${isPrevious && isSelected ? 'ring-4 ring-gray-200' : ''} 
                                                                    `}
                                                                    title={isPrevious ? 'Mantener puntaje anterior' : ''}
                                                                >
                                                                    {isSelected ? <CheckCircleIcon className="h-5 w-5" /> : (isPrevious ? '' : s.value)}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Observations with Voice Dictation */}
                    <div className="bg-surface p-6 rounded-xl border border-secondary/20 space-y-4">
                        <label className="block text-sm font-bold text-text-primary uppercase tracking-wider">
                            Comentarios y Observaciones (Dictado por Voz)
                        </label>
                        <VoiceTextarea 
                            value={generalComments} 
                            onChange={setGeneralComments} 
                            placeholder="Dicte o escriba observaciones adicionales sobre el desempeño del residente..."
                            className="bg-background border-secondary/30"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SurveysModule;
