
import React, { useState, useEffect, useRef } from 'react';
import { CVData, Student, Activity, CVEducation, CVExperience, CVProgramRole } from '../types';
import { StudentService, ActivityService, SubjectService, QuizService, AttemptService } from '../services/dataService';
import { IdentificationIcon, PrinterIcon, SparklesIcon, PlusIcon, TrashIcon, DownloadIcon, EditIcon, ShieldCheckIcon } from './icons';

interface CurriculumModuleProps {
    currentUserId: string;
}

const emptyCV: CVData = {
    fullName: '',
    rut: '',
    email: '',
    phone: '',
    specialty: 'Radiología e Imagenología',
    summary: '',
    education: [],
    clinicalRotations: [],
    academicActivities: [],
    programRoles: [],
    skills: ['Trabajo en Equipo', 'Radiodiagnóstico General', 'Inglés Técnico'],
    languages: ['Español (Nativo)']
};

const CurriculumModule: React.FC<CurriculumModuleProps> = ({ currentUserId }) => {
    const [cvData, setCvData] = useState<CVData>(emptyCV);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    
    // New Role State
    const [newRole, setNewRole] = useState<CVProgramRole>({ id: '', role: '', description: '', period: '' });
    
    useEffect(() => {
        const loadInitialData = async () => {
            if (currentUserId !== 'DOCENTE' && currentUserId !== '10611061') {
                const students = await StudentService.getAll();
                const me = students.find(s => s.id === currentUserId);
                if (me) {
                    setCvData(prev => ({
                        ...prev,
                        fullName: me.name,
                        rut: me.id,
                        email: me.email_ua,
                        phone: me.phone,
                        summary: `Residente de ${me.level} en el programa de especialización en Radiología de la Universidad de Antofagasta.`
                    }));
                }
            }
        };
        loadInitialData();
    }, [currentUserId]);

    const handleAutoFill = async () => {
        setIsAutoFilling(true);
        try {
            // Fetch all related data
            const [activities, subjects, quizzes, attempts, students] = await Promise.all([
                ActivityService.getAll(),
                SubjectService.getAll(),
                QuizService.getAll(),
                AttemptService.getAll(),
                StudentService.getAll()
            ]);

            const me = students.find(s => s.id === currentUserId);
            
            // 1. Education
            const newEducation: CVEducation[] = [];
            if (me?.origin_university) {
                newEducation.push({
                    id: 'EDU-1',
                    institution: me.origin_university,
                    degree: 'Médico Cirujano',
                    startYear: '2015', // Mock
                    endYear: '2022'  // Mock
                });
            }
            newEducation.push({
                id: 'EDU-2',
                institution: 'Universidad de Antofagasta',
                degree: 'Especialidad en Radiología',
                startYear: me?.admission_date.substring(0,4) || '2023',
                endYear: 'Presente'
            });

            // 2. Clinical Rotations (From Subjects where user has grades)
            const myAttempts = attempts.filter(a => a.alumno_id === currentUserId);
            const myRotations: CVExperience[] = [];
            
            subjects.forEach(sub => {
                // Check if user has participated in quizzes for this subject
                const subQuizzes = quizzes.filter(q => q.asignatura === sub.name);
                const hasParticipation = subQuizzes.some(q => myAttempts.some(a => a.id_cuestionario === q.id_cuestionario));
                
                if (hasParticipation) {
                    myRotations.push({
                        id: `ROT-${sub.id}`,
                        institution: 'Hospital Regional de Antofagasta',
                        role: `Residente en rotación de ${sub.name}`,
                        startYear: '2024', // Mock date logic
                        endYear: '2024',
                        description: 'Participación en informes radiológicos, procedimientos y reuniones clínicas.'
                    });
                }
            });

            // 3. Academic Activities
            const myActivities = activities.filter(a => a.participantId === currentUserId);

            setCvData(prev => ({
                ...prev,
                education: newEducation,
                clinicalRotations: myRotations,
                academicActivities: myActivities,
                // Refine summary based on level
                summary: me ? `Médico residente de nivel ${me.level} con formación en ${me.origin_university}. Enfocado en el desarrollo de competencias diagnósticas avanzadas.` : prev.summary
            }));

            alert("Datos sincronizados desde el sistema académico.");

        } catch (error) {
            console.error("Error autofilling CV", error);
        } finally {
            setIsAutoFilling(false);
        }
    };

    const handleInputChange = (field: keyof CVData, value: any) => {
        setCvData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddRole = () => {
        if (!newRole.role) return;
        const roleToAdd = { ...newRole, id: `ROLE-${Date.now()}` };
        setCvData(prev => ({
            ...prev,
            programRoles: [...prev.programRoles, roleToAdd]
        }));
        setNewRole({ id: '', role: '', description: '', period: '' });
    };

    const handleDeleteRole = (id: string) => {
        setCvData(prev => ({
            ...prev,
            programRoles: prev.programRoles.filter(r => r.id !== id)
        }));
    };

    const handlePrint = () => {
        window.print();
    };

    // --- RENDER HELPERS ---

    const renderEditSection = () => (
        <div className="space-y-8 animate-fade-in-up">
            {/* Personal Info */}
            <div className="bg-surface p-6 rounded-xl border border-secondary/20 shadow-sm">
                <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-secondary/10 pb-2">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Nombre Completo</label>
                        <input type="text" value={cvData.fullName} onChange={e => handleInputChange('fullName', e.target.value)} className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">RUT / ID</label>
                        <input type="text" value={cvData.rut} onChange={e => handleInputChange('rut', e.target.value)} className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Especialidad / Título</label>
                        <input type="text" value={cvData.specialty} onChange={e => handleInputChange('specialty', e.target.value)} className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Email</label>
                        <input type="email" value={cvData.email} onChange={e => handleInputChange('email', e.target.value)} className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-text-secondary mb-1">Resumen Profesional</label>
                        <textarea value={cvData.summary} onChange={e => handleInputChange('summary', e.target.value)} rows={3} className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary resize-none" />
                    </div>
                </div>
            </div>

            {/* Education */}
            <div className="bg-surface p-6 rounded-xl border border-secondary/20 shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-secondary/10 pb-2">
                    <h3 className="text-lg font-bold text-text-primary">Formación Académica</h3>
                    <button className="text-xs bg-secondary/10 hover:bg-secondary/20 px-2 py-1 rounded flex items-center gap-1 transition-colors"><PlusIcon className="h-3 w-3"/> Añadir</button>
                </div>
                {cvData.education.length === 0 ? (
                    <p className="text-sm text-text-secondary italic">No hay registros. Use "Sincronizar Datos" para importar.</p>
                ) : (
                    <div className="space-y-3">
                        {cvData.education.map((edu, idx) => (
                            <div key={idx} className="p-3 bg-background rounded-lg border border-secondary/10 flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-sm">{edu.degree}</p>
                                    <p className="text-xs text-text-secondary">{edu.institution}</p>
                                    <p className="text-xs text-text-secondary">{edu.startYear} - {edu.endYear}</p>
                                </div>
                                <button className="text-danger hover:bg-danger/10 p-1 rounded"><TrashIcon className="h-4 w-4"/></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Program Roles (NEW SECTION) */}
            <div className="bg-surface p-6 rounded-xl border border-secondary/20 shadow-sm">
                <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-secondary/10 pb-2 flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-primary" /> Roles y Gestión del Programa
                </h3>
                
                <div className="space-y-3 mb-4">
                    {cvData.programRoles.map((role) => (
                        <div key={role.id} className="p-3 bg-background rounded-lg border border-secondary/10 flex justify-between items-start">
                            <div>
                                <p className="font-bold text-sm">{role.role}</p>
                                <p className="text-xs text-text-secondary">{role.period}</p>
                                <p className="text-xs text-text-secondary italic mt-1">{role.description}</p>
                            </div>
                            <button onClick={() => handleDeleteRole(role.id)} className="text-danger hover:bg-danger/10 p-1 rounded"><TrashIcon className="h-4 w-4"/></button>
                        </div>
                    ))}
                    {cvData.programRoles.length === 0 && (
                        <p className="text-sm text-text-secondary italic">No hay roles registrados (Ej: Jefe de Residentes, Encargado de Actividades).</p>
                    )}
                </div>

                {/* Add Role Form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-background/50 p-3 rounded-lg border border-secondary/10">
                    <input 
                        type="text" 
                        placeholder="Cargo (Ej: Jefe de Becados)" 
                        value={newRole.role}
                        onChange={(e) => setNewRole({...newRole, role: e.target.value})}
                        className="w-full bg-background border border-secondary/30 rounded px-2 py-1.5 text-sm"
                    />
                    <input 
                        type="text" 
                        placeholder="Periodo (Ej: 2024)" 
                        value={newRole.period}
                        onChange={(e) => setNewRole({...newRole, period: e.target.value})}
                        className="w-full bg-background border border-secondary/30 rounded px-2 py-1.5 text-sm"
                    />
                    <input 
                        type="text" 
                        placeholder="Descripción corta" 
                        value={newRole.description}
                        onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                        className="w-full bg-background border border-secondary/30 rounded px-2 py-1.5 text-sm md:col-span-2"
                    />
                    <button 
                        onClick={handleAddRole}
                        disabled={!newRole.role}
                        className="md:col-span-4 bg-secondary/10 hover:bg-secondary/20 text-text-primary px-3 py-1.5 rounded text-sm font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                    >
                        <PlusIcon className="h-4 w-4"/> Agregar Cargo
                    </button>
                </div>
            </div>

            {/* Rotations */}
            <div className="bg-surface p-6 rounded-xl border border-secondary/20 shadow-sm">
                <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-secondary/10 pb-2">Experiencia Clínica (Rotaciones)</h3>
                {cvData.clinicalRotations.length === 0 ? (
                    <p className="text-sm text-text-secondary italic">No hay rotaciones registradas.</p>
                ) : (
                    <div className="space-y-3">
                        {cvData.clinicalRotations.map((rot, idx) => (
                            <div key={idx} className="p-3 bg-background rounded-lg border border-secondary/10">
                                <div className="flex justify-between">
                                    <p className="font-bold text-sm">{rot.role}</p>
                                    <span className="text-xs bg-secondary/10 px-2 py-0.5 rounded">{rot.startYear}</span>
                                </div>
                                <p className="text-xs text-text-secondary">{rot.institution}</p>
                                <p className="text-xs text-text-secondary mt-1 italic">{rot.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Activities */}
            <div className="bg-surface p-6 rounded-xl border border-secondary/20 shadow-sm">
                <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-secondary/10 pb-2">Cursos, Congresos e Investigación</h3>
                {cvData.academicActivities.length === 0 ? (
                    <p className="text-sm text-text-secondary italic">No hay actividades registradas.</p>
                ) : (
                    <div className="space-y-3">
                        {cvData.academicActivities.map((act, idx) => (
                            <div key={idx} className="p-3 bg-background rounded-lg border border-secondary/10">
                                <div className="flex justify-between">
                                    <p className="font-bold text-sm">{act.title}</p>
                                    <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">{act.type}</span>
                                </div>
                                <p className="text-xs text-text-secondary">{act.role} - {act.institution}</p>
                                <p className="text-xs text-text-secondary">{new Date(act.date).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderPreviewSection = () => (
        <div className="bg-white text-gray-900 shadow-2xl mx-auto w-[210mm] min-h-[297mm] p-12 print:shadow-none print:w-full">
            {/* CV Header */}
            <div className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold uppercase tracking-wide text-gray-800">{cvData.fullName || 'Nombre del Residente'}</h1>
                    <p className="text-xl text-gray-600 font-serif italic mt-1">{cvData.specialty}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                    <p>{cvData.email}</p>
                    <p>{cvData.phone}</p>
                    <p>{cvData.rut}</p>
                </div>
            </div>

            {/* Summary */}
            {cvData.summary && (
                <div className="mb-8">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-gray-200 mb-3 pb-1">Perfil Profesional</h2>
                    <p className="text-sm leading-relaxed text-gray-700 text-justify">{cvData.summary}</p>
                </div>
            )}

            {/* Education */}
            <div className="mb-8">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-gray-200 mb-4 pb-1">Formación Académica</h2>
                <div className="space-y-4">
                    {cvData.education.map((edu, idx) => (
                        <div key={idx} className="flex">
                            <div className="w-32 flex-shrink-0 text-sm font-bold text-gray-500">{edu.startYear} - {edu.endYear}</div>
                            <div>
                                <h3 className="font-bold text-gray-800">{edu.degree}</h3>
                                <p className="text-sm text-gray-600">{edu.institution}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Program Roles (NEW SECTION IN PREVIEW) */}
            {cvData.programRoles.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-gray-200 mb-4 pb-1">Cargos y Responsabilidades en el Programa</h2>
                    <div className="space-y-4">
                        {cvData.programRoles.map((role, idx) => (
                            <div key={idx} className="flex">
                                <div className="w-32 flex-shrink-0 text-sm font-bold text-gray-500">{role.period}</div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{role.role}</h3>
                                    <p className="text-sm text-gray-600">{role.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Experience */}
            <div className="mb-8">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-gray-200 mb-4 pb-1">Experiencia Clínica y Rotaciones</h2>
                <div className="space-y-4">
                    {cvData.clinicalRotations.map((rot, idx) => (
                        <div key={idx} className="flex">
                            <div className="w-32 flex-shrink-0 text-sm font-bold text-gray-500">{rot.startYear}</div>
                            <div>
                                <h3 className="font-bold text-gray-800">{rot.role}</h3>
                                <p className="text-sm text-gray-600 italic">{rot.institution}</p>
                                <p className="text-sm text-gray-700 mt-1">{rot.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Activities */}
            {cvData.academicActivities.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-gray-200 mb-4 pb-1">Actividades Académicas e Investigación</h2>
                    <div className="space-y-3">
                        {cvData.academicActivities.map((act, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-bold text-gray-800 text-sm">{act.title}</h3>
                                    <span className="text-xs font-mono text-gray-500">{new Date(act.date).getFullYear()}</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    <span className="italic">{act.type}</span> • {act.role} • {act.institution}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skills & Languages */}
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-gray-200 mb-3 pb-1">Habilidades</h2>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                        {cvData.skills.map((skill, idx) => <li key={idx}>{skill}</li>)}
                    </ul>
                </div>
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-gray-200 mb-3 pb-1">Idiomas</h2>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                        {cvData.languages.map((lang, idx) => <li key={idx}>{lang}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col pb-10">
            {/* Toolbar */}
            <div className="bg-surface p-4 rounded-xl shadow-sm border border-secondary/20 flex flex-col md:flex-row justify-between items-center gap-4 mb-6 print:hidden">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <IdentificationIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">Currículum Vitae</h2>
                        <p className="text-sm text-text-secondary">Generador automático de hoja de vida académica.</p>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    {viewMode === 'edit' && (
                        <button 
                            onClick={handleAutoFill}
                            disabled={isAutoFilling}
                            className="bg-accent/10 hover:bg-accent/20 text-accent font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            <SparklesIcon className={`h-5 w-5 ${isAutoFilling ? 'animate-spin' : ''}`} />
                            {isAutoFilling ? 'Sincronizando...' : 'Sincronizar Datos'}
                        </button>
                    )}
                    
                    <div className="bg-background border border-secondary/30 p-1 rounded-lg flex">
                        <button 
                            onClick={() => setViewMode('edit')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'edit' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            <EditIcon className="h-4 w-4" /> Editar
                        </button>
                        <button 
                            onClick={() => setViewMode('preview')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            <DownloadIcon className="h-4 w-4" /> Vista Previa
                        </button>
                    </div>

                    {viewMode === 'preview' && (
                        <button 
                            onClick={handlePrint}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
                        >
                            <PrinterIcon className="h-5 w-5" /> Imprimir / PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow overflow-y-auto">
                {viewMode === 'edit' ? renderEditSection() : (
                    <div className="flex justify-center bg-secondary/10 p-8 rounded-xl border border-secondary/20 overflow-auto print:p-0 print:border-none print:bg-white">
                        {renderPreviewSection()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CurriculumModule;
