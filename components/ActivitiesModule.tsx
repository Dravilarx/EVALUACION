import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, Teacher, Activity } from '../types';
import { StudentService, TeacherService, ActivityService } from '../services/dataService';
import { resolveDOI } from '../services/geminiService';
import { GlobeIcon, UsersIcon, BriefcaseIcon, PlusIcon, CheckCircleIcon, PresentationChartLineIcon, AcademicIcon, EditIcon, TrashIcon, DownloadIcon, DocumentTextIcon, CloudUploadIcon, SparklesIcon, CheckBadgeIcon, ClockIcon } from './icons';
import { exportToCSV } from '../utils';

interface ActivitiesModuleProps {
    currentUserId: string;
}

const emptyActivity: Activity = {
    id: '',
    type: 'Curso',
    title: '',
    date: new Date().toISOString().split('T')[0],
    institution: '',
    role: 'Asistente',
    description: '',
    participantId: '',
    participantType: 'Student',
    validationStatus: 'Pending'
};

const defaultActivityTypes = ['Curso', 'Congreso', 'Estadía', 'Publicación', 'Poster', 'Vinculación', 'Docencia', 'Seminario'];

const ActivitiesModule: React.FC<ActivitiesModuleProps> = ({ currentUserId }) => {
    const [targetType, setTargetType] = useState<'Student' | 'Teacher'>('Student');
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [currentActivity, setCurrentActivity] = useState<Activity>(emptyActivity);
    const [isSaving, setIsSaving] = useState(false);
    const [filterType, setFilterType] = useState('');
    const [isResolvingDOI, setIsResolvingDOI] = useState(false);
    
    // File Upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [certificateFile, setCertificateFile] = useState<File | null>(null);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);

    const isCoordinator = currentUserId === 'DOCENTE';

    useEffect(() => {
        const loadData = async () => {
            const [s, t, a] = await Promise.all([
                StudentService.getAll(),
                TeacherService.getAll(),
                ActivityService.getAll()
            ]);
            setStudents(s);
            setTeachers(t);
            setActivities(a);
        };
        loadData();
    }, []);

    // --- Dynamic Options Calculation ---
    const dynamicOptions = useMemo(() => {
        const types = new Set(defaultActivityTypes);
        const titles = new Set<string>();
        const institutions = new Set<string>();
        const roles = new Set(['Asistente', 'Expositor', 'Autor', 'Co-autor', 'Organizador']);

        activities.forEach(a => {
            if (a.type) types.add(a.type);
            if (a.title) titles.add(a.title);
            if (a.institution) institutions.add(a.institution);
            if (a.role) roles.add(a.role);
        });

        return {
            types: Array.from(types).sort(),
            titles: Array.from(titles).sort(),
            institutions: Array.from(institutions).sort(),
            roles: Array.from(roles).sort()
        };
    }, [activities]);

    const handleDOIResolve = async () => {
        if (!currentActivity.doi) return;
        setIsResolvingDOI(true);
        const data = await resolveDOI(currentActivity.doi);
        if (data) {
            setCurrentActivity(prev => ({
                ...prev,
                title: data.title,
                institution: data.institution,
                date: data.date,
                type: 'Publicación' // Auto set type
            }));
        } else {
            alert("No se pudieron obtener datos del DOI.");
        }
        setIsResolvingDOI(false);
    };

    const handleCertificateUpload = (files: FileList | null) => {
        if (files && files[0]) {
            setCertificateFile(files[0]);
            // Mock URL creation
            const mockUrl = URL.createObjectURL(files[0]);
            setCurrentActivity(prev => ({ ...prev, certificateUrl: mockUrl }));
        }
    };

    const handleValidation = async (activity: Activity) => {
        if (!isCoordinator) return;
        const newStatus: 'Pending' | 'Validated' = activity.validationStatus === 'Validated' ? 'Pending' : 'Validated';
        const updated: Activity = { ...activity, validationStatus: newStatus };
        
        // Optimistic update
        setActivities(prev => prev.map(a => a.id === activity.id ? updated : a));
        await ActivityService.update(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentActivity.participantId || !currentActivity.title) return;

        setIsSaving(true);
        
        try {
            if (isEditing && currentActivity.id) {
                // Update
                const updatedActivity = { ...currentActivity }; 
                await ActivityService.update(updatedActivity);
                setActivities(prev => prev.map(a => a.id === updatedActivity.id ? updatedActivity : a));
                alert("Actividad actualizada exitosamente.");
            } else {
                // Create
                const newActivity: Activity = {
                    ...currentActivity,
                    id: `ACT-${Date.now()}`,
                    participantType: targetType,
                    // If creating as teacher, auto-validate? maybe not.
                };
                const saved = await ActivityService.create(newActivity);
                setActivities(prev => [saved, ...prev]);
                alert("Actividad registrada exitosamente.");
            }
            
            // Reset
            setCurrentActivity({ ...emptyActivity, participantId: '' });
            setCertificateFile(null);
            setIsEditing(false);
            
        } catch (error) {
            console.error(error);
            alert("Error al guardar la actividad.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (activity: Activity) => {
        setCurrentActivity(activity);
        setTargetType(activity.participantType);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta actividad?")) {
            try {
                await ActivityService.delete(id);
                setActivities(prev => prev.filter(a => a.id !== id));
            } catch (error) {
                console.error("Error deleting activity", error);
            }
        }
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setCurrentActivity({ ...emptyActivity, participantId: '' });
        setCertificateFile(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentActivity(prev => ({ ...prev, [name]: value }));
    };

    const handleExport = () => {
        const dataToExport = filteredActivities.map(a => ({
            ID: a.id,
            Titulo: a.title,
            Tipo: a.type,
            Fecha: a.date,
            Institucion: a.institution,
            Rol: a.role,
            Participante: getParticipantName(a.participantId, a.participantType),
            Validado: a.validationStatus === 'Validated' ? 'Sí' : 'No'
        }));
        exportToCSV(dataToExport, `Actividades_${new Date().toISOString().split('T')[0]}`);
    };

    const handlePrint = () => {
        window.print();
    };

    const getParticipantName = (id: string, type: 'Student' | 'Teacher') => {
        if (type === 'Student') return students.find(s => s.id === id)?.name || id;
        return teachers.find(t => t.id === id)?.name || id;
    };

    const filteredActivities = activities.filter(a => 
        !filterType || a.type === filterType
    );

    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                        <GlobeIcon className="h-8 w-8 text-cyan-600" /> Actividades y Extensión
                    </h2>
                    <p className="text-text-secondary mt-1">Registro de congresos, cursos, publicaciones y vinculación con el medio.</p>
                </div>
                <div className="flex gap-2 print:hidden">
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary bg-surface border border-secondary/30 rounded-lg hover:bg-secondary/10 transition-colors" title="Descargar CSV/Excel">
                        <DocumentTextIcon className="h-4 w-4" /> Exportar
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary bg-surface border border-secondary/30 rounded-lg hover:bg-secondary/10 transition-colors" title="Imprimir PDF">
                        <DownloadIcon className="h-4 w-4" /> PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-1 space-y-6 print:hidden">
                    <div className={`bg-surface p-6 rounded-xl shadow-lg border ${isEditing ? 'border-cyan-500' : 'border-secondary/20'}`}>
                        <h3 className="font-bold text-lg mb-4 text-text-primary border-b border-secondary/20 pb-2">
                            {isEditing ? 'Editar Actividad' : 'Registrar Nueva Actividad'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            {/* DOI Autofill */}
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    name="doi"
                                    value={currentActivity.doi || ''}
                                    onChange={handleInputChange}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="DOI / PMID (Autocompletar)"
                                />
                                <button 
                                    type="button" 
                                    onClick={handleDOIResolve}
                                    disabled={isResolvingDOI}
                                    className="bg-cyan-100 text-cyan-700 px-3 rounded-lg hover:bg-cyan-200 transition-colors disabled:opacity-50"
                                    title="Buscar datos con IA"
                                >
                                    <SparklesIcon className={`h-4 w-4 ${isResolvingDOI ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {/* Target Type Selector */}
                            <div className="flex bg-background rounded-lg p-1 border border-secondary/20">
                                <button
                                    type="button"
                                    onClick={() => { setTargetType('Student'); setCurrentActivity(prev => ({...prev, participantId: ''})) }}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${targetType === 'Student' ? 'bg-cyan-600 text-white shadow' : 'text-text-secondary hover:bg-secondary/10'}`}
                                >
                                    <UsersIcon className="h-4 w-4" /> Residente
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setTargetType('Teacher'); setCurrentActivity(prev => ({...prev, participantId: ''})) }}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${targetType === 'Teacher' ? 'bg-cyan-600 text-white shadow' : 'text-text-secondary hover:bg-secondary/10'}`}
                                >
                                    <BriefcaseIcon className="h-4 w-4" /> Docente
                                </button>
                            </div>

                            {/* Person Selector */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">
                                    {targetType === 'Student' ? 'Seleccionar Residente' : 'Seleccionar Docente'}
                                </label>
                                <select 
                                    name="participantId"
                                    value={currentActivity.participantId} 
                                    onChange={handleInputChange}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                                    required
                                >
                                    <option value="">Seleccione...</option>
                                    {targetType === 'Student' 
                                        ? students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                        : teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                                    }
                                </select>
                            </div>

                            {/* Title (Flexible) */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Título / Nombre</label>
                                <input 
                                    list="activity-titles"
                                    type="text"
                                    name="title"
                                    value={currentActivity.title}
                                    onChange={handleInputChange}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Ej: Congreso Chileno de Radiología"
                                    required
                                    autoComplete="off"
                                />
                                <datalist id="activity-titles">
                                    {dynamicOptions.titles.map(t => <option key={t} value={t} />)}
                                </datalist>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Fecha</label>
                                    <input 
                                        type="date"
                                        name="date"
                                        value={currentActivity.date}
                                        onChange={handleInputChange}
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Tipo</label>
                                    <input 
                                        list="activity-types"
                                        name="type"
                                        value={currentActivity.type} 
                                        onChange={handleInputChange}
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                    <datalist id="activity-types">
                                        {dynamicOptions.types.map(t => <option key={t} value={t} />)}
                                    </datalist>
                                </div>
                            </div>

                            {/* Institution & Role */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Institución</label>
                                    <input 
                                        list="activity-institutions"
                                        type="text"
                                        name="institution"
                                        value={currentActivity.institution}
                                        onChange={handleInputChange}
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                    <datalist id="activity-institutions">
                                        {dynamicOptions.institutions.map(i => <option key={i} value={i} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Rol</label>
                                    <input 
                                        list="activity-roles"
                                        type="text"
                                        name="role"
                                        value={currentActivity.role}
                                        onChange={handleInputChange}
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                    <datalist id="activity-roles">
                                        {dynamicOptions.roles.map(r => <option key={r} value={r} />)}
                                    </datalist>
                                </div>
                            </div>

                            {/* Certificate Upload */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Certificado / Respaldo</label>
                                <div 
                                    className="border-2 border-dashed border-secondary/30 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/5 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {certificateFile || currentActivity.certificateUrl ? (
                                        <div className="flex items-center gap-2 text-cyan-600 font-medium">
                                            <CheckCircleIcon className="h-5 w-5" />
                                            {certificateFile?.name || "Certificado cargado"}
                                        </div>
                                    ) : (
                                        <>
                                            <CloudUploadIcon className="h-8 w-8 text-secondary mb-1" />
                                            <span className="text-xs text-text-secondary">Subir imagen o PDF</span>
                                        </>
                                    )}
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleCertificateUpload(e.target.files)} />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {isEditing && (
                                    <button 
                                        type="button"
                                        onClick={cancelEdit}
                                        className="px-4 py-3 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors font-medium text-text-secondary"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button 
                                    type="submit"
                                    disabled={isSaving || !currentActivity.participantId}
                                    className="flex-grow bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <PlusIcon className="h-5 w-5" /> {isEditing ? 'Actualizar' : 'Registrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Column */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                            <PresentationChartLineIcon className="h-5 w-5 text-text-secondary" /> Registro de Actividades
                        </h3>
                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-surface border border-secondary/30 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="">Todos los tipos</option>
                            {dynamicOptions.types.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    
                    {filteredActivities.length === 0 ? (
                        <div className="bg-surface/50 border border-secondary/20 p-8 rounded-xl text-center text-text-secondary">
                            No hay actividades registradas con los filtros actuales.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredActivities.map(activity => (
                                <div key={activity.id} className="bg-surface p-4 rounded-xl shadow-sm border border-secondary/20 flex gap-4 transition-all hover:shadow-md group relative">
                                    {/* Action Buttons */}
                                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(activity); }} className="p-1.5 hover:bg-cyan-100 rounded text-cyan-700" title="Editar">
                                            <EditIcon className="h-4 w-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(activity.id); }} className="p-1.5 hover:bg-danger/20 rounded text-danger" title="Eliminar">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-cyan-100 text-cyan-700`}>
                                        <AcademicIcon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-grow pr-10">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <h4 className="font-bold text-text-primary text-lg">{activity.title}</h4>
                                                <p className="text-sm text-text-secondary font-medium">{getParticipantName(activity.participantId, activity.participantType)}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs bg-cyan-50 text-cyan-800 px-2 py-1 rounded border border-cyan-200 font-bold whitespace-nowrap">
                                                    {activity.type}
                                                </span>
                                                {/* Validation Badge */}
                                                <button 
                                                    onClick={() => handleValidation(activity)}
                                                    disabled={!isCoordinator}
                                                    className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded font-bold transition-colors ${activity.validationStatus === 'Validated' ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'} ${isCoordinator ? 'cursor-pointer hover:bg-opacity-80' : 'cursor-default'}`}
                                                    title={isCoordinator ? "Clic para validar" : "Estado de validación"}
                                                >
                                                    {activity.validationStatus === 'Validated' ? <CheckBadgeIcon className="h-3 w-3"/> : <ClockIcon className="h-3 w-3"/>}
                                                    {activity.validationStatus === 'Validated' ? 'Validado' : 'Pendiente'}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mt-1 mb-2">
                                            <span className="flex items-center gap-1">📅 {new Date(activity.date).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1">📍 {activity.institution}</span>
                                            <span className="flex items-center gap-1">👤 Rol: {activity.role}</span>
                                            {activity.certificateUrl && <span className="flex items-center gap-1 text-cyan-600 cursor-pointer hover:underline">📄 Certificado</span>}
                                        </div>

                                        <p className="text-sm text-text-primary leading-relaxed bg-background/50 p-3 rounded-lg border border-secondary/10">
                                            {activity.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivitiesModule;