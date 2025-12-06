
import React, { useState, useMemo, useEffect } from 'react';
import { Question, Quiz, Attempt, Student, StudentStats, QuestionStats, QuizStats, QuizQuestion, CompetencyEvaluation, PresentationEvaluation, Subject } from '../types';
import { QuestionService, QuizService, AttemptService, SubjectService } from '../services/dataService';
import QuestionBank from './QuestionBank';
import QuizList from './QuizList';
import StatisticsDashboard from './StatisticsDashboard';
import QuizTaker from './QuizTaker';
import GradingDashboard from './GradingDashboard';
import StudentDashboard from './StudentDashboard';
import { ClipboardCheckIcon as EvalIcon, RefreshIcon, ChartBarIcon, BookOpenIcon, PlayIcon, SparklesIcon, UsersIcon, BriefcaseIcon, TableIcon, CheckCircleIcon } from './icons';
import { calculateGrade } from '../utils';

type View = 'dashboard' | 'bank' | 'quizzes' | 'stats' | 'take_quiz' | 'grading';

interface EvaluationsModuleProps {
    currentUserId: string;
    students: Student[];
    initialQuizId?: string | null;
    onClearInitialQuizId?: () => void;
}

const EvaluationDashboard: React.FC<{
    stats: { active: number; questions: number; attempts: number; avg: number };
    activeQuizzes: Quiz[];
    attempts: Attempt[];
    currentUserId: string;
    onStart: (id: string) => void;
    onNavigate: (view: View) => void;
}> = ({ stats, activeQuizzes, attempts, currentUserId, onStart, onNavigate }) => {
    
    const isTeacher = currentUserId === 'DOCENTE';
    const effectiveUserId = isTeacher ? 'DOCENTE-PREVIEW' : currentUserId;

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-text-primary">Panel de Evaluaciones</h2>
                <p className="text-text-secondary mt-1">Resumen de actividad académica y cuestionarios.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/20 flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-text-secondary">Cuestionarios Activos</p>
                        <p className="text-3xl font-bold mt-2 text-text-primary">{stats.active}</p>
                        <p className="text-xs text-text-secondary mt-1">En curso actualmente</p>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
                        <EvalIcon className="h-6 w-6" />
                    </div>
                </div>
                <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/20 flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-text-secondary">Banco de Preguntas</p>
                        <p className="text-3xl font-bold mt-2 text-text-primary">{stats.questions}</p>
                        <p className="text-xs text-text-secondary mt-1">Total disponible</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <BookOpenIcon className="h-6 w-6" />
                    </div>
                </div>
                 <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/20 flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-text-secondary">Actividad Reciente</p>
                        <p className="text-3xl font-bold mt-2 text-text-primary">{stats.attempts}</p>
                        <p className="text-xs text-text-secondary mt-1">Intentos completados</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                        <ChartBarIcon className="h-6 w-6" />
                    </div>
                </div>
                <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/20 flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-text-secondary">Promedio General</p>
                        <p className="text-3xl font-bold mt-2 text-text-primary">{stats.avg.toFixed(1)}%</p>
                        <p className="text-xs text-text-secondary mt-1">Rendimiento global</p>
                    </div>
                    <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500">
                        <div className="h-6 w-6 font-bold flex items-center justify-center text-lg">%</div>
                    </div>
                </div>
            </div>
            
            {/* Active/Pending Quizzes Section */}
            <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                <div className="p-5 border-b border-secondary/20 flex justify-between items-center bg-background/50">
                    <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                        <EvalIcon className="text-primary h-5 w-5"/> Cuestionarios Disponibles / Activos
                    </h3>
                    <button onClick={() => onNavigate('quizzes')} className="text-xs text-primary hover:underline font-semibold">
                        Ver todos
                    </button>
                </div>
                <div className="p-4">
                    {activeQuizzes.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {activeQuizzes.map(quiz => {
                                // Check if user has already taken this quiz
                                const userAttempt = attempts.find(a => a.id_cuestionario === quiz.id_cuestionario && a.alumno_id === effectiveUserId);
                                const isCompleted = !!userAttempt;

                                return (
                                    <div key={quiz.id_cuestionario} className="p-4 bg-background rounded-lg border border-secondary/10 hover:border-primary/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                {isCompleted ? (
                                                    <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded flex items-center gap-1 border border-purple-200">
                                                        <CheckCircleIcon className="h-3 w-3" /> REALIZADO {isTeacher && "(TEST)"}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold bg-success/10 text-success px-1.5 py-0.5 rounded">ACTIVO</span>
                                                )}
                                                <span className="text-xs text-text-secondary">Vence: {new Date(quiz.ventana_disponibilidad.fin).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="font-bold text-text-primary group-hover:text-primary transition-colors">{quiz.titulo}</h4>
                                            <p className="text-xs text-text-secondary mt-1">{quiz.asignatura} • {quiz.tiempo_limite_minutos} min</p>
                                            
                                            {isCompleted && userAttempt && (
                                                <div className="mt-2 text-xs text-text-primary bg-surface inline-block px-2 py-1 rounded border border-secondary/20">
                                                    Nota obtenida: <span className="font-bold">{userAttempt.nota?.toFixed(1)}</span>
                                                    {isTeacher && <span className="text-text-secondary italic ml-1">- No se guarda en Libro de Notas</span>}
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => !isCompleted && onStart(quiz.id_cuestionario)}
                                            disabled={isCompleted}
                                            className={`flex-shrink-0 flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all shadow-lg 
                                                ${isCompleted 
                                                    ? 'bg-secondary/20 text-text-secondary cursor-not-allowed shadow-none' 
                                                    : 'bg-primary hover:bg-primary-dark text-white shadow-primary/20'}`}
                                        >
                                            {isCompleted ? 'Completado' : <><PlayIcon className="h-4 w-4" /> Iniciar</>}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                <EvalIcon className="h-8 w-8 text-secondary" />
                            </div>
                            <p className="text-text-primary font-medium">No hay cuestionarios activos.</p>
                            <p className="text-sm text-text-secondary">Crea uno nuevo en la sección de Cuestionarios.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const EvaluationsModule: React.FC<EvaluationsModuleProps> = ({ currentUserId, students, initialQuizId, onClearInitialQuizId }) => {
    const [view, setView] = useState<View>('dashboard');
    const [loading, setLoading] = useState(true);
    
    // State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]); // New state for subjects
    const [activeQuiz, setActiveQuiz] = useState<{ quiz: Quiz; questions: Question[] } | null>(null);
    
    // Draft state for creating a quiz from the bank
    const [pendingQuizDraft, setPendingQuizDraft] = useState<Quiz | null>(null);

    const isTeacher = currentUserId === 'DOCENTE';
    const currentStudent = students.find(s => s.id === currentUserId);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [qs, qzs, atts, subs] = await Promise.all([
                    QuestionService.getAll(),
                    QuizService.getAll(),
                    AttemptService.getAll(),
                    SubjectService.getAll()
                ]);
                setQuestions(qs);
                setQuizzes(qzs);
                setAttempts(atts);
                setSubjects(subs);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Handle deep linking to specific quiz (e.g. from Residents Folder)
    useEffect(() => {
        if (!loading && initialQuizId && quizzes.length > 0) {
            handleStartQuiz(initialQuizId);
            if (onClearInitialQuizId) {
                onClearInitialQuizId();
            }
        }
    }, [initialQuizId, quizzes, loading]);
    
    // Handlers
    const handleAddQuestion = async (newQuestion: Question) => {
        try {
            const created = await QuestionService.create(newQuestion);
            setQuestions(prev => [created, ...prev]);
        } catch (e) { console.error(e); }
    };

    const handleUpdateQuestion = async (updatedQuestion: Question) => {
        try {
            await QuestionService.update(updatedQuestion);
            setQuestions(prev => prev.map(q => q.codigo_pregunta === updatedQuestion.codigo_pregunta ? updatedQuestion : q));
        } catch (e) { console.error(e); }
    };

    const handleDeleteQuestion = async (questionCode: string) => {
        try {
            await QuestionService.delete(questionCode);
            setQuestions(prev => prev.filter(q => q.codigo_pregunta !== questionCode));
        } catch (e) { console.error(e); }
    };
    
    const handleAddQuiz = async (newQuiz: Quiz) => {
        try {
            const created = await QuizService.create(newQuiz);
            setQuizzes(prev => [created, ...prev]);
        } catch (e) { console.error(e); }
    };

    const handleUpdateQuiz = async (updatedQuiz: Quiz) => {
        try {
            await QuizService.update(updatedQuiz);
            setQuizzes(prev => prev.map(q => q.id_cuestionario === updatedQuiz.id_cuestionario ? updatedQuiz : q));
        } catch (e) { console.error(e); }
    };

    const handleDeleteQuiz = async (quizId: string) => {
        try {
            await QuizService.delete(quizId);
            setQuizzes(prev => prev.filter(q => q.id_cuestionario !== quizId));
        } catch (e) { console.error(e); }
    };
    
    const handleSaveAssignment = async (quizId: string, updatedData: Partial<Quiz>) => {
        const quiz = quizzes.find(q => q.id_cuestionario === quizId);
        if (!quiz) return;
        const updatedQuiz = { ...quiz, ...updatedData };
        await handleUpdateQuiz(updatedQuiz);
    };

    const handleStartQuiz = (quizId: string) => {
        const quizToTake = quizzes.find(q => q.id_cuestionario === quizId);
        if (quizToTake) {
            const quizQuestions = quizToTake.preguntas
                .map(pq => questions.find(q => q.codigo_pregunta === pq.codigo_pregunta))
                .filter((q): q is Question => !!q);
            
            setActiveQuiz({ quiz: quizToTake, questions: quizQuestions });
            setView('take_quiz');
        } else {
            console.warn("Quiz not found:", quizId);
        }
    };
    
    const handleSubmitAttempt = async (attempt: Attempt) => {
        try {
            const created = await AttemptService.create(attempt);
            
            // Re-fetch all attempts to ensure synchronization and proper state update
            // This ensures StudentDashboard sees the new attempt immediately
            const allAttempts = await AttemptService.getAll();
            setAttempts(allAttempts);
            
            setActiveQuiz(null);
            setView('dashboard'); 
        } catch (e) { console.error(e); }
    };

    const handleUpdateAttempt = async (updatedAttempt: Attempt) => {
        try {
            await AttemptService.update(updatedAttempt);
            setAttempts(prev => prev.map(a => a.id_intento === updatedAttempt.id_intento ? updatedAttempt : a));
        } catch (e) { console.error(e); }
    };

    // Handler to create quiz from bank selection
    const handleCreateQuizFromQuestions = (selectedQuestionIds: string[]) => {
        const selectedQuizQuestions: QuizQuestion[] = selectedQuestionIds.map(id => {
            const q = questions.find(question => question.codigo_pregunta === id);
            return { codigo_pregunta: id, puntaje: q ? Math.max(1, Math.min(5, q.dificultad)) : 1 };
        });

        const draftQuiz: Quiz = {
            id_cuestionario: "",
            titulo: "",
            descripcion: "",
            preguntas: selectedQuizQuestions,
            creado_desde: "banco",
            alumnos_asignados: [],
            tiempo_limite_minutos: 30,
            ventana_disponibilidad: {
                inicio: new Date().toISOString(),
                fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            link_acceso: "",
            proctoring: { habilitado: false },
            intentos_permitidos: 1,
            docente_creador: "Equipo Docente",
            asignatura: subjects.length > 0 ? subjects[0].name : "",
        };

        setPendingQuizDraft(draftQuiz);
        setView('quizzes');
    };

    useEffect(() => {
        // Only reset view if NO active quiz is set via initialQuizId props mechanism logic handled above
        // But generally, we want dashboard as default unless overridden
        if (!initialQuizId) {
            setView('dashboard');
            setActiveQuiz(null);
        }
    }, [currentUserId]);

    // Memoized statistics
    const studentStats = useMemo<StudentStats[]>(() => {
        const statsMap = new Map<string, { totalScore: number; totalGrade: number; count: number }>();
        attempts.forEach(attempt => {
            if (attempt.estado === 'pendiente_revision') return;

            if (!statsMap.has(attempt.alumno_id)) {
                statsMap.set(attempt.alumno_id, { totalScore: 0, totalGrade: 0, count: 0 });
            }
            const current = statsMap.get(attempt.alumno_id)!;
            current.totalScore += attempt.porcentaje;
            const grade = attempt.nota !== undefined ? attempt.nota : calculateGrade(attempt.puntaje_total_obtenido, attempt.puntaje_total_posible);
            current.totalGrade += grade;
            current.count++;
        });

        return students.map(student => {
            const studentAttempts = statsMap.get(student.id);
            return {
                studentId: student.id,
                studentName: student.name,
                studentCourse: student.course,
                attemptCount: studentAttempts?.count || 0,
                averageScore: studentAttempts && studentAttempts.count > 0 ? studentAttempts.totalScore / studentAttempts.count : 0,
                averageGrade: studentAttempts && studentAttempts.count > 0 ? studentAttempts.totalGrade / studentAttempts.count : 0,
            };
        });
    }, [attempts, students]);

     const questionStats = useMemo<QuestionStats[]>(() => {
        const statsMap = new Map<string, { correct: number; total: number }>();
        attempts.forEach(attempt => {
            if (attempt.estado === 'pendiente_revision') return;

            attempt.respuestas.forEach(answer => {
                if (!statsMap.has(answer.codigo_pregunta)) {
                    statsMap.set(answer.codigo_pregunta, { correct: 0, total: 0 });
                }
                const current = statsMap.get(answer.codigo_pregunta)!;
                if (answer.puntaje_obtenido > 0) {
                    current.correct++;
                }
                current.total++;
            });
        });

        return questions.map(q => {
            const stats = statsMap.get(q.codigo_pregunta);
            return {
                codigo_pregunta: q.codigo_pregunta,
                enunciado: q.enunciado,
                especialidad: q.especialidad,
                docente_creador: q.docente_creador,
                successRate: stats && stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
                totalAnswers: stats?.total || 0,
            };
        });
    }, [attempts, questions]);

     const quizStats = useMemo<QuizStats[]>(() => {
        const statsMap = new Map<string, { totalScore: number; totalTime: number; count: number }>();
        attempts.forEach(attempt => {
            if (attempt.estado === 'pendiente_revision') return;

            if (!statsMap.has(attempt.id_cuestionario)) {
                statsMap.set(attempt.id_cuestionario, { totalScore: 0, totalTime: 0, count: 0 });
            }
            const current = statsMap.get(attempt.id_cuestionario)!;
            current.totalScore += attempt.porcentaje;
            current.totalTime += attempt.tiempo_utilizado_seg;
            current.count++;
        });

        return quizzes.map(quiz => {
            const stats = statsMap.get(quiz.id_cuestionario);
            return {
                quizId: quiz.id_cuestionario,
                quizTitle: quiz.titulo,
                asignatura: quiz.asignatura,
                docente_creador: quiz.docente_creador,
                participantCount: stats?.count || 0,
                averageScore: stats && stats.count > 0 ? stats.totalScore / stats.count : 0,
                averageTimeSeconds: stats && stats.count > 0 ? stats.totalTime / stats.count : 0,
            };
        });
    }, [attempts, quizzes]);

    const activeQuizzes = useMemo(() => {
        const now = new Date();
        return quizzes.filter(quiz => {
            return new Date(quiz.ventana_disponibilidad.fin) > now;
        }).sort((a, b) => new Date(a.ventana_disponibilidad.fin).getTime() - new Date(b.ventana_disponibilidad.fin).getTime());
    }, [quizzes]);

    const pendingReviewsCount = useMemo(() => {
        return attempts.filter(a => a.estado === 'pendiente_revision').length;
    }, [attempts]);

    const summaryStats = useMemo(() => {
        const completedAttempts = attempts.filter(a => a.estado === 'entregado');
        const totalScore = completedAttempts.reduce((acc, curr) => acc + (curr.porcentaje || 0), 0);
        const avgScore = completedAttempts.length ? (totalScore / completedAttempts.length) : 0;
        
        return {
            active: activeQuizzes.length,
            questions: questions.length,
            attempts: completedAttempts.length,
            avg: avgScore
        };
    }, [attempts, activeQuizzes, questions]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex h-full items-center justify-center">
                    <div className="flex flex-col items-center gap-3 opacity-60">
                         <RefreshIcon className="h-10 w-10 animate-spin text-primary" />
                         <p className="font-medium">Cargando datos...</p>
                    </div>
                </div>
            );
        }

        if (view === 'take_quiz' && activeQuiz) {
            return <QuizTaker 
                quiz={activeQuiz.quiz} 
                questions={activeQuiz.questions} 
                onSubmit={handleSubmitAttempt}
                studentId={isTeacher ? 'DOCENTE-PREVIEW' : (currentStudent?.id || 'TEST-STUDENT')}
            />;
        }

        // Student View (If not teacher)
        if (!isTeacher && currentStudent) {
            return <StudentDashboard 
                student={currentStudent}
                quizzes={quizzes}
                attempts={attempts}
                onStartQuiz={handleStartQuiz}
            />;
        }
        
        switch (view) {
            case 'bank':
                return <QuestionBank 
                    questions={questions} 
                    onAddQuestion={handleAddQuestion} 
                    onUpdateQuestion={handleUpdateQuestion} 
                    onDeleteQuestion={handleDeleteQuestion}
                    onCreateQuiz={handleCreateQuizFromQuestions}
                />;
            case 'stats':
                return <StatisticsDashboard 
                    studentStats={studentStats}
                    questionStats={questionStats}
                    quizStats={quizStats}
                    quizzes={quizzes}
                    questions={questions}
                />;
            case 'quizzes':
                 return <QuizList
                    quizzes={quizzes}
                    onStartQuiz={handleStartQuiz}
                    onAddQuiz={handleAddQuiz}
                    onUpdateQuiz={handleUpdateQuiz}
                    onDeleteQuiz={handleDeleteQuiz}
                    allQuestions={questions}
                    allStudents={students}
                    onSaveAssignment={handleSaveAssignment}
                    initialDraft={pendingQuizDraft}
                    onClearDraft={() => setPendingQuizDraft(null)}
                    subjects={subjects} // Pass subjects
                />;
            case 'grading':
                return <GradingDashboard
                    attempts={attempts}
                    quizzes={quizzes}
                    questions={questions}
                    students={students}
                    onUpdateAttempt={handleUpdateAttempt}
                />;
            case 'dashboard':
            default:
               return <EvaluationDashboard 
                    stats={summaryStats} 
                    activeQuizzes={activeQuizzes.slice(0, 4)} // Show top 4
                    attempts={attempts} // Pass attempts
                    currentUserId={currentUserId} // Pass current user
                    onStart={handleStartQuiz}
                    onNavigate={setView}
               />;
        }
    };
    
    return (
        <div className="flex flex-col h-full animate-fade-in-right">
             
             {/* Internal Evaluation Navigation - Only for Teachers (Management View) */}
             {view !== 'take_quiz' && isTeacher && (
                <div className="bg-surface/50 border-b border-secondary/20 p-2 mb-4 rounded-lg flex gap-2 overflow-x-auto">
                     <button onClick={() => setView('dashboard')} className={`px-4 py-2 text-sm rounded-md font-medium transition-colors whitespace-nowrap ${view === 'dashboard' ? 'bg-primary text-white shadow' : 'hover:bg-secondary/20 text-text-secondary'}`}>Panel</button>
                     <button onClick={() => setView('quizzes')} className={`px-4 py-2 text-sm rounded-md font-medium transition-colors whitespace-nowrap ${view === 'quizzes' ? 'bg-primary text-white shadow' : 'hover:bg-secondary/20 text-text-secondary'}`}>Cuestionarios</button>
                     <button onClick={() => setView('bank')} className={`px-4 py-2 text-sm rounded-md font-medium transition-colors whitespace-nowrap ${view === 'bank' ? 'bg-primary text-white shadow' : 'hover:bg-secondary/20 text-text-secondary'}`}>Preguntas</button>
                     <button onClick={() => setView('grading')} className={`px-4 py-2 text-sm rounded-md font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${view === 'grading' ? 'bg-primary text-white shadow' : 'hover:bg-secondary/20 text-text-secondary'}`}>
                        Revisiones
                        {pendingReviewsCount > 0 && <span className="bg-warning text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingReviewsCount}</span>}
                    </button>
                     <button onClick={() => setView('stats')} className={`px-4 py-2 text-sm rounded-md font-medium transition-colors whitespace-nowrap ${view === 'stats' ? 'bg-primary text-white shadow' : 'hover:bg-secondary/20 text-text-secondary'}`}>Estadísticas</button>
                </div>
             )}

             {/* Header for Students */}
             {!isTeacher && currentStudent && view !== 'take_quiz' && (
                 <div className="mb-6 flex items-center gap-3">
                     <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                         <EvalIcon className="h-6 w-6" />
                     </div>
                     <div>
                         <h2 className="text-2xl font-bold text-text-primary">Módulo de Evaluaciones</h2>
                         <p className="text-sm text-text-secondary">Gestiona tus evaluaciones y revisa tu progreso</p>
                     </div>
                 </div>
             )}

            <div className="flex-grow">
                {renderContent()}
            </div>
        </div>
    );
};

export default EvaluationsModule;
