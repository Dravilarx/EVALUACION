import React from 'react';
import { Quiz, StudentStats, QuestionStats, QuizStats } from '../types';
import { PlayIcon, UsersIcon, BriefcaseIcon } from './icons';

interface DashboardProps {
    studentStats: StudentStats[];
    questionStats: QuestionStats[];
    quizStats: QuizStats[];
    pendingQuizzes: Quiz[];
    onStartQuiz: (quizId: string) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; subtext: string; icon: React.ReactNode }> = ({ title, value, subtext, icon }) => (
    <div className="bg-surface p-6 rounded-lg shadow-lg flex items-start justify-between border border-secondary/20">
        <div>
            <p className="text-sm text-text-secondary">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-text-secondary mt-2">{subtext}</p>
        </div>
        <div className="bg-primary/20 p-3 rounded-full text-accent">
            {icon}
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ studentStats, questionStats, quizStats, pendingQuizzes, onStartQuiz }) => {
    
    const totalQuizzes = quizStats.length;
    const totalQuestions = questionStats.length;
    const totalTeachers = new Set(questionStats.map(q => q.docente_creador)).size;

    const totalAttempts = studentStats.reduce((sum, s) => sum + s.attemptCount, 0);
    const totalStudents = studentStats.length;
    const overallAverageScore = studentStats.length > 0
        ? studentStats.reduce((sum, s) => sum + (s.averageScore * s.attemptCount), 0) / (totalAttempts || 1)
        : 0;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold">Panel Principal</h2>
                <p className="text-text-secondary mt-1">Resumen de la actividad en la plataforma.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <StatCard 
                    title="Actividad de Docentes"
                    value={totalQuizzes}
                    subtext={`${totalQuestions} preguntas | ${totalTeachers} docentes activos`}
                    icon={<BriefcaseIcon className="h-6 w-6" />}
                />
                <StatCard 
                    title="Actividad de Alumnos"
                    value={totalAttempts}
                    subtext={`${totalStudents} alumnos | ${overallAverageScore.toFixed(1)}% nota media`}
                    icon={<UsersIcon className="h-6 w-6" />}
                />
            </div>
            
            <div>
                <h3 className="text-2xl font-bold">Cuestionarios Pendientes</h3>
                <div className="mt-4 space-y-4">
                    {pendingQuizzes.length > 0 ? pendingQuizzes.map(quiz => (
                         <div key={quiz.id_cuestionario} className="bg-surface p-4 rounded-lg shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-secondary/20 hover:border-primary transition-colors">
                            <div>
                                <h4 className="font-bold text-lg">{quiz.titulo}</h4>
                                <p className="text-sm text-text-secondary mt-1">{quiz.asignatura} - {quiz.docente_creador}</p>
                                <p className="text-xs text-text-secondary mt-2">{quiz.preguntas.length} preguntas • {quiz.tiempo_limite_minutos} min</p>
                            </div>
                            <button 
                                onClick={() => onStartQuiz(quiz.id_cuestionario)}
                                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark font-semibold transition-colors w-full sm:w-auto"
                            >
                                <PlayIcon /> Comenzar
                            </button>
                        </div>
                    )) : (
                        <div className="text-center text-text-secondary p-8 border-2 border-dashed border-secondary/30 rounded-lg">
                            <p>¡Felicidades! No tienes cuestionarios pendientes.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
