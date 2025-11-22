
import React, { useState, useEffect, useCallback } from 'react';
import { Quiz, Question, QuestionType, Attempt } from '../types';
import { VideoIcon, LinkIcon, ZoomInIcon, ZoomOutIcon, CloseIcon, RefreshIcon, PencilIcon, MenuIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, XCircleIcon } from './icons';
import ImageEditor from './ImageEditor';
import { calculateGrade, getGradeColor } from '../utils';

const QuizTaker: React.FC<{ quiz: Quiz; questions: Question[]; onSubmit: (attempt: Attempt) => void; studentId: string }> = ({ quiz, questions, onSubmit, studentId }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [startTime] = useState(new Date());
    const [timeLeft, setTimeLeft] = useState(quiz.tiempo_limite_minutos * 60);
    const [isConfirmingSubmit, setIsConfirmingSubmit] = useState(false);
    const [finalAttempt, setFinalAttempt] = useState<Attempt | null>(null);
    
    // Review Mode State
    const [showReview, setShowReview] = useState(false);

    // Sidebar Navigation State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Image Viewer State
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [editedImages, setEditedImages] = useState<Record<string, string>>({}); // Stores annotations per question code
    const [isEditorOpen, setIsEditorOpen] = useState(false);

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
        const hasFreeResponse = questions.some(q => q.tipo_pregunta === QuestionType.FreeResponse);
        
        // Calculate Grade (Nota)
        const grade = calculateGrade(totalObtainedScore, totalPossibleScore);

        const attempt: Attempt = {
            id_intento: `ATT-${Date.now()}`,
            id_cuestionario: quiz.id_cuestionario,
            alumno_id: studentId,
            inicio: startTime.toISOString(),
            fin: endTime.toISOString(),
            respuestas: answeredQuestions,
            puntaje_total_obtenido: totalObtainedScore,
            puntaje_total_posible: totalPossibleScore,
            porcentaje: totalPossibleScore > 0 ? (totalObtainedScore / totalPossibleScore) * 100 : 0,
            nota: grade,
            tiempo_utilizado_seg: Math.floor((endTime.getTime() - startTime.getTime()) / 1000),
            estado: timeLeft <= 0 ? 'expirado' : (hasFreeResponse ? 'pendiente_revision' : 'entregado')
        };

        setFinalAttempt(attempt);
        setIsConfirmingSubmit(false);
    }, [answers, questions, quiz, startTime, timeLeft, studentId]);

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

    // Image Viewer Handlers
    const handleImageClick = (src: string) => {
        setZoomedImage(src);
        setZoomLevel(1);
    };

    const handleZoomIn = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoomLevel(prev => Math.min(prev + 0.5, 4));
    };

    const handleZoomOut = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
    };

    const handleResetZoom = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoomLevel(1);
    };
    
    const handleEditImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditorOpen(true);
    };

    const handleSaveEditedImage = (newImageSrc: string) => {
        const currentQ = questions[currentQuestionIndex];
        setEditedImages(prev => ({
            ...prev,
            [currentQ.codigo_pregunta]: newImageSrc
        }));
        setZoomedImage(newImageSrc); // Update the currently viewed image
        setIsEditorOpen(false);
    };


    if (finalAttempt) {
        const isPendingReview = finalAttempt.estado === 'pendiente_revision';
        return (
            <div className="max-w-4xl mx-auto bg-surface p-8 rounded-lg shadow-2xl">
                <div className="text-center border-b border-secondary/20 pb-6 mb-6">
                    <h2 className="text-3xl font-bold text-accent mb-4">¡Cuestionario Finalizado!</h2>
                    {isPendingReview ? (
                         <div className="bg-warning/20 p-6 rounded-lg border border-warning/50 mb-6">
                            <p className="text-xl font-semibold text-warning mb-2">Pendiente de Revisión</p>
                            <p className="text-text-primary">
                                Tu cuestionario contiene preguntas de respuesta libre que requieren revisión manual por parte del docente. 
                                Tu nota actual es provisional.
                            </p>
                            <div className="mt-4 pt-4 border-t border-warning/30 flex justify-around">
                                <div>
                                    <p className="text-sm text-text-secondary">Puntaje Parcial</p>
                                    <p className="text-2xl font-bold">{finalAttempt.puntaje_total_obtenido} / {finalAttempt.puntaje_total_posible}</p>
                                </div>
                                 <div>
                                    <p className="text-sm text-text-secondary">Nota Parcial</p>
                                    <p className={`text-2xl font-bold ${getGradeColor(finalAttempt.nota || 1)}`}>{finalAttempt.nota?.toFixed(1)}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="bg-background p-4 rounded-lg border border-secondary/20">
                                    <p className="text-sm text-text-secondary">Puntaje Obtenido</p>
                                    <p className="text-3xl font-bold mt-1">
                                        {finalAttempt.puntaje_total_obtenido} / {finalAttempt.puntaje_total_posible}
                                    </p>
                                </div>
                                 <div className="bg-background p-4 rounded-lg border border-secondary/20">
                                    <p className="text-sm text-text-secondary">Nota Final</p>
                                    <p className={`text-5xl font-bold mt-1 ${getGradeColor(finalAttempt.nota || 1)}`}>
                                        {finalAttempt.nota?.toFixed(1)}
                                    </p>
                                    <p className="text-xs text-text-secondary mt-2">Escala 1.0 - 7.0 (60% Exigencia)</p>
                                </div>
                            </div>
                        </>
                    )}
                    
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setShowReview(!showReview)}
                            className="px-6 py-3 rounded-lg bg-secondary hover:bg-secondary/80 font-semibold transition-colors"
                        >
                            {showReview ? 'Ocultar Detalles' : 'Revisar Respuestas y Feedback'}
                        </button>
                        <button
                            onClick={() => onSubmit(finalAttempt)}
                            className="px-8 py-3 rounded-lg bg-primary hover:bg-primary-dark font-bold transition-colors text-white"
                        >
                            Volver al Panel
                        </button>
                    </div>
                </div>

                {showReview && (
                    <div className="space-y-8 animate-fade-in-down">
                        <h3 className="text-xl font-bold border-l-4 border-primary pl-3">Detalle de Respuestas</h3>
                        
                        {questions.map((q, index) => {
                            const response = finalAttempt.respuestas.find(r => r.codigo_pregunta === q.codigo_pregunta);
                            const userAnswer = response?.respuesta;
                            
                            let isCorrect = false;
                            let correctAnswerText = "";
                            
                            if (q.tipo_pregunta === QuestionType.MultipleChoice) {
                                const correctAlt = q.alternativas?.find(a => a.es_correcta);
                                isCorrect = userAnswer === correctAlt?.id;
                                correctAnswerText = `${correctAlt?.id}) ${correctAlt?.texto}`;
                            } else if (q.tipo_pregunta === QuestionType.TrueFalse) {
                                isCorrect = userAnswer === q.respuesta_correcta_vf;
                                correctAnswerText = q.respuesta_correcta_vf || "";
                            } else {
                                // Free response is not auto-graded in this view essentially
                                isCorrect = (response?.puntaje_obtenido || 0) > 0; 
                                correctAnswerText = "(Evaluación manual)";
                            }

                            const quizQuestion = quiz.preguntas.find(pq => pq.codigo_pregunta === q.codigo_pregunta);
                            const maxScore = quizQuestion?.puntaje || 0;

                            return (
                                <div key={q.codigo_pregunta} className={`bg-background p-6 rounded-xl border-l-4 shadow-sm ${isCorrect ? 'border-success' : q.tipo_pregunta === QuestionType.FreeResponse ? 'border-warning' : 'border-danger'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 block">Pregunta {index + 1}</span>
                                            <h4 className="text-lg font-medium text-text-primary">{q.enunciado}</h4>
                                        </div>
                                        <div className="flex-shrink-0 ml-4">
                                            {isCorrect ? (
                                                <CheckCircleIcon className="h-8 w-8 text-success" />
                                            ) : q.tipo_pregunta === QuestionType.FreeResponse ? (
                                                <div className="bg-warning/20 text-warning text-xs px-2 py-1 rounded font-bold">Pendiente</div>
                                            ) : (
                                                <XCircleIcon className="h-8 w-8 text-danger" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                                        <div className={`p-3 rounded-lg border ${isCorrect ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'}`}>
                                            <p className="font-semibold text-text-secondary mb-1">Tu Respuesta:</p>
                                            <p className={isCorrect ? 'text-success' : 'text-danger'}>
                                                {q.tipo_pregunta === QuestionType.MultipleChoice && userAnswer ? (
                                                    `${userAnswer}) ${q.alternativas?.find(a => a.id === userAnswer)?.texto || ''}`
                                                ) : userAnswer || "Sin responder"}
                                            </p>
                                        </div>
                                        {!isCorrect && q.tipo_pregunta !== QuestionType.FreeResponse && (
                                            <div className="p-3 rounded-lg bg-background border border-secondary/30">
                                                <p className="font-semibold text-text-secondary mb-1">Respuesta Correcta:</p>
                                                <p className="text-text-primary">{correctAnswerText}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* FEEDBACK SECTION */}
                                    <div className="mt-4 space-y-4">
                                        {isCorrect ? (
                                            <div className="bg-success/10 p-4 rounded-lg border border-success/20">
                                                <p className="text-xs font-bold text-success uppercase tracking-wider mb-2">Retroalimentación</p>
                                                <p className="text-text-secondary">{q.feedback_correcto}</p>
                                            </div>
                                        ) : (
                                            <div className="bg-danger/10 p-4 rounded-lg border border-danger/20">
                                                <p className="text-xs font-bold text-danger uppercase tracking-wider mb-2">Retroalimentación Constructiva</p>
                                                <p className="text-text-primary mb-2">{q.feedback_incorrecto}</p>
                                                
                                                {/* RESOURCES FOR INCORRECT ANSWERS */}
                                                {((q.adjuntos.links?.length || 0) > 0 || (q.adjuntos.videos?.length || 0) > 0) && (
                                                    <div className="mt-4 pt-4 border-t border-danger/20">
                                                        <p className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                                                            <LinkIcon className="h-4 w-4 text-accent" /> Material de Estudio Recomendado:
                                                        </p>
                                                        <div className="space-y-2">
                                                            {q.adjuntos.videos?.map((video, i) => (
                                                                <a key={i} href={video} target="_blank" rel="noreferrer" className="block text-xs bg-surface p-2 rounded hover:bg-secondary/20 transition-colors text-accent underline decoration-dashed">
                                                                    <VideoIcon className="inline h-3 w-3 mr-1" /> Video de Repaso {i + 1}
                                                                </a>
                                                            ))}
                                                            {q.adjuntos.links?.map((link, i) => (
                                                                <a key={i} href={link} target="_blank" rel="noreferrer" className="block text-xs bg-surface p-2 rounded hover:bg-secondary/20 transition-colors text-accent underline decoration-dashed">
                                                                    <LinkIcon className="inline h-3 w-3 mr-1" /> Recurso Externo {i + 1}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                         <div className="flex justify-center pt-6">
                            <button
                                onClick={() => onSubmit(finalAttempt)}
                                className="px-8 py-3 rounded-lg bg-primary hover:bg-primary-dark font-bold transition-colors text-white"
                            >
                                Finalizar Revisión
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return <div>Cargando pregunta...</div>;

    // Determine which image to show (original or edited by student)
    const displayImage = editedImages[currentQuestion.codigo_pregunta] || currentQuestion.adjuntos.imagenes?.[0];

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    return (
        <>
            <div className="flex flex-col md:flex-row gap-6 items-start max-w-7xl mx-auto">
                
                {/* Collapsible Sidebar Navigation */}
                <div className={`
                    fixed inset-0 z-40 md:static md:z-auto bg-surface/95 md:bg-surface md:rounded-lg md:shadow-lg border-r md:border border-secondary/20 transition-all duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:opacity-0'}
                    flex flex-col
                `}>
                    <div className="p-4 border-b border-secondary/20 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-text-primary">Navegación</h3>
                            <p className="text-xs text-text-secondary">{questions.length} Preguntas</p>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 rounded hover:bg-secondary/20">
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>
                    
                    <div className="p-4 overflow-y-auto flex-grow grid grid-cols-4 gap-2 content-start">
                        {questions.map((q, idx) => {
                            const isAnswered = !!answers[q.codigo_pregunta];
                            const isCurrent = currentQuestionIndex === idx;
                            return (
                                <button
                                    key={q.codigo_pregunta}
                                    onClick={() => {
                                        setCurrentQuestionIndex(idx);
                                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                                    }}
                                    className={`
                                        aspect-square rounded-lg flex items-center justify-center text-sm font-bold border transition-all
                                        ${isCurrent 
                                            ? 'border-accent ring-2 ring-accent ring-offset-2 ring-offset-surface z-10 bg-accent/10 text-accent' 
                                            : 'border-transparent'}
                                        ${isAnswered && !isCurrent
                                            ? 'bg-success/20 text-success border-success/30' 
                                            : ''}
                                        ${!isAnswered && !isCurrent
                                            ? 'bg-background text-text-secondary hover:bg-secondary/20'
                                            : ''}
                                    `}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-4 border-t border-secondary/20 bg-background/30 text-xs space-y-2">
                        <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded bg-accent/10 border border-accent"></div>
                             <span className="text-text-secondary">Actual</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded bg-success/20 border border-success/30"></div>
                             <span className="text-text-secondary">Respondida</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded bg-background border border-transparent"></div>
                             <span className="text-text-secondary">Pendiente</span>
                        </div>
                    </div>
                </div>
                
                {/* Sidebar Overlay for Mobile */}
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-30 md:hidden" 
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}

                {/* Main Content Area */}
                <div className="flex-grow w-full bg-surface p-6 md:p-8 rounded-lg shadow-2xl border border-secondary/20 relative">
                    
                    {/* Header with Menu Toggle and Timer */}
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-secondary/20">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 rounded-lg bg-background hover:bg-secondary/20 border border-secondary/20 transition-colors text-text-primary"
                                title={isSidebarOpen ? "Ocultar menú" : "Mostrar menú"}
                            >
                                <MenuIcon className="h-5 w-5" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold hidden sm:block">{quiz.titulo}</h2>
                                <p className="text-sm text-text-secondary">Pregunta {currentQuestionIndex + 1} de {questions.length}</p>
                            </div>
                        </div>
                        <div className={`text-lg font-bold px-3 py-1.5 rounded-lg border border-transparent ${timeLeft < 300 ? 'text-danger bg-danger/10 border-danger/20' : 'bg-background'}`}>
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                    </div>

                    <div className="mb-8 min-h-[300px]">
                        <h3 className="text-xl mb-4 font-medium leading-relaxed">{currentQuestion.enunciado}</h3>
                        
                        {/* Display Question Image */}
                        {displayImage && 
                            <div className="relative group inline-block">
                                <img 
                                    src={displayImage} 
                                    alt="Adjunto" 
                                    className="my-4 rounded-lg max-w-full md:max-w-lg max-h-[400px] object-contain mx-auto cursor-zoom-in hover:opacity-90 transition-opacity border border-secondary/20 shadow-lg"
                                    onClick={() => handleImageClick(displayImage)}
                                />
                                <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none backdrop-blur-sm">
                                    Clic para ampliar y editar
                                </div>
                            </div>
                        }
                        
                        {(currentQuestion.adjuntos.videos?.length || 0) > 0 || (currentQuestion.adjuntos.links?.length || 0) > 0 ? (
                            <div className="mt-4 space-y-3 bg-background/50 p-4 rounded-lg border border-secondary/10">
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Recursos Adicionales</p>
                                {currentQuestion.adjuntos.videos?.map((videoUrl, index) => (
                                    <a key={`video-${index}`} href={videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-accent hover:underline text-sm p-2 bg-surface rounded-md transition-colors hover:bg-secondary/20 border border-secondary/10">
                                        <VideoIcon className="h-4 w-4"/>
                                        <span>Video de apoyo {index + 1}</span>
                                    </a>
                                ))}
                                {currentQuestion.adjuntos.links?.map((linkUrl, index) => (
                                    <a key={`link-${index}`} href={linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-accent hover:underline text-sm p-2 bg-surface rounded-md transition-colors hover:bg-secondary/20 border border-secondary/10">
                                        <LinkIcon className="h-4 w-4"/>
                                        <span>Enlace de referencia {index + 1}</span>
                                    </a>
                                ))}
                            </div>
                        ) : null}
                        
                        {/* Answers Section */}
                        <div className="mt-6">
                            {currentQuestion.tipo_pregunta === QuestionType.MultipleChoice && currentQuestion.alternativas && (
                                <div className="grid grid-cols-1 gap-3">
                                    {currentQuestion.alternativas.map(alt => (
                                        <button
                                            key={alt.id}
                                            onClick={() => handleAnswerSelect(currentQuestion.codigo_pregunta, alt.id)}
                                            className={`group relative p-4 pl-12 rounded-xl text-left transition-all duration-200 border-2 ${
                                                answers[currentQuestion.codigo_pregunta] === alt.id
                                                    ? 'bg-primary/10 border-primary shadow-md'
                                                    : 'bg-background hover:bg-surface border-secondary/20 hover:border-primary/50'
                                            }`}
                                        >
                                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                answers[currentQuestion.codigo_pregunta] === alt.id ? 'border-primary bg-primary' : 'border-secondary/40 group-hover:border-primary'
                                            }`}>
                                                {answers[currentQuestion.codigo_pregunta] === alt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <span className="text-lg text-text-primary">{alt.texto}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {currentQuestion.tipo_pregunta === QuestionType.TrueFalse && (
                                <div className="flex justify-center gap-6 mt-6">
                                    {['Verdadero', 'Falso'].map(option => (
                                    <button
                                            key={option}
                                            onClick={() => handleAnswerSelect(currentQuestion.codigo_pregunta, option)}
                                            className={`w-40 py-4 rounded-xl text-lg font-bold transition-all duration-200 border-2 shadow-sm ${
                                                answers[currentQuestion.codigo_pregunta] === option
                                                    ? 'bg-primary text-white border-primary transform scale-105'
                                                    : 'bg-background hover:bg-surface border-secondary/20 hover:border-primary/50 text-text-secondary hover:text-text-primary'
                                            }`}
                                        >
                                        {option}
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {currentQuestion.tipo_pregunta === QuestionType.FreeResponse && (
                                <div className="mt-4">
                                    <textarea
                                        value={answers[currentQuestion.codigo_pregunta] || ''}
                                        onChange={(e) => handleAnswerSelect(currentQuestion.codigo_pregunta, e.target.value)}
                                        rows={8}
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-4 focus:ring-2 focus:ring-primary focus:outline-none text-lg leading-relaxed placeholder-secondary/30 resize-y"
                                        placeholder="Escribe tu respuesta detallada aquí..."
                                    />
                                    <p className="text-xs text-text-secondary mt-2 text-right">Se evaluará ortografía y redacción.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-secondary/20">
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-background border border-secondary/20 hover:bg-secondary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                        >
                            <ChevronLeftIcon className="h-4 w-4" /> Anterior
                        </button>
                        
                        {currentQuestionIndex === questions.length - 1 ? (
                            <button onClick={() => setIsConfirmingSubmit(true)} className="px-8 py-2.5 rounded-lg bg-success hover:bg-success/80 text-white font-bold shadow-lg shadow-success/20 transition-all transform hover:scale-105">
                                Finalizar y Entregar
                            </button>
                        ) : (
                             <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold shadow-lg shadow-primary/20 transition-all transform hover:scale-105"
                            >
                                Siguiente <ChevronRightIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isConfirmingSubmit && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface p-8 rounded-xl shadow-2xl max-w-md w-full text-center border border-secondary/20">
                        <h3 className="text-2xl font-bold mb-4">¿Estás seguro?</h3>
                        <p className="text-text-secondary mb-6">
                            Has respondido <span className="font-bold text-primary">{Object.keys(answers).length}</span> de <span className="font-bold">{questions.length}</span> preguntas.
                            <br/><br/>
                            Una vez entregado, no podrás modificar tus respuestas.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setIsConfirmingSubmit(false)}
                                className="px-6 py-2.5 rounded-lg bg-transparent border border-secondary/30 hover:bg-secondary/10 transition-colors"
                            >
                                Revisar
                            </button>
                            <button
                                onClick={calculateAndSetAttempt}
                                className="px-6 py-2.5 rounded-lg bg-success hover:bg-success/80 text-white font-bold shadow-lg shadow-success/20 transition-colors"
                            >
                                Entregar Todo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Image Viewer Modal */}
            {zoomedImage && !isEditorOpen && (
                <div 
                    className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[60] overflow-hidden"
                    onClick={() => setZoomedImage(null)}
                >
                    {/* Toolbar */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-surface/90 px-6 py-3 rounded-full flex items-center gap-4 shadow-xl z-[70]" onClick={(e) => e.stopPropagation()}>
                         <button 
                            onClick={handleZoomOut} 
                            className="p-2 hover:bg-secondary/50 rounded-full transition-colors text-text-primary"
                            title="Alejar"
                        >
                            <ZoomOutIcon className="h-6 w-6"/>
                        </button>
                        <span className="text-sm font-mono w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                        <button 
                            onClick={handleZoomIn} 
                            className="p-2 hover:bg-secondary/50 rounded-full transition-colors text-text-primary"
                            title="Acercar"
                        >
                            <ZoomInIcon className="h-6 w-6"/>
                        </button>
                        <div className="w-px h-6 bg-secondary/50 mx-2"></div>
                         <button 
                            onClick={handleResetZoom} 
                            className="p-2 hover:bg-secondary/50 rounded-full transition-colors text-text-primary"
                            title="Restablecer zoom"
                        >
                            <RefreshIcon className="h-5 w-5"/>
                        </button>
                        <button 
                            onClick={handleEditImage} 
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark rounded-full transition-colors text-white font-semibold text-sm ml-2"
                            title="Editar o anotar imagen"
                        >
                            <PencilIcon className="h-4 w-4"/> Editar / Anotar
                        </button>
                         <button 
                            onClick={() => setZoomedImage(null)} 
                            className="p-2 hover:bg-danger/20 text-danger rounded-full transition-colors ml-2"
                            title="Cerrar"
                        >
                            <CloseIcon className="h-6 w-6"/>
                        </button>
                    </div>

                    {/* Image Container with Scroll */}
                    <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
                        <div 
                            style={{ 
                                transform: `scale(${zoomLevel})`, 
                                transformOrigin: 'center center',
                                transition: 'transform 0.2s ease-out'
                            }}
                            className="cursor-grab active:cursor-grabbing"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img 
                                src={zoomedImage} 
                                alt="Vista ampliada" 
                                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                draggable={false}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Image Editor for Quiz Taker */}
            {isEditorOpen && (
                <ImageEditor 
                    isOpen={isEditorOpen}
                    onClose={() => setIsEditorOpen(false)}
                    onSave={handleSaveEditedImage}
                    imageSrc={zoomedImage}
                />
            )}
        </>
    );
};

export default QuizTaker;
