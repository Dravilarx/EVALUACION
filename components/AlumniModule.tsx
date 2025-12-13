
import React, { useState, useEffect, useMemo } from 'react';
import { Student, AlumniFollowUp, Teacher } from '../types';
import { StudentService, AlumniService, TeacherService } from '../services/dataService';
import { GraduationCapIcon, PlusIcon, LocationIcon, BriefcaseIcon, ClockIcon, CheckCircleIcon, ExclamationIcon, FilterIcon, UsersIcon, EditIcon, CloseIcon, TrashIcon } from './icons';

interface AlumniModuleProps {
    currentUserId: string;
}

interface NewFollowUp {
    currentJob: string;
    location: string;
    contactMethod: string;
    notes: string;
    date: string;
}

const AlumniModule: React.FC<AlumniModuleProps> = ({ currentUserId }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]); // To resolve names
    const [allFollowUps, setAllFollowUps] = useState<AlumniFollowUp[]>([]);
    const [selectedAlumnus, setSelectedAlumnus] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');

    // Form State for New/Edit Entry
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null); // Track if editing specific ID
    const [newFollowUp, setNewFollowUp] = useState<NewFollowUp>({
        currentJob: '',
        location: '',
        contactMethod: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Form State for Editing Profile (Base Data)
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editProfileData, setEditProfileData] = useState<{ email: string, phone: string }>({ email: '', phone: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sData, tData, fData] = await Promise.all([
                StudentService.getAll(),
                TeacherService.getAll(),
                AlumniService.getFollowUps()
            ]);
            // Filter only graduated students
            const graduates = sData.filter(s => s.status === 'Egresado' || s.level === 'Egresado');
            setStudents(graduates);
            setTeachers(tData);
            setAllFollowUps(fData);
        } catch (error) {
            console.error("Error loading alumni data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAlumnus = (student: Student) => {
        setSelectedAlumnus(student);
        setIsFormOpen(false);
        setIsEditingProfile(false);
        setEditingEntryId(null);
        setEditProfileData({
            email: student.email_personal,
            phone: student.phone
        });
        resetForm();
    };

    const resetForm = () => {
        setNewFollowUp({
            currentJob: '',
            location: '',
            contactMethod: '',
            notes: '',
            date: new Date().toISOString().split('T')[0]
        });
        setEditingEntryId(null);
    };

    const getUserName = (id: string) => {
        if (id === '10611061') return 'Marcelo Avila (Admin)';
        if (id === 'DOCENTE') return 'Docente Genérico';
        const teacher = teachers.find(t => t.id === id);
        return teacher ? teacher.name : id;
    };

    const handleSaveFollowUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAlumnus) return;

        try {
            if (editingEntryId) {
                // UPDATE EXISTING
                const updatedEntry: AlumniFollowUp = {
                    id: editingEntryId,
                    studentId: selectedAlumnus.id,
                    date: new Date(newFollowUp.date).toISOString(),
                    currentJob: newFollowUp.currentJob,
                    location: newFollowUp.location,
                    contactMethod: newFollowUp.contactMethod,
                    notes: newFollowUp.notes,
                    registeredBy: currentUserId // Could keep original author, but usually last modifier is tracked
                };
                await AlumniService.updateFollowUp(updatedEntry);
                setAllFollowUps(prev => prev.map(f => f.id === editingEntryId ? updatedEntry : f));
                alert("Registro actualizado correctamente.");
            } else {
                // CREATE NEW
                const entry: AlumniFollowUp = {
                    id: `AL-${Date.now()}`,
                    studentId: selectedAlumnus.id,
                    date: new Date(newFollowUp.date).toISOString(),
                    currentJob: newFollowUp.currentJob,
                    location: newFollowUp.location,
                    contactMethod: newFollowUp.contactMethod,
                    notes: newFollowUp.notes,
                    registeredBy: currentUserId
                };
                const saved = await AlumniService.createFollowUp(entry);
                setAllFollowUps(prev => [saved, ...prev]);
                alert("Seguimiento registrado exitosamente.");
            }
            
            resetForm();
            setIsFormOpen(false);
        } catch (error) {
            console.error("Error saving follow-up", error);
        }
    };

    const handleEditEntry = (entry: AlumniFollowUp) => {
        setNewFollowUp({
            currentJob: entry.currentJob,
            location: entry.location,
            contactMethod: entry.contactMethod,
            notes: entry.notes || '',
            date: entry.date.substring(0, 10) // Format for input date
        });
        setEditingEntryId(entry.id);
        setIsFormOpen(true);
    };

    const handleDeleteEntry = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este registro de contacto?")) {
            try {
                await AlumniService.deleteFollowUp(id);
                setAllFollowUps(prev => prev.filter(f => f.id !== id));
            } catch (error) {
                console.error("Error deleting entry", error);
            }
        }
    };

    const handleUpdateProfile = async () => {
        if (!selectedAlumnus) return;
        try {
            const updatedStudent: Student = {
                ...selectedAlumnus,
                email_personal: editProfileData.email,
                phone: editProfileData.phone
            };
            await StudentService.update(updatedStudent);
            
            // Update local state
            setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
            setSelectedAlumnus(updatedStudent);
            setIsEditingProfile(false);
            alert("Datos de contacto actualizados.");
        } catch (error) {
            console.error("Error updating profile", error);
            alert("Error al actualizar los datos.");
        }
    };

    // Calculate Last Contact Status
    const getLastContactStatus = (studentId: string) => {
        const studentFollowUps = allFollowUps.filter(f => f.studentId === studentId);
        if (studentFollowUps.length === 0) return { color: 'bg-secondary/20 text-text-secondary', label: 'Sin contacto', days: Infinity };

        const lastDate = new Date(Math.max(...studentFollowUps.map(f => new Date(f.date).getTime())));
        const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 365) return { color: 'bg-success/10 text-success', label: '< 1 Año', days: diffDays };
        if (diffDays < 730) return { color: 'bg-warning/10 text-warning', label: '1-2 Años', days: diffDays };
        return { color: 'bg-danger/10 text-danger', label: '> 2 Años', days: diffDays };
    };

    const filteredStudents = useMemo(() => {
        return students.filter(s => 
            s.name.toLowerCase().includes(filterText.toLowerCase()) || 
            s.id.includes(filterText)
        );
    }, [students, filterText]);

    const currentAlumnusFollowUps = useMemo(() => {
        if (!selectedAlumnus) return [];
        return allFollowUps
            .filter(f => f.studentId === selectedAlumnus.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allFollowUps, selectedAlumnus]);

    if (loading) return <div className="p-8 text-center text-text-secondary">Cargando base de datos de egresados...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in-up">
            {/* Header */}
            <div className="bg-surface p-5 rounded-xl shadow-sm border border-secondary/20 flex flex-col md:flex-row justify-between items-center gap-4 mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <GraduationCapIcon className="h-8 w-8 text-purple-600" /> Red de Exalumnos
                    </h2>
                    <p className="text-sm text-text-secondary">Seguimiento de trayectoria laboral y contacto.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="bg-secondary/5 px-4 py-2 rounded-lg border border-secondary/10 flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-secondary" />
                        <span className="font-bold text-text-primary">{students.length}</span>
                        <span className="text-xs text-text-secondary">Titulados</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-grow overflow-hidden">
                
                {/* LIST COLUMN */}
                <div className="lg:w-1/3 bg-surface rounded-xl shadow-sm border border-secondary/20 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-secondary/10 bg-secondary/5">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Buscar exalumno..." 
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="w-full bg-background border border-secondary/30 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <FilterIcon className="absolute left-3 top-2.5 h-4 w-4 text-secondary" />
                        </div>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-2 space-y-2">
                        {filteredStudents.length === 0 ? (
                            <div className="text-center p-8 text-text-secondary italic">No se encontraron egresados.</div>
                        ) : (
                            filteredStudents.map(student => {
                                const status = getLastContactStatus(student.id);
                                return (
                                    <div 
                                        key={student.id}
                                        onClick={() => handleSelectAlumnus(student)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedAlumnus?.id === student.id ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-background border-transparent hover:bg-secondary/5 hover:border-secondary/20'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-text-primary text-sm">{student.name}</h4>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-secondary mb-1">Egreso: {student.graduation_date ? new Date(student.graduation_date).getFullYear() : 'N/D'}</p>
                                        <div className="flex items-center gap-1 text-[10px] text-text-secondary">
                                            <ClockIcon className="h-3 w-3" /> Último contacto: {status.days === Infinity ? 'Nunca' : `${status.days} días`}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* DETAIL COLUMN */}
                <div className="lg:w-2/3 flex flex-col gap-6 overflow-hidden">
                    {selectedAlumnus ? (
                        <>
                            {/* Profile Card */}
                            <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/20 flex-shrink-0 animate-fade-in-right">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4 flex-grow">
                                        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 border-2 border-white shadow-sm overflow-hidden">
                                            {selectedAlumnus.photo_url ? (
                                                <img src={selectedAlumnus.photo_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-xl">{selectedAlumnus.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold text-text-primary">{selectedAlumnus.name}</h3>
                                            
                                            {isEditingProfile ? (
                                                <div className="mt-2 space-y-2 max-w-md bg-secondary/5 p-3 rounded-lg border border-secondary/10">
                                                    <input 
                                                        type="email" 
                                                        value={editProfileData.email} 
                                                        onChange={(e) => setEditProfileData({...editProfileData, email: e.target.value})}
                                                        className="w-full text-sm p-1.5 rounded border border-secondary/30"
                                                        placeholder="Email Personal"
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={editProfileData.phone} 
                                                        onChange={(e) => setEditProfileData({...editProfileData, phone: e.target.value})}
                                                        className="w-full text-sm p-1.5 rounded border border-secondary/30"
                                                        placeholder="Teléfono"
                                                    />
                                                    <div className="flex justify-end gap-2 pt-1">
                                                        <button onClick={() => setIsEditingProfile(false)} className="text-xs px-2 py-1 rounded hover:bg-secondary/10">Cancelar</button>
                                                        <button onClick={handleUpdateProfile} className="text-xs px-3 py-1 rounded bg-purple-600 text-white font-bold">Guardar</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="group relative">
                                                    <p className="text-text-secondary">{selectedAlumnus.email_personal} • {selectedAlumnus.phone}</p>
                                                    <button 
                                                        onClick={() => setIsEditingProfile(true)}
                                                        className="absolute -right-8 top-0 p-1 text-secondary hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Editar Datos de Contacto"
                                                    >
                                                        <EditIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                            
                                            <p className="text-xs text-text-secondary mt-1">
                                                Universidad de Origen: {selectedAlumnus.origin_university}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
                                        >
                                            <PlusIcon className="h-5 w-5" /> Nuevo Contacto
                                        </button>
                                        {!isEditingProfile && (
                                            <button 
                                                onClick={() => setIsEditingProfile(true)}
                                                className="bg-surface hover:bg-secondary/10 border border-secondary/20 text-text-secondary hover:text-text-primary px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm"
                                            >
                                                <EditIcon className="h-4 w-4" /> Editar Datos
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* New/Edit Entry Form */}
                            {isFormOpen && (
                                <div className="bg-surface p-6 rounded-xl shadow-lg border border-purple-200 animate-fade-in-down flex-shrink-0">
                                    <h4 className="font-bold text-purple-800 mb-4 pb-2 border-b border-purple-100">
                                        {editingEntryId ? 'Editar Registro de Seguimiento' : 'Registrar Nuevo Seguimiento'}
                                    </h4>
                                    <form onSubmit={handleSaveFollowUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-text-secondary mb-1">Fecha de Contacto</label>
                                            <input 
                                                type="date" 
                                                value={newFollowUp.date}
                                                onChange={(e) => setNewFollowUp({...newFollowUp, date: e.target.value})}
                                                className="w-full bg-background border border-secondary/30 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-text-secondary mb-1">Medio de Contacto</label>
                                            <select 
                                                value={newFollowUp.contactMethod}
                                                onChange={(e) => setNewFollowUp({...newFollowUp, contactMethod: e.target.value})}
                                                className="w-full bg-background border border-secondary/30 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                            >
                                                <option value="">Seleccione...</option>
                                                <option value="Email">Email</option>
                                                <option value="Teléfono">Teléfono</option>
                                                <option value="LinkedIn">LinkedIn</option>
                                                <option value="Presencial">Presencial</option>
                                                <option value="Otro">Otro</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-text-secondary mb-1">Lugar de Trabajo Actual</label>
                                            <input 
                                                type="text" 
                                                value={newFollowUp.currentJob}
                                                onChange={(e) => setNewFollowUp({...newFollowUp, currentJob: e.target.value})}
                                                placeholder="Ej: Clínica Alemana"
                                                className="w-full bg-background border border-secondary/30 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-text-secondary mb-1">Ubicación (Ciudad/País)</label>
                                            <input 
                                                type="text" 
                                                value={newFollowUp.location}
                                                onChange={(e) => setNewFollowUp({...newFollowUp, location: e.target.value})}
                                                placeholder="Ej: Santiago, Chile"
                                                className="w-full bg-background border border-secondary/30 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-text-secondary mb-1">Notas Adicionales</label>
                                            <textarea 
                                                value={newFollowUp.notes}
                                                onChange={(e) => setNewFollowUp({...newFollowUp, notes: e.target.value})}
                                                placeholder="Comentarios sobre su estado actual, becas, subespecialidades, etc."
                                                rows={2}
                                                className="w-full bg-background border border-secondary/30 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex justify-end gap-3">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsFormOpen(false)}
                                                className="px-4 py-2 rounded-lg border border-secondary/30 text-text-secondary hover:bg-secondary/10 text-sm font-bold"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                type="submit"
                                                className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md"
                                            >
                                                {editingEntryId ? 'Actualizar' : 'Guardar Registro'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/20 flex-grow overflow-y-auto relative animate-fade-in-up">
                                <h3 className="font-bold text-lg text-text-primary mb-6 sticky top-0 bg-surface z-10 pb-2 border-b border-secondary/10">Historial de Trayectoria</h3>
                                
                                {currentAlumnusFollowUps.length === 0 ? (
                                    <div className="text-center p-12 opacity-60">
                                        <ExclamationIcon className="h-12 w-12 mx-auto mb-3 text-secondary" />
                                        <p className="text-text-secondary">Aún no hay registros de seguimiento para este exalumno.</p>
                                        <button onClick={() => { resetForm(); setIsFormOpen(true); }} className="text-purple-600 font-bold hover:underline mt-2">Agregar el primer contacto</button>
                                    </div>
                                ) : (
                                    <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-secondary/20">
                                        {currentAlumnusFollowUps.map((followUp, index) => (
                                            <div key={followUp.id} className="relative group">
                                                {/* Timeline Node */}
                                                <div className="absolute -left-[1.85rem] top-1.5 w-4 h-4 rounded-full bg-purple-100 border-4 border-white shadow-sm flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                                                </div>
                                                
                                                <div className="bg-background rounded-lg border border-secondary/20 p-4 hover:shadow-md transition-shadow relative">
                                                    {/* Actions (Hover) */}
                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background p-1 rounded-lg shadow-sm border border-secondary/10">
                                                        <button 
                                                            onClick={() => handleEditEntry(followUp)} 
                                                            className="p-1.5 hover:bg-purple-100 text-purple-600 rounded" 
                                                            title="Editar"
                                                        >
                                                            <EditIcon className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteEntry(followUp.id)} 
                                                            className="p-1.5 hover:bg-red-100 text-red-600 rounded" 
                                                            title="Eliminar"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    <div className="flex justify-between items-start mb-2 pr-12">
                                                        <div>
                                                            <h4 className="font-bold text-text-primary text-base">{followUp.currentJob}</h4>
                                                            <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                                                                <LocationIcon className="h-3 w-3" /> {followUp.location}
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-mono text-text-secondary bg-secondary/10 px-2 py-1 rounded">
                                                            {new Date(followUp.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    
                                                    <p className="text-sm text-text-primary leading-relaxed mb-3">
                                                        {followUp.notes || <span className="italic text-secondary">Sin notas adicionales.</span>}
                                                    </p>
                                                    
                                                    <div className="flex items-center justify-between pt-3 border-t border-secondary/10">
                                                        <span className="text-xs text-text-secondary font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">
                                                            Vía: {followUp.contactMethod}
                                                        </span>
                                                        <span className="text-[10px] text-text-secondary italic flex items-center gap-1">
                                                            Registrado por: <span className="font-semibold">{getUserName(followUp.registeredBy)}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-60 bg-surface rounded-xl border border-secondary/20 border-dashed">
                            <GraduationCapIcon className="h-16 w-16 text-secondary mb-4" />
                            <h3 className="text-xl font-bold text-text-primary">Selecciona un Exalumno</h3>
                            <p className="text-text-secondary max-w-sm mt-2">
                                Elige un egresado de la lista para ver su historial laboral y registrar nuevos contactos de seguimiento.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlumniModule;
