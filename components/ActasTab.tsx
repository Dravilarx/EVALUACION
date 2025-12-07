
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Acta, Student, Subject, Teacher, SurveyResult } from '../types';
import { DocumentTextIcon, CheckCircleIcon, ClockIcon, XCircleIcon, RefreshIcon, AcademicIcon, ThumbUpIcon, PrinterIcon, PenIcon, KeyIcon, FingerPrintIcon } from './icons';
import { ActaService, SurveyService } from '../services/dataService';
import { COMPETENCIES_LIST, PRESENTATION_CRITERIA_LIST } from '../constants';
import { getGradeColor } from '../utils';

interface ActasTabProps {
    actas: Acta[];
    students: Student[];
    subjects: Subject[];
    teachers: Teacher[];
    currentUserId: string;
    onUpdateActa: (updatedActa: Acta) => void;
}

type ModalStep = 'view' | 'confirm' | 'success';
type SignatureType = 'PIN' | 'Draw';

const ActasTab: React.FC<ActasTabProps> = ({ actas, students, subjects, teachers, currentUserId, onUpdateActa }) => {
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

    // Reset state on modal open
    useEffect(() => {
        if (!selectedActa) {
            setModalStep('view');
            setIsProcessing(false);
            setPin(['', '', '', '']);
            setHasDrawn(false);
        }
    }, [selectedActa]);

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
                    height: 100%;
                    background: white;
                    padding: 40px;
                    z-index: 9999;
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
        <div className="space-y-6 animate-fade-in-up">
            {/* Filters */}
            <div className="bg-surface p-5 rounded-xl shadow-sm border border-secondary/20 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <DocumentTextIcon className="h-6 w-6 text-primary" /> Actas de Calificación
                    </h2>
                    <p className="text-sm text-text-secondary">Registro oficial de notas ponderadas.</p>
                </div>
                {isTeacher && (
                    <div className="flex gap-3">
                        <select 
                            value={filterStudent} 
                            onChange={(e) => setFilterStudent(e.target.value)}
                            className="bg-background border border-secondary/30 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Todos los Alumnos</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select 
                            value={filterSubject} 
                            onChange={(e) => setFilterSubject(e.target.value)}
                            className="bg-background border border-secondary/30 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Todas las Asignaturas</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* Table */}
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
                                <tr><td colSpan={6} className="p-8 text-center text-text-secondary">No hay actas disponibles.</td></tr>
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

            {/* MODAL & OFFICIAL DOCUMENT VIEW */}
            {selectedActa && (
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
