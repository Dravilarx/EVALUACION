
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Acta, Student, Subject, Teacher, SurveyResult, Quiz, Attempt, CompetencyEvaluation, PresentationEvaluation, ManualGradeEntry, FinalExam } from '../types';
import { DocumentTextIcon, CheckCircleIcon, ClockIcon, XCircleIcon, RefreshIcon, AcademicIcon, PrinterIcon, PenIcon, KeyIcon, FingerPrintIcon, ClipboardCheckIcon, ChartBarIcon, BriefcaseIcon } from './icons';
import { ActaService, SurveyService } from '../services/dataService';
import { getGradeColor, calculateGrade } from '../utils';

interface ActasTabProps {
    actas: Acta[];
    students: Student[];
    subjects: Subject[];
    teachers: Teacher[];
    // Extended props for Report Generation
    quizzes?: Quiz[];
    attempts?: Attempt[];
    competencies?: CompetencyEvaluation[];
    presentations?: PresentationEvaluation[];
    manualGrades?: ManualGradeEntry[];
    finalExams?: FinalExam[];
    currentUserId: string;
    onUpdateActa: (updatedActa: Acta) => void;
}

type ModalStep = 'view' | 'confirm' | 'success' | 'print_report';
type SignatureType = 'PIN' | 'Draw';

// Report Selection State
interface ReportSelection {
    gradeBook: boolean;
    transversal: boolean;
    finalExam: boolean;
    graduation: boolean;
}

const ActasTab: React.FC<ActasTabProps> = ({ 
    actas, students, subjects, teachers, 
    quizzes = [], attempts = [], competencies = [], presentations = [], manualGrades = [], finalExams = [],
    currentUserId, onUpdateActa 
}) => {
    // Permissions: Docente OR Admin
    const isTeacher = currentUserId === 'DOCENTE' || currentUserId === '10611061';
    
    const [selectedActa, setSelectedActa] = useState<Acta | null>(null);
    const [filterStudent, setFilterStudent] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    
    // Multi-step Flow State
    const [modalStep, setModalStep] = useState<ModalStep>('view');
    const [isProcessing, setIsProcessing] = useState(false);

    // Signature State
    const [signatureType, setSignatureType] = useState<SignatureType>('PIN');
    const [pin, setPin] = useState(['', '', '', '']);
    const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    // --- REPORT GENERATION STATE ---
    const [reportStudentId, setReportStudentId] = useState('');
    const [reportSelection, setReportSelection] = useState<ReportSelection>({
        gradeBook: true,
        transversal: true,
        finalExam: true,
        graduation: true
    });

    // Reset state on modal open
    useEffect(() => {
        if (!selectedActa && modalStep !== 'print_report') {
            setModalStep('view');
            setIsProcessing(false);
            setPin(['', '', '', '']);
            setHasDrawn(false);
        }
    }, [selectedActa, modalStep]);

    const filteredActas = useMemo(() => {
        return actas.filter(acta => {
            const matchesUser = isTeacher ? true : acta.studentId === currentUserId;
            const matchesStudent = filterStudent ? acta.studentId === filterStudent : true;
            const matchesSubject = filterSubject ? acta.subjectId === filterSubject : true;
            return matchesUser && matchesStudent && matchesSubject;
        });
    }, [actas, isTeacher, currentUserId, filterStudent, filterSubject]);

    const getStudentName = (id: string) => students.find(s => s.id === id)?.name || id;
    const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;
    const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || id;

    // --- CALCULATE GRADES FOR REPORTS ---
    const getStudentReportData = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return null;

        // 1. Standard Subjects (Libro de Notas)
        const standardSubjects = subjects.filter(s => s.type !== 'Transversal');
        const standardGrades = standardSubjects.map(sub => {
            // Logic duplicated from GradesTab for consistency (Simplified for report)
            const manual = manualGrades.find(m => m.studentId === studentId && m.subjectId === sub.id && m.type === 'Written'); // Using written as proxy or check acta
            const acta = actas.find(a => a.studentId === studentId && a.subjectId === sub.id);
            
            let finalGrade = 0;
            if (acta) finalGrade = acta.content.finalGrade;
            else if (manual) finalGrade = manual.grade; // Simplified fallback
            
            return { name: sub.name, grade: finalGrade };
        });

        // 2. Transversal Subjects
        const transversalSubjects = subjects.filter(s => s.type === 'Transversal');
        const transversalGrades = transversalSubjects.map(sub => {
            const entry = manualGrades.find(m => m.studentId === studentId && m.subjectId === sub.id && m.type === 'Transversal');
            return { name: sub.name, grade: entry ? entry.grade : 0 };
        });

        // 3. Final Exam
        const exam = finalExams.find(e => e.studentId === studentId && e.status === 'Completed');

        // 4. Final Graduation Grade
        // Calculate average presentation
        const validStandardGrades = standardGrades.filter(g => g.grade > 0);
        const validTransversalGrades = transversalGrades.filter(g => g.grade > 0);
        const allGrades = [...validStandardGrades, ...validTransversalGrades]; // Assuming transversals count for presentation too? Usually standard only for "Presentation Grade" 80% logic.
        
        // Use logic from RadiologyFinalGradeTab: Average of ALL subjects (Standard + Transversal if applicable, usually standard)
        // Let's assume standard for presentation grade base
        let totalSum = 0;
        let count = 0;
        standardGrades.forEach(g => { if(g.grade > 0) { totalSum += g.grade; count++; } });
        // Also include transversal if they have grades? Usually distinct. Sticking to standard for 80% base.
        
        const presentationGrade = count > 0 ? totalSum / count : 0;
        const examGrade = exam ? exam.finalGrade : 0;
        
        let finalTitulation = 0;
        if (presentationGrade > 0 && examGrade > 0) {
            finalTitulation = (presentationGrade * 0.8) + (examGrade * 0.2);
        }

        return {
            student,
            standardGrades,
            transversalGrades,
            exam,
            presentationGrade,
            finalTitulation
        };
    };

    // PIN Handling
    const handlePinChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        if (value && index < 3) pinRefs.current[index + 1]?.focus();
    };

    // Canvas Handling
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
        setHasDrawn(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            setHasDrawn(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleConfirmSign = async () => {
        if (!selectedActa) return;
        
        // Validation
        if (signatureType === 'PIN' && pin.join('').length !== 4) {
            alert("Ingrese un PIN válido de 4 dígitos.");
            return;
        }
        if (signatureType === 'Draw' && !hasDrawn) {
            alert("Por favor firme en el recuadro.");
            return;
        }

        setIsProcessing(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Signature Data
            const sigData = signatureType === 'PIN' 
                ? 'PIN_VERIFIED' 
                : canvasRef.current?.toDataURL() || '';

            const updated: Acta = { 
                ...selectedActa, 
                status: 'Aceptada',
                signature: {
                    type: signatureType,
                    data: sigData,
                    timestamp: new Date().toISOString()
                }
            };
            
            await ActaService.update(updated);
            onUpdateActa(updated);

            // Generate Survey Logic (Simplified)
            const pendingSurvey: SurveyResult = {
                id: `SURV-AUTO-${Date.now()}`,
                studentId: currentUserId,
                teacherId: selectedActa.teacherId,
                subjectId: selectedActa.subjectId,
                date: new Date().toISOString(),
                status: 'Pending',
                responses: {},
                textResponses: { q25: '', q26: '', q27: '' }
            };
            await SurveyService.create(pendingSurvey);
            
            setModalStep('success');
            setTimeout(() => setSelectedActa(null), 3000);

        } catch (error) {
            console.error("Error accepting acta:", error);
            alert("Error al firmar.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleInitiateSigning = () => {
        setModalStep('confirm');
    };

    const handleGenerateReport = () => {
        if (!reportStudentId) {
            alert("Seleccione un alumno para generar el reporte.");
            return;
        }
        if (!Object.values(reportSelection).some(v => v)) {
            alert("Seleccione al menos un tipo de reporte.");
            return;
        }
        setModalStep('print_report');
    };

    // INJECT PRINT STYLES
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                body * {
                    visibility: hidden;
                }
                .print-container, .print-container * {
                    visibility: visible;
                }
                .print-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    min-height: 100vh;
                    background: white;
                    padding: 20mm;
                    z-index: 9999;
                }
                .page-break {
                    page-break-after: always;
                }
                .no-print {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    return (
        <div className="space-y-8 animate-fade-in-up">
            
            {/* --- REPORT GENERATOR SECTION (ADMIN ONLY) --- */}
            {isTeacher && (
                <div className="bg-surface p-6 rounded-xl border border-primary/20 shadow-sm">
                    <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                        <PrinterIcon className="h-6 w-6 text-primary" /> Generador de Reportes Globales
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <div className="lg:col-span-1">
                            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Seleccionar Alumno</label>
                            <select 
                                value={reportStudentId} 
                                onChange={(e) => setReportStudentId(e.target.value)}
                                className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                            >
                                <option value="">-- Seleccione --</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Documentos a Incluir</label>
                            <div className="flex flex-wrap gap-3">
                                <label className="flex items-center gap-2 bg-background border border-secondary/20 px-3 py-2 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={reportSelection.gradeBook}
                                        onChange={e => setReportSelection(prev => ({...prev, gradeBook: e.target.checked}))}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">Libro de Notas</span>
                                </label>
                                <label className="flex items-center gap-2 bg-background border border-secondary/20 px-3 py-2 rounded-lg cursor-pointer hover:border-purple-500/50 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={reportSelection.transversal}
                                        onChange={e => setReportSelection(prev => ({...prev, transversal: e.target.checked}))}
                                        className="rounded text-purple-600 focus:ring-purple-600"
                                    />
                                    <span className="text-sm">Ramos Transversales</span>
                                </label>
                                <label className="flex items-center gap-2 bg-background border border-secondary/20 px-3 py-2 rounded-lg cursor-pointer hover:border-indigo-500/50 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={reportSelection.finalExam}
                                        onChange={e => setReportSelection(prev => ({...prev, finalExam: e.target.checked}))}
                                        className="rounded text-indigo-600 focus:ring-indigo-600"
                                    />
                                    <span className="text-sm">Examen Final</span>
                                </label>
                                <label className="flex items-center gap-2 bg-background border border-secondary/20 px-3 py-2 rounded-lg cursor-pointer hover:border-emerald-500/50 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={reportSelection.graduation}
                                        onChange={e => setReportSelection(prev => ({...prev, graduation: e.target.checked}))}
                                        className="rounded text-emerald-600 focus:ring-emerald-600"
                                    />
                                    <span className="text-sm">Nota Titulación</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <button 
                                onClick={handleGenerateReport}
                                className="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <PrinterIcon className="h-5 w-5" /> Vista Previa / Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- INDIVIDUAL ACTAS TABLE --- */}
            <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-secondary/20 pb-2">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <DocumentTextIcon className="h-6 w-6 text-text-secondary" /> Historial de Actas Individuales
                        </h2>
                    </div>
                    {isTeacher && (
                        <div className="flex gap-3">
                            <select 
                                value={filterStudent} 
                                onChange={(e) => setFilterStudent(e.target.value)}
                                className="bg-background border border-secondary/30 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Filtrar Alumno</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <select 
                                value={filterSubject} 
                                onChange={(e) => setFilterSubject(e.target.value)}
                                className="bg-background border border-secondary/30 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Filtrar Asignatura</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-secondary/10 text-text-secondary uppercase text-xs font-bold border-b border-secondary/20">
                                <tr>
                                    <th className="p-4">Fecha Emisión</th>
                                    <th className="p-4">Asignatura</th>
                                    <th className="p-4">Alumno</th>
                                    <th className="p-4 text-center">Nota Final</th>
                                    <th className="p-4 text-center">Estado</th>
                                    <th className="p-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary/10">
                                {filteredActas.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-text-secondary">No hay actas individuales disponibles.</td></tr>
                                ) : (
                                    filteredActas.map(acta => (
                                        <tr key={acta.id} className="hover:bg-background/50">
                                            <td className="p-4 font-mono text-text-secondary">{new Date(acta.generatedAt).toLocaleDateString()}</td>
                                            <td className="p-4 font-medium">{getSubjectName(acta.subjectId)}</td>
                                            <td className="p-4">{getStudentName(acta.studentId)}</td>
                                            <td className="p-4 text-center">
                                                <span className={`font-bold text-lg ${getGradeColor(acta.content.finalGrade)}`}>
                                                    {acta.content.finalGrade.toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${acta.status === 'Aceptada' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                                    {acta.status === 'Aceptada' ? <CheckCircleIcon className="h-3 w-3"/> : <ClockIcon className="h-3 w-3"/>}
                                                    {acta.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => setSelectedActa(acta)}
                                                    className="text-primary hover:bg-primary/10 p-2 rounded transition-colors text-xs font-bold"
                                                >
                                                    Ver Documento
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- MODAL FOR PRINTING REPORTS --- */}
            {modalStep === 'print_report' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-surface w-full max-w-5xl h-[95vh] rounded-xl shadow-2xl flex flex-col border border-secondary/20 overflow-hidden relative">
                        <header className="p-4 border-b border-secondary/20 flex justify-between items-center bg-secondary/5 print:hidden">
                            <h3 className="text-lg font-bold text-text-primary">Vista Previa de Impresión</h3>
                            <div className="flex gap-2">
                                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors shadow-lg">
                                    <PrinterIcon className="h-4 w-4" /> Imprimir Documento Oficial
                                </button>
                                <button onClick={() => setModalStep('view')} className="p-2 hover:bg-secondary/20 rounded-full"><XCircleIcon className="h-6 w-6" /></button>
                            </div>
                        </header>

                        <div className="flex-grow overflow-y-auto bg-gray-100 flex justify-center p-8 print:p-0 print:bg-white">
                            {/* OFFICIAL REPORT CONTAINER */}
                            <div className="print-container bg-white w-full max-w-[210mm] p-12 shadow-2xl relative text-gray-900 font-serif print:shadow-none print:w-full space-y-12">
                                
                                {/* Report Header (Repeated on pages usually, simplified here) */}
                                <div className="text-center border-b-2 border-gray-800 pb-6">
                                    <div className="flex justify-center mb-4">
                                        <AcademicIcon className="h-16 w-16 text-gray-800" />
                                    </div>
                                    <h1 className="text-2xl font-bold uppercase tracking-widest mb-1">Universidad de Antofagasta</h1>
                                    <h2 className="text-lg font-semibold text-gray-600">Facultad de Medicina y Odontología</h2>
                                    <p className="text-sm italic mt-2">Departamento de Radiología e Imágenes</p>
                                    <p className="text-xs text-right mt-4 font-mono">FECHA EMISIÓN: {new Date().toLocaleDateString()}</p>
                                </div>

                                {/* Student Info Block */}
                                {(() => {
                                    const data = getStudentReportData(reportStudentId);
                                    if (!data) return <div>Error cargando datos del alumno.</div>;

                                    return (
                                        <>
                                            <div className="bg-gray-50 border border-gray-200 p-4 rounded mb-8">
                                                <h3 className="font-bold text-gray-800 uppercase text-sm border-b border-gray-300 pb-2 mb-2">Antecedentes del Residente</h3>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <p><span className="font-bold">Nombre:</span> {data.student.name}</p>
                                                    <p><span className="font-bold">RUT / ID:</span> {data.student.id}</p>
                                                    <p><span className="font-bold">Programa:</span> Especialidad en Radiología</p>
                                                    <p><span className="font-bold">Cohorte:</span> {new Date(data.student.admission_date).getFullYear()}</p>
                                                </div>
                                            </div>

                                            {/* 1. LIBRO DE NOTAS */}
                                            {reportSelection.gradeBook && (
                                                <div className="mb-8">
                                                    <h3 className="text-lg font-bold uppercase border-l-4 border-gray-800 pl-3 mb-4 bg-gray-100 py-1">I. Resumen Libro de Notas (Asignaturas)</h3>
                                                    <table className="w-full text-sm border-collapse border border-gray-300">
                                                        <thead className="bg-gray-200">
                                                            <tr>
                                                                <th className="border border-gray-300 p-2 text-left">Asignatura</th>
                                                                <th className="border border-gray-300 p-2 text-center w-32">Calificación Final</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {data.standardGrades.map((g, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="border border-gray-300 p-2">{g.name}</td>
                                                                    <td className="border border-gray-300 p-2 text-center font-bold">
                                                                        {g.grade > 0 ? g.grade.toFixed(2) : '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {/* 2. RAMOS TRANSVERSALES */}
                                            {reportSelection.transversal && (
                                                <div className="mb-8">
                                                    <h3 className="text-lg font-bold uppercase border-l-4 border-gray-800 pl-3 mb-4 bg-gray-100 py-1">II. Resumen Ramos Transversales</h3>
                                                    <table className="w-full text-sm border-collapse border border-gray-300">
                                                        <thead className="bg-gray-200">
                                                            <tr>
                                                                <th className="border border-gray-300 p-2 text-left">Asignatura Transversal</th>
                                                                <th className="border border-gray-300 p-2 text-center w-32">Calificación Final</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {data.transversalGrades.map((g, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="border border-gray-300 p-2">{g.name}</td>
                                                                    <td className="border border-gray-300 p-2 text-center font-bold">
                                                                        {g.grade > 0 ? g.grade.toFixed(2) : '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {data.transversalGrades.length === 0 && <tr><td colSpan={2} className="p-2 border text-center italic">Sin asignaturas transversales registradas.</td></tr>}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {/* 3. EXAMEN FINAL */}
                                            {reportSelection.finalExam && (
                                                <div className="mb-8 page-break">
                                                    <h3 className="text-lg font-bold uppercase border-l-4 border-gray-800 pl-3 mb-4 bg-gray-100 py-1">III. Examen Final de Especialidad</h3>
                                                    {data.exam ? (
                                                        <div className="border border-gray-300 p-4">
                                                            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                                                <p><span className="font-bold">Fecha:</span> {new Date(data.exam.date).toLocaleDateString()}</p>
                                                                <p><span className="font-bold">Estado:</span> {data.exam.status === 'Completed' ? 'Aprobado' : 'Pendiente'}</p>
                                                            </div>
                                                            <div className="mb-4">
                                                                <p className="font-bold text-sm mb-1">Comisión Evaluadora:</p>
                                                                <ul className="list-disc list-inside text-sm italic text-gray-700">
                                                                    {data.exam.commissionIds.map(tid => <li key={tid}>{getTeacherName(tid)}</li>)}
                                                                </ul>
                                                            </div>
                                                            <div className="text-center border-t border-gray-300 pt-4">
                                                                <p className="text-sm uppercase font-bold text-gray-500">Nota Examen Final</p>
                                                                <p className="text-4xl font-extrabold">{data.exam.finalGrade.toFixed(1)}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm italic border p-4 text-center">Examen Final no registrado o pendiente.</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* 4. NOTA TITULACION */}
                                            {reportSelection.graduation && (
                                                <div className="mb-12">
                                                    <h3 className="text-lg font-bold uppercase border-l-4 border-gray-800 pl-3 mb-4 bg-gray-100 py-1">IV. Nota Final de Titulación</h3>
                                                    <table className="w-full text-sm border-collapse border border-gray-300">
                                                        <tbody>
                                                            <tr>
                                                                <td className="border border-gray-300 p-3 bg-gray-50">Nota de Presentación (Promedio Asignaturas - 80%)</td>
                                                                <td className="border border-gray-300 p-3 text-center font-bold text-lg">{data.presentationGrade.toFixed(2)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="border border-gray-300 p-3 bg-gray-50">Nota Examen Final (20%)</td>
                                                                <td className="border border-gray-300 p-3 text-center font-bold text-lg">{data.exam ? data.exam.finalGrade.toFixed(1) : '-'}</td>
                                                            </tr>
                                                            <tr className="border-t-2 border-gray-800">
                                                                <td className="border border-gray-300 p-4 font-bold text-right uppercase bg-gray-100 text-base">Calificación Final del Programa</td>
                                                                <td className="border border-gray-300 p-4 text-center font-extrabold text-3xl bg-gray-100">
                                                                    {data.finalTitulation > 0 ? data.finalTitulation.toFixed(1) : '-'}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <div className="mt-2 text-xs text-right italic">
                                                        {data.finalTitulation >= 4.0 ? "ESTADO: APROBADO" : "ESTADO: PENDIENTE / REPROBADO"}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}

                                {/* SIGNATURE FOOTER */}
                                <div className="mt-20 pt-10 flex flex-col items-center justify-center page-break">
                                    {/* Placeholder Signature Image or Line */}
                                    <div className="w-64 border-b-2 border-gray-800 mb-2"></div>
                                    <p className="font-bold text-lg">Dr. Marcelo Avila</p>
                                    <p className="text-sm uppercase text-gray-600">Jefe de Programa de Radiología</p>
                                    <p className="text-xs text-gray-500">Universidad de Antofagasta</p>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL & OFFICIAL DOCUMENT VIEW (Original Actas) */}
            {selectedActa && modalStep !== 'print_report' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-surface w-full max-w-4xl max-h-[95vh] rounded-xl shadow-2xl flex flex-col border border-secondary/20 overflow-hidden relative">
                        
                        {/* SUCCESS STEP */}
                        {modalStep === 'success' && (
                            <div className="absolute inset-0 z-50 bg-surface flex flex-col items-center justify-center p-8 animate-fade-in-up">
                                <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6">
                                    <CheckCircleIcon className="h-16 w-16 text-success" />
                                </div>
                                <h3 className="text-3xl font-bold text-text-primary mb-2">¡Acta Firmada!</h3>
                                <p className="text-text-secondary text-center max-w-md">
                                    Documento archivado y encuesta docente habilitada.
                                </p>
                                <div className="mt-8 w-full max-w-xs bg-secondary/10 h-1 rounded-full overflow-hidden">
                                    <div className="h-full bg-success animate-progress-indeterminate"></div>
                                </div>
                            </div>
                        )}

                        {/* SIGNATURE STEP */}
                        {modalStep === 'confirm' && (
                            <div className="absolute inset-0 z-40 bg-surface flex flex-col animate-fade-in-right">
                                <header className="p-6 border-b border-secondary/20 flex justify-between items-center bg-secondary/5">
                                    <h3 className="text-xl font-bold text-text-primary">Firma Digital</h3>
                                    <button onClick={() => setModalStep('view')} className="p-2 hover:bg-secondary/20 rounded-full"><XCircleIcon className="h-6 w-6 text-text-secondary" /></button>
                                </header>
                                <div className="flex-grow p-8 flex flex-col items-center justify-center">
                                    <div className="bg-white p-8 rounded-xl shadow-lg border border-secondary/20 w-full max-w-md">
                                        <div className="flex justify-center gap-4 mb-6 border-b border-secondary/10 pb-4">
                                            <button 
                                                onClick={() => setSignatureType('PIN')}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-bold ${signatureType === 'PIN' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-secondary/10'}`}
                                            >
                                                <KeyIcon className="h-5 w-5" /> PIN
                                            </button>
                                            <button 
                                                onClick={() => setSignatureType('Draw')}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-bold ${signatureType === 'Draw' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-secondary/10'}`}
                                            >
                                                <PenIcon className="h-5 w-5" /> Trazo
                                            </button>
                                        </div>

                                        {signatureType === 'PIN' ? (
                                            <div className="text-center space-y-4">
                                                <p className="text-sm text-text-secondary">Ingrese su PIN de seguridad de 4 dígitos</p>
                                                <div className="flex justify-center gap-3">
                                                    {pin.map((digit, idx) => (
                                                        <input
                                                            key={idx}
                                                            ref={el => { pinRefs.current[idx] = el; }}
                                                            type="password"
                                                            maxLength={1}
                                                            value={digit}
                                                            onChange={e => handlePinChange(idx, e.target.value)}
                                                            className="w-12 h-12 text-center text-2xl border-2 border-secondary/30 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all"
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-xs text-text-secondary italic mt-2">Para pruebas: Cualquier 4 dígitos</p>
                                            </div>
                                        ) : (
                                            <div className="text-center space-y-4">
                                                <p className="text-sm text-text-secondary">Dibuje su firma en el recuadro</p>
                                                <div className="border-2 border-dashed border-secondary/40 rounded-lg bg-gray-50 relative">
                                                    <canvas 
                                                        ref={canvasRef}
                                                        width={350}
                                                        height={150}
                                                        className="cursor-crosshair w-full touch-none"
                                                        onMouseDown={startDrawing}
                                                        onMouseMove={draw}
                                                        onMouseUp={stopDrawing}
                                                        onMouseLeave={stopDrawing}
                                                        onTouchStart={startDrawing}
                                                        onTouchMove={draw}
                                                        onTouchEnd={stopDrawing}
                                                    />
                                                    <button onClick={clearCanvas} className="absolute top-2 right-2 text-xs text-danger hover:bg-danger/10 px-2 py-1 rounded">Borrar</button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-8 flex gap-3">
                                            <button onClick={() => setModalStep('view')} className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-secondary/5 transition-colors">Cancelar</button>
                                            <button 
                                                onClick={handleConfirmSign}
                                                disabled={isProcessing}
                                                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold shadow-lg transition-all flex justify-center items-center gap-2"
                                            >
                                                {isProcessing ? <RefreshIcon className="animate-spin h-4 w-4"/> : <FingerPrintIcon className="h-4 w-4"/>}
                                                Firmar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DOCUMENT VIEW */}
                        <header className="p-4 border-b border-secondary/20 flex justify-between items-center bg-secondary/5 print:hidden">
                            <h3 className="text-lg font-bold text-text-primary">Vista Previa</h3>
                            <div className="flex gap-2">
                                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-secondary/30 rounded-lg text-sm font-bold hover:bg-secondary/5 transition-colors">
                                    <PrinterIcon className="h-4 w-4" /> Imprimir Oficial
                                </button>
                                <button onClick={() => setSelectedActa(null)} className="p-2 hover:bg-secondary/20 rounded-full"><XCircleIcon className="h-6 w-6" /></button>
                            </div>
                        </header>

                        <div className="overflow-y-auto bg-gray-100 flex justify-center p-8 print:p-0 print:bg-white flex-grow">
                            {/* OFFICIAL DOCUMENT CONTAINER */}
                            <div className="print-container bg-white w-full max-w-[210mm] min-h-[297mm] p-12 shadow-2xl relative text-gray-900 font-serif print:shadow-none print:w-full">
                                
                                {/* Watermark */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
                                    <div className="transform -rotate-45 text-9xl font-bold whitespace-nowrap">
                                        DOCUMENTO OFICIAL UA DOCUMENTO OFICIAL UA
                                    </div>
                                </div>

                                {/* Header */}
                                <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
                                    <div className="flex justify-center mb-4">
                                        <AcademicIcon className="h-16 w-16 text-gray-800" />
                                    </div>
                                    <h1 className="text-2xl font-bold uppercase tracking-widest mb-1">Universidad de Antofagasta</h1>
                                    <h2 className="text-lg font-semibold text-gray-600">Facultad de Medicina y Odontología</h2>
                                    <p className="text-sm italic mt-2">Departamento de Radiología e Imágenes</p>
                                </div>

                                {/* Title */}
                                <div className="text-center mb-10">
                                    <h3 className="text-xl font-bold uppercase border-2 border-gray-800 inline-block px-6 py-2">Acta de Calificación Final</h3>
                                    <p className="text-sm mt-2 text-gray-500 font-mono">FOLIO: {selectedActa.id}</p>
                                </div>

                                {/* Student Info */}
                                <div className="mb-8 grid grid-cols-2 gap-y-4 text-sm">
                                    <div><span className="font-bold uppercase text-gray-500 text-xs block">Nombre del Residente:</span> {getStudentName(selectedActa.studentId)}</div>
                                    <div><span className="font-bold uppercase text-gray-500 text-xs block">RUT / ID:</span> {selectedActa.studentId}</div>
                                    <div><span className="font-bold uppercase text-gray-500 text-xs block">Asignatura:</span> {getSubjectName(selectedActa.subjectId)}</div>
                                    <div><span className="font-bold uppercase text-gray-500 text-xs block">Fecha de Emisión:</span> {new Date(selectedActa.generatedAt).toLocaleDateString()}</div>
                                </div>

                                {/* Grades Table */}
                                <table className="w-full text-sm border-collapse border border-gray-300 mb-8">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border border-gray-300 p-2 text-left w-2/3">Ítem de Evaluación</th>
                                            <th className="border border-gray-300 p-2 text-center w-1/3">Calificación (1.0 - 7.0)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-300 p-2">Evaluación Teórica (Escrita) - 60%</td>
                                            <td className="border border-gray-300 p-2 text-center">{selectedActa.content.writtenGrade.toFixed(1)}</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-300 p-2">Evaluación de Competencias - 30%</td>
                                            <td className="border border-gray-300 p-2 text-center">{selectedActa.content.competencyGrade.toFixed(1)}</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-300 p-2">Presentación Clínica - 10%</td>
                                            <td className="border border-gray-300 p-2 text-center">{selectedActa.content.presentationGrade.toFixed(1)}</td>
                                        </tr>
                                        <tr className="bg-gray-50 font-bold">
                                            <td className="border border-gray-300 p-3 text-right uppercase">Nota Final Ponderada</td>
                                            <td className="border border-gray-300 p-3 text-center text-lg">{selectedActa.content.finalGrade.toFixed(1)}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Feedback Section */}
                                <div className="mb-12 border border-gray-200 p-4 rounded bg-gray-50">
                                    <p className="font-bold text-xs uppercase text-gray-500 mb-2">Observaciones del Docente:</p>
                                    <p className="italic text-gray-700 text-sm leading-relaxed">"{selectedActa.content.writtenComment || 'Sin observaciones adicionales.'}"</p>
                                </div>

                                {/* Signatures Footer */}
                                <div className="mt-auto pt-12 flex justify-between items-end gap-10">
                                    <div className="text-center flex-1">
                                        {/* Teacher Signature Placeholder */}
                                        <div className="h-16 mb-2 flex items-end justify-center">
                                            <img src={`https://ui-avatars.com/api/?name=${getTeacherName(selectedActa.teacherId)}&background=random&font-size=0.33`} className="h-12 opacity-50 grayscale" alt="Firma Docente" />
                                        </div>
                                        <div className="border-t border-gray-400 pt-2">
                                            <p className="font-bold text-sm">{getTeacherName(selectedActa.teacherId)}</p>
                                            <p className="text-xs text-gray-500 uppercase">Docente Responsable</p>
                                        </div>
                                    </div>

                                    <div className="text-center flex-1">
                                        {/* Student Signature */}
                                        <div className="h-16 mb-2 flex items-end justify-center">
                                            {selectedActa.signature ? (
                                                selectedActa.signature.type === 'Draw' ? (
                                                    <img src={selectedActa.signature.data} className="h-14" alt="Firma Alumno" />
                                                ) : (
                                                    <div className="border-2 border-gray-800 px-2 py-1 font-mono text-xs font-bold tracking-widest transform -rotate-2">
                                                        PIN: VERIFICADO
                                                        <br/><span className="text-[8px] font-sans font-normal">{new Date(selectedActa.signature.timestamp).toLocaleDateString()}</span>
                                                    </div>
                                                )
                                            ) : (
                                                <div className="h-full w-full border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                                                    Pendiente de Firma
                                                </div>
                                            )}
                                        </div>
                                        <div className="border-t border-gray-400 pt-2">
                                            <p className="font-bold text-sm">{getStudentName(selectedActa.studentId)}</p>
                                            <p className="text-xs text-gray-500 uppercase">Residente (Toma de Conocimiento)</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="text-center mt-12 text-[10px] text-gray-400">
                                    Documento generado electrónicamente por sistema GRUA - Universidad de Antofagasta. 
                                    <br/>Código de Verificación: {selectedActa.id}-{Date.now().toString(36)}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions (Only for Student if Pending) */}
                        {!isTeacher && selectedActa.status === 'Pendiente' && selectedActa.studentId === currentUserId && (
                            <div className="p-4 bg-surface border-t border-secondary/20 flex justify-center print:hidden">
                                <button 
                                    onClick={handleInitiateSigning}
                                    className="px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 animate-pulse"
                                >
                                    <PenIcon className="h-5 w-5" /> Firmar Conforme
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActasTab;
