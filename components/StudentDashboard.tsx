
import React, { useMemo } from 'react';
import { Quiz, Attempt, Student } from '../types';
import { PlayIcon, CheckCircleIcon, CalendarIcon, ClipboardCheckIcon } from './icons';
import { getGradeColor } from '../utils';

interface StudentDashboardProps {
    student: Student;
    quizzes: Quiz[];
    attempts: Attempt[];
    onStartQuiz: (quizId: string) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ student, quizzes, attempts, onStartQuiz }) => {
    
    const studentAttempts = useMemo(() => {
        return attempts.filter(a => a.alumno_id === student.id).sort((a, b) => new Date(b.fin).getTime() - new Date(a.fin).getTime());
    }, [attempts, student.id]);

    const assignedQuizzes = useMemo(() => {
        return quizzes.filter(q => q.alumnos_asignados.includes(student.id));
    }, [quizzes, student.id]);

    const availableQuizzes = useMemo(() => {
        const now = new Date();
        return assignedQuizzes.filter(q => {
            const startDate = new Date(q.ventana_disponibilidad.inicio);
            const endDate = new Date(q.ventana_disponibilidad.fin);
            
            // Check time window
            if (now < startDate || now > endDate) return false;

            // Check attempts limit
            const attemptsMade = studentAttempts.filter(a => a.id_cuestionario === q.id_cuestionario).length;
            if (q.intentos_permitidos > 0 && attemptsMade >= q.intentos_permitidos) return false;

            return true;
        });
    }, [assignedQuizzes, studentAttempts]);

    return (
        <div className="space-y-8">
            <div className="bg-surface p-6 rounded-lg border-l-4 border-primary shadow-md">
                <h2 className="text-3xl font-bold text-text-primary">Hola, {student.name}</h2>
                <p className="text-text-secondary mt-1">{student.course} - ID: {student.id}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Available Quizzes Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <PlayIcon className="text-accent" /> Evaluaciones Disponibles
                    </h3>
                    
                    {availableQuizzes.length === 0 ? (
                        <div className="bg-surface/50 border border-secondary/30 rounded-lg p-8 text-center">
                            <p className="text-text-secondary">No tienes evaluaciones pendientes en este momento.</p>
                        </div>
                    ) : (
                        availableQuizzes.map(quiz => (
                            <div key={quiz.id_cuestionario} className="bg-surface p-5 rounded-lg shadow-md border border-secondary/20 hover:border-accent transition-all flex flex-col sm:flex-row justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-lg">{quiz.titulo}</h4>
                                    <p className="text-sm text-text-secondary mb-2">{quiz.asignatura}</p>
                                    <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                                        <span className="flex items-center gap-1 bg-background px-2 py-1 rounded">
                                            <CalendarIcon className="h-3 w-3" /> Vence: {new Date(quiz.ventana_disponibilidad.fin).toLocaleDateString()}
                                        </span>
                                        <span className="bg-background px-2 py-1 rounded">
                                            Tiempo: {quiz.tiempo_limite_minutos} min
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <button 
                                        onClick={() => onStartQuiz(quiz.id_cuestionario)}
                                        className="w-full sm:w-auto px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/20 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                                    >
                                        <PlayIcon className="h-5 w-5" /> Iniciar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* History Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <ClipboardCheckIcon className="text-success" /> Historial de Intentos
                    </h3>

                    {studentAttempts.length === 0 ? (
                        <div className="bg-surface/50 border border-secondary/30 rounded-lg p-8 text-center">
                            <p className="text-text-secondary">Aún no has realizado ninguna evaluación.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {studentAttempts.map(attempt => {
                                const quiz = quizzes.find(q => q.id_cuestionario === attempt.id_cuestionario);
                                return (
                                    <div key={attempt.id_intento} className="bg-surface p-4 rounded-lg border border-secondary/20 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-semibold">{quiz?.titulo || 'Cuestionario eliminado'}</h4>
                                            <p className="text-xs text-text-secondary">
                                                {new Date(attempt.fin).toLocaleDateString()} • {attempt.puntaje_total_obtenido}/{attempt.puntaje_total_posible} pts
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {attempt.estado === 'pendiente_revision' ? (
                                                <span className="bg-warning/20 text-warning text-xs px-2 py-1 rounded font-bold border border-warning/30">
                                                    En Revisión
                                                </span>
                                            ) : (
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-2xl font-bold ${getGradeColor(attempt.nota || 1)}`}>
                                                        {attempt.nota?.toFixed(1)}
                                                    </span>
                                                    <span className="text-[10px] text-text-secondary uppercase tracking-wider">Nota</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
