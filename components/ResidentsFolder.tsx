
import React, { useState, useEffect, useMemo } from 'react';
import { Student, Annotation, Activity, Subject, Quiz, Attempt, Acta, Teacher, SurveyResult, CompetencyEvaluation, PresentationEvaluation, TimelineEvent, AppDocument } from '../types';
import { StudentService, AnnotationService, ActivityService, SubjectService, QuizService, AttemptService, ActaService, TeacherService, SurveyService, CompetencyService, PresentationService, DocumentService } from '../services/dataService';
import { AcademicIcon, UsersIcon, ThumbUpIcon, ThumbDownIcon, ChatBubbleLeftRightIcon, GlobeIcon, CheckCircleIcon, XCircleIcon, ClipboardCheckIcon, ClockIcon, PlayIcon, DocumentTextIcon, FileIcon, ArrowUpRightIcon, BellIcon, ChartBarIcon, TableIcon, UploadIcon, DownloadIcon } from './icons';
import { getGradeColor, calculateGrade } from '../utils';
import ActasTab from './ActasTab';

interface ResidentsFolderProps {
    currentUserId: string;
    onNavigateToPoll: (processId: string) => void;
    onGoToEvaluations?: () => void;
    onStartQuiz: (quizId: string) => void;
}

const ResidentsFolder: React.FC<ResidentsFolderProps> = ({ currentUserId, onNavigateToPoll, onStartQuiz }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    
    // Data States
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [actas, setActas] = useState<Acta[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [surveys, setSurveys] = useState<SurveyResult[]>([]);
    const [competencies, setCompetencies] = useState<CompetencyEvaluation[]>([]);
    const [presentations, setPresentations] = useState<PresentationEvaluation[]>([]);
    
    // Mock Data for new features (since we don't have endpoints yet)
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [documents, setDocuments] = useState<AppDocument[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'annotations' | 'activities' | 'grades' | 'timeline' | 'documents' | 'actas_view'>('annotations');
    
    useEffect(() => {
        const loadData = async () => {
            const [stData, subData, quizData, attemptData, actaData, teacherData, surveyData, compData, presData] = await Promise.all([
                StudentService.getAll(),
                SubjectService.getAll(),
                QuizService.getAll(),
                AttemptService.getAll(),
                ActaService.getAll(),
                TeacherService.getAll(),
                SurveyService.getAll(),
                CompetencyService.getAll(),
                PresentationService.getAll()
            ]);
            setStudents(stData);
            setSubjects(subData);
            setQuizzes(quizData);
            setAttempts(attemptData);
            setActas(actaData);
            setTeachers(teacherData);
            setSurveys(surveyData);
            setCompetencies(compData);
            setPresentations(presData);
            
            // If current user is a resident, auto-select them
            if (currentUserId !== 'DOCENTE') {
                const me = stData.find(s => s.id === currentUserId);
                if (me) setSelectedStudent(me);
            }

            setLoading(false);
        };
        loadData();
    }, [currentUserId]);

    useEffect(() => {
        const loadDetails = async () => {
            if (selectedStudent) {
                const [notes, acts, docs] = await Promise.all([
                    AnnotationService.getByTarget(selectedStudent.id),
                    ActivityService.getByParticipant(selectedStudent.id),
                    DocumentService.getByOwner(selectedStudent.id) // Fetch specific docs
                ]);
                setAnnotations(notes);
                setActivities(acts);
                setDocuments(docs);

                // Generate Mock Timeline
                const admissionYear = new Date(selectedStudent.admission_date).getFullYear();
                const mockTimeline: TimelineEvent[] = [
                    { id: '1', date: selectedStudent.admission_date, title: 'Ingreso al Programa', description: 'Inicio de residencia en Radiología', type: 'Administrative', status: 'Completed' },
                    { id: '2', date: `${admissionYear}-07-15`, title: 'Examen Módulo Tórax', description: 'Aprobado con distinción', type: 'Academic', status: 'Completed' },
                    { id: '3', date: `${admissionYear}-12-20`, title: 'Evaluación Anual R1', description: 'Promoción a segundo año', type: 'Milestone', status: 'Completed' },
                    { id: '4', date: `${admissionYear + 1}-06-10`, title: 'Rotación Neurorradiología', description: 'En curso actualmente', type: 'Academic', status: 'Pending' },
                    { id: '5', date: `${admissionYear + 3}-03-01`, title: 'Examen de Título', description: 'Fecha estimada de egreso', type: 'Milestone', status: 'Future' },
                ];
                setTimeline(mockTimeline);
            }
        };
        loadDetails();
    }, [selectedStudent]);

    // --- Derived Data & Calculations ---

    const studentQuizzes = selectedStudent 
        ? quizzes.filter(q => q.alumnos_asignados.includes(selectedStudent.id))
        : [];

    const studentActas = selectedStudent
        ? actas.filter(a => a.studentId === selectedStudent.id)
        : [];

    const studentSurveys = selectedStudent
        ? surveys.filter(s => s.studentId === selectedStudent.id)
        : [];

    // Pending Items
    const pendingQuizzes = studentQuizzes.filter(q => {
        const attempt = attempts.find(a => a.id_cuestionario === q.id_cuestionario && a.alumno_id === selectedStudent?.id);
        const isCompleted = attempt?.estado === 'entregado' || attempt?.estado === 'pendiente_revision';
        const isExpired = new Date(q.ventana_disponibilidad.fin) < new Date();
        return !isCompleted && !isExpired;
    });

    const pendingActas = studentActas.filter(a => a.status === 'Pendiente');
    
    const pendingSurveys = studentSurveys.filter(s => s.status === 'Pending');

    const totalPending = pendingQuizzes.length + pendingActas.length + pendingSurveys.length;

    // Grade Calculation Logic
    const gradeSummary = useMemo(() => {
        if (!selectedStudent) return { rows: [], generalAverage: 0 };

        const rows = subjects.map(subject => {
            // 1. Written (60%)
            const subjectQuizzes = quizzes.filter(q => 
                q.asignatura.trim().toLowerCase() === subject.name.trim().toLowerCase() || 
                q.asignatura === "Interdisciplinario"
            );
            
            let writtenSum = 0;
            let writtenCount = 0;
            subjectQuizzes.forEach(quiz => {
                const studentAttempts = attempts.filter(a => a.id_cuestionario === quiz.id_cuestionario && a.alumno_id === selectedStudent.id);
                if (studentAttempts.length > 0) {
                    const bestAttempt = studentAttempts.reduce((prev, current) => (prev.nota || 0) > (current.nota || 0) ? prev : current);
                    if (bestAttempt.nota !== undefined) {
                        writtenSum += bestAttempt.nota;
                        writtenCount++;
                    }
                }
            });
            const writtenGrade = writtenCount > 0 ? writtenSum / writtenCount : null;

            // 2. Competency (30%)
            const studentCompetencies = competencies.filter(c => c.studentId === selectedStudent.id && c.subjectId === subject.id);
            let compSum = 0;
            studentCompetencies.forEach(c => compSum += c.average);
            const competencyGrade = studentCompetencies.length > 0 ? compSum / studentCompetencies.length : null;

            // 3. Presentation (10%)
            const studentPresentations = presentations.filter(p => p.studentId === selectedStudent.id && p.subjectId === subject.id);
            let presSum = 0;
            studentPresentations.forEach(p => presSum += p.average);
            const presentationGrade = studentPresentations.length > 0 ? presSum / studentPresentations.length : null;

            // Final
            let finalGrade = null;
            if (writtenGrade !== null || competencyGrade !== null || presentationGrade !== null) {
                let weightedSum = 0;
                let totalWeight = 0;
                if (writtenGrade !== null) { weightedSum += writtenGrade * 0.6; totalWeight += 0.6; }
                if (competencyGrade !== null) { weightedSum += competencyGrade * 0.3; totalWeight += 0.3; }
                if (presentationGrade !== null) { weightedSum += presentationGrade * 0.1; totalWeight += 0.1; }
                if (totalWeight > 0) finalGrade = weightedSum / totalWeight; 
            }

            return {
                subjectName: subject.name,
                writtenGrade,
                competencyGrade,
                presentationGrade,
                finalGrade
            };
        });

        // Calculate General Average from rows that have a final grade
        const validRows = rows.filter(r => r.finalGrade !== null);
        const generalAverage = validRows.length > 0 
            ? validRows.reduce((sum, r) => sum + (r.finalGrade || 0), 0) / validRows.length
            : 0;

        return { rows, generalAverage };
    }, [selectedStudent, subjects, quizzes, attempts, competencies, presentations]);

    // Risk Calculation
    const riskStatus = useMemo(() => {
        if (!selectedStudent || gradeSummary.generalAverage === 0) return { color: 'bg-secondary', label: 'Sin Datos' };
        
        const avg = gradeSummary.generalAverage;
        const negativeNotes = annotations.filter(a => a.type === 'Negative').length;
        
        // Logic: Red if < 4.0 OR > 2 Negative notes
        if (avg < 4.0 || negativeNotes > 2) return { color: 'bg-danger', label: 'Riesgo Alto' };
        // Logic: Yellow if < 5.0 OR 1-2 Negative notes
        if (avg < 5.0 || negativeNotes > 0) return { color: 'bg-warning', label: 'Riesgo Medio' };
        
        return { color: 'bg-success', label: 'Riesgo Bajo' };
    }, [gradeSummary, annotations, selectedStudent]);


    const handleUpdateActa = (updatedActa: Acta) => {
        setActas(prev => prev.map(a => a.id === updatedActa.id ? updatedActa : a));
    };

    const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || id;
    const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-100px)] animate-fade-in-up">
            
            {/* Top Selection Panel - Only show if user is DOCENTE */}
            {currentUserId === 'DOCENTE' && (
                <div className="w-full bg-surface rounded-xl shadow-sm border border-secondary/20 p-4 flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <UsersIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">Carpeta Académica</h2>
                            <p className="text-sm text-text-secondary">Seleccione un residente para gestionar su expediente</p>
                        </div>
                    </div>
                    
                    <div className="w-full md:w-80">
                        <select
                            className="w-full p-2.5 bg-background border border-secondary/30 rounded-lg outline-none focus:ring-2 focus:ring-primary text-text-primary shadow-sm"
                            value={selectedStudent?.id || ''}
                            onChange={(e) => {
                                const student = students.find(s => s.id === e.target.value);
                                setSelectedStudent(student || null);
                            }}
                        >
                            <option value="">-- Seleccionar Residente --</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.level})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Main Content - Full Width Below */}
            <div className={`w-full flex-grow bg-surface rounded-xl shadow-sm border border-secondary/20 flex flex-col overflow-hidden relative`}>
                {selectedStudent ? (
                    <div className="flex flex-col h-full">
                        {/* Header Profile with Big Average & Risk Semaphore */}
                        <div className="p-6 border-b border-secondary/20 bg-gradient-to-r from-primary/5 to-transparent">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                                            {selectedStudent.photo_url ? <img src={selectedStudent.photo_url} className="w-full h-full object-cover" /> : <AcademicIcon className="h-10 w-10 text-primary"/>}
                                        </div>
                                        {/* Risk Semaphore Badge */}
                                        <div 
                                            className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${riskStatus.color} shadow-md flex items-center justify-center`}
                                            title={`Estado: ${riskStatus.label}`}
                                        >
                                            <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-text-primary">{selectedStudent.name}</h2>
                                        <p className="text-text-secondary">{selectedStudent.id} • {selectedStudent.course}</p>
                                        <div className="flex gap-2 mt-2 items-center">
                                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">{selectedStudent.level}</span>
                                            <span className="bg-secondary/10 text-text-secondary px-2 py-0.5 rounded text-xs">{selectedStudent.email_ua}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${riskStatus.color} opacity-90`}>{riskStatus.label}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Big Average Display */}
                                <div className="flex flex-col items-end md:border-l md:border-secondary/20 md:pl-8">
                                    <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">Promedio General</span>
                                    <div className={`text-5xl font-extrabold ${getGradeColor(gradeSummary.generalAverage)}`}>
                                        {gradeSummary.generalAverage > 0 ? gradeSummary.generalAverage.toFixed(1) : '-'}
                                    </div>
                                    <span className="text-xs text-text-secondary">Ponderado actual</span>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-6 mt-8 border-b border-secondary/10 overflow-x-auto">
                                <button 
                                    onClick={() => setActiveTab('annotations')}
                                    className={`pb-3 px-2 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'annotations' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    <ChatBubbleLeftRightIcon className="h-4 w-4" /> Hoja de Vida
                                </button>
                                <button 
                                    onClick={() => setActiveTab('timeline')}
                                    className={`pb-3 px-2 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'timeline' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    <ClockIcon className="h-4 w-4" /> Trayectoria
                                </button>
                                <button 
                                    onClick={() => setActiveTab('activities')}
                                    className={`pb-3 px-2 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'activities' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    <GlobeIcon className="h-4 w-4" /> Actividades
                                </button>
                                <button 
                                    onClick={() => setActiveTab('grades')}
                                    className={`pb-3 px-2 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'grades' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    <TableIcon className="h-4 w-4" /> Calificaciones
                                </button>
                                <button 
                                    onClick={() => setActiveTab('documents')}
                                    className={`pb-3 px-2 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'documents' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    <FileIcon className="h-4 w-4" /> Documentos
                                </button>
                                {activeTab === 'actas_view' && (
                                    <button 
                                        className="pb-3 px-2 text-sm font-bold transition-colors border-b-2 border-warning text-warning whitespace-nowrap flex items-center gap-2"
                                    >
                                        <DocumentTextIcon className="h-4 w-4" /> Actas (Firma)
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content Area - 2 Columns */}
                        <div className="flex-grow overflow-hidden bg-background/30 flex flex-col lg:flex-row">
                            
                            {/* LEFT COLUMN: Main Content (70%) */}
                            <div className="flex-grow overflow-y-auto p-6 lg:w-[70%] border-r border-secondary/20">
                                
                                {/* Annotations Tab (Hoja de Vida) */}
                                {activeTab === 'annotations' && (
                                    <div className="animate-fade-in-up">
                                        <h3 className="font-bold text-lg text-text-primary mb-6 flex items-center gap-2">
                                            <ChatBubbleLeftRightIcon className="h-5 w-5 text-accent" /> Anotaciones y Observaciones
                                        </h3>
                                        
                                        {annotations.length === 0 ? (
                                            <div className="text-center p-8 border-2 border-dashed border-secondary/20 rounded-xl">
                                                <p className="text-text-secondary">No hay anotaciones registradas en la hoja de vida.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-secondary/20 ml-2">
                                                {annotations.map(note => (
                                                    <div key={note.id} className="relative pl-10">
                                                        <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-surface ${note.type === 'Positive' ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                                                            {note.type === 'Positive' ? <ThumbUpIcon className="h-4 w-4" /> : <ThumbDownIcon className="h-4 w-4" />}
                                                        </div>
                                                        <div className="bg-surface p-5 rounded-xl shadow-sm border border-secondary/20">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${note.type === 'Positive' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                                    {note.type === 'Positive' ? 'Anotación Positiva' : 'Anotación Negativa'}
                                                                </span>
                                                                <span className="text-xs text-text-secondary">{new Date(note.date).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-sm text-text-primary mb-3 leading-relaxed">"{note.content}"</p>
                                                            <div className="flex items-center gap-2 pt-2 border-t border-secondary/10">
                                                                <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] text-text-secondary font-bold">
                                                                    {note.authorId.charAt(0)}
                                                                </div>
                                                                <p className="text-xs text-text-secondary italic">Registrado por: {note.authorId}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Timeline Tab */}
                                {activeTab === 'timeline' && (
                                    <div className="animate-fade-in-up">
                                        <h3 className="font-bold text-lg text-text-primary mb-6 flex items-center gap-2">
                                            <ClockIcon className="h-5 w-5 text-accent" /> Línea de Tiempo Académica
                                        </h3>
                                        <div className="space-y-0 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-secondary/20">
                                            {timeline.map((event) => (
                                                <div key={event.id} className="relative pl-16 pb-8 group">
                                                    {/* Timeline Dot */}
                                                    <div className={`absolute left-4 top-1 -ml-1.5 w-5 h-5 rounded-full border-4 border-surface shadow-sm z-10 
                                                        ${event.status === 'Completed' ? 'bg-success' : event.status === 'Pending' ? 'bg-warning animate-pulse' : 'bg-secondary/30'}`}>
                                                    </div>
                                                    
                                                    {/* Card */}
                                                    <div className={`p-4 rounded-xl border transition-all hover:shadow-md 
                                                        ${event.status === 'Future' ? 'bg-surface/50 border-dashed border-secondary/30 opacity-70' : 'bg-surface border-secondary/20'}`}>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="font-bold text-text-primary">{event.title}</h4>
                                                            <span className="text-xs font-mono text-text-secondary">{new Date(event.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-sm text-text-secondary mb-2">{event.description}</p>
                                                        <div className="flex gap-2">
                                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-secondary/10 text-text-secondary">{event.type}</span>
                                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                                                event.status === 'Completed' ? 'bg-success/10 text-success' : 
                                                                event.status === 'Pending' ? 'bg-warning/10 text-warning' : 'bg-secondary/10 text-text-secondary'
                                                            }`}>{event.status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Activities Tab */}
                                {activeTab === 'activities' && (
                                    <div className="animate-fade-in-up">
                                        <h3 className="font-bold text-lg text-text-primary mb-6 flex items-center gap-2">
                                            <GlobeIcon className="h-5 w-5 text-cyan-600" /> Historial de Actividades
                                        </h3>
                                        
                                        {activities.length === 0 ? (
                                            <div className="text-center p-8 border-2 border-dashed border-secondary/20 rounded-xl">
                                                <p className="text-text-secondary">No hay actividades de extensión registradas.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {activities.map(activity => (
                                                    <div key={activity.id} className="bg-surface p-5 rounded-xl shadow-sm border border-secondary/20 flex gap-5 transition-all hover:shadow-md items-start">
                                                        <div className="flex-shrink-0 w-14 text-center bg-cyan-50 rounded-xl py-2 border border-cyan-100">
                                                            <div className="text-xs font-bold text-cyan-600 uppercase">{new Date(activity.date).getFullYear()}</div>
                                                            <div className="text-lg font-bold text-cyan-800 leading-none">{new Date(activity.date).toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '')}</div>
                                                            <div className="text-xs text-cyan-600">{new Date(activity.date).getDate()}</div>
                                                        </div>
                                                        <div className="flex-grow">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h4 className="font-bold text-text-primary text-lg">{activity.title}</h4>
                                                                <span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded font-bold">{activity.type}</span>
                                                            </div>
                                                            <p className="text-sm text-text-secondary mb-3 flex items-center gap-2">
                                                                <span className="font-semibold">{activity.institution}</span> • <span>Rol: {activity.role}</span>
                                                            </p>
                                                            <p className="text-sm text-text-primary leading-relaxed bg-background/50 p-3 rounded-lg border border-secondary/10 text-pretty">
                                                                {activity.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Grades Summary Tab */}
                                {activeTab === 'grades' && (
                                    <div className="animate-fade-in-up">
                                        <h3 className="font-bold text-lg text-text-primary mb-6 flex items-center gap-2">
                                            <TableIcon className="h-5 w-5 text-indigo-600" /> Resumen de Calificaciones
                                        </h3>
                                        
                                        <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-secondary/10 text-text-secondary uppercase text-xs font-bold border-b border-secondary/20">
                                                        <tr>
                                                            <th className="px-6 py-4">Asignatura</th>
                                                            <th className="px-6 py-4 text-center text-blue-600">Escrita (60%)</th>
                                                            <th className="px-6 py-4 text-center text-indigo-600">Competencias (30%)</th>
                                                            <th className="px-6 py-4 text-center text-cyan-600">Presentación (10%)</th>
                                                            <th className="px-6 py-4 text-center font-extrabold text-text-primary">Final</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-secondary/20">
                                                        {gradeSummary.rows.map((row, idx) => (
                                                            <tr key={idx} className="hover:bg-secondary/5">
                                                                <td className="px-6 py-4 font-medium">{row.subjectName}</td>
                                                                <td className="px-6 py-4 text-center font-mono">
                                                                    {row.writtenGrade ? row.writtenGrade.toFixed(1) : '-'}
                                                                </td>
                                                                <td className="px-6 py-4 text-center font-mono">
                                                                    {row.competencyGrade ? row.competencyGrade.toFixed(1) : '-'}
                                                                </td>
                                                                <td className="px-6 py-4 text-center font-mono">
                                                                    {row.presentationGrade ? row.presentationGrade.toFixed(1) : '-'}
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    {row.finalGrade ? (
                                                                        <span className={`font-bold px-2 py-1 rounded bg-surface border border-secondary/10 ${getGradeColor(row.finalGrade)}`}>
                                                                            {row.finalGrade.toFixed(1)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-secondary/50 text-xs italic">En curso</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {gradeSummary.rows.length === 0 && (
                                                            <tr>
                                                                <td colSpan={5} className="p-8 text-center text-text-secondary">No hay asignaturas cursadas.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Documents Tab */}
                                {activeTab === 'documents' && (
                                    <div className="animate-fade-in-up">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                                                <FileIcon className="h-5 w-5 text-emerald-600" /> Repositorio de Documentos
                                            </h3>
                                            <p className="text-xs text-text-secondary italic">
                                                Los documentos se gestionan desde el módulo central.
                                            </p>
                                        </div>

                                        {documents.length === 0 ? (
                                            <div className="text-center p-8 border-2 border-dashed border-secondary/20 rounded-xl">
                                                <p className="text-text-secondary">No hay documentos cargados para este residente.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {documents.map(doc => (
                                                    <div key={doc.id} className="bg-surface p-4 rounded-xl border border-secondary/20 hover:border-emerald-500/50 transition-all flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-3 bg-red-100 rounded-lg text-red-600">
                                                                <DocumentTextIcon className="h-6 w-6" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-text-primary text-sm">{doc.title}</h4>
                                                                <p className="text-xs text-text-secondary">{doc.type} • {new Date(doc.uploadDate).toLocaleDateString()} • {doc.category}</p>
                                                            </div>
                                                        </div>
                                                        <button className="p-2 hover:bg-secondary/10 rounded-full text-text-secondary hover:text-primary transition-colors">
                                                            <DownloadIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actas View (Hidden from main tabs unless triggered) */}
                                {activeTab === 'actas_view' && (
                                    <ActasTab 
                                        actas={studentActas}
                                        students={students}
                                        subjects={subjects}
                                        teachers={teachers}
                                        currentUserId={currentUserId}
                                        onUpdateActa={handleUpdateActa}
                                    />
                                )}

                            </div>

                            {/* RIGHT COLUMN: Notifications / Pending (30%) */}
                            <div className="lg:w-[30%] bg-surface/50 p-6 overflow-y-auto space-y-6">
                                <h3 className="font-bold text-sm text-text-secondary uppercase tracking-wider flex items-center gap-2 mb-4">
                                    <BellIcon className="h-4 w-4" /> Pendientes
                                </h3>

                                {totalPending === 0 ? (
                                    <div className="text-center py-8 opacity-60">
                                        <CheckCircleIcon className="h-10 w-10 text-success mx-auto mb-2" />
                                        <p className="text-sm font-medium">¡Todo al día!</p>
                                        <p className="text-xs text-text-secondary">No tienes tareas pendientes.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Pending Quizzes */}
                                        {pendingQuizzes.map(quiz => (
                                            <div key={quiz.id_cuestionario} className="bg-surface p-4 rounded-xl shadow-sm border-l-4 border-primary hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                                        <ClockIcon className="h-3 w-3"/> QUIZ
                                                    </span>
                                                    <span className="text-[10px] text-text-secondary">Vence: {new Date(quiz.ventana_disponibilidad.fin).toLocaleDateString()}</span>
                                                </div>
                                                <h4 className="font-bold text-sm text-text-primary mb-1 line-clamp-2">{quiz.titulo}</h4>
                                                <p className="text-xs text-text-secondary mb-3">{quiz.asignatura}</p>
                                                <button 
                                                    onClick={() => onStartQuiz(quiz.id_cuestionario)}
                                                    className="w-full py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    Responder Ahora
                                                </button>
                                            </div>
                                        ))}

                                        {/* Pending Actas */}
                                        {pendingActas.map(acta => (
                                            <div key={acta.id} className="bg-surface p-4 rounded-xl shadow-sm border-l-4 border-warning hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="bg-warning/10 text-warning text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                                        <DocumentTextIcon className="h-3 w-3"/> ACTA
                                                    </span>
                                                    <span className="text-[10px] text-text-secondary">{new Date(acta.generatedAt).toLocaleDateString()}</span>
                                                </div>
                                                <h4 className="font-bold text-sm text-text-primary mb-1">Calificación Final</h4>
                                                <p className="text-xs text-text-secondary mb-3">{getSubjectName(acta.subjectId)}</p>
                                                <button 
                                                    onClick={() => setActiveTab('actas_view')}
                                                    className="w-full py-1.5 bg-warning hover:bg-warning-dark text-white rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    Revisar y Firmar
                                                </button>
                                            </div>
                                        ))}

                                        {/* Pending Surveys */}
                                        {pendingSurveys.map(survey => (
                                            <div key={survey.id} className="bg-surface p-4 rounded-xl shadow-sm border-l-4 border-indigo-500 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                                        <FileIcon className="h-3 w-3"/> ENCUESTA
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-sm text-text-primary mb-1">Evaluación Docente</h4>
                                                <p className="text-xs text-text-secondary mb-3">
                                                    {getTeacherName(survey.teacherId)} - {getSubjectName(survey.subjectId)}
                                                </p>
                                                <button 
                                                    onClick={() => onNavigateToPoll(survey.id)}
                                                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    Completar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-60 p-8">
                        <AcademicIcon className="h-16 w-16 text-primary mb-4" />
                        <h3 className="text-xl font-bold text-text-primary">Selecciona un Residente</h3>
                        <p className="text-text-secondary">Para ver su perfil y hoja de vida académica.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResidentsFolder;
