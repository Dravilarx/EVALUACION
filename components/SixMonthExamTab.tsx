
import React, { useState, useMemo } from 'react';
import { Student, Teacher, SixMonthExam } from '../types';
import { CheckCircleIcon, UsersIcon, CloseIcon, PlusIcon, TrashIcon, ClipboardCheckIcon, EditIcon, DocumentTextIcon, XCircleIcon } from './icons';
import { FINAL_EXAM_RUBRIC } from '../constants';
import { SixMonthExamService } from '../services/dataService';

interface SixMonthExamTabProps {
    students: Student[];
    teachers: Teacher[];
    currentUserId: string;
    exams: SixMonthExam[];
    onUpdate: (exam: SixMonthExam) => void;
}

const SixMonthExamTab: React.FC<SixMonthExamTabProps> = ({ students, teachers, currentUserId, exams, onUpdate }) => {
    const isTeacher = currentUserId === 'DOCENTE' || currentUserId === '10611061';
    
    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'evaluate'>('list');
    
    // Evaluation Form State
    const [currentExam, setCurrentExam] = useState<Partial<SixMonthExam>>({
        caseTopics: [],
        commissionIds: [],
        scores: {},
        comments: ''
    });
    
    // Temp State for adding cases
    const [newCaseTopic, setNewCaseTopic] = useState('');

    const handleOpenEvaluation = (exam?: SixMonthExam) => {
        if (exam) {
            setCurrentExam(exam);
        } else {
            setCurrentExam({
                id: `EXAM6M-${Date.now()}`,
                date: new Date().toISOString(),
                caseTopics: [],
                commissionIds: [],
                scores: {},
                comments: '',
                finalStatus: 'Pending',
                numericGrade: 0
            });
        }
        setIsModalOpen(true);
        setViewMode('evaluate');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setViewMode('list');
        setCurrentExam({});
    };

    const handleAddCase = () => {
        if (!newCaseTopic.trim()) return;
        setCurrentExam(prev => ({
            ...prev,
            caseTopics: [...(prev.caseTopics || []), newCaseTopic]
        }));
        setNewCaseTopic('');
    };

    const handleRemoveCase = (index: number) => {
        setCurrentExam(prev => ({
            ...prev,
            caseTopics: (prev.caseTopics || []).filter((_, i) => i !== index)
        }));
    };

    const toggleCommissionMember = (teacherId: string) => {
        setCurrentExam(prev => {
            const currentIds = prev.commissionIds || [];
            if (currentIds.includes(teacherId)) {
                return { ...prev, commissionIds: currentIds.filter(id => id !== teacherId) };
            } else {
                return { ...prev, commissionIds: [...currentIds, teacherId] };
            }
        });
    };

    const handleScoreChange = (dimensionId: number, score: number) => {
        setCurrentExam(prev => ({
            ...prev,
            scores: { ...prev.scores, [dimensionId]: score }
        }));
    };

    // Calculate Grade in real-time
    const calculation = useMemo(() => {
        const scores = currentExam.scores || {};
        let totalWeightedScore = 0;
        let totalWeight = 0;

        FINAL_EXAM_RUBRIC.forEach(item => {
            const score = scores[item.id];
            if (score !== undefined) {
                totalWeightedScore += score * item.weight;
                totalWeight += item.weight;
            }
        });

        const maxScore = 4;
        const score = totalWeightedScore;
        const passingScore = 2.4; // 60% of 4
        let finalGrade = 1.0;

        if (score < passingScore) {
            finalGrade = 1 + (score / passingScore) * 3;
        } else {
            finalGrade = 4 + ((score - passingScore) / (maxScore - passingScore)) * 3;
        }

        const roundedGrade = Math.round(Math.min(7.0, Math.max(1.0, finalGrade)) * 10) / 10;
        
        // CUSTOM LOGIC FOR 6 MONTH EXAM: Grade > 5.0 is Approved
        const status = roundedGrade > 5.0 ? 'Aprobado' : 'Reprobado';

        return {
            weightedScore: totalWeightedScore,
            finalGrade: roundedGrade,
            status
        };
    }, [currentExam.scores]);

    const handleSave = async () => {
        if (!currentExam.studentId) {
            alert("Debe seleccionar un alumno.");
            return;
        }
        if ((currentExam.commissionIds || []).length === 0) {
            alert("Debe seleccionar al menos un miembro de la comisión.");
            return;
        }
        if ((currentExam.caseTopics || []).length === 0) {
            alert("Debe registrar al menos un caso clínico.");
            return;
        }

        const examToSave: SixMonthExam = {
            id: currentExam.id!,
            studentId: currentExam.studentId!,
            date: currentExam.date || new Date().toISOString(),
            commissionIds: currentExam.commissionIds || [],
            caseTopics: currentExam.caseTopics || [],
            scores: currentExam.scores || {},
            comments: currentExam.comments || '',
            finalStatus: calculation.status as 'Aprobado' | 'Reprobado',
            numericGrade: calculation.finalGrade
        };

        try {
            if (exams.find(e => e.id === examToSave.id)) {
                await SixMonthExamService.update(examToSave);
            } else {
                await SixMonthExamService.create(examToSave);
            }
            onUpdate(examToSave);
            handleCloseModal();
        } catch (error) {
            console.error("Error saving exam", error);
            alert("Error al guardar el examen.");
        }
    };

    const getStudentName = (id: string) => students.find(s => s.id === id)?.name || id;
    const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || id;

    // --- RENDER ---

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-surface p-5 rounded-xl shadow-sm border border-secondary/20 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <ClipboardCheckIcon className="h-6 w-6 text-purple-600" /> Examen de Continuidad (6 Meses)
                    </h2>
                    <p className="text-sm text-text-secondary">Evaluación de corte. Se requiere nota superior a 5.0 para aprobar.</p>
                </div>
                {isTeacher && (
                    <button 
                        onClick={() => handleOpenEvaluation()}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
                    >
                        <PlusIcon className="h-5 w-5" /> Nueva Evaluación
                    </button>
                )}
            </div>

            {/* List View */}
            <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/10 text-text-secondary uppercase text-xs font-bold border-b border-secondary/20">
                        <tr>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Alumno</th>
                            <th className="p-4">Comisión</th>
                            <th className="p-4 text-center">Nota (Ref)</th>
                            <th className="p-4 text-center">Estado</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary/10">
                        {exams.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-text-secondary">No hay exámenes registrados.</td></tr>
                        ) : (
                            exams.map(exam => (
                                <tr key={exam.id} className="hover:bg-background/50">
                                    <td className="p-4 font-mono text-text-secondary">{new Date(exam.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-bold text-text-primary">{getStudentName(exam.studentId)}</td>
                                    <td className="p-4">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {exam.commissionIds.map(tid => (
                                                <div key={tid} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold" title={getTeacherName(tid)}>
                                                    {getTeacherName(tid).charAt(0)}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center text-text-secondary">
                                        {exam.numericGrade.toFixed(1)}
                                    </td>
                                    <td className="p-4 text-center">
                                        {exam.finalStatus === 'Aprobado' ? (
                                            <span className="bg-success text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center justify-center gap-1 mx-auto w-fit">
                                                <CheckCircleIcon className="h-3 w-3" /> APROBADO
                                            </span>
                                        ) : (
                                            <span className="bg-danger text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center justify-center gap-1 mx-auto w-fit">
                                                <XCircleIcon className="h-3 w-3" /> REPROBADO
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {isTeacher && (
                                            <button onClick={() => handleOpenEvaluation(exam)} className="text-purple-600 hover:bg-purple-50 p-2 rounded transition-colors">
                                                <EditIcon className="h-5 w-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface w-full max-w-6xl max-h-[95vh] rounded-xl shadow-2xl flex flex-col border border-secondary/20">
                        <header className="p-5 border-b border-secondary/20 bg-secondary/5 rounded-t-xl flex justify-between items-center">
                            <h3 className="text-xl font-bold text-text-primary">Evaluación - Examen 6 Meses</h3>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-secondary/20 rounded-full"><CloseIcon /></button>
                        </header>

                        <div className="flex-grow overflow-y-auto p-6 space-y-8">
                            
                            {/* Header Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Alumno</label>
                                    <select 
                                        value={currentExam.studentId || ''} 
                                        onChange={(e) => setCurrentExam({...currentExam, studentId: e.target.value})}
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-purple-500"
                                        disabled={!!currentExam.finalStatus && currentExam.finalStatus !== 'Pending'}
                                    >
                                        <option value="">Seleccione Alumno...</option>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Fecha</label>
                                    <input 
                                        type="date" 
                                        value={currentExam.date ? currentExam.date.substring(0, 10) : ''}
                                        onChange={(e) => setCurrentExam({...currentExam, date: e.target.value})}
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Commission Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider flex items-center gap-2">
                                        <UsersIcon className="h-4 w-4" /> Comisión Evaluadora
                                    </label>
                                    <div className="bg-background border border-secondary/30 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                                        {teachers.map(t => (
                                            <label key={t.id} className="flex items-center gap-2 p-2 hover:bg-secondary/10 rounded cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={(currentExam.commissionIds || []).includes(t.id)}
                                                    onChange={() => toggleCommissionMember(t.id)}
                                                    className="rounded text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className="text-sm">{t.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Clinical Cases */}
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider flex items-center gap-2">
                                        <DocumentTextIcon className="h-4 w-4" /> Casos Clínicos Evaluados
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input 
                                            type="text" 
                                            placeholder="Tema del caso (ej: Tórax Patológico)" 
                                            value={newCaseTopic}
                                            onChange={(e) => setNewCaseTopic(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCase()}
                                            className="flex-grow bg-background border border-secondary/30 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                        <button onClick={handleAddCase} className="bg-purple-600 text-white p-1.5 rounded-lg hover:bg-purple-700 transition-colors"><PlusIcon className="h-5 w-5"/></button>
                                    </div>
                                    <div className="bg-background border border-secondary/30 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                                        {(currentExam.caseTopics || []).length === 0 && <p className="text-xs text-text-secondary italic text-center py-2">Sin casos registrados</p>}
                                        {(currentExam.caseTopics || []).map((topic, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-surface p-2 rounded border border-secondary/10">
                                                <span className="text-sm font-medium"><span className="text-purple-600 font-bold mr-2">{idx + 1}.</span> {topic}</span>
                                                <button onClick={() => handleRemoveCase(idx)} className="text-danger hover:bg-danger/10 rounded p-1"><TrashIcon className="h-4 w-4"/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* RUBRIC GRID */}
                            <div className="border border-secondary/20 rounded-xl overflow-hidden">
                                <div className="bg-secondary/10 p-3 border-b border-secondary/20 flex justify-between items-center">
                                    <h4 className="font-bold text-text-primary">Rúbrica de Evaluación</h4>
                                    <p className="text-xs text-text-secondary">Escala: 0 (Insatisfactorio) - 4 (Excelente)</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-surface border-b border-secondary/10">
                                                <th className="p-3 text-left w-1/4">Dimensión / Ponderación</th>
                                                {[0, 1, 2, 3, 4].map(score => (
                                                    <th key={score} className="p-3 text-center w-[15%] border-l border-secondary/10">
                                                        <span className="font-bold text-lg block">{score}</span>
                                                        <span className="text-[10px] text-text-secondary font-normal uppercase">
                                                            {score === 4 ? 'Excelente' : score === 3 ? 'Satisfactorio' : score === 2 ? 'Puede mejorar' : score === 1 ? 'Inadecuado' : 'Insatisfactorio'}
                                                        </span>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-secondary/10">
                                            {FINAL_EXAM_RUBRIC.map(item => (
                                                <tr key={item.id} className="hover:bg-background/50">
                                                    <td className="p-3">
                                                        <p className="font-bold text-purple-900">{item.dimension}</p>
                                                        <p className="text-xs text-text-secondary font-bold bg-secondary/10 px-2 py-0.5 rounded w-fit mt-1">{(item.weight * 100)}%</p>
                                                    </td>
                                                    {[0, 1, 2, 3, 4].map(score => {
                                                        const isSelected = (currentExam.scores || {})[item.id] === score;
                                                        return (
                                                            <td key={score} className="p-1 border-l border-secondary/10 relative h-full">
                                                                <button
                                                                    onClick={() => handleScoreChange(item.id, score)}
                                                                    className={`w-full h-full min-h-[80px] rounded-lg transition-all flex flex-col items-center justify-center p-2 text-xs text-center border-2
                                                                        ${isSelected 
                                                                            ? 'bg-purple-600 text-white shadow-lg border-purple-600' 
                                                                            : 'bg-transparent border-transparent hover:border-purple-200 hover:bg-purple-50 text-text-secondary'
                                                                        }
                                                                    `}
                                                                >
                                                                    {isSelected && <CheckCircleIcon className="h-6 w-6 mb-1 text-white" />}
                                                                    <span className={`leading-snug ${isSelected ? 'opacity-100' : 'opacity-70'}`}>
                                                                        {item.descriptors[score as 0|1|2|3|4]}
                                                                    </span>
                                                                </button>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Comments */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Comentarios de la Comisión</label>
                                <textarea 
                                    value={currentExam.comments || ''}
                                    onChange={(e) => setCurrentExam({...currentExam, comments: e.target.value})}
                                    rows={3}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    placeholder="Observaciones generales sobre el desempeño..."
                                />
                            </div>

                        </div>

                        {/* Footer / Calculation */}
                        <footer className="p-5 border-t border-secondary/20 bg-surface/95 rounded-b-xl flex justify-between items-center sticky bottom-0">
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-xs font-bold text-text-secondary uppercase">Nota Calculada</p>
                                    <p className="text-xl font-bold text-text-primary">{calculation.finalGrade.toFixed(1)}</p>
                                </div>
                                <div className="h-10 w-px bg-secondary/20"></div>
                                <div>
                                    <p className="text-xs font-bold text-text-secondary uppercase">Estado Final</p>
                                    <p className={`text-4xl font-extrabold ${calculation.status === 'Aprobado' ? 'text-success' : 'text-danger'}`}>
                                        {calculation.status.toUpperCase()}
                                    </p>
                                    <p className="text-[10px] text-text-secondary mt-1">Requisito: Nota &gt; 5.0</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleCloseModal} className="px-5 py-2 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors">Cancelar</button>
                                <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg transition-all flex items-center gap-2">
                                    <CheckCircleIcon className="h-5 w-5" /> Guardar Evaluación
                                </button>
                            </div>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SixMonthExamTab;
