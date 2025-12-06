
import React, { useState, useEffect } from 'react';
import { Student, Teacher, Activity } from '../types';
import { StudentService, TeacherService, ActivityService } from '../services/dataService';
import { GlobeIcon, UsersIcon, BriefcaseIcon, PlusIcon, CheckCircleIcon, PresentationChartLineIcon, AcademicIcon } from './icons';

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
    participantType: 'Student'
};

const activityTypes = ['Curso', 'Congreso', 'Estadía', 'Publicación', 'Poster', 'Vinculación'];

const ActivitiesModule: React.FC<ActivitiesModuleProps> = ({ currentUserId }) => {
    const [targetType, setTargetType] = useState<'Student' | 'Teacher'>('Student');
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [currentActivity, setCurrentActivity] = useState<Activity>(emptyActivity);
    const [isSaving, setIsSaving] = useState(false);
    const [filterType, setFilterType] = useState('');

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentActivity.participantId || !currentActivity.title) return;

        setIsSaving(true);
        const newActivity: Activity = {
            ...currentActivity,
            id: `ACT-${Date.now()}`,
            participantType: targetType
        };

        try {
            const saved = await ActivityService.create(newActivity);
            setActivities(prev => [saved, ...prev]);
            setCurrentActivity({ ...emptyActivity, participantId: '' }); // Reset form but keep type selection logic if needed
            alert("Actividad registrada exitosamente.");
        } catch (error) {
            console.error(error);
            alert("Error al guardar la actividad.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentActivity(prev => ({ ...prev, [name]: value }));
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
            <div>
                <h2 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                    <GlobeIcon className="h-8 w-8 text-cyan-600" /> Actividades y Extensión
                </h2>
                <p className="text-text-secondary mt-1">Registro de congresos, cursos, publicaciones y vinculación con el medio.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface p-6 rounded-xl shadow-lg border border-secondary/20">
                        <h3 className="font-bold text-lg mb-4 text-text-primary border-b border-secondary/20 pb-2">Registrar Nueva Actividad</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            
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

                            {/* Activity Type */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Tipo de Actividad</label>
                                <select 
                                    name="type"
                                    value={currentActivity.type} 
                                    onChange={handleInputChange}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Título / Nombre</label>
                                <input 
                                    type="text"
                                    name="title"
                                    value={currentActivity.title}
                                    onChange={handleInputChange}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Ej: Congreso Chileno de Radiología"
                                    required
                                />
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
                                    <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Rol</label>
                                    <input 
                                        type="text"
                                        name="role"
                                        value={currentActivity.role}
                                        onChange={handleInputChange}
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Ej: Asistente"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Institución / Lugar</label>
                                <input 
                                    type="text"
                                    name="institution"
                                    value={currentActivity.institution}
                                    onChange={handleInputChange}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Ej: SOCHRADI"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Descripción Breve</label>
                                <textarea 
                                    name="description"
                                    value={currentActivity.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                                    placeholder="Detalles adicionales..."
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSaving || !currentActivity.participantId}
                                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PlusIcon className="h-5 w-5" /> Registrar Actividad
                            </button>
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
                            {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    
                    {filteredActivities.length === 0 ? (
                        <div className="bg-surface/50 border border-secondary/20 p-8 rounded-xl text-center text-text-secondary">
                            No hay actividades registradas con los filtros actuales.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredActivities.map(activity => (
                                <div key={activity.id} className="bg-surface p-4 rounded-xl shadow-sm border border-secondary/20 flex gap-4 transition-all hover:shadow-md group">
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-cyan-100 text-cyan-700`}>
                                        <AcademicIcon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <h4 className="font-bold text-text-primary text-lg">{activity.title}</h4>
                                                <p className="text-sm text-text-secondary font-medium">{getParticipantName(activity.participantId, activity.participantType)}</p>
                                            </div>
                                            <span className="text-xs bg-cyan-50 text-cyan-800 px-2 py-1 rounded border border-cyan-200 font-bold whitespace-nowrap">
                                                {activity.type}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mt-1 mb-2">
                                            <span className="flex items-center gap-1">📅 {new Date(activity.date).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1">📍 {activity.institution}</span>
                                            <span className="flex items-center gap-1">👤 Rol: {activity.role}</span>
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
