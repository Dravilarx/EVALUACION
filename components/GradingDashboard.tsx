
import React, { useState } from 'react';
import { Attempt, Quiz, Question, Student, QuestionType } from '../types';
import { CheckCircleIcon, CloseIcon, ClipboardCheckIcon } from './icons';
import { calculateGrade, getGradeColor } from '../utils';

interface GradingDashboardProps {
    attempts: Attempt[];
    quizzes: Quiz[];
    questions: Question[];
    students: Student[];
    onUpdateAttempt: (attempt: Attempt) => void;
}

const GradingDashboard: React.FC<GradingDashboardProps> = ({ attempts, quizzes, questions, students, onUpdateAttempt }) => {
    const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);
    const [gradingAnswers, setGradingAnswers] = useState<Record<string, number>>({});

    const pendingAttempts = attempts.filter(a => a.estado === 'pendiente_revision');

    const handleSelectAttempt = (attempt: Attempt) => {
        // Initialize local state with existing scores
        const initialScores: Record<string, number> = {};
        attempt.respuestas.forEach(r => {
            initialScores[r.codigo_pregunta] = r.puntaje_obtenido;
        });
        setGradingAnswers(initialScores);
        setSelectedAttempt(attempt);
    };

    const handleScoreChange = (questionCode: string, score: number, maxScore: number) => {
        const safeScore = Math.max(0, Math.min(maxScore, isNaN(score) ? 0 : score));
        setGradingAnswers(prev => ({ ...prev, [questionCode]: safeScore }));
    };

    const handleSaveGrading = () => {
        if (!selectedAttempt) return;

        const updatedAnswers = selectedAttempt.respuestas.map(r => ({
            ...r,
            puntaje_obtenido: gradingAnswers[r.codigo_pregunta] ?? r.puntaje_obtenido
        }));

        const totalObtained = updatedAnswers.reduce((sum, r) => sum + r.puntaje_obtenido, 0);
        
        // Recalculate Grade
        const grade = calculateGrade(totalObtained, selectedAttempt.puntaje_total_posible);

        const updatedAttempt: Attempt = {
            ...selectedAttempt,
            respuestas: updatedAnswers,
            puntaje_total_obtenido: totalObtained,
            porcentaje: selectedAttempt.puntaje_total_posible > 0 ? (totalObtained / selectedAttempt.puntaje_total_posible) * 100 : 0,
            nota: grade,
            estado: 'entregado'
        };

        onUpdateAttempt(updatedAttempt);
        setSelectedAttempt(null);
    };

    if (selectedAttempt) {
        const quiz = quizzes.find(q => q.id_cuestionario === selectedAttempt.id_cuestionario);
        const student = students.find(s => s.id === selectedAttempt.alumno_id);
        
        if (!quiz) return <div>Error: Cuestionario no encontrado</div>;

        // Calculate dynamic total as teacher grades
        const currentTotal = Object.values(gradingAnswers).reduce((a: number, b: number) => a + b, 0);
        const currentGrade = calculateGrade(currentTotal, selectedAttempt.puntaje_total_posible);

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-secondary/20 pb-4">
                    <div>
                         <h2 className="text-2xl font-bold flex items-center gap-2">
                            <ClipboardCheckIcon className="h-8 w-8 text-accent" /> 
                            Revisión de Intento
                        </h2>
                        <p className="text-text-secondary">Alumno: {student?.name || selectedAttempt.alumno_id} | Cuestionario: {quiz.titulo}</p>
                    </div>
                    <button onClick={() => setSelectedAttempt(null)} className="p-2 rounded-full hover:bg-secondary/50"><CloseIcon /></button>
                </div>

                <div className="space-y-6 pb-20">
                    {selectedAttempt.respuestas.map((response, index) => {
                        const question = questions.find(q => q.codigo_pregunta === response.codigo_pregunta);
                        const quizQuestion = quiz.preguntas.find(q => q.codigo_pregunta === response.codigo_pregunta);
                        const maxScore = quizQuestion?.puntaje || 0;

                        if (!question) return null;

                        const isFreeResponse = question.tipo_pregunta === QuestionType.FreeResponse;

                        return (
                            <div key={response.codigo_pregunta} className={`bg-surface p-6 rounded-lg shadow-md border ${isFreeResponse ? 'border-accent' : 'border-secondary/20'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-grow">
                                        <span className="text-xs font-bold bg-secondary/30 px-2 py-1 rounded text-text-secondary mb-2 inline-block">Pregunta {index + 1}</span>
                                        <h3 className="text-lg font-medium">{question.enunciado}</h3>
                                    </div>
                                    <div className="ml-4 bg-background p-3 rounded text-center min-w-[80px]">
                                        <p className="text-xs text-text-secondary">Puntaje</p>
                                        <div className="flex items-center justify-center gap-1">
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max={maxScore}
                                                step="0.5"
                                                disabled={!isFreeResponse}
                                                value={gradingAnswers[response.codigo_pregunta] ?? 0}
                                                onChange={(e) => handleScoreChange(response.codigo_pregunta, parseFloat(e.target.value), maxScore)}
                                                className={`w-16 text-center font-bold rounded p-1 border ${isFreeResponse ? 'bg-white text-black border-accent' : 'bg-transparent border-transparent text-text-primary'}`}
                                            />
                                            <span className="text-text-secondary">/ {maxScore}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-background/50 p-4 rounded-lg border border-secondary/10">
                                    <p className="text-sm text-text-secondary mb-1">Respuesta del Alumno:</p>
                                    <p className="font-medium whitespace-pre-wrap">{response.respuesta || <span className="italic text-text-secondary">Sin respuesta</span>}</p>
                                </div>

                                {isFreeResponse && question.criterios_rubrica && (
                                    <div className="mt-4">
                                        <p className="text-sm font-bold text-accent mb-2">Rúbrica de Evaluación:</p>
                                        <div className="grid gap-2">
                                            {question.criterios_rubrica.map((crit, idx) => (
                                                <div key={idx} className="bg-secondary/10 p-2 rounded text-sm border border-secondary/10">
                                                    <span className="font-semibold">{crit.criterio}</span> ({crit.max_puntos} pts): {crit.descriptor}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isFreeResponse && (
                                    <div className="mt-4">
                                         <p className="text-sm font-bold text-success mb-1">Feedback Correcto (Referencia):</p>
                                         <p className="text-sm text-text-secondary italic">{question.feedback_correcto}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-surface p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] border-t border-accent/50 flex justify-between items-center z-40 container mx-auto max-w-7xl rounded-t-xl">
                    <div className="flex gap-8 items-center">
                        <div>
                            <p className="text-sm text-text-secondary">Puntaje Total</p>
                            <p className="text-2xl font-bold">
                                {currentTotal} <span className="text-base text-text-secondary font-normal">/ {selectedAttempt.puntaje_total_posible}</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-text-secondary">Nota Preliminar</p>
                            <p className={`text-3xl font-bold ${getGradeColor(currentGrade)}`}>
                                {currentGrade.toFixed(1)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setSelectedAttempt(null)} className="px-6 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                            Cancelar
                        </button>
                        <button onClick={handleSaveGrading} className="px-6 py-2 rounded-lg bg-success hover:bg-success/80 font-bold text-white transition-colors flex items-center gap-2">
                            <CheckCircleIcon className="text-white"/> Finalizar Revisión
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-2">
                <ClipboardCheckIcon className="h-8 w-8 text-accent" /> 
                Revisiones Pendientes
            </h2>
            
            {pendingAttempts.length === 0 ? (
                <div className="bg-surface p-8 rounded-lg border-2 border-dashed border-secondary/30 text-center">
                    <CheckCircleIcon className="h-12 w-12 text-success mx-auto mb-4" />
                    <p className="text-lg font-medium">¡Todo al día!</p>
                    <p className="text-text-secondary">No hay intentos pendientes de revisión manual.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingAttempts.map(attempt => {
                        const quiz = quizzes.find(q => q.id_cuestionario === attempt.id_cuestionario);
                        const student = students.find(s => s.id === attempt.alumno_id);
                        return (
                            <div key={attempt.id_intento} className="bg-surface rounded-lg shadow-lg p-6 border border-secondary/20 hover:border-accent transition-colors cursor-pointer" onClick={() => handleSelectAttempt(attempt)}>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg truncate w-2/3" title={quiz?.titulo}>{quiz?.titulo}</h3>
                                    <span className="bg-warning/20 text-warning text-xs px-2 py-1 rounded font-semibold whitespace-nowrap">Pendiente</span>
                                </div>
                                <div className="space-y-2 text-sm text-text-secondary">
                                    <p><strong className="text-text-primary">Alumno:</strong> {student?.name || attempt.alumno_id}</p>
                                    <p><strong className="text-text-primary">Fecha:</strong> {new Date(attempt.fin).toLocaleDateString()} {new Date(attempt.fin).toLocaleTimeString()}</p>
                                    <p><strong className="text-text-primary">Puntaje Preliminar:</strong> {attempt.puntaje_total_obtenido} / {attempt.puntaje_total_posible}</p>
                                </div>
                                <button className="mt-4 w-full py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded transition-colors font-semibold">
                                    Revisar Ahora
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GradingDashboard;