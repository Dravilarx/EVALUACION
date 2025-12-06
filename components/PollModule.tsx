
import React, { useState, useEffect, useMemo } from 'react';
import { Teacher, Subject, SurveyResult, Student } from '../types';
import { TeacherService, SubjectService, SurveyService, StudentService } from '../services/dataService';
import { FileIcon, CheckCircleIcon, UsersIcon, BookOpenIcon, PlusIcon, FilterIcon, ArrowUpRightIcon, ClockIcon, SparklesIcon } from './icons';

const questions = [
    { id: 5, text: "Las actividades pedagógicas propuestas por el docente permitieron ejercitar las competencias que este programa de formación promueve." },
    { id: 6, text: "El docente desarrolló estrategias que ayudaron a potenciar habilidades de comunicación y trabajo en equipo." },
    { id: 7, text: "El docente promovió la realización de procedimientos clínicos de acuerdo al nivel de conocimientos y competencias adquiridas por el residente, ajustándose a las competencias u objetivos por cumplir en esta asignatura." },
    { id: 8, text: "Las actividades propuestas por el docente permitieron mantener el interés y motivación durante el desarrollo de la asignatura/rotación" },
    { id: 9, text: "Las actividades propuestas por el docente promovieron la reflexión análisis disciplinar" },
    { id: 10, text: "Las actividades propuestas por el docente facilitaron el aprendizaje y fortalecimiento de destrezas técnicas." },
    { id: 11, text: "El docente dominaba las temáticas que desarrolló durante la rotación, utilizando la medicina basada en la evidencia y no sólo la experiencia." },
    { id: 12, text: "El docente verificó constantemente el grado de aprendizaje en cada una de las actividades desarrolladas, entregando retroalimentación constante." },
    { id: 13, text: "El docente tuvo disposición para aclarar dudas y responder respuestas." },
    { id: 14, text: "El docente estuvo disponible y dedicó el tiempo necesario para la realización de distintas actividades y supervisión directa." },
    { id: 15, text: "El docente demostró un trato respetuoso con los residentes, equipo de salud y pacientes durante la rotación" },
    { id: 16, text: "El material de estudio recomendado para la rotación fue pertinente, actualizado y relevante para profundizar el conocimiento de la disciplina." },
    { id: 17, text: "El docente explicó el proceso evacuativo, es decir, con que procedimientos, cuándo se realizarían y sus respectivas ponderaciones." },
    { id: 18, text: "El docente al finalizar la evaluación retro alimenta el desempeño alcanzado, mencionando aspectos positivos y aspectos a mejorar." },
    { id: 19, text: "Las evaluaciones realizadas fueron adecuadas y coherentes con las actividades desarrolladas durante la rotación." },
    { id: 20, text: "El docente calificó considerando los criterios específicos de evaluación que están establecidos para esta rotación" },
    { id: 21, text: "El docente entregó las calificaciones dentro del plazo reglamentario establecido." },
    { id: 22, text: "El docente mantuvo actualizado el archivo personal del residente." },
    { id: 23, text: "El docente incluyó en el archivo personal del residente todas las actividades realizadas y su cumplimiento, las evaluaciones y los trabajos desarrollados durante el transcurso de la rotación." },
    { id: 24, text: "Los recursos (equipamiento, infraestructura, materiales clínicos) utilizados durante la rotación fueron suficientes y adecuados." }
];

const options = ["Siempre", "Algunas veces", "Nunca", "No aplica"];

interface PollModuleProps {
    currentUserId: string;
    onComplete?: () => void;
    initialSurveyId?: string | null;
    onClearInitialSurveyId?: () => void;
}

const PollModule: React.FC<PollModuleProps> = ({ currentUserId, onComplete, initialSurveyId, onClearInitialSurveyId }) => {
    const [view, setView] = useState<'list' | 'form' | 'detail' | 'success'>('list');
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [surveys, setSurveys] = useState<SurveyResult[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [filterText, setFilterText] = useState('');
    const [filterTeacherId, setFilterTeacherId] = useState('');
    const [filterSubjectId, setFilterSubjectId] = useState('');
    const [filterStudentId, setFilterStudentId] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Form State
    const [currentSurveyId, setCurrentSurveyId] = useState<string | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [responses, setResponses] = useState<Record<number, string>>({});
    const [textResponses, setTextResponses] = useState({
        q25: '',
        q26: '',
        q27: ''
    });
    const [isFormLocked, setIsFormLocked] = useState(false); // New state to lock fields for pending surveys
    
    const [selectedSurvey, setSelectedSurvey] = useState<SurveyResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const isAdmin = currentUserId === 'DOCENTE';

    useEffect(() => {
        const loadData = async () => {
            try {
                const [t, s, surveyData, allStudents] = await Promise.all([
                    TeacherService.getAll(), 
                    SubjectService.getAll(),
                    SurveyService.getAll(),
                    StudentService.getAll()
                ]);
                setTeachers(t);
                setSubjects(s);
                setSurveys(surveyData);
                setStudents(allStudents);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Handle deep linking to specific survey (Pending)
    useEffect(() => {
        if (!loading && initialSurveyId && surveys.length > 0) {
            const targetSurvey = surveys.find(s => s.id === initialSurveyId);
            if (targetSurvey) {
                if (targetSurvey.status === 'Pending') {
                    handleFillPendingSurvey(targetSurvey);
                } else {
                    handleViewSurvey(targetSurvey);
                }
            }
            if (onClearInitialSurveyId) onClearInitialSurveyId();
        }
    }, [initialSurveyId, surveys, loading]);

    const handleOptionChange = (questionId: number, option: string) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: option
        }));
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTextResponses(prev => ({ ...prev, [name]: value }));
    };

    // --- DEMO FILL FUNCTION ---
    const handleDemoFill = () => {
        const demoResponses: Record<number, string> = {};
        questions.forEach(q => {
            // Randomly select between "Siempre" and "Generalmente" mostly
            const r = Math.random();
            demoResponses[q.id] = r > 0.3 ? "Siempre" : r > 0.1 ? "Algunas veces" : "Nunca";
        });
        setResponses(demoResponses);
        setTextResponses({
            q25: "Excelente disposición para enseñar y muy buen trato con los pacientes.",
            q26: "A veces las visitas de sala se extienden demasiado.",
            q27: "Mantener las sesiones de revisión bibliográfica."
        });
    };

    const handleSubmit = async () => {
        if (!selectedTeacher || !selectedSubject) {
            alert("Error: Debe estar seleccionado un docente y una asignatura.");
            return;
        }

        const answeredCount = Object.keys(responses).length;
        if (answeredCount < questions.length) {
            alert(`Por favor responda todas las preguntas (${answeredCount} de ${questions.length}).`);
            return;
        }

        setIsSaving(true);

        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));

            const surveyData: SurveyResult = {
                id: currentSurveyId || `SURV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                studentId: currentUserId,
                teacherId: selectedTeacher,
                subjectId: selectedSubject,
                date: new Date().toISOString(),
                status: 'Completed', // Mark as completed
                responses: responses,
                textResponses: textResponses
            };

            if (currentSurveyId) {
                await SurveyService.update(surveyData);
                setSurveys(prev => prev.map(s => s.id === currentSurveyId ? surveyData : s));
            } else {
                await SurveyService.create(surveyData);
                setSurveys(prev => [surveyData, ...prev]);
            }

            // Show success view instead of alert
            setView('success');

            // Reset Form Data
            setResponses({});
            setTextResponses({ q25: '', q26: '', q27: '' });
            setSelectedTeacher('');
            setSelectedSubject('');
            setCurrentSurveyId(null);
            setIsFormLocked(false);
            
            // Auto navigate back after delay
            setTimeout(() => {
                if (onComplete) onComplete();
                setView('list');
            }, 2000);

        } catch (error) {
            console.error("Error crítico al enviar encuesta:", error);
            alert("Ocurrió un error al procesar la encuesta. Por favor intente nuevamente.");
            setIsSaving(false); // Only reset saving if error, otherwise success view takes over
        }
    };

    const handleNewSurvey = () => {
        setSelectedTeacher('');
        setSelectedSubject('');
        setResponses({});
        setTextResponses({ q25: '', q26: '', q27: '' });
        setCurrentSurveyId(null);
        setIsFormLocked(false);
        setView('form');
    };

    const handleFillPendingSurvey = (survey: SurveyResult) => {
        setSelectedTeacher(survey.teacherId);
        setSelectedSubject(survey.subjectId);
        setCurrentSurveyId(survey.id);
        setResponses(survey.responses || {});
        setTextResponses(survey.textResponses || { q25: '', q26: '', q27: '' });
        setIsFormLocked(true); // Lock fields so they match the Acta
        setView('form');
    };

    const handleViewSurvey = (survey: SurveyResult) => {
        setSelectedSurvey(survey);
        setView('detail');
    };

    const getStudentName = (id: string) => students.find(s => s.id === id)?.name || id;
    const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || id;
    const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

    // Filter Logic
    const { pendingSurveys, completedSurveys } = useMemo(() => {
        let data = surveys;

        if (!isAdmin) {
            data = data.filter(s => s.studentId === currentUserId);
        }

        const pending = data.filter(s => s.status === 'Pending');
        let completed = data.filter(s => s.status !== 'Pending'); 

        if (filterText) {
            const lower = filterText.toLowerCase();
            completed = completed.filter(s => {
                const tName = getTeacherName(s.teacherId).toLowerCase();
                const subName = getSubjectName(s.subjectId).toLowerCase();
                const stName = getStudentName(s.studentId).toLowerCase();
                return tName.includes(lower) || subName.includes(lower) || stName.includes(lower);
            });
        }

        if (filterTeacherId) completed = completed.filter(s => s.teacherId === filterTeacherId);
        if (filterSubjectId) completed = completed.filter(s => s.subjectId === filterSubjectId);
        if (filterStudentId && isAdmin) completed = completed.filter(s => s.studentId === filterStudentId);

        return { pendingSurveys: pending, completedSurveys: completed };
    }, [surveys, currentUserId, isAdmin, filterText, filterTeacherId, filterSubjectId, filterStudentId, teachers, subjects, students]);

    if (loading) return <div className="p-8 text-center text-text-secondary">Cargando encuesta...</div>;

    if (view === 'success') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in-up">
                <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6">
                    <CheckCircleIcon className="h-16 w-16 text-success" />
                </div>
                <h3 className="text-3xl font-bold text-text-primary mb-2">¡Encuesta Enviada!</h3>
                <p className="text-text-secondary text-center max-w-md">
                    Tus respuestas han sido registradas correctamente de forma anónima.
                </p>
                <div className="mt-8 w-64 bg-secondary/10 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-success animate-progress-indeterminate"></div>
                </div>
                <p className="text-xs text-text-secondary mt-2">Redirigiendo...</p>
            </div>
        );
    }

    if (view === 'list') {
        return (
            <div className="space-y-6 animate-fade-in-up pb-20">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                            <FileIcon className="h-8 w-8 text-primary" /> Historial de Encuestas
                        </h2>
                        <p className="text-text-secondary">Repositorio de evaluaciones docentes realizadas.</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all border ${showFilters ? 'bg-secondary text-white border-secondary' : 'bg-background border-secondary/30 text-text-secondary'}`}
                        >
                            <FilterIcon className="h-5 w-5" /> Filtros
                        </button>
                        <button 
                            onClick={handleNewSurvey}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition-all"
                        >
                            <PlusIcon className="h-5 w-5" /> Nueva Encuesta
                        </button>
                    </div>
                </div>

                {/* Pending Surveys Section */}
                {!isAdmin && pendingSurveys.length > 0 && (
                    <div className="bg-warning/10 border border-warning/30 rounded-xl p-6 shadow-sm mb-6">
                        <h3 className="font-bold text-lg text-warning flex items-center gap-2 mb-4">
                            <ClockIcon className="h-5 w-5" /> Evaluaciones Pendientes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingSurveys.map(survey => (
                                <div key={survey.id} className="bg-surface p-4 rounded-lg shadow border-l-4 border-warning flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-text-primary">{getTeacherName(survey.teacherId)}</p>
                                        <p className="text-sm text-text-secondary">{getSubjectName(survey.subjectId)}</p>
                                        <p className="text-xs text-text-secondary mt-1">Generada el: {new Date(survey.date).toLocaleDateString()}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleFillPendingSurvey(survey)}
                                        className="bg-warning hover:bg-warning-dark text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2"
                                    >
                                        Evaluar Ahora <ArrowUpRightIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {showFilters && (
                    <div className="bg-surface p-4 rounded-xl border border-secondary/20 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-down">
                        <div className="md:col-span-4">
                            <input 
                                type="text" 
                                placeholder="Buscar por texto..." 
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="w-full bg-background border border-secondary/30 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <select 
                                value={filterTeacherId} 
                                onChange={(e) => setFilterTeacherId(e.target.value)}
                                className="w-full bg-background border border-secondary/30 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Todos los Docentes</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <select 
                                value={filterSubjectId} 
                                onChange={(e) => setFilterSubjectId(e.target.value)}
                                className="w-full bg-background border border-secondary/30 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Todas las Asignaturas</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        {isAdmin && (
                            <div>
                                <select 
                                    value={filterStudentId} 
                                    onChange={(e) => setFilterStudentId(e.target.value)}
                                    className="w-full bg-background border border-secondary/30 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Todos los Alumnos</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="flex items-center justify-end md:col-span-1">
                            <button 
                                onClick={() => {
                                    setFilterText('');
                                    setFilterTeacherId('');
                                    setFilterSubjectId('');
                                    setFilterStudentId('');
                                }}
                                className="text-sm text-text-secondary hover:text-danger underline"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                    {completedSurveys.length === 0 ? (
                        <div className="p-12 text-center text-text-secondary">
                            <FileIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No hay encuestas completadas.</p>
                            <p className="text-sm">Las encuestas enviadas aparecerán aquí.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-secondary/10 text-text-secondary font-bold uppercase text-xs">
                                    <tr>
                                        <th className="p-4">Fecha</th>
                                        <th className="p-4">Docente Evaluado</th>
                                        <th className="p-4">Asignatura</th>
                                        {isAdmin && <th className="p-4">Alumno</th>}
                                        <th className="p-4 text-center">Estado</th>
                                        <th className="p-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary/10">
                                    {completedSurveys.map(survey => {
                                        return (
                                            <tr key={survey.id} className="hover:bg-background/50">
                                                <td className="p-4 font-mono text-text-secondary">
                                                    {new Date(survey.date).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 font-bold text-text-primary">{getTeacherName(survey.teacherId)}</td>
                                                <td className="p-4 text-text-secondary">{getSubjectName(survey.subjectId)}</td>
                                                {isAdmin && <td className="p-4 text-text-secondary">{getStudentName(survey.studentId)}</td>}
                                                <td className="p-4 text-center">
                                                    <span className="flex items-center justify-center gap-1 text-success font-bold text-xs">
                                                        <CheckCircleIcon className="h-4 w-4" /> Enviada
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button 
                                                        onClick={() => handleViewSurvey(survey)}
                                                        className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors text-xs font-bold flex items-center justify-center gap-1 mx-auto"
                                                    >
                                                        <ArrowUpRightIcon className="h-3 w-3" /> Ver Detalle
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'detail' && selectedSurvey) {
        return (
            <div className="space-y-8 animate-fade-in-up pb-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className="p-2 hover:bg-secondary/10 rounded-full transition-colors">
                        <ArrowUpRightIcon className="h-5 w-5 transform rotate-180" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold text-text-primary">Detalle de Encuesta</h2>
                        <p className="text-text-secondary">Enviada el {new Date(selectedSurvey.date).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/20 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <span className="text-xs font-bold text-text-secondary uppercase">Docente</span>
                        <p className="font-bold text-lg">{getTeacherName(selectedSurvey.teacherId)}</p>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-text-secondary uppercase">Asignatura</span>
                        <p className="font-bold text-lg">{getSubjectName(selectedSurvey.subjectId)}</p>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-text-secondary uppercase">Realizada Por</span>
                        <p className="font-bold text-lg">{getStudentName(selectedSurvey.studentId)}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {questions.map((q, index) => (
                        <div key={q.id} className="bg-surface p-4 rounded-xl border border-secondary/20 opacity-80">
                            <p className="font-medium text-text-primary mb-2 flex gap-3">
                                <span className="font-bold text-secondary bg-secondary/10 w-6 h-6 rounded flex items-center justify-center text-xs flex-shrink-0">{index + 1}</span>
                                {q.text}
                            </p>
                            <div className="ml-9">
                                <span className="inline-block bg-primary/10 text-primary font-bold px-3 py-1 rounded text-sm">
                                    {selectedSurvey.responses[q.id] || "No respondida"}
                                </span>
                            </div>
                        </div>
                    ))}

                    <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/20 space-y-6">
                        <h3 className="font-bold text-lg text-accent border-b border-secondary/20 pb-2">Comentarios Adicionales</h3>
                        <div>
                            <p className="font-bold text-sm text-text-primary mb-1">25. Fortalezas</p>
                            <p className="p-3 bg-background rounded-lg border border-secondary/20 text-sm italic">{selectedSurvey.textResponses.q25 || "Sin comentarios."}</p>
                        </div>
                        <div>
                            <p className="font-bold text-sm text-text-primary mb-1">26. Debilidades</p>
                            <p className="p-3 bg-background rounded-lg border border-secondary/20 text-sm italic">{selectedSurvey.textResponses.q26 || "Sin comentarios."}</p>
                        </div>
                        <div>
                            <p className="font-bold text-sm text-text-primary mb-1">27. Sugerencias</p>
                            <p className="p-3 bg-background rounded-lg border border-secondary/20 text-sm italic">{selectedSurvey.textResponses.q27 || "Sin comentarios."}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // FORM VIEW (NEW OR PENDING)
    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                        <FileIcon className="h-8 w-8 text-primary" /> Encuesta de Evaluación Docente
                    </h2>
                    <p className="text-text-secondary">Instrumento para evaluar el desempeño docente en rotaciones clínicas.</p>
                </div>
                <div className="flex gap-4">
                    {/* DEMO BUTTON FOR PETER PARKER OR ANYONE */}
                    <button 
                        onClick={handleDemoFill}
                        className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-2 rounded-lg font-bold flex items-center gap-1 transition-colors border border-purple-200"
                        title="Rellenar automáticamente para pruebas"
                    >
                        <SparklesIcon className="h-4 w-4" /> Demo Fill
                    </button>
                    <button onClick={() => setView('list')} className="text-sm text-text-secondary hover:text-primary font-medium">
                        &larr; Volver al Historial
                    </button>
                </div>
            </div>

            <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/20 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider flex items-center gap-1">
                        <UsersIcon className="h-4 w-4" /> Docente a Evaluar
                    </label>
                    <select 
                        value={selectedTeacher} 
                        onChange={(e) => setSelectedTeacher(e.target.value)}
                        className={`w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary ${isFormLocked ? 'opacity-70 cursor-not-allowed bg-secondary/10' : ''}`}
                        disabled={isFormLocked}
                    >
                        <option value="">Seleccione Docente...</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wider flex items-center gap-1">
                        <BookOpenIcon className="h-4 w-4" /> Asignatura / Rotación
                    </label>
                     <select 
                        value={selectedSubject} 
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className={`w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary ${isFormLocked ? 'opacity-70 cursor-not-allowed bg-secondary/10' : ''}`}
                        disabled={isFormLocked}
                    >
                        <option value="">Seleccione Asignatura...</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-8">
                {questions.map((q, index) => (
                    <div key={q.id} className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/10 hover:border-secondary/30 transition-colors">
                        <p className="font-medium text-text-primary mb-4 flex gap-3">
                            <span className="font-bold text-secondary bg-secondary/10 w-6 h-6 rounded flex items-center justify-center text-xs flex-shrink-0">{index + 1}</span>
                            {q.text}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 ml-9">
                            {options.map((opt) => (
                                <label key={opt} className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${responses[q.id] === opt ? 'bg-primary text-white border-primary shadow-md' : 'bg-background hover:bg-secondary/10 border-secondary/20 text-text-secondary'}`}>
                                    <input 
                                        type="radio" 
                                        name={`q-${q.id}`} 
                                        value={opt} 
                                        checked={responses[q.id] === opt}
                                        onChange={() => handleOptionChange(q.id, opt)}
                                        className="hidden" 
                                    />
                                    <span className="text-sm font-semibold">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/20 space-y-6">
                    <h3 className="font-bold text-lg text-accent border-b border-secondary/20 pb-2">Comentarios Adicionales</h3>
                    
                    <div>
                        <label className="font-bold text-sm text-text-primary block mb-2">25. Comente las fortalezas del docente en la rotación</label>
                        <textarea name="q25" value={textResponses.q25} onChange={handleTextChange} className="w-full p-3 bg-background border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary outline-none" rows={3}></textarea>
                    </div>

                    <div>
                        <label className="font-bold text-sm text-text-primary block mb-2">26. Comente las debilidades del docente en la rotación</label>
                        <textarea name="q26" value={textResponses.q26} onChange={handleTextChange} className="w-full p-3 bg-background border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary outline-none" rows={3}></textarea>
                    </div>

                    <div>
                        <label className="font-bold text-sm text-text-primary block mb-2">27. Sugerencias</label>
                        <textarea name="q27" value={textResponses.q27} onChange={handleTextChange} className="w-full p-3 bg-background border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary outline-none" rows={3}></textarea>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 pb-20">
                <button 
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                >
                    {isSaving ? <ArrowUpRightIcon className="animate-spin h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                    {isSaving ? "Enviando..." : "Enviar Encuesta"}
                </button>
            </div>
        </div>
    );
};

export default PollModule;
