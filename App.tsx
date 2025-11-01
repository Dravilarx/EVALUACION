import React, { useState, useMemo } from 'react';
import { Question, Quiz, Attempt, Student, StudentStats, QuestionStats, QuizStats } from './types';
import { initialQuestions, initialQuizzes, initialAttempts, mockStudents } from './data/mockData';
import QuestionBank from './components/QuestionBank';
import QuizList from './components/QuizList';
import StatisticsDashboard from './components/StatisticsDashboard';
import QuizTaker from './components/QuizTaker';
import Dashboard from './components/Dashboard';
import { DashboardIcon } from './components/icons';

type View = 'dashboard' | 'bank' | 'quizzes' | 'stats' | 'take_quiz';

const App: React.FC = () => {
    const [view, setView] = useState<View>('dashboard');
    
    // State
    const [questions, setQuestions] = useState<Question[]>(initialQuestions);
    const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes);
    const [attempts, setAttempts] = useState<Attempt[]>(initialAttempts);
    const [students] = useState<Student[]>(mockStudents);
    const [activeQuiz, setActiveQuiz] = useState<{ quiz: Quiz; questions: Question[] } | null>(null);
    
    // Handlers
    const handleAddQuestion = (newQuestion: Question) => {
        setQuestions(prev => [newQuestion, ...prev]);
    };
    
    const handleAddQuiz = (newQuiz: Quiz) => {
        setQuizzes(prev => [newQuiz, ...prev]);
    };

    const handleUpdateQuiz = (updatedQuiz: Quiz) => {
        setQuizzes(prev => prev.map(q => q.id_cuestionario === updatedQuiz.id_cuestionario ? updatedQuiz : q));
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
        setView('quizzes');
    };


    // Memoized statistics
    const studentStats = useMemo<StudentStats[]>(() => {
        const statsMap = new Map<string, { totalScore: number; count: number }>();
        attempts.forEach(attempt => {
            if (!statsMap.has(attempt.alumno_id)) {
                statsMap.set(attempt.alumno_id, { totalScore: 0, count: 0 });
            }
            const current = statsMap.get(attempt.alumno_id)!;
            current.totalScore += attempt.porcentaje;
            current.count++;
        });

        return students.map(student => {
            const studentAttempts = statsMap.get(student.id);
            return {
                studentId: student.id,
                studentName: student.name,
                studentCourse: student.course,
                attemptCount: studentAttempts?.count || 0,
                averageScore: studentAttempts ? studentAttempts.totalScore / studentAttempts.count : 0,
            };
        });
    }, [attempts, students]);

     const questionStats = useMemo<QuestionStats[]>(() => {
        const statsMap = new Map<string, { correct: number; total: number }>();
        attempts.forEach(attempt => {
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

    const renderView = () => {
        if (view === 'take_quiz' && activeQuiz) {
            return <QuizTaker quiz={activeQuiz.quiz} questions={activeQuiz.questions} onSubmit={handleSubmitAttempt} />;
        }
        
        switch (view) {
            case 'bank':
                return <QuestionBank questions={questions} onAddQuestion={handleAddQuestion} />;
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
                    allQuestions={questions}
                    allStudents={students}
                    onSaveAssignment={handleSaveAssignment}
                />;
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
        <div className="bg-background text-text-primary min-h-screen">
            <nav className="bg-surface shadow-md">
                <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-accent">+ EvalúaMed</h1>
                     {view !== 'take_quiz' && (
                        <div className="flex items-center space-x-2">
                             <button
                                onClick={() => setView('dashboard')}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${view === 'dashboard' ? 'bg-primary text-white' : 'hover:bg-secondary'}`}
                            >Principal</button>
                             <button
                                onClick={() => setView('quizzes')}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${view === 'quizzes' ? 'bg-primary text-white' : 'hover:bg-secondary'}`}
                            >Cuestionarios</button>
                            <button
                                onClick={() => setView('bank')}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${view === 'bank' ? 'bg-primary text-white' : 'hover:bg-secondary'}`}
                            >Preguntas</button>
                            <button
                                onClick={() => setView('stats')}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${view === 'stats' ? 'bg-primary text-white' : 'hover:bg-secondary'}`}
                            >Estadísticas</button>
                        </div>
                     )}
                </div>
            </nav>
            <main className="container mx-auto p-6">
                {renderView()}
            </main>
        </div>
    );
};

export default App;
