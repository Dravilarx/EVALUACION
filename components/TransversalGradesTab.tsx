
import React, { useState, useMemo } from 'react';
import { Student, Subject, Teacher, ManualGradeEntry } from '../types';
import { TableIcon, EditIcon, PlusIcon, CloseIcon, CheckCircleIcon, BriefcaseIcon } from './icons';
import { getGradeColor } from '../utils';
import { ManualGradeService } from '../services/dataService';

interface TransversalGradesTabProps {
    students: Student[];
    subjects: Subject[];
    teachers: Teacher[];
    currentUserId: string;
    manualGrades: ManualGradeEntry[];
    onManualGradeUpdate: (entry: ManualGradeEntry) => void;
}

interface TransversalRow {
    studentId: string;
    studentName: string;
    subjectId: string;
    subjectName: string;
    leadTeacherId: string;
    leadTeacherName: string;
    finalGrade: number | null;
    comment: string;
    hasGrade: boolean;
}

const TransversalGradesTab: React.FC<TransversalGradesTabProps> = ({ 
    students, subjects, teachers, currentUserId, manualGrades, onManualGradeUpdate 
}) => {
    // Permissions
    const isTeacher = currentUserId === 'DOCENTE' || currentUserId === '10611061';

    // Filters
    const [filterStudent, setFilterStudent] = useState('');
    const [filterSubject, setFilterSubject] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [entryData, setEntryData] = useState<{
        studentId: string;
        studentName: string;
        subjectId: string;
        subjectName: string;
        grade: number | '';
        comment: string;
    } | null>(null);

    // Helpers
    const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || id;

    // Filter subjects to only Transversal ones
    const transversalSubjects = useMemo(() => subjects.filter(s => s.type === 'Transversal'), [subjects]);

    // Build Rows
    const rows = useMemo<TransversalRow[]>(() => {
        const result: TransversalRow[] = [];
        // If not teacher, filter students list to only the current user
        const visibleStudents = isTeacher ? students : students.filter(s => s.id === currentUserId);

        visibleStudents.forEach(student => {
            transversalSubjects.forEach(subject => {
                // Find existing grade
                const gradeEntry = manualGrades.find(m => 
                    m.studentId === student.id && 
                    m.subjectId === subject.id && 
                    m.type === 'Transversal'
                );

                result.push({
                    studentId: student.id,
                    studentName: student.name,
                    subjectId: subject.id,
                    subjectName: subject.name,
                    leadTeacherId: subject.lead_teacher_id,
                    leadTeacherName: getTeacherName(subject.lead_teacher_id),
                    finalGrade: gradeEntry ? gradeEntry.grade : null,
                    comment: gradeEntry?.comment || '',
                    hasGrade: !!gradeEntry
                });
            });
        });
        return result;
    }, [students, transversalSubjects, manualGrades, isTeacher, currentUserId, teachers]);

    // Filter Rows
    const filteredRows = useMemo(() => {
        return rows.filter(row => {
            const matchesStudent = filterStudent ? row.studentId === filterStudent : true;
            const matchesSubject = filterSubject ? row.subjectId === filterSubject : true;
            return matchesStudent && matchesSubject;
        });
    }, [rows, filterStudent, filterSubject]);

    // Modal Handlers
    const openEditModal = (row: TransversalRow) => {
        if (!isTeacher) return;
        setEntryData({
            studentId: row.studentId,
            studentName: row.studentName,
            subjectId: row.subjectId,
            subjectName: row.subjectName,
            grade: row.finalGrade !== null ? row.finalGrade : '',
            comment: row.comment
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!entryData || entryData.grade === '') return;

        const gradeValue = Number(entryData.grade);
        if (gradeValue < 1.0 || gradeValue > 7.0) {
            alert("La nota debe estar entre 1.0 y 7.0");
            return;
        }

        try {
            const entry: ManualGradeEntry = {
                id: `MAN-TRANS-${entryData.studentId}-${entryData.subjectId}`, 
                studentId: entryData.studentId,
                subjectId: entryData.subjectId,
                type: 'Transversal',
                grade: gradeValue,
                comment: entryData.comment,
                date: new Date().toISOString(),
                authorId: currentUserId
            };

            await ManualGradeService.create(entry);
            onManualGradeUpdate(entry);
            setIsModalOpen(false);
            setEntryData(null);
        } catch (error) {
            console.error("Error saving grade", error);
            alert("Error al guardar la nota.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header & Filters */}
            <div className="bg-surface p-5 rounded-xl shadow-sm border border-secondary/20 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                            <BriefcaseIcon className="h-6 w-6 text-purple-600" /> Ramos Transversales
                        </h2>
                        <p className="text-sm text-text-secondary">Asignaturas de formación general con nota única final.</p>
                    </div>
                </div>

                {isTeacher && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-secondary/10">
                        <div>
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
                            <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Asignatura Transversal</label>
                            <select 
                                value={filterSubject} 
                                onChange={(e) => setFilterSubject(e.target.value)}
                                className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                            >
                                <option value="">Todas las Asignaturas</option>
                                {transversalSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/10 text-text-secondary uppercase text-xs font-bold border-b border-secondary/20">
                            <tr>
                                <th className="p-4 w-1/4">Alumno</th>
                                <th className="p-4 w-1/4">Asignatura</th>
                                <th className="p-4 w-1/4">Docente Encargado</th>
                                <th className="p-4 text-center w-1/6">Nota Final</th>
                                <th className="p-4 text-center w-1/12">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/20">
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-text-secondary italic">
                                        {transversalSubjects.length === 0 ? "No hay asignaturas transversales configuradas." : "No hay registros disponibles para los filtros seleccionados."}
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row) => (
                                    <tr key={`${row.studentId}-${row.subjectId}`} className="hover:bg-background/50 transition-colors">
                                        <td className="p-4 font-bold text-text-primary">{row.studentName}</td>
                                        <td className="p-4 text-text-primary">
                                            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold mr-2 border border-purple-100">T</span>
                                            {row.subjectName}
                                        </td>
                                        <td className="p-4 text-text-secondary">{row.leadTeacherName}</td>
                                        <td className="p-4 text-center">
                                            {row.finalGrade !== null ? (
                                                <span className={`font-extrabold text-xl ${getGradeColor(row.finalGrade)}`}>
                                                    {row.finalGrade.toFixed(1)}
                                                </span>
                                            ) : (
                                                <span className="text-secondary/30 italic">Sin Nota</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {isTeacher && (
                                                <button 
                                                    onClick={() => openEditModal(row)}
                                                    className={`p-2 rounded-full transition-colors ${row.hasGrade ? 'text-secondary hover:text-primary hover:bg-secondary/10' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                                                    title={row.hasGrade ? "Editar Nota" : "Ingresar Nota"}
                                                >
                                                    {row.hasGrade ? <EditIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && entryData && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md flex flex-col border border-secondary/20 animate-fade-in-up">
                        <header className="p-5 border-b border-secondary/20 bg-secondary/5 rounded-t-xl flex justify-between items-center">
                            <h3 className="text-lg font-bold text-text-primary">Ingresar Calificación</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-secondary/20 rounded-full"><CloseIcon /></button>
                        </header>
                        
                        <div className="p-6 space-y-4">
                            <div className="bg-background p-3 rounded-lg border border-secondary/20 text-sm">
                                <p><span className="font-bold text-text-secondary">Alumno:</span> {entryData.studentName}</p>
                                <p className="mt-1"><span className="font-bold text-text-secondary">Asignatura:</span> {entryData.subjectName}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-1">Nota Final (1.0 - 7.0)</label>
                                <input 
                                    type="number" 
                                    step="0.1" min="1.0" max="7.0"
                                    value={entryData.grade}
                                    onChange={(e) => setEntryData({...entryData, grade: e.target.value === '' ? '' : parseFloat(e.target.value)})}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-3 text-3xl font-bold outline-none focus:ring-2 focus:ring-primary text-center text-primary"
                                    autoFocus
                                    placeholder="-"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-1">Observación</label>
                                <textarea 
                                    value={entryData.comment}
                                    onChange={(e) => setEntryData({...entryData, comment: e.target.value})}
                                    rows={3}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                                    placeholder="Comentarios sobre el desempeño..."
                                />
                            </div>
                        </div>

                        <footer className="p-5 border-t border-secondary/20 bg-secondary/5 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors text-sm">Cancelar</button>
                            <button 
                                onClick={handleSave}
                                className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-all text-sm flex items-center gap-2"
                            >
                                <CheckCircleIcon className="h-4 w-4"/> Guardar
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransversalGradesTab;
