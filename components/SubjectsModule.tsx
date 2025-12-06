
import React, { useState, useEffect } from 'react';
import { Subject, Teacher } from '../types';
import { SubjectService, TeacherService } from '../services/dataService';
import { BookOpenIcon, PlusIcon, EditIcon, TrashIcon, CloseIcon, CheckCircleIcon } from './icons';

const emptySubject: Subject = {
    id: '',
    name: '',
    code: '',
    lead_teacher_id: '',
    participating_teachers_ids: []
};

const SubjectsModule: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentSubject, setCurrentSubject] = useState<Subject>(emptySubject);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [subjectsData, teachersData] = await Promise.all([
                SubjectService.getAll(),
                TeacherService.getAll()
            ]);
            setSubjects(subjectsData);
            setTeachers(teachersData);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    const getTeacherName = (id: string) => {
        const teacher = teachers.find(t => t.id === id);
        return teacher ? teacher.name : 'Desconocido';
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentSubject(prev => ({ ...prev, [name]: value }));
    };

    const handleParticipatingTeacherToggle = (teacherId: string) => {
        setCurrentSubject(prev => {
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
                await SubjectService.update(currentSubject);
                setSubjects(prev => prev.map(s => s.id === currentSubject.id ? currentSubject : s));
            } else {
                await SubjectService.create(currentSubject);
                setSubjects(prev => [currentSubject, ...prev]); // This assumes create updates the ID internally in the service mock but for UI it might duplicate if ID is empty initially in state.
                // In a real app, the service returns the object with the new ID.
                // Re-fetch or manually assign ID in mock service is handled.
            }
            setIsFormOpen(false);
            loadData(); // Re-fetch to ensure IDs are synced
        } catch (error) {
            console.error("Error saving subject", error);
        }
    };

    const handleEdit = (subject: Subject) => {
        setCurrentSubject(subject);
        setIsEditing(true);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta asignatura?")) {
            try {
                await SubjectService.delete(id);
                setSubjects(prev => prev.filter(s => s.id !== id));
            } catch (error) {
                console.error("Error deleting subject", error);
            }
        }
    };

    const handleNew = () => {
        setCurrentSubject(emptySubject);
        setIsEditing(false);
        setIsFormOpen(true);
    };

    const filteredSubjects = subjects.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inputClass = "w-full bg-background border border-secondary/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none";
    const labelClass = "block text-xs font-semibold text-text-secondary mb-1";

    return (
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                        <BookOpenIcon className="h-8 w-8 text-primary" /> Asignaturas
                    </h2>
                    <p className="text-text-secondary">Gestión de malla curricular y equipos docentes</p>
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
                        onClick={handleNew}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
                    >
                        <PlusIcon className="h-5 w-5" /> <span className="hidden sm:inline">Nueva Asignatura</span>
                    </button>
                </div>
            </div>

            <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/10 text-text-secondary uppercase text-xs font-bold border-b border-secondary/20">
                            <tr>
                                <th className="px-6 py-4">Asignatura</th>
                                <th className="px-6 py-4">Docente a Cargo</th>
                                <th className="px-6 py-4 hidden md:table-cell">Docentes Participantes</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/20">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-text-secondary">Cargando asignaturas...</td></tr>
                            ) : filteredSubjects.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-text-secondary">No se encontraron asignaturas.</td></tr>
                            ) : (
                                filteredSubjects.map(subject => (
                                    <tr key={subject.id} className="hover:bg-secondary/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-text-primary">{subject.name}</div>
                                            <div className="text-xs text-text-secondary font-mono">{subject.code}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                 <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {getTeacherName(subject.lead_teacher_id).charAt(0)}
                                                 </div>
                                                 <span>{getTeacherName(subject.lead_teacher_id)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {subject.participating_teachers_ids.length === 0 ? (
                                                    <span className="text-text-secondary text-xs italic">Sin participantes adicionales</span>
                                                ) : (
                                                    <>
                                                        {subject.participating_teachers_ids.slice(0, 3).map(id => (
                                                            <span key={id} className="bg-secondary/10 px-2 py-0.5 rounded text-[10px] text-text-secondary border border-secondary/20">
                                                                {getTeacherName(id)}
                                                            </span>
                                                        ))}
                                                        {subject.participating_teachers_ids.length > 3 && (
                                                            <span className="text-[10px] text-text-secondary px-1">+{subject.participating_teachers_ids.length - 3} más</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(subject)} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded text-text-secondary" title="Editar">
                                                    <EditIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(subject.id)} className="p-1.5 hover:bg-danger/20 hover:text-danger rounded text-text-secondary" title="Eliminar">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
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
                                <input type="text" name="name" value={currentSubject.name} onChange={handleInputChange} className={inputClass} required placeholder="Ej: Radiología Intervencionista" />
                            </div>
                            <div>
                                <label className={labelClass}>Código</label>
                                <input type="text" name="code" value={currentSubject.code} onChange={handleInputChange} className={inputClass} required placeholder="Ej: RAD-INT-401" />
                            </div>
                            
                            <div>
                                <label className={labelClass}>Docente a Cargo</label>
                                <select name="lead_teacher_id" value={currentSubject.lead_teacher_id} onChange={handleInputChange} className={inputClass} required>
                                    <option value="">Seleccione un docente...</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-2">
                                <label className={labelClass}>Docentes que Participan</label>
                                <div className="max-h-40 overflow-y-auto border border-secondary/30 rounded-lg p-2 space-y-1 bg-background">
                                    {teachers.filter(t => t.id !== currentSubject.lead_teacher_id).map(t => (
                                        <label key={t.id} className="flex items-center gap-2 p-1.5 hover:bg-secondary/10 rounded cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={currentSubject.participating_teachers_ids.includes(t.id)}
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
};

export default SubjectsModule;
