
import React, { useState, useEffect } from 'react';
import { Student, Annotation, Activity, Subject, Quiz, Attempt, Acta, Teacher, SurveyResult } from '../types';
import { StudentService, AnnotationService, ActivityService, SubjectService, QuizService, AttemptService, ActaService, TeacherService, SurveyService } from '../services/dataService';
import { AcademicIcon, UsersIcon, ThumbUpIcon, ThumbDownIcon, ChatBubbleLeftRightIcon, GlobeIcon, CheckCircleIcon, XCircleIcon, ClipboardCheckIcon, ClockIcon, PlayIcon, DocumentTextIcon, FileIcon, ArrowUpRightIcon, BellIcon } from './icons';
import { getGradeColor } from '../utils';
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
    
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'annotations' | 'activities' | 'evaluations' | 'actas' | 'surveys'>('evaluations');
    
    useEffect(() => {
        const loadData = async () => {
            const [stData, subData, quizData, attemptData, actaData, teacherData, surveyData] = await Promise.all([
                StudentService.getAll(),
                SubjectService.getAll(),
                QuizService.getAll(),
                AttemptService.getAll(),
                ActaService.getAll(),
                TeacherService.getAll(),
                SurveyService.getAll()
            ]);
            setStudents(stData);
            setSubjects(subData);
            setQuizzes(quizData);
            setAttempts(attemptData);
            setActas(actaData);
            setTeachers(teacherData);
            setSurveys(surveyData);
            
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
                const [notes, acts] = await Promise.all([
                    AnnotationService.getByTarget(selectedStudent.id),
                    ActivityService.getByParticipant(selectedStudent.id),
                ]);
                setAnnotations(notes);
                setActivities(acts);
            }
        };
        loadDetails();
    }, [selectedStudent]);

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filter Data for selected student
    const studentQuizzes = selectedStudent 
        ? quizzes.filter(q => q.alumnos_asignados.includes(selectedStudent.id))
        : [];

    const studentActas = selectedStudent
        ? actas.filter(a => a.studentId === selectedStudent.id)
        : [];

    const studentSurveys = selectedStudent
        ? surveys.filter(s => s.studentId === selectedStudent.id)
        : [];

    // Calculate Pending Items
    const pendingQuizzes = studentQuizzes.filter(q => {
        const attempt = attempts.find(a => a.id_cuestionario === q.id_cuestionario && a.alumno_id === selectedStudent?.id);
        const isCompleted = attempt?.estado === 'entregado' || attempt?.estado === 'pendiente_revision';
        const isExpired = new Date(q.ventana_disponibilidad.fin) < new Date();
        return !isCompleted && !isExpired;
    });

    const pendingActas = studentActas.filter(a => a.status === 'Pendiente');
    
    const pendingSurveys = studentSurveys.filter(s => s.status === 'Pending');

    const totalPending = pendingQuizzes.length + pendingActas.length + pendingSurveys.length;

    const handleUpdateActa = (updatedActa: Acta) => {
        setActas(prev => prev.map(a => a.id === updatedActa.id ? updatedActa : a));
    };

    const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || id;
    const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-100px)] animate-fade-in-up">
            
            {/* Top Selection Panel - Only show if user is DOCENTE */}
            {currentUserId === 'DOCENTE' && (
                <div className="w-full bg-surface rounded-xl shadow-sm border border-secondary/20 flex flex-col flex-shrink-0 max-h-[30vh]">
                    <div className="p-3 border-b border-secondary/20 bg-background/50 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <UsersIcon className="h-5 w-5 text-primary" /> Residentes
                        </h2>
                        <input 
                            type="text" 
                            placeholder="Buscar residente..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 bg-background border border-secondary/30 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                    <div className="overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {loading ? <p className="col-span-full text-center p-4 text-text-secondary">Cargando...</p> : 
                        filteredStudents.map(student => (
                            <button
                                key={student.id}
                                onClick={() => setSelectedStudent(student)}
                                className={`text-left p-3 rounded-lg flex items-center gap-3 transition-colors border ${selectedStudent?.id === student.id ? 'bg-primary text-white border-primary shadow-md' : 'bg-background hover:bg-secondary/10 text-text-primary border-transparent hover:border-secondary/20'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${selectedStudent?.id === student.id ? 'bg-white text-primary' : 'bg-primary/10 text-primary'}`}>
                                    {student.name.charAt(0)}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold truncate">{student.name}</p>
                                    <p className={`text-xs truncate ${selectedStudent?.id === student.id ? 'text-white/80' : 'text-text-secondary'}`}>{student.level} • {student.status}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content - Full Width Below */}
            <div className={`w-full flex-grow bg-surface rounded-xl shadow-sm border border-secondary/20 flex flex-col overflow-hidden relative`}>
                {selectedStudent ? (
                    <div className="flex flex-col h-full">
                        {/* Header Profile */}
                        <div className="p-6 border-b border-secondary/20 bg-gradient-to-r from-primary/5 to-transparent">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                                    {selectedStudent.photo_url ? <img src={selectedStudent.photo_url} className="w-full h-full object-cover" /> : <AcademicIcon className="h-8 w-8 text-primary"/>}
                                </div>
                                <div className="flex-grow">
                                    <h2 className="text-2xl font-bold text-text-primary">{selectedStudent.name}</h2>
                                    <p className="text-text-secondary">{selectedStudent.id} • {selectedStudent.course}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">{selectedStudent.level}</span>
                                        <span className="bg-secondary/10 text-text-secondary px-2 py-0.5 rounded text-xs">{selectedStudent.email_ua}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Tabs */}
                            <div className="flex gap-6 mt-6 border-b border-secondary/10 overflow-x-auto">
                                <button 
                                    onClick={() => setActiveTab('evaluations')}
                                    className={`pb-2 px-1 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'evaluations' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    Evaluaciones (Quiz)
                                    {pendingQuizzes.length > 0 && <span className="bg-danger text-white text-[10px] px-1.5 rounded-full shadow-sm ml-1">{pendingQuizzes.length}</span>}
                                </button>
                                <button 
                                    onClick={() => setActiveTab('actas')}
                                    className={`pb-2 px-1 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'actas' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    Actas y Certificados
                                    {pendingActas.length > 0 && <span className="bg-danger text-white text-[10px] px-1.5 rounded-full shadow-sm ml-1">{pendingActas.length}</span>}
                                </button>
                                <button 
                                    onClick={() => setActiveTab('surveys')}
                                    className={`pb-2 px-1 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'surveys' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    Encuestas Docentes
                                    {pendingSurveys.length > 0 && (
                                        <span className="bg-danger text-white text-[10px] px-1.5 rounded-full animate-pulse shadow-sm">
                                            {pendingSurveys.length}
                                        </span>
                                    )}
                                </button>
                                <button 
                                    onClick={() => setActiveTab('annotations')}
                                    className={`pb-2 px-1 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'annotations' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    Hoja de Vida
                                </button>
                                <button 
                                    onClick={() => setActiveTab('activities')}
                                    className={`pb-2 px-1 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'activities' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    Actividades
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-grow overflow-y-auto p-6 bg-background/30">
                            
                            {/* Notification Banner */}
                            {totalPending > 0 && (
                                <div className="mb-6 bg-warning/10 border border-warning/30 p-4 rounded-xl flex items-start gap-4 shadow-sm animate-fade-in-down">
                                    <div className="p-2 bg-warning/20 rounded-full text-warning shrink-0">
                                        <BellIcon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-text-primary">
                                            {selectedStudent.id === currentUserId ? 'Tienes' : 'El residente tiene'} {totalPending} actividad(es) pendiente(s)
                                        </h4>
                                        <div className="mt-2 space-y-1">
                                            {pendingQuizzes.length > 0 && (
                                                <button onClick={() => setActiveTab('evaluations')} className="block text-xs text-text-secondary hover:text-primary hover:underline text-left">
                                                    • {pendingQuizzes.length} Evaluación(es) por responder
                                                </button>
                                            )}
                                            {pendingActas.length > 0 && (
                                                <button onClick={() => setActiveTab('actas')} className="block text-xs text-text-secondary hover:text-primary hover:underline text-left">
                                                    • {pendingActas.length} Acta(s) pendiente(s) de firma
                                                </button>
                                            )}
                                            {pendingSurveys.length > 0 && (
                                                <button onClick={() => setActiveTab('surveys')} className="block text-xs text-text-secondary hover:text-primary hover:underline text-left">
                                                    • {pendingSurveys.length} Encuesta(s) docente(s) pendiente(s)
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* EVALUATIONS (QUIZZES) TAB */}
                            {activeTab === 'evaluations' && (
                                <>
                                    <h3 className="font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
                                        <ClipboardCheckIcon className="h-5 w-5 text-primary" /> Cuestionarios Asignados
                                    </h3>
                                    
                                    {studentQuizzes.length === 0 ? (
                                        <div className="text-center p-8 border-2 border-dashed border-secondary/20 rounded-xl">
                                            <p className="text-text-secondary">No tiene cuestionarios asignados actualmente.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {studentQuizzes.map(quiz => {
                                                const attempt = attempts.find(a => a.id_cuestionario === quiz.id_cuestionario && a.alumno_id === selectedStudent.id);
                                                const isExpired = new Date(quiz.ventana_disponibilidad.fin) < new Date();
                                                const isCompleted = attempt?.estado === 'entregado' || attempt?.estado === 'pendiente_revision';
                                                
                                                return (
                                                    <div key={quiz.id_cuestionario} className="bg-surface p-4 rounded-xl shadow-sm border border-secondary/20">
                                                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {isCompleted ? (
                                                                        <span className="bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><CheckCircleIcon className="h-3 w-3"/> COMPLETADO</span>
                                                                    ) : isExpired ? (
                                                                        <span className="bg-danger/10 text-danger text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><XCircleIcon className="h-3 w-3"/> VENCIDO</span>
                                                                    ) : (
                                                                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><ClockIcon className="h-3 w-3"/> PENDIENTE</span>
                                                                    )}
                                                                    <span className="text-xs text-text-secondary">Asignatura: {quiz.asignatura}</span>
                                                                </div>
                                                                <h4 className="font-bold text-text-primary text-lg">{quiz.titulo}</h4>
                                                                <p className="text-xs text-text-secondary mt-1">Vence: {new Date(quiz.ventana_disponibilidad.fin).toLocaleDateString()} • {quiz.tiempo_limite_minutos} min</p>
                                                            </div>
                                                            
                                                            {isCompleted && attempt ? (
                                                                <div className="text-right bg-background p-2 rounded-lg border border-secondary/10 min-w-[100px]">
                                                                    <span className="text-xs text-text-secondary block">Nota Obtenida</span>
                                                                    <span className={`text-xl font-bold ${getGradeColor(attempt.nota || 1)}`}>{attempt.nota?.toFixed(1)}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-text-secondary italic">
                                                                    Sin realizar
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* CTA ACTION BUTTON */}
                                                        {!isCompleted && !isExpired && selectedStudent.id === currentUserId && (
                                                            <div className="mt-4 pt-4 border-t border-secondary/10 flex justify-end">
                                                                <button
                                                                    onClick={() => onStartQuiz(quiz.id_cuestionario)}
                                                                    className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2 transform hover:scale-105"
                                                                >
                                                                    <PlayIcon className="h-4 w-4" /> Responder Cuestionario
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* ACTAS TAB */}
                            {activeTab === 'actas' && (
                                <ActasTab 
                                    actas={studentActas}
                                    students={students}
                                    subjects={subjects}
                                    teachers={teachers}
                                    currentUserId={currentUserId}
                                    onUpdateActa={handleUpdateActa}
                                />
                            )}

                            {/* SURVEYS (ENCUESTAS) TAB */}
                            {activeTab === 'surveys' && (
                                <>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                                            <FileIcon className="h-5 w-5 text-warning" /> Encuestas Docentes
                                        </h3>
                                        {pendingSurveys.length > 0 && (
                                            <span className="bg-warning/20 text-warning border border-warning/30 text-xs px-3 py-1 rounded-full font-bold">
                                                {pendingSurveys.length} Pendiente(s)
                                            </span>
                                        )}
                                    </div>

                                    {studentSurveys.length === 0 ? (
                                        <div className="text-center p-8 border-2 border-dashed border-secondary/20 rounded-xl">
                                            <p className="text-text-secondary">No hay encuestas asignadas aún.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {studentSurveys.map(survey => {
                                                const isPending = survey.status === 'Pending';
                                                
                                                return (
                                                    <div key={survey.id} className={`bg-surface p-5 rounded-xl shadow-sm border ${isPending ? 'border-warning/50 bg-warning/5' : 'border-secondary/20'}`}>
                                                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    {isPending ? (
                                                                        <span className="bg-warning/20 text-warning text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><ClockIcon className="h-3 w-3"/> PENDIENTE</span>
                                                                    ) : (
                                                                        <span className="bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><CheckCircleIcon className="h-3 w-3"/> COMPLETADA</span>
                                                                    )}
                                                                    <span className="text-xs text-text-secondary">Generada: {new Date(survey.date).toLocaleDateString()}</span>
                                                                </div>
                                                                <h4 className="font-bold text-text-primary text-base">Evaluación a: {getTeacherName(survey.teacherId)}</h4>
                                                                <p className="text-sm text-text-secondary mt-1">Asignatura: {getSubjectName(survey.subjectId)}</p>
                                                            </div>
                                                            
                                                            {isPending && selectedStudent.id === currentUserId ? (
                                                                <button
                                                                    onClick={() => onNavigateToPoll(survey.id)}
                                                                    className="bg-warning hover:bg-warning-dark text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2 transform hover:scale-105"
                                                                >
                                                                    Responder Encuesta <ArrowUpRightIcon className="h-4 w-4" />
                                                                </button>
                                                            ) : !isPending ? (
                                                                <div className="text-right">
                                                                    <span className="text-xs text-text-secondary italic">Gracias por tu feedback</span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-right">
                                                                    <span className="text-xs text-text-secondary italic">Pendiente por el residente</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Annotations Tab */}
                            {activeTab === 'annotations' && (
                                <>
                                    <h3 className="font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
                                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-accent" /> Anotaciones y Observaciones
                                    </h3>
                                    
                                    {annotations.length === 0 ? (
                                        <div className="text-center p-8 border-2 border-dashed border-secondary/20 rounded-xl">
                                            <p className="text-text-secondary">No hay anotaciones registradas.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-secondary/20">
                                            {annotations.map(note => (
                                                <div key={note.id} className="relative pl-10">
                                                    <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-surface ${note.type === 'Positive' ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                                                        {note.type === 'Positive' ? <ThumbUpIcon className="h-4 w-4" /> : <ThumbDownIcon className="h-4 w-4" />}
                                                    </div>
                                                    <div className="bg-surface p-4 rounded-xl shadow-sm border border-secondary/20">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${note.type === 'Positive' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                                {note.type === 'Positive' ? 'Anotación Positiva' : 'Anotación Negativa'}
                                                            </span>
                                                            <span className="text-xs text-text-secondary">{new Date(note.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-sm text-text-primary mb-2 leading-relaxed">"{note.content}"</p>
                                                        <p className="text-xs text-text-secondary italic">Registrado por: {note.authorId}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Activities Tab */}
                            {activeTab === 'activities' && (
                                <>
                                    <h3 className="font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
                                        <GlobeIcon className="h-5 w-5 text-cyan-600" /> Historial de Actividades
                                    </h3>
                                    
                                    {activities.length === 0 ? (
                                        <div className="text-center p-8 border-2 border-dashed border-secondary/20 rounded-xl">
                                            <p className="text-text-secondary">No hay actividades registradas.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {activities.map(activity => (
                                                <div key={activity.id} className="bg-surface p-4 rounded-xl shadow-sm border border-secondary/20 flex gap-4 transition-all hover:shadow-md">
                                                    <div className="flex-shrink-0 w-12 text-center bg-cyan-50 rounded-lg py-2 border border-cyan-100">
                                                        <div className="text-xs font-bold text-cyan-600 uppercase">{new Date(activity.date).getFullYear()}</div>
                                                        <div className="text-xs text-cyan-800">{new Date(activity.date).toLocaleDateString('es-ES', { month: 'short' })}</div>
                                                    </div>
                                                    <div className="flex-grow">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="font-bold text-text-primary">{activity.title}</h4>
                                                            <span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded font-bold">{activity.type}</span>
                                                        </div>
                                                        <p className="text-xs text-text-secondary mb-2">{activity.institution} • Rol: {activity.role}</p>
                                                        <p className="text-sm text-text-primary leading-relaxed bg-background/50 p-2 rounded border border-secondary/10">
                                                            {activity.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

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
