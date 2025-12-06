
import React, { useState, useEffect } from 'react';
import { StudentService, QuizService, AttemptService, CompetencyService, PresentationService, SubjectService, TeacherService, ActaService } from '../services/dataService';
import { Student, Quiz, Attempt, CompetencyEvaluation, PresentationEvaluation, Subject, Teacher, Acta } from '../types';
import GradesTab from './GradesTab';
import ActasTab from './ActasTab';
import { RefreshIcon, TableIcon, DocumentTextIcon, CloseIcon, CheckCircleIcon, ChartBarIcon, ScreenIcon, ClipboardCheckIcon } from './icons';
import { getGradeColor } from '../utils';

interface GradesModuleProps {
    currentUserId: string;
}

const GradesModule: React.FC<GradesModuleProps> = ({ currentUserId }) => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'grades' | 'actas'>('grades');
    const [students, setStudents] = useState<Student[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [competencies, setCompetencies] = useState<CompetencyEvaluation[]>([]);
    const [presentations, setPresentations] = useState<PresentationEvaluation[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [actas, setActas] = useState<Acta[]>([]);

    // State for Acta Generation Modal
    const [isActaModalOpen, setIsActaModalOpen] = useState(false);
    const [actaCandidate, setActaCandidate] = useState<any>(null);
    const [teacherFeedback, setTeacherFeedback] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [st, qz, at, co, pr, su, te, ac] = await Promise.all([
                    StudentService.getAll(),
                    QuizService.getAll(),
                    AttemptService.getAll(),
                    CompetencyService.getAll(),
                    PresentationService.getAll(),
                    SubjectService.getAll(),
                    TeacherService.getAll(),
                    ActaService.getAll()
                ]);
                setStudents(st);
                setQuizzes(qz);
                setAttempts(at);
                setCompetencies(co);
                setPresentations(pr);
                setSubjects(su);
                setTeachers(te);
                setActas(ac);
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
            setActiveTab('actas');
        } catch (error) {
            console.error(error);
            alert("Error al generar el acta.");
        }
    };

    const handleUpdateActa = (updatedActa: Acta) => {
        setActas(prev => prev.map(a => a.id === updatedActa.id ? updatedActa : a));
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3 opacity-60">
                     <RefreshIcon className="h-10 w-10 animate-spin text-primary" />
                     <p className="font-medium">Calculando calificaciones ponderadas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up h-full flex flex-col relative">
            <div className="flex border-b border-secondary/20 mb-6 gap-6">
                <button 
                    onClick={() => setActiveTab('grades')}
                    className={`pb-3 px-1 font-bold text-sm transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'grades' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    <TableIcon className="h-5 w-5" /> Libro de Notas
                </button>
                <button 
                    onClick={() => setActiveTab('actas')}
                    className={`pb-3 px-1 font-bold text-sm transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'actas' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    <DocumentTextIcon className="h-5 w-5" /> Actas y Certificados
                </button>
            </div>

            {activeTab === 'grades' ? (
                <GradesTab 
                    students={students}
                    quizzes={quizzes}
                    attempts={attempts}
                    competencies={competencies}
                    presentations={presentations}
                    subjects={subjects}
                    teachers={teachers}
                    currentUserId={currentUserId}
                    onGenerateActa={handleInitiateActa}
                    existingActas={actas}
                />
            ) : (
                <ActasTab 
                    actas={actas}
                    students={students}
                    subjects={subjects}
                    teachers={teachers}
                    currentUserId={currentUserId}
                    onUpdateActa={handleUpdateActa}
                />
            )}

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

                        <div className="p-6 space-y-6">
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

                            {/* Feedback Input */}
                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-2">Comentarios y Feedback del Docente</label>
                                <textarea 
                                    value={teacherFeedback}
                                    onChange={(e) => setTeacherFeedback(e.target.value)}
                                    placeholder="Escriba aquí sus observaciones finales sobre el desempeño del residente..."
                                    rows={4}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                                />
                                <p className="text-xs text-text-secondary mt-1 text-right">Este comentario será visible para el residente en su acta.</p>
                            </div>
                        </div>

                        <footer className="p-6 border-t border-secondary/20 bg-secondary/5 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setIsActaModalOpen(false)} className="px-5 py-2 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors font-medium">Cancelar</button>
                            <button 
                                onClick={handleConfirmActaGeneration}
                                className="px-5 py-2 rounded-lg bg-success hover:bg-success/80 text-white font-bold shadow-lg transition-all flex items-center gap-2"
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
