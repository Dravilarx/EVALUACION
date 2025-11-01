import React, { useState, useEffect, useCallback } from 'react';
import { Quiz, Question, QuestionType, Attempt } from '../types';

const QuizTaker: React.FC<{ quiz: Quiz; questions: Question[]; onSubmit: (attempt: Attempt) => void }> = ({ quiz, questions, onSubmit }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [startTime] = useState(new Date());
    const [timeLeft, setTimeLeft] = useState(quiz.tiempo_limite_minutos * 60);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [isConfirmingSubmit, setIsConfirmingSubmit] = useState(false);
    const [finalAttempt, setFinalAttempt] = useState<Attempt | null>(null);

    // Fix: Define handleAnswerSelect function to update the answers state.
    const handleAnswerSelect = (questionCode: string, answer: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionCode]: answer
        }));
    };

    const calculateAndSetAttempt = useCallback(() => {
        const endTime = new Date();
        const answeredQuestions = questions.map(q => {
            const userAnswer = answers[q.codigo_pregunta];
            let score = 0;
            if (userAnswer) {
                switch (q.tipo_pregunta) {
                    case QuestionType.MultipleChoice:
                        const correctAlt = q.alternativas?.find(a => a.es_correcta);
                        if (correctAlt?.id === userAnswer) {
                            score = quiz.preguntas.find(pq => pq.codigo_pregunta === q.codigo_pregunta)?.puntaje || 0;
                        }
                        break;
                    case QuestionType.TrueFalse:
                        if (q.respuesta_correcta_vf === userAnswer) {
                             score = quiz.preguntas.find(pq => pq.codigo_pregunta === q.codigo_pregunta)?.puntaje || 0;
                        }
                        break;
                    case QuestionType.FreeResponse:
                        // Manual grading required, score is 0 for now
                        score = 0;
                        break;
                }
            }
            return {
                codigo_pregunta: q.codigo_pregunta,
                respuesta: userAnswer || '',
                puntaje_obtenido: score
            };
        });
        
        const totalPossibleScore = quiz.preguntas.reduce((sum, q) => sum + q.puntaje, 0);
        const totalObtainedScore = answeredQuestions.reduce((sum, a) => sum + a.puntaje_obtenido, 0);
        
        const attempt: Attempt = {
            id_intento: `ATT-${Date.now()}`,
            id_cuestionario: quiz.id_cuestionario,
            alumno_id: "ALU-CURRENT", // Mocked student ID
            inicio: startTime.toISOString(),
            fin: endTime.toISOString(),
            respuestas: answeredQuestions,
            puntaje_total_obtenido: totalObtainedScore,
            puntaje_total_posible: totalPossibleScore,
            porcentaje: totalPossibleScore > 0 ? (totalObtainedScore / totalPossibleScore) * 100 : 0,
            tiempo_utilizado_seg: Math.floor((endTime.getTime() - startTime.getTime()) / 1000),
            estado: timeLeft <= 0 ? 'expirado' : 'entregado'
        };

        setFinalAttempt(attempt);
        setIsConfirmingSubmit(false);
    }, [answers, questions, quiz, startTime, timeLeft]);

    useEffect(() => {
        if (timeLeft <= 0) {
            calculateAndSetAttempt();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, calculateAndSetAttempt]);


    if (finalAttempt) {
        const hasFreeResponse = questions.some(q => q.tipo_pregunta === QuestionType.FreeResponse);
        return (
            <div className="max-w-2xl mx-auto bg-surface p-8 rounded-lg shadow-2xl text-center">
                <h2 className="text-3xl font-bold text-accent mb-4">¡Cuestionario Finalizado!</h2>
                <p className="text-lg">Tu puntaje es:</p>
                <p className="text-5xl font-bold my-4">
                    {finalAttempt.puntaje_total_obtenido} / {finalAttempt.puntaje_total_posible}
                </p>
                <p className="text-2xl text-text-secondary mb-6">
                    ({finalAttempt.porcentaje.toFixed(1)}%)
                </p>
                {hasFreeResponse && (
                    <div className="bg-background/50 p-4 rounded-lg text-warning border border-warning/50 my-4">
                        <p><strong>Nota:</strong> Este cuestionario contiene preguntas de respuesta libre. El puntaje final será calculado después de la corrección manual por parte de tu docente.</p>
                    </div>
                )}
                <button
                    onClick={() => onSubmit(finalAttempt)}
                    className="mt-6 px-8 py-3 rounded-lg bg-primary hover:bg-primary-dark font-bold transition-colors"
                >
                    Volver a Cuestionarios
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return <div>Cargando pregunta...</div>;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    return (
        <>
            <div className="max-w-4xl mx-auto bg-surface p-8 rounded-lg shadow-2xl">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-secondary/20">
                    <div>
                        <h2 className="text-2xl font-bold">{quiz.titulo}</h2>
                        <p className="text-text-secondary">Pregunta {currentQuestionIndex + 1} de {questions.length}</p>
                    </div>
                    <div className={`text-xl font-bold px-4 py-2 rounded-lg ${timeLeft < 300 ? 'text-danger bg-danger/20' : ''}`}>
                        Tiempo: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                </div>

                <div className="mb-8 min-h-[300px]">
                    <h3 className="text-xl mb-4">{currentQuestion.enunciado}</h3>
                    {currentQuestion.adjuntos.imagenes?.[0] && 
                        <img 
                            src={currentQuestion.adjuntos.imagenes[0]} 
                            alt="Adjunto" 
                            className="my-4 rounded-lg max-w-sm mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setZoomedImage(currentQuestion.adjuntos.imagenes![0])}
                        />
                    }
                    
                    {currentQuestion.tipo_pregunta === QuestionType.MultipleChoice && currentQuestion.alternativas && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentQuestion.alternativas.map(alt => (
                                <button
                                    key={alt.id}
                                    onClick={() => handleAnswerSelect(currentQuestion.codigo_pregunta, alt.id)}
                                    className={`p-4 rounded-lg text-left transition-all duration-200 border-2 ${
                                        answers[currentQuestion.codigo_pregunta] === alt.id
                                            ? 'bg-primary border-accent'
                                            : 'bg-background hover:bg-background/70 border-secondary/30'
                                    }`}
                                >
                                    <span className="font-bold mr-2">{alt.id})</span> {alt.texto}
                                </button>
                            ))}
                        </div>
                    )}

                    {currentQuestion.tipo_pregunta === QuestionType.TrueFalse && (
                        <div className="flex justify-center gap-4">
                            {['Verdadero', 'Falso'].map(option => (
                            <button
                                    key={option}
                                    onClick={() => handleAnswerSelect(currentQuestion.codigo_pregunta, option)}
                                    className={`px-8 py-4 rounded-lg text-lg font-bold transition-all duration-200 border-2 ${
                                        answers[currentQuestion.codigo_pregunta] === option
                                            ? 'bg-primary border-accent'
                                            : 'bg-background hover:bg-background/70 border-secondary/30'
                                    }`}
                                >
                                {option}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {currentQuestion.tipo_pregunta === QuestionType.FreeResponse && (
                        <textarea
                            value={answers[currentQuestion.codigo_pregunta] || ''}
                            onChange={(e) => handleAnswerSelect(currentQuestion.codigo_pregunta, e.target.value)}
                            rows={6}
                            className="w-full bg-background border border-secondary/30 rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="Escribe tu respuesta aquí..."
                        />
                    )}
                </div>

                <div className="flex justify-between items-center mt-8 pt-4 border-t border-secondary/20">
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-6 py-2 rounded-lg bg-secondary hover:bg-secondary/80 disabled:bg-secondary/30 disabled:cursor-not-allowed transition-colors"
                    >
                        Anterior
                    </button>
                    
                    <button onClick={() => setIsConfirmingSubmit(true)} className="px-6 py-2 rounded-lg bg-success hover:bg-success/80 font-bold transition-colors">
                        Finalizar y Entregar
                    </button>
                    
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        disabled={currentQuestionIndex === questions.length - 1}
                        className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark disabled:bg-primary/30 disabled:cursor-not-allowed transition-colors"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {isConfirmingSubmit && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface p-8 rounded-lg shadow-2xl max-w-md w-full text-center">
                        <h3 className="text-2xl font-bold mb-4">¿Estás seguro?</h3>
                        <p className="text-text-secondary mb-6">
                            Una vez que entregues el cuestionario, no podrás volver a modificar tus respuestas. Se registrará tu puntaje actual.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setIsConfirmingSubmit(false)}
                                className="px-6 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={calculateAndSetAttempt}
                                className="px-6 py-2 rounded-lg bg-success hover:bg-success/80 font-bold transition-colors"
                            >
                                Confirmar Entrega
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {zoomedImage && (
                <div 
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-zoom-out"
                    onClick={() => setZoomedImage(null)}
                >
                    <img 
                        src={zoomedImage} 
                        alt="Vista ampliada" 
                        className="max-w-full max-h-full object-contain rounded-lg cursor-default"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
        </>
    );
};

export default QuizTaker;