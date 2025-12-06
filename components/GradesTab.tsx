
import React, { useState, useMemo } from 'react';
import { Student, Quiz, Attempt, CompetencyEvaluation, PresentationEvaluation, Subject, Teacher, Acta } from '../types';
import { TableIcon, FilterIcon, ClipboardCheckIcon, ChartBarIcon, ScreenIcon, CheckCircleIcon, ClockIcon, DocumentTextIcon } from './icons';
import { getGradeColor } from '../utils';

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
    competencyGrade: number | null; 
    competencyDetails: Record<number, number>; // Added for Acta snapshot
    presentationGrade: number | null;
    presentationDetails: Record<number, number>; // Added for Acta snapshot
    
    finalGrade: number | null;
    status: 'Completo' | 'Pendiente' | 'Sin Iniciar';
    progress: number; 
    hasActa: boolean; // Added to check if acta exists
}

const GradesTab: React.FC<GradesTabProps> = ({ 
    students, quizzes, attempts, competencies, presentations, subjects, teachers, currentUserId, onGenerateActa, existingActas
}) => {
    // Determine Role
    const isTeacher = currentUserId === 'DOCENTE';

    // Filters
    const [filterStudent, setFilterStudent] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterTeacher, setFilterTeacher] = useState('');

    // --- Calculation Logic ---
    const gradeData = useMemo<GradeRow[]>(() => {
        const rows: GradeRow[] = [];

        // If not teacher, filter students list to only the current user
        const visibleStudents = isTeacher ? students : students.filter(s => s.id === currentUserId);

        visibleStudents.forEach(student => {
            subjects.forEach(subject => {
                // Check if Acta already exists
                const hasActa = existingActas.some(a => a.studentId === student.id && a.subjectId === subject.id);

                // 1. Calculate Written Grade (60%)
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

                const writtenGrade = writtenCount > 0 ? writtenSum / writtenCount : null;
                const writtenDetails = quizDetails.length > 0 ? quizDetails.join('\n') : "Sin cuestionarios asignados";

                // 2. Calculate Competency Grade (30%)
                const studentCompetencies = competencies.filter(c => c.studentId === student.id && c.subjectId === subject.id);
                let compSum = 0;
                let compDetailsSnapshot: Record<number, number> = {}; // Capture last evaluation details for snapshot
                studentCompetencies.forEach(c => {
                    compSum += c.average;
                    compDetailsSnapshot = c.scores; // Just taking the last one for now, ideally merge or pick specific
                });
                const competencyGrade = studentCompetencies.length > 0 ? compSum / studentCompetencies.length : null;

                // 3. Calculate Presentation Grade (10%)
                const studentPresentations = presentations.filter(p => p.studentId === student.id && p.subjectId === subject.id);
                let presSum = 0;
                let presDetailsSnapshot: Record<number, number> = {};
                studentPresentations.forEach(p => {
                    presSum += p.average;
                    presDetailsSnapshot = p.scores;
                });
                const presentationGrade = studentPresentations.length > 0 ? presSum / studentPresentations.length : null;

                // 4. Calculate Final Weighted Grade
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
                    competencyGrade,
                    competencyDetails: compDetailsSnapshot,
                    presentationGrade,
                    presentationDetails: presDetailsSnapshot,
                    finalGrade: finalGrade,
                    status,
                    progress,
                    hasActa
                });
            });
        });
        return rows;
    }, [students, subjects, quizzes, attempts, competencies, presentations, isTeacher, currentUserId, existingActas]);

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
                    </div>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-full text-xs text-text-secondary">
                            <span className="w-2 h-2 rounded-full bg-success"></span> Completo
                            <span className="w-2 h-2 rounded-full bg-warning ml-2"></span> Pendiente
                            <span className="w-2 h-2 rounded-full bg-secondary/30 ml-2"></span> Sin Iniciar
                        </div>
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
                                <th className="p-4 border-b border-secondary/20 text-center w-1/6 bg-blue-50/50 text-blue-700">
                                    <div className="flex flex-col items-center gap-1">
                                        <ClipboardCheckIcon className="h-4 w-4" /> Evaluaciones (60%)
                                    </div>
                                </th>
                                <th className="p-4 border-b border-secondary/20 text-center w-1/6 bg-indigo-50/50 text-indigo-700">
                                    <div className="flex flex-col items-center gap-1">
                                        <ChartBarIcon className="h-4 w-4" /> Competencias (30%)
                                    </div>
                                </th>
                                <th className="p-4 border-b border-secondary/20 text-center w-1/6 bg-cyan-50/50 text-cyan-700">
                                    <div className="flex flex-col items-center gap-1">
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
                                        <td className="p-4 text-center bg-blue-50/10 border-r border-secondary/5 relative group cursor-help">
                                            {row.writtenGrade !== null ? (
                                                <>
                                                    <span className={`font-bold text-lg ${getGradeColor(row.writtenGrade)}`}>
                                                        {row.writtenGrade.toFixed(1)}
                                                    </span>
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg whitespace-pre-line text-left">
                                                        <div className="font-bold border-b border-gray-600 mb-1 pb-1">Desglose Cuestionarios:</div>
                                                        {row.writtenDetails}
                                                    </div>
                                                </>
                                            ) : <span className="text-secondary/30">-</span>}
                                        </td>

                                        {/* Competencias 30% */}
                                        <td className="p-4 text-center bg-indigo-50/10 border-r border-secondary/5">
                                            {row.competencyGrade !== null ? (
                                                <span className={`font-bold text-lg ${getGradeColor(row.competencyGrade)}`}>
                                                    {row.competencyGrade.toFixed(1)}
                                                </span>
                                            ) : <span className="text-secondary/30">-</span>}
                                        </td>

                                        {/* Presentación 10% */}
                                        <td className="p-4 text-center bg-cyan-50/10 border-r border-secondary/5">
                                            {row.presentationGrade !== null ? (
                                                <span className={`font-bold text-lg ${getGradeColor(row.presentationGrade)}`}>
                                                    {row.presentationGrade.toFixed(1)}
                                                </span>
                                            ) : <span className="text-secondary/30">-</span>}
                                        </td>

                                        {/* Final Grade */}
                                        <td className="p-4 text-center border-r border-secondary/5 bg-secondary/5">
                                            {row.finalGrade !== null ? (
                                                <div className="flex flex-col items-center">
                                                    <span className={`font-extrabold text-2xl ${getGradeColor(row.finalGrade)}`}>
                                                        {row.finalGrade.toFixed(1)}
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
        </div>
    );
};

export default GradesTab;
