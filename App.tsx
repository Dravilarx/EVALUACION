
import React, { useState, useMemo, useEffect } from 'react';
import { Question, Quiz, Attempt, Student, StudentStats, QuestionStats, QuizStats, QuizQuestion } from './types';
import { initialQuestions, initialQuizzes, initialAttempts, mockStudents } from './data/mockData';
import QuestionBank from './components/QuestionBank';
import QuizList from './components/QuizList';
import StatisticsDashboard from './components/StatisticsDashboard';
import QuizTaker from './components/QuizTaker';
import Dashboard from './components/Dashboard';
import GradingDashboard from './components/GradingDashboard';
import StudentDashboard from './components/StudentDashboard';
import { ClipboardCheckIcon, UsersIcon } from './components/icons';
import { calculateGrade } from './utils';

type View = 'dashboard' | 'bank' | 'quizzes' | 'stats' | 'take_quiz' | 'grading';

const App: React.FC = () => {
    const [view, setView] = useState<View>('dashboard');
    const [currentUserId, setCurrentUserId] = useState<string>('DOCENTE'); // 'DOCENTE' or Student ID
    
    // State
    const [questions, setQuestions] = useState<Question[]>(initialQuestions);
    const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes);
    const [attempts, setAttempts] = useState<Attempt[]>(initialAttempts);
    const [students] = useState<Student[]>(mockStudents);
    const [activeQuiz, setActiveQuiz] = useState<{ quiz: Quiz; questions: Question[] } | null>(null);
    
    // Draft state for creating a quiz from the bank
    const [pendingQuizDraft, setPendingQuizDraft] = useState<Quiz | null>(null);
    
    // Handlers
    const handleAddQuestion = (newQuestion: Question) => {
        setQuestions(prev => [newQuestion, ...prev]);
    };

    const handleUpdateQuestion = (updatedQuestion: Question) => {
        setQuestions(prev => prev.map(q => q.codigo_pregunta === updatedQuestion.codigo_pregunta ? updatedQuestion : q));
    };

    const handleDeleteQuestion = (questionCode: string) => {
        // Confirmation is now handled in QuestionBank component
        setQuestions(prev => prev.filter(q => q.codigo_pregunta !== questionCode));
    };
    
    const handleAddQuiz = (newQuiz: Quiz) => {
        setQuizzes(prev => [newQuiz, ...prev]);
    };

    const handleUpdateQuiz = (updatedQuiz: Quiz) => {
        setQuizzes(prev => prev.map(q => q.id_cuestionario === updatedQuiz.id_cuestionario ? updatedQuiz : q));
    };

    const handleDeleteQuiz = (quizId: string) => {
        // Confirmation is now handled in QuizList component
        setQuizzes(prev => prev.filter(q => q.id_cuestionario !== quizId));
    };
    
    const handleSaveAssignment = (quizId: string, updatedData: Partial<Quiz>) => {
        setQuizzes(prev => prev.map(q => q.id_cuestionario === quizId ? { ...q, ...updatedData } : q));
    };

    const handleStartQuiz = (quizId: string) => {
        const quizToTake = quizzes.find(q => q.id_cuestionario === quizId);
        if (quizToTake) {
            const quizQuestions = quizToTake.preguntas
                .map(pq => questions.find(q => q.codigo_pregunta === pq.codigo_pregunta))
                .filter((q): q is Question => !!q);
            
            setActiveQuiz({ quiz: quizToTake, questions: quizQuestions });
            setView('take_quiz');
        }
    };
    
    const handleSubmitAttempt = (attempt: Attempt) => {
        setAttempts(prev => [...prev, attempt]);
        setActiveQuiz(null);
        // Redirect to the main view of the current user
        setView('dashboard'); 
    };

    const handleUpdateAttempt = (updatedAttempt: Attempt) => {
        setAttempts(prev => prev.map(a => a.id_intento === updatedAttempt.id_intento ? updatedAttempt : a));
    };

    // Handler to create quiz from bank selection
    const handleCreateQuizFromQuestions = (selectedQuestionIds: string[]) => {
        const selectedQuizQuestions: QuizQuestion[] = selectedQuestionIds.map(id => {
            const q = questions.find(question => question.codigo_pregunta === id);
            // Default score based on difficulty or 1
            return { codigo_pregunta: id, puntaje: q ? Math.max(1, Math.min(5, q.dificultad)) : 1 };
        });

        // Create a skeleton quiz object
        const draftQuiz: Quiz = {
            id_cuestionario: "", // Will be generated in form
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
            asignatura: "",
        };

        setPendingQuizDraft(draftQuiz);
        setView('quizzes');
    };

    // Derived State for User Switching
    const isTeacher = currentUserId === 'DOCENTE';
    const currentStudent = students.find(s => s.id === currentUserId);

    // Reset view when switching users
    useEffect(() => {
        setView('dashboard');
        setActiveQuiz(null);
    }, [currentUserId]);


    // Memoized statistics
    const studentStats = useMemo<StudentStats[]>(() => {
        const statsMap = new Map<string, { totalScore: number; totalGrade: number; count: number }>();
        attempts.forEach(attempt => {
            // Only count fully graded attempts for statistics
            if (attempt.estado === 'pendiente_revision') return;

            if (!statsMap.has(attempt.alumno_id)) {
                statsMap.set(attempt.alumno_id, { totalScore: 0, totalGrade: 0, count: 0 });
            }
            const current = statsMap.get(attempt.alumno_id)!;
            current.totalScore += attempt.porcentaje;
            // Use stored note or calculate it on the fly if missing (legacy data)
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
                
                // Consider correct if score > 0 (simplified logic, ideally compare with max score)
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

    const pendingQuizzes = useMemo(() => {
        // Simulating the view for all students. A real app would filter by a logged-in user.
        return quizzes.filter(quiz => {
            const isAvailable = new Date(quiz.ventana_disponibilidad.fin) > new Date();
            // Show quizzes that have assigned students but haven't been attempted by all of them.
            // This is a simplified logic for the dashboard view.
            const totalAttemptsForThisQuiz = attempts.filter(a => a.id_cuestionario === quiz.id_cuestionario).length;
            return isAvailable && quiz.alumnos_asignados.length > totalAttemptsForThisQuiz;
        });
    }, [quizzes, attempts]);

    const pendingReviewsCount = useMemo(() => {
        return attempts.filter(a => a.estado === 'pendiente_revision').length;
    }, [attempts]);

    const renderView = () => {
        // Common view for taking quizzes
        if (view === 'take_quiz' && activeQuiz) {
            return <QuizTaker 
                quiz={activeQuiz.quiz} 
                questions={activeQuiz.questions} 
                onSubmit={handleSubmitAttempt}
                studentId={isTeacher ? 'DOCENTE-PREVIEW' : currentUserId}
            />;
        }

        // Student View
        if (!isTeacher && currentStudent) {
            return <StudentDashboard 
                student={currentStudent}
                quizzes={quizzes}
                attempts={attempts}
                onStartQuiz={handleStartQuiz}
            />;
        }
        
        // Teacher Views
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
                />;
            case 'grading':
                return <GradingDashboard
                    attempts={attempts}
                    quizzes={quizzes}
                    questions={questions}
                    students={students}
                    onUpdateAttempt={handleUpdateAttempt}
                />
            case 'dashboard':
            default:
               return <Dashboard 
                    studentStats={studentStats} 
                    questionStats={questionStats}
                    quizStats={quizStats}
                    pendingQuizzes={pendingQuizzes}
                    onStartQuiz={handleStartQuiz}
               />;
        }
    };
    
    return (
        <div className="bg-background text-text-primary min-h-screen flex flex-col">
            <nav className="bg-surface shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                         <h1 className="text-2xl font-bold text-accent cursor-pointer" onClick={() => setView('dashboard')}>+ EvalúaMed</h1>
                         
                         {/* User Switcher for Demo Purposes */}
                         <div className="relative hidden md:block">
                            <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary h-4 w-4" />
                            <select 
                                value={currentUserId} 
                                onChange={(e) => setCurrentUserId(e.target.value)}
                                className="bg-background border border-secondary/30 text-sm rounded-full py-1 pl-9 pr-4 focus:ring-2 focus:ring-accent focus:outline-none appearance-none cursor-pointer hover:bg-secondary/10 transition-colors"
                            >
                                <option value="DOCENTE">Vista Docente (Admin)</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>Alumno: {s.name}</option>
                                ))}
                            </select>
                         </div>
                    </div>

                     {view !== 'take_quiz' && isTeacher && (
                        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
                             <button
                                onClick={() => setView('dashboard')}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${view === 'dashboard' ? 'bg-primary text-white' : 'hover:bg-secondary'}`}
                            >Principal</button>
                             <button
                                onClick={() => setView('quizzes')}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${view === 'quizzes' ? 'bg-primary text-white' : 'hover:bg-secondary'}`}
                            >Cuestionarios</button>
                            <button
                                onClick={() => setView('bank')}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${view === 'bank' ? 'bg-primary text-white' : 'hover:bg-secondary'}`}
                            >Preguntas</button>
                             <button
                                onClick={() => setView('grading')}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${view === 'grading' ? 'bg-primary text-white' : 'hover:bg-secondary'}`}
                            >
                                <ClipboardCheckIcon className="h-5 w-5" />
                                Revisiones
                                {pendingReviewsCount > 0 && (
                                    <span className="bg-warning text-background text-xs font-bold px-2 py-0.5 rounded-full">{pendingReviewsCount}</span>
                                )}
                            </button>
                            <button
                                onClick={() => setView('stats')}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${view === 'stats' ? 'bg-primary text-white' : 'hover:bg-secondary'}`}
                            >Estadísticas</button>
                        </div>
                     )}
                     
                     {!isTeacher && currentStudent && view !== 'take_quiz' && (
                         <div className="flex items-center gap-2">
                             <span className="text-sm text-text-secondary hidden sm:inline">Alumno:</span>
                             <span className="font-bold text-accent bg-primary/10 px-3 py-1 rounded-full">{currentStudent.name}</span>
                         </div>
                     )}
                </div>
            </nav>
            <main className="container mx-auto p-6 flex-grow">
                {renderView()}
            </main>
        </div>
    );
};

export default App;
