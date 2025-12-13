
import React, { useState, useEffect } from 'react';
import { StudentService, QuizService, AttemptService, CompetencyService, PresentationService, SubjectService, TeacherService, ActaService, ManualGradeService, FinalExamService, SixMonthExamService } from '../services/dataService';
import { generateActaFeedback } from '../services/geminiService';
import { Student, Quiz, Attempt, CompetencyEvaluation, PresentationEvaluation, Subject, Teacher, Acta, ManualGradeEntry, FinalExam, SixMonthExam } from '../types';
import GradesTab from './GradesTab';
import TransversalGradesTab from './TransversalGradesTab';
import FinalExamTab from './FinalExamTab';
import SixMonthExamTab from './SixMonthExamTab';
import RadiologyFinalGradeTab from './RadiologyFinalGradeTab';
import { RefreshIcon, TableIcon, DocumentTextIcon, CloseIcon, CheckCircleIcon, ChartBarIcon, ScreenIcon, ClipboardCheckIcon, SparklesIcon, BriefcaseIcon, AcademicIcon } from './icons'; 
import { getGradeColor } from '../utils';

interface GradesModuleProps {
    currentUserId: string;
}

const GradesModule: React.FC<GradesModuleProps> = ({ currentUserId }) => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'grades' | 'transversal' | 'six_month_exam' | 'final_exam' | 'final_radiology'>('grades');
    const [students, setStudents] = useState<Student[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [competencies, setCompetencies] = useState<CompetencyEvaluation[]>([]);
    const [presentations, setPresentations] = useState<PresentationEvaluation[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [actas, setActas] = useState<Acta[]>([]);
    const [manualGrades, setManualGrades] = useState<ManualGradeEntry[]>([]);
    const [finalExams, setFinalExams] = useState<FinalExam[]>([]);
    const [sixMonthExams, setSixMonthExams] = useState<SixMonthExam[]>([]);

    // State for Acta Generation Modal
    const [isActaModalOpen, setIsActaModalOpen] = useState(false);
    const [actaCandidate, setActaCandidate] = useState<any>(null);
    const [teacherFeedback, setTeacherFeedback] = useState('');
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [st, qz, at, co, pr, su, te, ac, mg, fe, sme] = await Promise.all([
                    StudentService.getAll(),
                    QuizService.getAll(),
                    AttemptService.getAll(),
                    CompetencyService.getAll(),
                    PresentationService.getAll(),
                    SubjectService.getAll(),
                    TeacherService.getAll(),
                    ActaService.getAll(),
                    ManualGradeService.getAll(),
                    FinalExamService.getAll(),
                    SixMonthExamService.getAll()
                ]);
                setStudents(st);
                setQuizzes(qz);
                setAttempts(at);
                setCompetencies(co);
                setPresentations(pr);
                setSubjects(su);
                setTeachers(te);
                setActas(ac);
                setManualGrades(mg);
                setFinalExams(fe);
                setSixMonthExams(sme);
            } catch (error) {
                console.error("Error loading grades data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleInitiateActa = (rowData: any) => {
        if (!rowData.finalGrade) {
            alert("No se puede generar un acta sin nota final calculada.");
            return;
        }
        setActaCandidate(rowData);
        setTeacherFeedback('');
        setIsActaModalOpen(true);
    };

    const handleAIFeedback = async () => {
        if (!actaCandidate) return;
        setIsGeneratingFeedback(true);
        try {
            const feedback = await generateActaFeedback({
                studentName: actaCandidate.studentName,
                subjectName: actaCandidate.subjectName,
                finalGrade: actaCandidate.finalGrade || 0,
                writtenGrade: actaCandidate.writtenGrade || 0,
                competencyGrade: actaCandidate.competencyGrade || 0,
                presentationGrade: actaCandidate.presentationGrade || 0,
                competencyDetails: actaCandidate.competencyDetails || {},
                presentationDetails: actaCandidate.presentationDetails || {}
            });
            setTeacherFeedback(feedback);
        } catch (error) {
            alert("No se pudo generar el feedback con IA. Por favor, inténtelo de nuevo.");
        } finally {
            setIsGeneratingFeedback(false);
        }
    };

    const handleConfirmActaGeneration = async () => {
        if (!actaCandidate) return;

        const newActa: Acta = {
            id: `ACTA-${Date.now()}`,
            studentId: actaCandidate.studentId,
            subjectId: actaCandidate.subjectId,
            teacherId: actaCandidate.leadTeacherId,
            generatedAt: new Date().toISOString(),
            status: 'Pendiente',
            content: {
                writtenGrade: actaCandidate.writtenGrade,
                competencyGrade: actaCandidate.competencyGrade,
                presentationGrade: actaCandidate.presentationGrade,
                finalGrade: actaCandidate.finalGrade,
                competencyDetails: actaCandidate.competencyDetails,
                presentationDetails: actaCandidate.presentationDetails,
                writtenComment: teacherFeedback // Save the feedback
            }
        };

        try {
            const saved = await ActaService.create(newActa);
            setActas(prev => [saved, ...prev]);
            alert("Acta generada exitosamente. Ahora está disponible para la aceptación del residente.");
            setIsActaModalOpen(false);
            setActaCandidate(null);
            // Was navigating to actas tab, now stay on grades or do nothing
        } catch (error) {
            console.error(error);
            alert("Error al generar el acta.");
        }
    };

    const handleManualGradeUpdate = (newEntry: ManualGradeEntry) => {
        setManualGrades(prev => {
            const index = prev.findIndex(m => m.studentId === newEntry.studentId && m.subjectId === newEntry.subjectId && m.type === newEntry.type);
            if (index >= 0) {
                const updated = [...prev];
                updated[index] = newEntry;
                return updated;
            }
            return [...prev, newEntry];
        });
    };

    const handleFinalExamUpdate = (exam: FinalExam) => {
        setFinalExams(prev => {
            const idx = prev.findIndex(e => e.id === exam.id);
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = exam;
                return updated;
            }
            return [exam, ...prev];
        });
    };

    const handleSixMonthExamUpdate = (exam: SixMonthExam) => {
        setSixMonthExams(prev => {
            const idx = prev.findIndex(e => e.id === exam.id);
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = exam;
                return updated;
            }
            return [exam, ...prev];
        });
    };

    // Filter Standard Subjects for GradesTab
    const standardSubjects = subjects.filter(s => s.type !== 'Transversal');

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3 opacity-60">
                     <RefreshIcon className="h-10 w-10 animate-spin text-primary" />
                     <p className="font-medium">Calculando calificaciones...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up h-full flex flex-col relative">
            <div className="flex border-b border-secondary/20 mb-6 gap-6 overflow-x-auto flex-shrink-0">
                <button 
                    onClick={() => setActiveTab('grades')}
                    className={`pb-3 px-2 font-bold text-sm transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${activeTab === 'grades' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    <TableIcon className="h-5 w-5" /> Libro de Notas
                </button>
                <button 
                    onClick={() => setActiveTab('transversal')}
                    className={`pb-3 px-2 font-bold text-sm transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${activeTab === 'transversal' ? 'border-purple-600 text-purple-600' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    <BriefcaseIcon className="h-5 w-5" /> Ramos Transversales
                </button>
                <button 
                    onClick={() => setActiveTab('six_month_exam')}
                    className={`pb-3 px-2 font-bold text-sm transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${activeTab === 'six_month_exam' ? 'border-pink-600 text-pink-600' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    <ClipboardCheckIcon className="h-5 w-5" /> Examen 6 Meses
                </button>
                <button 
                    onClick={() => setActiveTab('final_exam')}
                    className={`pb-3 px-2 font-bold text-sm transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${activeTab === 'final_exam' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    <AcademicIcon className="h-5 w-5" /> Examen Final
                </button>
                <button 
                    onClick={() => setActiveTab('final_radiology')}
                    className={`pb-3 px-2 font-bold text-sm transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${activeTab === 'final_radiology' ? 'border-purple-600 text-purple-600' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    <AcademicIcon className="h-5 w-5" /> Nota Final Titulación
                </button>
            </div>

            <div className="flex-grow overflow-y-auto">
                {activeTab === 'grades' && (
                    <GradesTab 
                        students={students}
                        quizzes={quizzes}
                        attempts={attempts}
                        competencies={competencies}
                        presentations={presentations}
                        subjects={standardSubjects} // Pass filtered subjects
                        teachers={teachers}
                        currentUserId={currentUserId}
                        onGenerateActa={handleInitiateActa}
                        existingActas={actas}
                        manualGrades={manualGrades}
                        onManualGradeUpdate={handleManualGradeUpdate}
                    />
                )}

                {activeTab === 'transversal' && (
                    <TransversalGradesTab 
                        students={students}
                        subjects={subjects}
                        teachers={teachers}
                        currentUserId={currentUserId}
                        manualGrades={manualGrades}
                        onManualGradeUpdate={handleManualGradeUpdate}
                    />
                )}

                {activeTab === 'six_month_exam' && (
                    <SixMonthExamTab 
                        students={students}
                        teachers={teachers}
                        currentUserId={currentUserId}
                        exams={sixMonthExams}
                        onUpdate={handleSixMonthExamUpdate}
                    />
                )}

                {activeTab === 'final_exam' && (
                    <FinalExamTab 
                        students={students}
                        teachers={teachers}
                        currentUserId={currentUserId}
                        finalExams={finalExams}
                        onUpdate={handleFinalExamUpdate}
                    />
                )}

                {activeTab === 'final_radiology' && (
                    <RadiologyFinalGradeTab 
                        students={students}
                        subjects={subjects}
                        actas={actas}
                        manualGrades={manualGrades}
                        finalExams={finalExams}
                    />
                )}
            </div>

            {/* ACTA GENERATION MODAL */}
            {isActaModalOpen && actaCandidate && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface w-full max-w-2xl rounded-xl shadow-2xl flex flex-col border border-secondary/20 animate-fade-in-up">
                        <header className="p-6 border-b border-secondary/20 bg-secondary/5 rounded-t-xl flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-text-primary">Generar Acta de Calificación</h3>
                                <p className="text-sm text-text-secondary">Esta acción cerrará el ciclo de evaluación para esta asignatura.</p>
                            </div>
                            <button onClick={() => setIsActaModalOpen(false)} className="p-2 hover:bg-secondary/20 rounded-full"><CloseIcon /></button>
                        </header>

                        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                            {/* Summary Card */}
                            <div className="bg-background rounded-lg border border-secondary/20 p-4">
                                <div className="flex justify-between items-center mb-4 border-b border-secondary/10 pb-2">
                                    <div>
                                        <p className="font-bold text-text-primary">{actaCandidate.studentName}</p>
                                        <p className="text-xs text-text-secondary">{actaCandidate.subjectName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-text-secondary">Nota Final</p>
                                        <p className={`text-2xl font-extrabold ${getGradeColor(actaCandidate.finalGrade)}`}>
                                            {actaCandidate.finalGrade.toFixed(1)}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="bg-blue-50/50 p-2 rounded">
                                        <div className="flex justify-center mb-1 text-blue-600"><ClipboardCheckIcon className="h-4 w-4"/></div>
                                        <span className="opacity-70">Escrita (60%)</span>
                                        <p className="font-bold text-sm mt-1">{actaCandidate.writtenGrade?.toFixed(1) || '-'}</p>
                                    </div>
                                    <div className="bg-indigo-50/50 p-2 rounded">
                                        <div className="flex justify-center mb-1 text-indigo-600"><ChartBarIcon className="h-4 w-4"/></div>
                                        <span className="opacity-70">Competencias (30%)</span>
                                        <p className="font-bold text-sm mt-1">{actaCandidate.competencyGrade?.toFixed(1) || '-'}</p>
                                    </div>
                                    <div className="bg-cyan-50/50 p-2 rounded">
                                        <div className="flex justify-center mb-1 text-cyan-600"><ScreenIcon className="h-4 w-4"/></div>
                                        <span className="opacity-70">Presentación (10%)</span>
                                        <p className="font-bold text-sm mt-1">{actaCandidate.presentationGrade?.toFixed(1) || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Feedback Input with AI Assist */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <label className="block text-sm font-bold text-text-primary">Comentarios y Feedback del Docente</label>
                                    <button 
                                        onClick={handleAIFeedback}
                                        disabled={isGeneratingFeedback}
                                        className="flex items-center gap-1.5 text-xs bg-accent/10 text-accent hover:bg-accent hover:text-white px-3 py-1.5 rounded-full transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <SparklesIcon className={`h-4 w-4 ${isGeneratingFeedback ? 'animate-pulse' : ''}`} />
                                        {isGeneratingFeedback ? "Analizando..." : "Sugerir con IA"}
                                    </button>
                                </div>
                                <textarea 
                                    value={teacherFeedback}
                                    onChange={(e) => setTeacherFeedback(e.target.value)}
                                    placeholder={isGeneratingFeedback ? "La IA está redactando el feedback..." : "Escriba aquí sus observaciones finales sobre el desempeño del residente..."}
                                    rows={4}
                                    disabled={isGeneratingFeedback}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary text-sm resize-none disabled:bg-secondary/10 disabled:text-text-secondary"
                                />
                                <p className="text-xs text-text-secondary mt-1 text-right">Este comentario será visible para el residente en su acta.</p>
                            </div>
                        </div>

                        <footer className="p-6 border-t border-secondary/20 bg-secondary/5 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setIsActaModalOpen(false)} className="px-5 py-2 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors font-medium">Cancelar</button>
                            <button 
                                onClick={handleConfirmActaGeneration}
                                disabled={isGeneratingFeedback}
                                className="px-5 py-2 rounded-lg bg-success hover:bg-success/80 text-white font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <CheckCircleIcon className="h-5 w-5" /> Confirmar y Generar Acta
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GradesModule;
