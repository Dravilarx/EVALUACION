
import React, { useMemo } from 'react';
import { Student, Subject, Acta, ManualGradeEntry, FinalExam } from '../types';
import { getGradeColor } from '../utils';
import { AcademicIcon, CheckCircleIcon, DocumentTextIcon, ChartBarIcon, PrinterIcon } from './icons';

interface RadiologyFinalGradeTabProps {
    students: Student[];
    subjects: Subject[];
    actas: Acta[];
    manualGrades: ManualGradeEntry[];
    finalExams: FinalExam[];
}

interface FinalRow {
    studentId: string;
    studentName: string;
    subjectsCount: number;
    presentationGrade: number; // 80% (1 decimal)
    examGrade: number | null;   // 20% (1 decimal)
    finalRadiologyGrade: number | null; // (1 decimal)
    status: 'Pendiente' | 'Aprobado' | 'Reprobado';
}

const RadiologyFinalGradeTab: React.FC<RadiologyFinalGradeTabProps> = ({
    students, subjects, actas, manualGrades, finalExams
}) => {

    const rows = useMemo<FinalRow[]>(() => {
        return students.map(student => {
            // 1. Calculate Presentation Grade (Average of ALL subjects)
            let totalSubjectGrades = 0;
            let subjectCount = 0;

            subjects.forEach(subject => {
                let grade: number | null = null;

                // Priority 1: Official Acta (Standard Subjects)
                const acta = actas.find(a => a.studentId === student.id && a.subjectId === subject.id);
                if (acta) {
                    grade = acta.content.finalGrade;
                } 
                // Priority 2: Manual Grade (Transversal or Override)
                else {
                    const manual = manualGrades.find(m => m.studentId === student.id && m.subjectId === subject.id);
                    // For Transversal, look for 'Transversal' type. For Standard override, 'Written' might be used as placeholder or specific logic
                    // Here we look for any entry for simplicity, prioritizing 'Transversal' for transversal subjects
                    if (manual) grade = manual.grade;
                }

                if (grade !== null) {
                    totalSubjectGrades += grade;
                    subjectCount++;
                }
            });

            // Round Presentation Grade average to 1 decimal place as requested
            let presentationGrade = 0;
            if (subjectCount > 0) {
                const rawAverage = totalSubjectGrades / subjectCount;
                presentationGrade = Math.round(rawAverage * 10) / 10;
            }

            // 2. Get Final Exam Grade
            const exam = finalExams.find(e => e.studentId === student.id && e.status === 'Completed');
            const examGrade = exam ? exam.finalGrade : null;

            // 3. Calculate Final Radiology Grade (NFR)
            // Weight: Presentation 80% + Exam 20%
            // Result must be 1 decimal place
            let finalRadiologyGrade: number | null = null;
            let status: FinalRow['status'] = 'Pendiente';

            if (presentationGrade > 0 && examGrade !== null) {
                const rawFinal = (presentationGrade * 0.8) + (examGrade * 0.2);
                finalRadiologyGrade = Math.round(rawFinal * 10) / 10;
                
                if (finalRadiologyGrade >= 4.0) {
                    status = 'Aprobado';
                } else {
                    status = 'Reprobado';
                }
            }

            return {
                studentId: student.id,
                studentName: student.name,
                subjectsCount: subjectCount,
                presentationGrade,
                examGrade,
                finalRadiologyGrade,
                status
            };
        });
    }, [students, subjects, actas, manualGrades, finalExams]);

    const handlePrintCertificate = (row: FinalRow) => {
        if (row.status !== 'Aprobado') {
            alert("Solo se pueden generar certificados para alumnos aprobados.");
            return;
        }
        alert(`Generando Certificado de Título para ${row.studentName}...\nNota Final: ${row.finalRadiologyGrade?.toFixed(1)}`);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-surface p-5 rounded-xl shadow-sm border border-secondary/20">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <AcademicIcon className="h-6 w-6 text-purple-600" /> Nota Final Titulación
                    </h2>
                    <p className="text-sm text-text-secondary mt-1">
                        Cálculo ponderado: Nota de Presentación (80%) + Examen de Título (20%).
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-surface p-4 rounded-xl border border-secondary/20 flex items-center gap-3">
                    <div className="p-3 bg-blue-100 text-blue-700 rounded-lg"><DocumentTextIcon className="h-6 w-6"/></div>
                    <div>
                        <p className="text-xs text-text-secondary uppercase font-bold">Nota Presentación</p>
                        <p className="text-sm font-medium">Promedio Asignaturas</p>
                        <p className="text-xs text-text-secondary">Ponderación: 80%</p>
                    </div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-secondary/20 flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 text-indigo-700 rounded-lg"><CheckCircleIcon className="h-6 w-6"/></div>
                    <div>
                        <p className="text-xs text-text-secondary uppercase font-bold">Examen Especialidad</p>
                        <p className="text-sm font-medium">Comisión Final</p>
                        <p className="text-xs text-text-secondary">Ponderación: 20%</p>
                    </div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-secondary/20 flex items-center gap-3 col-span-2">
                    <div className="p-3 bg-purple-600 text-white rounded-lg"><ChartBarIcon className="h-6 w-6"/></div>
                    <div>
                        <p className="text-xs text-text-secondary uppercase font-bold">Nota Final Titulación</p>
                        <p className="text-sm font-medium">Calificación Definitiva del Programa</p>
                    </div>
                </div>
            </div>

            <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/10 text-text-secondary uppercase text-xs font-bold border-b border-secondary/20">
                        <tr>
                            <th className="p-4">Residente</th>
                            <th className="p-4 text-center">Asignaturas Cerradas</th>
                            <th className="p-4 text-center bg-blue-50/50 text-blue-800">Nota Presentación (80%)</th>
                            <th className="p-4 text-center bg-indigo-50/50 text-indigo-800">Examen Final (20%)</th>
                            <th className="p-4 text-center bg-purple-50/50 text-purple-800">Nota Titulación</th>
                            <th className="p-4 text-center">Estado</th>
                            <th className="p-4 text-center">Certificación</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary/20">
                        {rows.map((row) => (
                            <tr key={row.studentId} className="hover:bg-background/50">
                                <td className="p-4 font-bold text-text-primary">{row.studentName}</td>
                                <td className="p-4 text-center">
                                    <span className="bg-secondary/10 px-2 py-1 rounded text-xs font-bold">{row.subjectsCount} / {subjects.length}</span>
                                </td>
                                <td className="p-4 text-center bg-blue-50/10 border-l border-blue-100">
                                    {row.presentationGrade > 0 ? (
                                        <span className={`font-bold text-lg ${getGradeColor(row.presentationGrade)}`}>{row.presentationGrade.toFixed(2)}</span>
                                    ) : <span className="text-secondary/30">-</span>}
                                </td>
                                <td className="p-4 text-center bg-indigo-50/10 border-l border-indigo-100">
                                    {row.examGrade !== null ? (
                                        <span className={`font-bold text-lg ${getGradeColor(row.examGrade)}`}>{row.examGrade.toFixed(1)}</span>
                                    ) : <span className="text-secondary/30 italic text-xs">Pendiente</span>}
                                </td>
                                <td className="p-4 text-center bg-purple-50/10 border-l border-purple-100">
                                    {row.finalRadiologyGrade !== null ? (
                                        <span className={`font-extrabold text-2xl ${getGradeColor(row.finalRadiologyGrade)}`}>{row.finalRadiologyGrade.toFixed(1)}</span>
                                    ) : <span className="text-secondary/30">-</span>}
                                </td>
                                <td className="p-4 text-center">
                                    {row.status === 'Aprobado' && <span className="bg-success text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">APROBADO</span>}
                                    {row.status === 'Reprobado' && <span className="bg-danger text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">REPROBADO</span>}
                                    {row.status === 'Pendiente' && <span className="bg-secondary/20 text-text-secondary px-3 py-1 rounded-full text-xs font-bold">EN PROCESO</span>}
                                </td>
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => handlePrintCertificate(row)}
                                        disabled={row.status !== 'Aprobado'}
                                        className="text-text-secondary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-2 rounded-full hover:bg-secondary/10"
                                        title="Imprimir Certificado de Título"
                                    >
                                        <PrinterIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr><td colSpan={7} className="p-8 text-center text-text-secondary">No hay alumnos registrados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RadiologyFinalGradeTab;
