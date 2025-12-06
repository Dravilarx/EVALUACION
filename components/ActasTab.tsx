
import React, { useState, useMemo, useEffect } from 'react';
import { Acta, Student, Subject, Teacher, SurveyResult } from '../types';
import { DocumentTextIcon, CheckCircleIcon, ClockIcon, FilterIcon, XCircleIcon, RefreshIcon, AcademicIcon, ThumbUpIcon } from './icons';
import { ActaService, SurveyService } from '../services/dataService';
import { COMPETENCIES_LIST, PRESENTATION_CRITERIA_LIST, EVALUATION_SCALE } from '../constants';
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

const ActasTab: React.FC<ActasTabProps> = ({ actas, students, subjects, teachers, currentUserId, onUpdateActa }) => {
    const isTeacher = currentUserId === 'DOCENTE';
    const [selectedActa, setSelectedActa] = useState<Acta | null>(null);
    const [filterStudent, setFilterStudent] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    
    // New State for Multi-step Flow
    const [modalStep, setModalStep] = useState<ModalStep>('view');
    const [isProcessing, setIsProcessing] = useState(false);

    // Reset step when modal opens/closes
    useEffect(() => {
        if (!selectedActa) {
            setModalStep('view');
            setIsProcessing(false);
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

    const handleInitiateSigning = () => {
        setModalStep('confirm');
    };

    const handleConfirmSign = async () => {
        if (!selectedActa) return;
        
        setIsProcessing(true);
        try {
            // Simulate network delay for better UX
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // 1. Update Acta Status
            const updated = { ...selectedActa, status: 'Aceptada' as const };
            await ActaService.update(updated);
            onUpdateActa(updated);

            // 2. Generate Pending Survey for the Teacher & Subject
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
            
            setModalStep('success'); // Move to success screen
            
            // Close automatically after 2 seconds
            setTimeout(() => {
                setSelectedActa(null);
            }, 2500);

        } catch (error) {
            console.error("Error accepting acta:", error);
            alert("Hubo un error al procesar la firma. Por favor intente nuevamente.");
            setIsProcessing(false);
        }
    };

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

            {/* NEW MULTI-STEP MODAL */}
            {selectedActa && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-surface w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col border border-secondary/20 overflow-hidden relative">
                        
                        {/* STEP 3: SUCCESS VIEW */}
                        {modalStep === 'success' && (
                            <div className="absolute inset-0 z-20 bg-surface flex flex-col items-center justify-center p-8 animate-fade-in-up">
                                <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6">
                                    <CheckCircleIcon className="h-16 w-16 text-success" />
                                </div>
                                <h3 className="text-3xl font-bold text-text-primary mb-2">¡Acta Firmada!</h3>
                                <p className="text-text-secondary text-center max-w-md">
                                    Has aceptado conforme tu calificación final. El documento ha sido archivado y se ha generado la encuesta docente correspondiente.
                                </p>
                                <div className="mt-8 w-full max-w-xs bg-secondary/10 h-1 rounded-full overflow-hidden">
                                    <div className="h-full bg-success animate-progress-indeterminate"></div>
                                </div>
                                <p className="text-xs text-text-secondary mt-2">Cerrando ventana...</p>
                            </div>
                        )}

                        {/* STEP 2: CONFIRMATION VIEW */}
                        {modalStep === 'confirm' && (
                            <div className="absolute inset-0 z-10 bg-surface flex flex-col animate-fade-in-right">
                                <header className="p-6 border-b border-secondary/20 flex justify-between items-center bg-secondary/5">
                                    <h3 className="text-xl font-bold text-text-primary">Confirmación de Firma</h3>
                                    <button onClick={() => setModalStep('view')} className="p-2 hover:bg-secondary/20 rounded-full"><XCircleIcon className="h-6 w-6 text-text-secondary" /></button>
                                </header>
                                <div className="flex-grow p-8 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                                    <AcademicIcon className="h-16 w-16 text-primary mb-6" />
                                    <h4 className="text-2xl font-bold text-text-primary mb-4">Declaración de Conformidad</h4>
                                    <p className="text-text-secondary mb-8 leading-relaxed">
                                        Yo, <strong>{getStudentName(selectedActa.studentId)}</strong>, declaro haber revisado en detalle mi calificación final de 
                                        <span className="font-bold text-text-primary"> {selectedActa.content.finalGrade.toFixed(1)}</span> para la asignatura 
                                        <strong> {getSubjectName(selectedActa.subjectId)}</strong>, así como el feedback proporcionado por el docente. 
                                        <br/><br/>
                                        Al firmar este documento digital, acepto la nota asignada y confirmo que he recibido la retroalimentación correspondiente.
                                    </p>
                                    
                                    <div className="w-full bg-yellow-50 border border-yellow-100 p-4 rounded-lg text-left mb-8 flex gap-3">
                                        <div className="text-yellow-600 mt-1"><ClockIcon className="h-5 w-5"/></div>
                                        <div>
                                            <p className="text-sm font-bold text-yellow-800">Esta acción es irreversible</p>
                                            <p className="text-xs text-yellow-700">Una vez firmada, el acta quedará bloqueada y no se podrán realizar modificaciones posteriores.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 w-full justify-center">
                                        <button 
                                            onClick={() => setModalStep('view')}
                                            className="px-6 py-3 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors font-medium"
                                            disabled={isProcessing}
                                        >
                                            Volver a Revisar
                                        </button>
                                        <button 
                                            onClick={handleConfirmSign}
                                            disabled={isProcessing}
                                            className="px-8 py-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-all flex items-center gap-2"
                                        >
                                            {isProcessing ? <RefreshIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
                                            {isProcessing ? 'Firmando...' : 'Firmar Digitalmente'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 1: DOCUMENT VIEW (DEFAULT) */}
                        <header className="p-6 border-b border-secondary/20 flex justify-between items-start bg-secondary/5">
                            <div>
                                <h3 className="text-2xl font-bold text-text-primary uppercase tracking-wide">Acta de Calificación</h3>
                                <p className="text-sm text-text-secondary">Folio: {selectedActa.id}</p>
                            </div>
                            <button onClick={() => setSelectedActa(null)} className="p-2 hover:bg-secondary/20 rounded-full"><XCircleIcon className="h-6 w-6 text-text-secondary" /></button>
                        </header>

                        <div className="p-8 overflow-y-auto space-y-8 bg-white text-gray-800 flex-grow">
                            {/* Header Info */}
                            <div className="grid grid-cols-2 gap-6 border-b-2 border-gray-100 pb-6">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">Alumno</p>
                                    <p className="text-lg font-bold">{getStudentName(selectedActa.studentId)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">Asignatura</p>
                                    <p className="text-lg font-bold">{getSubjectName(selectedActa.subjectId)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">Docente Responsable</p>
                                    <p className="font-medium">{getTeacherName(selectedActa.teacherId)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">Fecha Emisión</p>
                                    <p className="font-medium">{new Date(selectedActa.generatedAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Summary Grades */}
                            <div className="grid grid-cols-4 gap-4 text-center bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-inner">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-2">Evaluación Escrita (60%)</p>
                                    <p className="text-3xl font-bold text-blue-600">{selectedActa.content.writtenGrade.toFixed(1)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-2">Competencias (30%)</p>
                                    <p className="text-3xl font-bold text-indigo-600">{selectedActa.content.competencyGrade.toFixed(1)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-2">Presentación (10%)</p>
                                    <p className="text-3xl font-bold text-cyan-600">{selectedActa.content.presentationGrade.toFixed(1)}</p>
                                </div>
                                <div className="border-l-2 border-gray-300 pl-4 bg-white rounded-r-lg">
                                    <p className="text-xs font-bold text-gray-800 mb-2 uppercase tracking-wider">Nota Final</p>
                                    <p className={`text-4xl font-extrabold ${getGradeColor(selectedActa.content.finalGrade)}`}>{selectedActa.content.finalGrade.toFixed(1)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Details - Competencies */}
                                <div>
                                    <h4 className="font-bold text-indigo-700 border-b border-indigo-100 pb-2 mb-3 uppercase text-sm">Detalle Competencias Personales</h4>
                                    <ul className="text-sm space-y-2">
                                        {COMPETENCIES_LIST.map(item => (
                                            <li key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-1 hover:bg-gray-50 px-2 rounded">
                                                <span className="text-gray-600 truncate mr-2" title={item.title}>{item.title}</span>
                                                <span className="font-bold">{selectedActa.content.competencyDetails[item.id] || '-'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Details - Presentation */}
                                <div>
                                    <h4 className="font-bold text-cyan-700 border-b border-cyan-100 pb-2 mb-3 uppercase text-sm">Detalle Presentación</h4>
                                    <ul className="text-sm space-y-2">
                                        {PRESENTATION_CRITERIA_LIST.map(item => (
                                            <li key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-1 hover:bg-gray-50 px-2 rounded">
                                                <span className="text-gray-600 truncate mr-2" title={item.title}>{item.title}</span>
                                                <span className="font-bold">{selectedActa.content.presentationDetails[item.id] || '-'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            
                            {/* Feedback Section - Prominent */}
                            <div className="mt-8 bg-blue-50/50 p-6 rounded-xl border border-blue-100 relative">
                                <h4 className="font-bold text-blue-800 uppercase text-sm mb-3 flex items-center gap-2">
                                    <ThumbUpIcon className="h-4 w-4"/> Feedback del Docente
                                </h4>
                                {selectedActa.content.writtenComment ? (
                                    <div className="text-gray-700 italic relative pl-6 border-l-4 border-blue-300">
                                        <p className="text-lg leading-relaxed">"{selectedActa.content.writtenComment}"</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 italic text-sm text-center py-2">Sin comentarios registrados por el docente.</p>
                                )}
                            </div>
                        </div>

                        <footer className="p-6 border-t border-secondary/20 bg-secondary/5 flex justify-end gap-4 rounded-b-xl items-center">
                            <button 
                                onClick={() => setSelectedActa(null)} 
                                className="px-6 py-2 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors font-medium"
                            >
                                Cerrar
                            </button>
                            
                            {/* Signature Actions */}
                            {!isTeacher && selectedActa.status === 'Pendiente' && selectedActa.studentId === currentUserId && (
                                <button 
                                    onClick={handleInitiateSigning}
                                    className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-colors flex items-center gap-2 animate-pulse"
                                >
                                    <CheckCircleIcon className="h-5 w-5" /> Revisar y Firmar
                                </button>
                            )}
                            
                            {/* Signed Status Indicator */}
                            {selectedActa.status === 'Aceptada' && (
                                <div className="px-6 py-2 rounded-lg bg-success/10 text-success border border-success/20 font-bold flex items-center gap-2 cursor-default">
                                    <CheckCircleIcon className="h-5 w-5" /> Documento Firmado y Aceptado
                                </div>
                            )}
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActasTab;
