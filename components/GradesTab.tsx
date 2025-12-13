
import React, { useState, useMemo } from 'react';
import { Student, Quiz, Attempt, CompetencyEvaluation, PresentationEvaluation, Subject, Teacher, Acta, ManualGradeEntry } from '../types';
import { TableIcon, FilterIcon, ClipboardCheckIcon, ChartBarIcon, ScreenIcon, CheckCircleIcon, ClockIcon, DocumentTextIcon, EditIcon, PlusIcon, CloseIcon, TrashIcon } from './icons';
import { getGradeColor } from '../utils';
import { ManualGradeService } from '../services/dataService';

interface GradesTabProps {
    students: Student[];
    quizzes: Quiz[];
    attempts: Attempt[];
    competencies: CompetencyEvaluation[];
    presentations: PresentationEvaluation[];
    subjects: Subject[];
    teachers: Teacher[];
    currentUserId: string; 
    onGenerateActa: (data: any) => void;
    existingActas: Acta[];
    manualGrades: ManualGradeEntry[];
    onManualGradeUpdate: (entry: ManualGradeEntry) => void;
}

// Helper interface for the calculated row
interface GradeRow {
    studentId: string;
    studentName: string;
    subjectId: string;
    subjectName: string;
    leadTeacherId: string;
    
    // Components
    writtenGrade: number | null; 
    writtenDetails: string; 
    isWrittenManual: boolean; // Flag for UI

    competencyGrade: number | null; 
    competencyDetails: Record<number, number>; 
    isCompetencyManual: boolean; // Flag for UI

    presentationGrade: number | null;
    presentationDetails: Record<number, number>; 
    isPresentationManual: boolean; // Flag for UI
    
    finalGrade: number | null;
    status: 'Completo' | 'Pendiente' | 'Sin Iniciar';
    progress: number; 
    hasActa: boolean; 
}

const GradesTab: React.FC<GradesTabProps> = ({ 
    students, quizzes, attempts, competencies, presentations, subjects, teachers, currentUserId, onGenerateActa, existingActas, manualGrades, onManualGradeUpdate
}) => {
    // Determine Role: Admin or Teacher
    const isTeacher = currentUserId === 'DOCENTE' || currentUserId === '10611061';

    // Filters
    const [filterStudent, setFilterStudent] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterTeacher, setFilterTeacher] = useState('');

    // Modal State
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    
    // State to handle multiple grades at once
    const [manualEntryData, setManualEntryData] = useState<{
        studentId: string;
        studentName: string;
        subjectId: string;
        subjectName: string;
        written: number | '';
        competency: number | '';
        presentation: number | '';
        comment: string;
        isNew?: boolean; // Flag to enable selectors
    } | null>(null);

    // --- Calculation Logic ---
    const gradeData = useMemo<GradeRow[]>(() => {
        const rows: GradeRow[] = [];

        // If not teacher, filter students list to only the current user
        const visibleStudents = isTeacher ? students : students.filter(s => s.id === currentUserId);

        visibleStudents.forEach(student => {
            subjects.forEach(subject => {
                // Check if Acta already exists
                const hasActa = existingActas.some(a => a.studentId === student.id && a.subjectId === subject.id);

                // --- 1. Written Grade (60%) ---
                // Check for manual override first
                const manualWritten = manualGrades.find(m => m.studentId === student.id && m.subjectId === subject.id && m.type === 'Written');
                
                let writtenGrade: number | null = null;
                let writtenDetails = "";
                let isWrittenManual = false;

                if (manualWritten) {
                    writtenGrade = manualWritten.grade;
                    writtenDetails = `Ingresado manualmente.\nObs: ${manualWritten.comment || '-'}`;
                    isWrittenManual = true;
                } else {
                    // Calculate from Quizzes
                    const subjectQuizzes = quizzes.filter(q => 
                        q.asignatura.trim().toLowerCase() === subject.name.trim().toLowerCase() || 
                        q.asignatura === "Interdisciplinario"
                    );
                    
                    let writtenSum = 0;
                    let writtenCount = 0;
                    let quizDetails: string[] = [];

                    subjectQuizzes.forEach(quiz => {
                        const studentAttempts = attempts.filter(a => a.id_cuestionario === quiz.id_cuestionario && a.alumno_id === student.id);
                        if (studentAttempts.length > 0) {
                            const bestAttempt = studentAttempts.reduce((prev, current) => (prev.nota || 0) > (current.nota || 0) ? prev : current);
                            if (bestAttempt.nota !== undefined) {
                                writtenSum += bestAttempt.nota;
                                writtenCount++;
                                quizDetails.push(`${quiz.titulo.substring(0, 20)}...: ${bestAttempt.nota.toFixed(1)}`);
                            }
                        } else {
                            quizDetails.push(`${quiz.titulo.substring(0, 20)}...: Pendiente`);
                        }
                    });

                    writtenGrade = writtenCount > 0 ? writtenSum / writtenCount : null;
                    writtenDetails = quizDetails.length > 0 ? quizDetails.join('\n') : "Sin cuestionarios asignados";
                }

                // --- 2. Competency Grade (30%) ---
                const manualCompetency = manualGrades.find(m => m.studentId === student.id && m.subjectId === subject.id && m.type === 'Competency');
                
                let competencyGrade: number | null = null;
                let isCompetencyManual = false;
                let compDetailsSnapshot: Record<number, number> = {};

                if (manualCompetency) {
                    competencyGrade = manualCompetency.grade;
                    isCompetencyManual = true;
                } else {
                    const studentCompetencies = competencies.filter(c => c.studentId === student.id && c.subjectId === subject.id);
                    let compSum = 0;
                    studentCompetencies.forEach(c => {
                        compSum += c.average;
                        compDetailsSnapshot = c.scores; 
                    });
                    competencyGrade = studentCompetencies.length > 0 ? compSum / studentCompetencies.length : null;
                }

                // --- 3. Presentation Grade (10%) ---
                const manualPresentation = manualGrades.find(m => m.studentId === student.id && m.subjectId === subject.id && m.type === 'Presentation');
                
                let presentationGrade: number | null = null;
                let isPresentationManual = false;
                let presDetailsSnapshot: Record<number, number> = {};

                if (manualPresentation) {
                    presentationGrade = manualPresentation.grade;
                    isPresentationManual = true;
                } else {
                    const studentPresentations = presentations.filter(p => p.studentId === student.id && p.subjectId === subject.id);
                    let presSum = 0;
                    studentPresentations.forEach(p => {
                        presSum += p.average;
                        presDetailsSnapshot = p.scores;
                    });
                    presentationGrade = studentPresentations.length > 0 ? presSum / studentPresentations.length : null;
                }

                // 4. Calculate Final Weighted Grade (Using 2 decimals)
                let finalGrade = null;
                let progress = 0;

                if (writtenGrade !== null) progress += 60;
                if (competencyGrade !== null) progress += 30;
                if (presentationGrade !== null) progress += 10;

                if (writtenGrade !== null || competencyGrade !== null || presentationGrade !== null) {
                    let weightedSum = 0;
                    let totalWeight = 0;

                    if (writtenGrade !== null) { weightedSum += writtenGrade * 0.6; totalWeight += 0.6; }
                    if (competencyGrade !== null) { weightedSum += competencyGrade * 0.3; totalWeight += 0.3; }
                    if (presentationGrade !== null) { weightedSum += presentationGrade * 0.1; totalWeight += 0.1; }
                    
                    if (totalWeight > 0) {
                        finalGrade = weightedSum / totalWeight; 
                    }
                }

                let status: GradeRow['status'] = 'Sin Iniciar';
                if (progress === 100) status = 'Completo';
                else if (progress > 0) status = 'Pendiente';

                rows.push({
                    studentId: student.id,
                    studentName: student.name,
                    subjectId: subject.id,
                    subjectName: subject.name,
                    leadTeacherId: subject.lead_teacher_id,
                    writtenGrade,
                    writtenDetails,
                    isWrittenManual,
                    competencyGrade,
                    competencyDetails: compDetailsSnapshot,
                    isCompetencyManual,
                    presentationGrade,
                    presentationDetails: presDetailsSnapshot,
                    isPresentationManual,
                    finalGrade,
                    status,
                    progress,
                    hasActa
                });
            });
        });
        return rows;
    }, [students, subjects, quizzes, attempts, competencies, presentations, isTeacher, currentUserId, existingActas, manualGrades]);

    // --- Filtering ---
    const filteredRows = useMemo(() => {
        return gradeData.filter(row => {
            const matchesStudent = filterStudent ? row.studentId === filterStudent : true;
            const matchesSubject = filterSubject ? row.subjectId === filterSubject : true;
            const matchesTeacher = filterTeacher ? row.leadTeacherId === filterTeacher : true;
            return matchesStudent && matchesSubject && matchesTeacher;
        });
    }, [gradeData, filterStudent, filterSubject, filterTeacher]);

    const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || id;

    // --- Manual Entry Logic ---
    const openManualEntry = (row: GradeRow) => {
        if (!isTeacher) return;
        
        // Find existing manual entries for this student/subject
        const writtenEntry = manualGrades.find(m => m.studentId === row.studentId && m.subjectId === row.subjectId && m.type === 'Written');
        const competencyEntry = manualGrades.find(m => m.studentId === row.studentId && m.subjectId === row.subjectId && m.type === 'Competency');
        const presentationEntry = manualGrades.find(m => m.studentId === row.studentId && m.subjectId === row.subjectId && m.type === 'Presentation');

        // Use comment from any of them (prioritizing written)
        const comment = writtenEntry?.comment || competencyEntry?.comment || presentationEntry?.comment || "";

        setManualEntryData({
            studentId: row.studentId,
            studentName: row.studentName,
            subjectId: row.subjectId,
            subjectName: row.subjectName,
            written: writtenEntry ? writtenEntry.grade : '',
            competency: competencyEntry ? competencyEntry.grade : '',
            presentation: presentationEntry ? presentationEntry.grade : '',
            comment,
            isNew: false
        });
        setIsManualModalOpen(true);
    };

    const openNewManualEntry = () => {
        setManualEntryData({
            studentId: '',
            studentName: '',
            subjectId: '',
            subjectName: '',
            written: '',
            competency: '',
            presentation: '',
            comment: '',
            isNew: true
        });
        setIsManualModalOpen(true);
    };

    const handleSaveManualGrade = async () => {
        if (!manualEntryData || !manualEntryData.studentId || !manualEntryData.subjectId) {
            alert("Por favor seleccione Alumno y Asignatura.");
            return;
        }

        const promises = [];
        
        // Helper to process a specific grade type
        const processGradeType = async (type: 'Written' | 'Competency' | 'Presentation', value: number | '') => {
            const existingEntry = manualGrades.find(m => 
                m.studentId === manualEntryData.studentId && 
                m.subjectId === manualEntryData.subjectId && 
                m.type === type
            );

            if (value !== '' && value !== null) {
                // Upsert logic
                const entry: ManualGradeEntry = {
                    id: existingEntry ? existingEntry.id : `MAN-${type}-${Date.now()}`,
                    studentId: manualEntryData.studentId,
                    subjectId: manualEntryData.subjectId,
                    type: type,
                    grade: Number(value),
                    comment: manualEntryData.comment,
                    date: new Date().toISOString(),
                    authorId: currentUserId
                };
                // We assume create handles upsert in backend/service or we can modify service. 
                // For mock, ManualGradeService.create handles array replacement effectively.
                await ManualGradeService.create(entry);
                onManualGradeUpdate(entry); // Notify parent for immediate UI update
            } else if (existingEntry) {
                // If field is cleared but entry existed -> Delete it (revert to auto calc)
                await ManualGradeService.delete(existingEntry.id);
                // We need to trigger a refresh. Ideally pass a delete callback or reload.
                // For this demo, simple reload works or we could pass a "delete" action up.
                // Assuming onManualGradeUpdate triggers a re-render or we reload.
                window.location.reload(); 
            }
        };

        try {
            await Promise.all([
                processGradeType('Written', manualEntryData.written),
                processGradeType('Competency', manualEntryData.competency),
                processGradeType('Presentation', manualEntryData.presentation),
            ]);
            
            setIsManualModalOpen(false);
            setManualEntryData(null);
        } catch (error) {
            console.error(error);
            alert("Error al guardar notas manuales");
        }
    };

    const GradeCell = ({ grade, isManual, onClick, tooltip }: { grade: number | null, isManual: boolean, onClick: () => void, tooltip?: string }) => (
        <div className="relative group h-full flex items-center justify-center cursor-pointer hover:bg-black/5 transition-colors min-h-[50px]" onClick={onClick} title={isTeacher ? "Click para editar manualmente" : ""}>
            {grade !== null ? (
                <>
                    <span className={`font-bold text-lg ${getGradeColor(grade)}`}>
                        {grade.toFixed(2)}
                    </span>
                    {isManual && (
                        <span className="absolute top-1 right-1 text-[8px] bg-secondary/20 text-secondary px-1 rounded">M</span>
                    )}
                    {tooltip && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg whitespace-pre-line text-left">
                            <div className="font-bold border-b border-gray-600 mb-1 pb-1">Detalle:</div>
                            {tooltip}
                        </div>
                    )}
                </>
            ) : (
                <span className="text-secondary/30">-</span>
            )}
            {isTeacher && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white rounded-full p-1.5 shadow-sm border border-secondary/20">
                        {grade !== null ? <EditIcon className="h-3 w-3 text-primary" /> : <PlusIcon className="h-3 w-3 text-primary" />}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-surface p-5 rounded-xl shadow-sm border border-secondary/20 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                            <TableIcon className="h-6 w-6 text-primary" /> {isTeacher ? 'Control de Calificaciones' : 'Mi Libro de Notas'}
                        </h2>
                        <p className="text-sm text-text-secondary">Ponderación: Escrita (60%) - Competencias (30%) - Presentación (10%)</p>
                        <p className="text-xs text-text-secondary mt-1 italic">Todas las notas en esta sección se muestran con 2 decimales.</p>
                    </div>
                    <div className="flex gap-2">
                        {isTeacher && (
                            <button 
                                onClick={openNewManualEntry}
                                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
                            >
                                <PlusIcon className="h-5 w-5" /> Registrar Nota Manual
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                {isTeacher && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-secondary/10">
                        <div className="relative">
                            <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Alumno</label>
                            <select 
                                value={filterStudent} 
                                onChange={(e) => setFilterStudent(e.target.value)}
                                className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                            >
                                <option value="">Todos los Alumnos</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Docente Encargado</label>
                            <select 
                                value={filterTeacher} 
                                onChange={(e) => setFilterTeacher(e.target.value)}
                                className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                            >
                                <option value="">Todos los Docentes</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Asignatura</label>
                            <select 
                                value={filterSubject} 
                                onChange={(e) => setFilterSubject(e.target.value)}
                                className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                            >
                                <option value="">Todas las Asignaturas</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Data Table */}
            <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-secondary/10 text-text-secondary uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4 border-b border-secondary/20 w-1/4">Alumno / Asignatura</th>
                                <th className="p-0 border-b border-secondary/20 text-center w-1/6 bg-blue-50/50 text-blue-700">
                                    <div className="p-4 flex flex-col items-center gap-1 h-full justify-center">
                                        <ClipboardCheckIcon className="h-4 w-4" /> Evaluaciones (60%)
                                    </div>
                                </th>
                                <th className="p-0 border-b border-secondary/20 text-center w-1/6 bg-indigo-50/50 text-indigo-700">
                                    <div className="p-4 flex flex-col items-center gap-1 h-full justify-center">
                                        <ChartBarIcon className="h-4 w-4" /> Competencias (30%)
                                    </div>
                                </th>
                                <th className="p-0 border-b border-secondary/20 text-center w-1/6 bg-cyan-50/50 text-cyan-700">
                                    <div className="p-4 flex flex-col items-center gap-1 h-full justify-center">
                                        <ScreenIcon className="h-4 w-4" /> Presentación (10%)
                                    </div>
                                </th>
                                <th className="p-4 border-b border-secondary/20 text-center w-1/6">Nota Ponderada</th>
                                <th className="p-4 border-b border-secondary/20 text-center w-1/6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/20">
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-secondary italic">
                                        {isTeacher ? "No hay registros que coincidan con los filtros." : "No tienes registros de calificaciones aún."}
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row, idx) => (
                                    <tr key={`${row.studentId}-${row.subjectId}`} className="hover:bg-background/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-text-primary">{row.studentName}</div>
                                            <div className="text-xs text-primary mt-0.5">{row.subjectName}</div>
                                            <div className="text-[10px] text-text-secondary mt-1 flex items-center gap-1">
                                                <span className="opacity-70">Docente:</span> {getTeacherName(row.leadTeacherId)}
                                            </div>
                                        </td>
                                        
                                        {/* Escrita 60% */}
                                        <td className="p-0 text-center bg-blue-50/10 border-r border-secondary/5">
                                            <GradeCell 
                                                grade={row.writtenGrade} 
                                                isManual={row.isWrittenManual} 
                                                onClick={() => openManualEntry(row)} 
                                                tooltip={row.writtenDetails} 
                                            />
                                        </td>

                                        {/* Competencias 30% */}
                                        <td className="p-0 text-center bg-indigo-50/10 border-r border-secondary/5">
                                            <GradeCell 
                                                grade={row.competencyGrade} 
                                                isManual={row.isCompetencyManual} 
                                                onClick={() => openManualEntry(row)}
                                            />
                                        </td>

                                        {/* Presentación 10% */}
                                        <td className="p-0 text-center bg-cyan-50/10 border-r border-secondary/5">
                                            <GradeCell 
                                                grade={row.presentationGrade} 
                                                isManual={row.isPresentationManual} 
                                                onClick={() => openManualEntry(row)}
                                            />
                                        </td>

                                        {/* Final Grade */}
                                        <td className="p-4 text-center border-r border-secondary/5 bg-secondary/5">
                                            {row.finalGrade !== null ? (
                                                <div className="flex flex-col items-center">
                                                    <span className={`font-extrabold text-2xl ${getGradeColor(row.finalGrade)}`}>
                                                        {row.finalGrade.toFixed(2)}
                                                    </span>
                                                    {row.progress < 100 && (
                                                        <span className="text-[10px] text-warning font-bold">(Parcial)</span>
                                                    )}
                                                </div>
                                            ) : <span className="text-secondary/30">-</span>}
                                        </td>

                                        {/* Actions / Status */}
                                        <td className="p-4">
                                            <div className="flex flex-col items-center gap-2">
                                                {row.hasActa ? (
                                                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-primary/20">
                                                        <DocumentTextIcon className="h-3 w-3" /> Acta Generada
                                                    </span>
                                                ) : isTeacher && row.progress === 100 ? (
                                                    <button 
                                                        onClick={() => onGenerateActa(row)}
                                                        className="bg-success hover:bg-success/80 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1 animate-pulse"
                                                    >
                                                        <DocumentTextIcon className="h-3 w-3" /> Generar Acta
                                                    </button>
                                                ) : (
                                                    <>
                                                        {row.status === 'Completo' && (
                                                            <span className="flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-full">
                                                                <CheckCircleIcon className="h-3 w-3" /> Completo
                                                            </span>
                                                        )}
                                                        {row.status === 'Pendiente' && (
                                                            <span className="flex items-center gap-1 text-xs font-bold text-warning bg-warning/10 px-2 py-1 rounded-full">
                                                                <ClockIcon className="h-3 w-3" /> Pendiente
                                                            </span>
                                                        )}
                                                        {row.status === 'Sin Iniciar' && (
                                                            <span className="text-xs text-secondary opacity-60">Sin Iniciar</span>
                                                        )}
                                                        <div className="w-20 h-1.5 bg-secondary/20 rounded-full overflow-hidden mt-1">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-500 ${row.progress === 100 ? 'bg-success' : 'bg-warning'}`}
                                                                style={{ width: `${row.progress}%` }}
                                                            ></div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MANUAL ENTRY MODAL */}
            {isManualModalOpen && manualEntryData && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-xl shadow-2xl w-full max-w-lg flex flex-col border border-secondary/20 animate-fade-in-up">
                        <header className="p-5 border-b border-secondary/20 bg-secondary/5 rounded-t-xl flex justify-between items-center">
                            <h3 className="text-lg font-bold text-text-primary">
                                {manualEntryData.isNew ? 'Registrar Calificaciones Manuales' : 'Editar Calificaciones Manuales'}
                            </h3>
                            <button onClick={() => setIsManualModalOpen(false)} className="p-1 hover:bg-secondary/20 rounded-full"><CloseIcon /></button>
                        </header>
                        
                        <div className="p-6 space-y-5">
                            
                            {/* Selection Fields (Only if New) */}
                            {manualEntryData.isNew ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-text-secondary mb-1">Alumno</label>
                                        <select 
                                            value={manualEntryData.studentId}
                                            onChange={(e) => setManualEntryData({...manualEntryData, studentId: e.target.value})}
                                            className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                                        >
                                            <option value="">Seleccione Alumno...</option>
                                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-text-secondary mb-1">Asignatura</label>
                                        <select 
                                            value={manualEntryData.subjectId}
                                            onChange={(e) => setManualEntryData({...manualEntryData, subjectId: e.target.value})}
                                            className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                                        >
                                            <option value="">Seleccione Asignatura...</option>
                                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-background p-3 rounded-lg border border-secondary/20">
                                    <p className="text-xs text-text-secondary uppercase font-bold">Residente</p>
                                    <p className="font-bold text-text-primary">{manualEntryData.studentName}</p>
                                    <p className="text-xs text-text-secondary uppercase font-bold mt-2">Asignatura</p>
                                    <p className="font-medium text-text-primary">{manualEntryData.subjectName}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <p className="text-xs text-text-secondary italic">Ingrese las notas que desea registrar manualmente (1.0 - 7.0). Deje en blanco para mantener el cálculo automático.</p>
                                
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-blue-700">Escrita (60%)</label>
                                        <input 
                                            type="number" 
                                            step="0.1" min="1.0" max="7.0"
                                            value={manualEntryData.written} 
                                            onChange={(e) => setManualEntryData({...manualEntryData, written: e.target.value === '' ? '' : parseFloat(e.target.value)})}
                                            className="w-full bg-blue-50/50 border border-blue-200 rounded-lg p-3 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                            placeholder="-"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-indigo-700">Competencias (30%)</label>
                                        <input 
                                            type="number" 
                                            step="0.1" min="1.0" max="7.0"
                                            value={manualEntryData.competency} 
                                            onChange={(e) => setManualEntryData({...manualEntryData, competency: e.target.value === '' ? '' : parseFloat(e.target.value)})}
                                            className="w-full bg-indigo-50/50 border border-indigo-200 rounded-lg p-3 text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                                            placeholder="-"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-cyan-700">Presentación (10%)</label>
                                        <input 
                                            type="number" 
                                            step="0.1" min="1.0" max="7.0"
                                            value={manualEntryData.presentation} 
                                            onChange={(e) => setManualEntryData({...manualEntryData, presentation: e.target.value === '' ? '' : parseFloat(e.target.value)})}
                                            className="w-full bg-cyan-50/50 border border-cyan-200 rounded-lg p-3 text-lg font-bold outline-none focus:ring-2 focus:ring-cyan-500 text-center"
                                            placeholder="-"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-1">Observación / Justificación</label>
                                <textarea 
                                    value={manualEntryData.comment}
                                    onChange={(e) => setManualEntryData({...manualEntryData, comment: e.target.value})}
                                    placeholder="Ej: Homologación de periodo anterior..."
                                    rows={3}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                                />
                            </div>
                        </div>

                        <footer className="p-5 border-t border-secondary/20 bg-secondary/5 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setIsManualModalOpen(false)} className="px-4 py-2 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors text-sm">Cancelar</button>
                            <button 
                                onClick={handleSaveManualGrade}
                                className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-all text-sm"
                            >
                                Guardar Notas
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GradesTab;
