
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Subject, Teacher, Student, ProcedureLog, SubjectProcedure } from '../types';
import { SubjectService, TeacherService, StudentService, ProcedureService } from '../services/dataService';
import { BookOpenIcon, PlusIcon, EditIcon, TrashIcon, CloseIcon, CheckCircleIcon, PdfIcon, ListIcon, CloudUploadIcon, DownloadIcon, CheckSquareIcon, UsersIcon } from './icons';

interface SubjectsModuleProps {
    // No props currently needed from parent, but good for extensibility
}

const emptySubject: Subject = {
    id: '',
    name: '',
    code: '',
    lead_teacher_id: '',
    participating_teachers_ids: [],
    procedures: []
};

type ViewMode = 'list' | 'detail';
type DetailTab = 'info' | 'syllabus' | 'procedures';

const SubjectsModule: React.FC = () => {
    // Data State
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [procedureLogs, setProcedureLogs] = useState<ProcedureLog[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [activeTab, setActiveTab] = useState<DetailTab>('info');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    
    // List Filters
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form State (for creating/editing subject details)
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject>(emptySubject);

    // Current User Mock (In real app, comes from auth context)
    // For demo purposes, we can toggle logic based on a "role" switch or just assume Teacher for management
    // But since the requirements include "Residentes can mark procedures", we need to know who is viewing.
    // We will assume 'DOCENTE' role for management features, but show procedure tracking for 'STUDENT'
    // For this module, let's assume the viewer is a Teacher by default to manage, but the "Preview" could be a student.
    // To make it simple: We show both views side-by-side or toggleable.
    const [userRole, setUserRole] = useState<'DOCENTE' | 'RESIDENTE'>('DOCENTE');
    const [currentUserId, setCurrentUserId] = useState<string>('DOCENTE'); // Default to teacher

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [subjectsData, teachersData, studentsData, logsData] = await Promise.all([
                SubjectService.getAll(),
                TeacherService.getAll(),
                StudentService.getAll(),
                ProcedureService.getAll()
            ]);
            setSubjects(subjectsData);
            setTeachers(teachersData);
            setStudents(studentsData);
            setProcedureLogs(logsData);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSubject = (subject: Subject) => {
        setSelectedSubject(subject);
        setViewMode('detail');
        setActiveTab('info');
    };

    const handleBackToList = () => {
        setSelectedSubject(null);
        setViewMode('list');
    };

    const getTeacherName = (id: string) => {
        const teacher = teachers.find(t => t.id === id);
        return teacher ? teacher.name : 'Desconocido';
    };

    // --- FORM HANDLERS ---

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditingSubject(prev => ({ ...prev, [name]: value }));
    };

    const handleParticipatingTeacherToggle = (teacherId: string) => {
        setEditingSubject(prev => {
            const currentIds = prev.participating_teachers_ids || [];
            if (currentIds.includes(teacherId)) {
                return { ...prev, participating_teachers_ids: currentIds.filter(id => id !== teacherId) };
            } else {
                return { ...prev, participating_teachers_ids: [...currentIds, teacherId] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await SubjectService.update(editingSubject);
                setSubjects(prev => prev.map(s => s.id === editingSubject.id ? editingSubject : s));
                // Update selected subject if open
                if (selectedSubject?.id === editingSubject.id) {
                    setSelectedSubject(editingSubject);
                }
            } else {
                await SubjectService.create(editingSubject);
                setSubjects(prev => [editingSubject, ...prev]); 
                loadData(); // To get ID
            }
            setIsFormOpen(false);
        } catch (error) {
            console.error("Error saving subject", error);
        }
    };

    const openNewForm = () => {
        setEditingSubject(emptySubject);
        setIsEditing(false);
        setIsFormOpen(true);
    };

    const openEditForm = (subject: Subject) => {
        setEditingSubject(subject);
        setIsEditing(true);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta asignatura?")) {
            await SubjectService.delete(id);
            setSubjects(prev => prev.filter(s => s.id !== id));
            if (selectedSubject?.id === id) handleBackToList();
        }
    };

    // --- SYLLABUS HANDLERS ---

    const handleUploadSyllabus = (file: File) => {
        // Mock upload: create a fake URL/Blob
        const fakeUrl = URL.createObjectURL(file);
        if (selectedSubject) {
            const updated = { ...selectedSubject, syllabus_url: fakeUrl };
            SubjectService.update(updated).then(() => {
                setSubjects(prev => prev.map(s => s.id === updated.id ? updated : s));
                setSelectedSubject(updated);
                alert("Programa subido correctamente.");
            });
        }
    };

    // --- PROCEDURE HANDLERS ---

    const handleLogProcedure = async (procedureId: string) => {
        if (!selectedSubject) return;
        // Assume current user is the resident logging
        // For testing, if userRole is DOCENTE, we can't log. 
        // We'll add a user switcher for demo purposes inside the detail view.
        
        const log = await ProcedureService.logProcedure(currentUserId, selectedSubject.id, procedureId);
        
        // Update local state
        setProcedureLogs(prev => {
            const exists = prev.findIndex(p => p.id === log.id);
            if (exists > -1) {
                const newLogs = [...prev];
                newLogs[exists] = log;
                return newLogs;
            }
            return [...prev, log];
        });
    };

    const handleValidateStudent = async (studentId: string) => {
        if (!selectedSubject) return;
        await ProcedureService.validateProcedures(studentId, selectedSubject.id);
        
        // Update local state to reflect validation
        setProcedureLogs(prev => prev.map(p => {
            if (p.studentId === studentId && p.subjectId === selectedSubject.id) {
                return { ...p, validatedCount: p.count, status: 'Validated' };
            }
            return p;
        }));
        alert("Procedimientos validados para el alumno.");
    };

    const filteredSubjects = subjects.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Render Helpers ---

    const inputClass = "w-full bg-background border border-secondary/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none";
    const labelClass = "block text-xs font-semibold text-text-secondary mb-1";

    if (viewMode === 'list') {
        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                            <BookOpenIcon className="h-8 w-8 text-primary" /> Asignaturas
                        </h2>
                        <p className="text-text-secondary">Gestión de malla curricular y rotaciones</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o código..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-background border border-secondary/30 rounded-lg px-4 py-2 text-sm flex-grow md:w-64"
                        />
                        <button 
                            onClick={openNewForm}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
                        >
                            <PlusIcon className="h-5 w-5" /> <span className="hidden sm:inline">Nueva Asignatura</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSubjects.map(subject => (
                        <div key={subject.id} className="bg-surface rounded-xl shadow-sm border border-secondary/20 hover:border-primary/50 transition-all cursor-pointer group flex flex-col h-full" onClick={() => handleSelectSubject(subject)}>
                            <div className="p-5 flex-grow">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono bg-secondary/10 px-2 py-1 rounded text-text-secondary">{subject.code}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => openEditForm(subject)} className="p-1.5 hover:bg-primary/10 text-primary rounded"><EditIcon className="h-4 w-4"/></button>
                                        <button onClick={() => handleDelete(subject.id)} className="p-1.5 hover:bg-danger/10 text-danger rounded"><TrashIcon className="h-4 w-4"/></button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg text-text-primary mb-1 group-hover:text-primary transition-colors">{subject.name}</h3>
                                <p className="text-sm text-text-secondary mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-success"></span> Activa
                                </p>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                        <UsersIcon className="h-4 w-4" /> 
                                        <span>Encargado: {getTeacherName(subject.lead_teacher_id)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                        <CheckSquareIcon className="h-4 w-4" /> 
                                        <span>{subject.procedures?.length || 0} Procedimientos requeridos</span>
                                    </div>
                                    {subject.syllabus_url && (
                                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                                            <PdfIcon className="h-4 w-4 text-danger" /> 
                                            <span>Programa Disponible</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-secondary/5 p-3 border-t border-secondary/10 flex justify-end">
                                <span className="text-xs font-bold text-primary flex items-center gap-1">
                                    Ver Detalles <PlusIcon className="h-3 w-3" />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* MODAL FORM */}
                {isFormOpen && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-surface rounded-xl shadow-2xl w-full max-w-lg flex flex-col border border-secondary/20">
                            <header className="p-5 border-b border-secondary/20 flex justify-between items-center bg-surface/95 rounded-t-xl">
                                <h3 className="text-xl font-bold text-text-primary">
                                    {isEditing ? 'Editar Asignatura' : 'Nueva Asignatura'}
                                </h3>
                                <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-secondary/20"><CloseIcon /></button>
                            </header>
                            
                            <form id="subject-form" onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className={labelClass}>Nombre de la Asignatura</label>
                                    <input type="text" name="name" value={editingSubject.name} onChange={handleInputChange} className={inputClass} required placeholder="Ej: Radiología Intervencionista" />
                                </div>
                                <div>
                                    <label className={labelClass}>Código</label>
                                    <input type="text" name="code" value={editingSubject.code} onChange={handleInputChange} className={inputClass} required placeholder="Ej: RAD-INT-401" />
                                </div>
                                
                                <div>
                                    <label className={labelClass}>Docente a Cargo</label>
                                    <select name="lead_teacher_id" value={editingSubject.lead_teacher_id} onChange={handleInputChange} className={inputClass} required>
                                        <option value="">Seleccione un docente...</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-2">
                                    <label className={labelClass}>Docentes que Participan</label>
                                    <div className="max-h-40 overflow-y-auto border border-secondary/30 rounded-lg p-2 space-y-1 bg-background">
                                        {teachers.filter(t => t.id !== editingSubject.lead_teacher_id).map(t => (
                                            <label key={t.id} className="flex items-center gap-2 p-1.5 hover:bg-secondary/10 rounded cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={editingSubject.participating_teachers_ids.includes(t.id)}
                                                    onChange={() => handleParticipatingTeacherToggle(t.id)}
                                                    className="rounded text-primary focus:ring-primary"
                                                />
                                                <span className="text-sm">{t.name}</span>
                                            </label>
                                        ))}
                                        {teachers.length === 0 && <p className="text-xs text-text-secondary text-center p-2">No hay docentes disponibles.</p>}
                                    </div>
                                </div>
                            </form>

                            <footer className="p-5 border-t border-secondary/20 bg-surface/95 rounded-b-xl flex justify-end gap-3">
                                <button onClick={() => setIsFormOpen(false)} className="px-5 py-2 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors">Cancelar</button>
                                <button type="submit" form="subject-form" className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-all">Guardar</button>
                            </footer>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- DETAIL VIEW ---
    if (viewMode === 'detail' && selectedSubject) {
        return (
            <div className="h-full flex flex-col animate-fade-in-up">
                {/* Detail Header */}
                <div className="mb-6">
                    <button onClick={handleBackToList} className="text-sm text-text-secondary hover:text-primary mb-2 flex items-center gap-1 font-medium">
                        ← Volver a la lista
                    </button>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                                {selectedSubject.name} <span className="text-sm font-normal text-text-secondary bg-secondary/10 px-2 py-1 rounded font-mono">{selectedSubject.code}</span>
                            </h2>
                            <p className="text-text-secondary mt-1">Docente a cargo: {getTeacherName(selectedSubject.lead_teacher_id)}</p>
                        </div>
                        
                        {/* Role Switcher Demo */}
                        <div className="flex items-center gap-2 bg-secondary/10 p-1 rounded-lg">
                            <button 
                                onClick={() => { setUserRole('DOCENTE'); setCurrentUserId('DOCENTE'); }}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${userRole === 'DOCENTE' ? 'bg-white shadow text-primary' : 'text-text-secondary'}`}
                            >
                                Vista Docente
                            </button>
                            <button 
                                onClick={() => { setUserRole('RESIDENTE'); setCurrentUserId(students[0]?.id || 'RES-DEMO'); }}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${userRole === 'RESIDENTE' ? 'bg-white shadow text-primary' : 'text-text-secondary'}`}
                            >
                                Vista Residente
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-secondary/20 mb-6">
                    <button 
                        onClick={() => setActiveTab('info')}
                        className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                    >
                        <BookOpenIcon className="h-4 w-4"/> Información General
                    </button>
                    <button 
                        onClick={() => setActiveTab('syllabus')}
                        className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'syllabus' ? 'border-danger text-danger' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                    >
                        <PdfIcon className="h-4 w-4"/> Programa (Syllabus)
                    </button>
                    <button 
                        onClick={() => setActiveTab('procedures')}
                        className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'procedures' ? 'border-success text-success' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                    >
                        <CheckSquareIcon className="h-4 w-4"/> Récord de Procedimientos
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto bg-surface border border-secondary/20 rounded-xl shadow-sm p-6">
                    
                    {/* INFO TAB */}
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-lg font-bold text-text-primary mb-4 border-b border-secondary/10 pb-2">Equipo Docente</h4>
                                    <div className="bg-background rounded-lg p-4 border border-secondary/20">
                                        <p className="text-sm font-bold text-primary mb-1">Docente a Cargo</p>
                                        <p className="text-base mb-4">{getTeacherName(selectedSubject.lead_teacher_id)}</p>
                                        
                                        <p className="text-sm font-bold text-text-secondary mb-1">Docentes Colaboradores</p>
                                        <ul className="list-disc list-inside text-sm space-y-1">
                                            {selectedSubject.participating_teachers_ids.map(id => (
                                                <li key={id}>{getTeacherName(id)}</li>
                                            ))}
                                            {selectedSubject.participating_teachers_ids.length === 0 && <li className="text-text-secondary italic">Ninguno registrado</li>}
                                        </ul>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-text-primary mb-4 border-b border-secondary/10 pb-2">Requisitos de Aprobación</h4>
                                    <div className="bg-background rounded-lg p-4 border border-secondary/20 text-sm space-y-3">
                                        <div className="flex justify-between">
                                            <span>Asistencia Mínima</span>
                                            <span className="font-bold">80%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Nota Mínima Exámenes</span>
                                            <span className="font-bold">4.0</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Procedimientos Requeridos</span>
                                            <span className="font-bold">{selectedSubject.procedures?.reduce((acc, p) => acc + p.goal, 0) || 0} Total</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SYLLABUS TAB */}
                    {activeTab === 'syllabus' && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                            {selectedSubject.syllabus_url ? (
                                <div className="text-center space-y-6 w-full max-w-2xl">
                                    <div className="bg-danger/5 border-2 border-danger/20 rounded-xl p-8 flex flex-col items-center">
                                        <PdfIcon className="h-20 w-20 text-danger mb-4" />
                                        <h3 className="text-xl font-bold text-text-primary mb-2">Programa de Asignatura Disponible</h3>
                                        <p className="text-text-secondary mb-6">Versión actualizada 2024</p>
                                        
                                        <div className="flex gap-4">
                                            <a 
                                                href={selectedSubject.syllabus_url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="px-6 py-3 bg-danger text-white rounded-lg font-bold shadow-lg hover:bg-danger/90 transition-all flex items-center gap-2"
                                            >
                                                <DownloadIcon className="h-5 w-5" /> Descargar PDF
                                            </a>
                                            {userRole === 'DOCENTE' && (
                                                <div className="relative">
                                                    <input 
                                                        type="file" 
                                                        accept="application/pdf" 
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={(e) => e.target.files && handleUploadSyllabus(e.target.files[0])}
                                                    />
                                                    <button className="px-6 py-3 bg-white border border-secondary/30 text-text-primary rounded-lg font-bold shadow-sm hover:bg-secondary/5 transition-all flex items-center gap-2">
                                                        <EditIcon className="h-5 w-5" /> Reemplazar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-background p-4 rounded-lg text-left text-sm text-text-secondary border border-secondary/10">
                                        <p className="font-bold mb-1">Contenidos:</p>
                                        <ul className="list-disc list-inside">
                                            <li>Objetivos generales y específicos.</li>
                                            <li>Calendario de actividades y rotaciones.</li>
                                            <li>Bibliografía recomendada.</li>
                                            <li>Pautas de evaluación.</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="bg-secondary/10 rounded-full p-6 inline-block">
                                        <CloudUploadIcon className="h-12 w-12 text-secondary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-secondary">Programa no disponible</h3>
                                    <p className="text-text-secondary">Aún no se ha cargado el syllabus digital para esta asignatura.</p>
                                    
                                    {userRole === 'DOCENTE' && (
                                        <div className="relative inline-block mt-4">
                                            <input 
                                                type="file" 
                                                accept="application/pdf" 
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => e.target.files && handleUploadSyllabus(e.target.files[0])}
                                            />
                                            <button className="px-6 py-3 bg-primary text-white rounded-lg font-bold shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2">
                                                <PlusIcon className="h-5 w-5" /> Subir PDF del Programa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PROCEDURES TAB */}
                    {activeTab === 'procedures' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-secondary/20 pb-4">
                                <h4 className="text-lg font-bold text-text-primary">Checklist de Procedimientos</h4>
                                {userRole === 'RESIDENTE' && (
                                    <div className="text-xs bg-success/10 text-success px-3 py-1 rounded-full font-bold border border-success/20">
                                        Vista Residente: {students.find(s => s.id === currentUserId)?.name}
                                    </div>
                                )}
                            </div>

                            {userRole === 'RESIDENTE' ? (
                                // --- RESIDENT VIEW ---
                                <div className="grid grid-cols-1 gap-4">
                                    {(selectedSubject.procedures || []).length === 0 ? (
                                        <p className="text-text-secondary text-center py-8">No hay procedimientos requeridos para esta asignatura.</p>
                                    ) : (
                                        selectedSubject.procedures?.map(proc => {
                                            // Get Log
                                            const log = procedureLogs.find(l => l.studentId === currentUserId && l.subjectId === selectedSubject.id && l.procedureId === proc.id);
                                            const count = log ? log.count : 0;
                                            const validated = log ? log.validatedCount : 0;
                                            const progress = Math.min(100, (count / proc.goal) * 100);
                                            const isValidatedComplete = validated >= proc.goal;

                                            return (
                                                <div key={proc.id} className="bg-background rounded-xl p-5 border border-secondary/20 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                                                    <div className="flex-grow w-full">
                                                        <div className="flex justify-between items-end mb-2">
                                                            <h5 className="font-bold text-text-primary text-lg">{proc.name}</h5>
                                                            <div className="text-right">
                                                                <span className="text-2xl font-bold text-primary">{count}</span>
                                                                <span className="text-sm text-text-secondary"> / {proc.goal}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Progress Bar */}
                                                        <div className="h-4 w-full bg-secondary/20 rounded-full overflow-hidden relative">
                                                            {/* Validated Progress (Solid) */}
                                                            <div 
                                                                className="h-full bg-success absolute left-0 top-0 transition-all duration-500" 
                                                                style={{ width: `${Math.min(100, (validated / proc.goal) * 100)}%` }}
                                                            ></div>
                                                            {/* Pending Validation (Striped/Lighter) */}
                                                            <div 
                                                                className="h-full bg-primary/50 absolute top-0 transition-all duration-500" 
                                                                style={{ 
                                                                    left: `${Math.min(100, (validated / proc.goal) * 100)}%`,
                                                                    width: `${Math.min(100, ((count - validated) / proc.goal) * 100)}%` 
                                                                }}
                                                            ></div>
                                                        </div>
                                                        
                                                        <div className="flex justify-between mt-2 text-xs">
                                                            <span className="text-success font-semibold">{validated} Validado(s)</span>
                                                            <span className="text-primary font-semibold">{count - validated} Pendiente(s)</span>
                                                        </div>
                                                    </div>

                                                    <button 
                                                        onClick={() => handleLogProcedure(proc.id)}
                                                        className="flex-shrink-0 w-full md:w-auto px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                                                    >
                                                        <PlusIcon className="h-5 w-5" /> Registrar (+1)
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            ) : (
                                // --- TEACHER VIEW ---
                                <div className="space-y-4">
                                    <p className="text-sm text-text-secondary mb-4">Seleccione un alumno para validar sus procedimientos realizados.</p>
                                    <div className="grid grid-cols-1 gap-4">
                                        {students.map(student => {
                                            // Calculate total progress for summary
                                            const totalGoal = selectedSubject.procedures?.reduce((sum, p) => sum + p.goal, 0) || 1;
                                            const studentLogs = procedureLogs.filter(l => l.studentId === student.id && l.subjectId === selectedSubject.id);
                                            const totalCount = studentLogs.reduce((sum, l) => sum + l.count, 0);
                                            const totalValidated = studentLogs.reduce((sum, l) => sum + l.validatedCount, 0);
                                            const pendingValidation = totalCount - totalValidated;

                                            return (
                                                <div key={student.id} className="bg-background rounded-xl border border-secondary/20 overflow-hidden">
                                                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/5 group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                                {student.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h5 className="font-bold text-text-primary">{student.name}</h5>
                                                                <p className="text-xs text-text-secondary">{student.level}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right hidden sm:block">
                                                                <span className="text-xs text-text-secondary block">Progreso Global</span>
                                                                <span className="font-bold text-primary">{Math.round((totalValidated/totalGoal)*100)}%</span>
                                                            </div>
                                                            {pendingValidation > 0 && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleValidateStudent(student.id); }}
                                                                    className="px-4 py-2 bg-success hover:bg-success/80 text-white rounded-lg text-xs font-bold shadow-md transition-colors animate-pulse"
                                                                >
                                                                    Validar {pendingValidation} Pendientes
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Expanded Details (Simplified: Always show for now or toggle) */}
                                                    <div className="px-4 pb-4 pt-0 border-t border-secondary/10 bg-surface/50">
                                                        <table className="w-full text-xs mt-3">
                                                            <thead>
                                                                <tr className="text-text-secondary text-left">
                                                                    <th className="pb-2">Procedimiento</th>
                                                                    <th className="pb-2 text-center">Meta</th>
                                                                    <th className="pb-2 text-center">Realizado</th>
                                                                    <th className="pb-2 text-center">Validado</th>
                                                                    <th className="pb-2 text-right">Estado</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {selectedSubject.procedures?.map(proc => {
                                                                    const log = procedureLogs.find(l => l.studentId === student.id && l.subjectId === selectedSubject.id && l.procedureId === proc.id);
                                                                    const count = log?.count || 0;
                                                                    const valid = log?.validatedCount || 0;
                                                                    
                                                                    return (
                                                                        <tr key={proc.id} className="border-b border-secondary/5 last:border-0">
                                                                            <td className="py-2 font-medium">{proc.name}</td>
                                                                            <td className="py-2 text-center">{proc.goal}</td>
                                                                            <td className="py-2 text-center font-bold">{count}</td>
                                                                            <td className="py-2 text-center text-success">{valid}</td>
                                                                            <td className="py-2 text-right">
                                                                                {valid >= proc.goal ? (
                                                                                    <span className="text-success flex items-center justify-end gap-1"><CheckCircleIcon className="h-3 w-3"/> Completo</span>
                                                                                ) : (
                                                                                    <span className="text-text-secondary opacity-50">En proceso</span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return <div>Error de estado</div>;
};

export default SubjectsModule;
