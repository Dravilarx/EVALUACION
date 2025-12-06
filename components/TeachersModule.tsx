
import React, { useState, useEffect, useRef } from 'react';
import { Teacher } from '../types';
import { TeacherService } from '../services/dataService';
import { BriefcaseIcon, PlusIcon, EditIcon, TrashIcon, DuplicateIcon, CloseIcon, ImageIcon, CheckCircleIcon, AcademicIcon } from './icons';

interface TeachersModuleProps {
}

const emptyTeacher: Teacher = {
    id: '',
    name: '',
    email_ua: '',
    email_personal: '',
    phone: '',
    admission_date: new Date().toISOString().split('T')[0],
    rank: 'Instructor',
    contract_hours: '22',
    subjects_in_charge: [],
    status: 'Activo',
    university_undergrad: '',
    university_postgrad: '',
    nationality: 'Chilena',
    sex: 'Otro',
    photo_url: ''
};

const TeachersModule: React.FC<TeachersModuleProps> = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentTeacher, setCurrentTeacher] = useState<Teacher>(emptyTeacher);
    const [isEditing, setIsEditing] = useState(false);
    const [subjectsInput, setSubjectsInput] = useState('');
    
    // Drag and Drop state
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadTeachers();
    }, []);

    useEffect(() => {
        if (isFormOpen) {
            setSubjectsInput(currentTeacher.subjects_in_charge.join(', '));
        }
    }, [isFormOpen, currentTeacher]);

    const loadTeachers = async () => {
        setLoading(true);
        try {
            const data = await TeacherService.getAll();
            setTeachers(data);
        } catch (error) {
            console.error("Failed to load teachers", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to convert file to Base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handlePhotoSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) return;

        try {
            const base64 = await fileToBase64(file);
            setCurrentTeacher(prev => ({ ...prev, photo_url: base64 }));
        } catch (error) {
            console.error("Error reading file", error);
        }
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>, dragging: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(dragging);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        handleDrag(e, false);
        handlePhotoSelect(e.dataTransfer.files);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentTeacher(prev => ({ ...prev, [name]: value }));
    };

    const handleSubjectsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSubjectsInput(e.target.value);
        const subjectsArray = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
        setCurrentTeacher(prev => ({ ...prev, subjects_in_charge: subjectsArray }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await TeacherService.update(currentTeacher);
                setTeachers(prev => prev.map(t => t.id === currentTeacher.id ? currentTeacher : t));
            } else {
                await TeacherService.create(currentTeacher);
                setTeachers(prev => [currentTeacher, ...prev]);
            }
            setIsFormOpen(false);
        } catch (error) {
            console.error("Error saving teacher", error);
            alert("Error al guardar el docente");
        }
    };

    const handleEdit = (teacher: Teacher) => {
        setCurrentTeacher(teacher);
        setIsEditing(true);
        setIsFormOpen(true);
    };

    const handleDuplicate = (teacher: Teacher) => {
        const copy = { 
            ...teacher, 
            id: `${teacher.id}-COPY`, 
            name: `${teacher.name} (Copia)`,
            email_ua: '', 
            email_personal: '' 
        };
        setCurrentTeacher(copy);
        setIsEditing(false); // Mode create based on copy
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este perfil docente? Esta acción es irreversible.")) {
            try {
                await TeacherService.delete(id);
                setTeachers(prev => prev.filter(t => t.id !== id));
            } catch (error) {
                console.error("Error deleting teacher", error);
            }
        }
    };

    const handleDownload = (teacher: Teacher) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(teacher, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", `perfil_docente_${teacher.name.replace(/\s+/g, '_')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleNew = () => {
        setCurrentTeacher(emptyTeacher);
        setIsEditing(false);
        setIsFormOpen(true);
    };

    const filteredTeachers = teachers.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inputClass = "w-full bg-background border border-secondary/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none";
    const labelClass = "block text-xs font-semibold text-text-secondary mb-1";

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                        <BriefcaseIcon className="h-8 w-8 text-primary" /> Cuerpo Docente
                    </h2>
                    <p className="text-text-secondary">Gestión de fichas académicas y contractuales</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o RUT..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-background border border-secondary/30 rounded-lg px-4 py-2 text-sm flex-grow md:w-64"
                    />
                    <button 
                        onClick={handleNew}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
                    >
                        <PlusIcon className="h-5 w-5" /> <span className="hidden sm:inline">Nuevo Docente</span>
                    </button>
                </div>
            </div>

            {/* Teachers Table */}
            <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/10 text-text-secondary uppercase text-xs font-bold border-b border-secondary/20">
                            <tr>
                                <th className="px-6 py-4">Docente</th>
                                <th className="px-6 py-4">Cargo / Horas</th>
                                <th className="px-6 py-4 hidden md:table-cell">Contacto</th>
                                <th className="px-6 py-4 hidden lg:table-cell">Asignaturas</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/20">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-text-secondary">Cargando docentes...</td></tr>
                            ) : filteredTeachers.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-text-secondary">No se encontraron docentes.</td></tr>
                            ) : (
                                filteredTeachers.map(teacher => (
                                    <tr key={teacher.id} className="hover:bg-secondary/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-secondary/20 overflow-hidden flex-shrink-0 border border-secondary/30">
                                                    {teacher.photo_url ? (
                                                        <img src={teacher.photo_url} alt={teacher.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <BriefcaseIcon className="h-full w-full p-2 text-secondary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-text-primary">{teacher.name}</div>
                                                    <div className="text-xs text-text-secondary">{teacher.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex w-fit px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary`}>
                                                    {teacher.rank}
                                                </span>
                                                <span className="text-xs text-text-secondary">
                                                    {teacher.contract_hours} hrs • {teacher.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="text-text-secondary">
                                                <div>{teacher.email_ua}</div>
                                                <div className="text-xs opacity-75">{teacher.phone}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                             <div className="flex flex-wrap gap-1">
                                                {teacher.subjects_in_charge.slice(0, 2).map((subject, idx) => (
                                                    <span key={idx} className="bg-secondary/10 px-1.5 py-0.5 rounded text-[10px] text-text-secondary border border-secondary/20 truncate max-w-[120px]">
                                                        {subject}
                                                    </span>
                                                ))}
                                                {teacher.subjects_in_charge.length > 2 && (
                                                    <span className="text-[10px] text-text-secondary px-1">+{teacher.subjects_in_charge.length - 2} más</span>
                                                )}
                                             </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleDownload(teacher)} className="p-1.5 hover:bg-secondary/20 rounded text-text-secondary" title="Descargar Ficha">
                                                    <CheckCircleIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDuplicate(teacher)} className="p-1.5 hover:bg-secondary/20 rounded text-text-secondary" title="Duplicar">
                                                    <DuplicateIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleEdit(teacher)} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded text-text-secondary" title="Editar">
                                                    <EditIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(teacher.id)} className="p-1.5 hover:bg-danger/20 hover:text-danger rounded text-text-secondary" title="Eliminar">
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
                    <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-secondary/20">
                        <header className="p-5 border-b border-secondary/20 flex justify-between items-center bg-surface/95 rounded-t-xl">
                            <h3 className="text-xl font-bold text-text-primary">
                                {isEditing ? `Editar: ${currentTeacher.name}` : 'Nuevo Docente'}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-secondary/20"><CloseIcon /></button>
                        </header>
                        
                        <main className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Left Column: Photo & Primary Info */}
                            <div className="md:col-span-1 space-y-6">
                                <div className="text-center">
                                    <div 
                                        className={`relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 cursor-pointer transition-all group ${isDragging ? 'border-primary scale-105' : 'border-secondary/20'}`}
                                        onDragEnter={(e) => handleDrag(e, true)}
                                        onDragLeave={(e) => handleDrag(e, false)}
                                        onDragOver={(e) => handleDrag(e, true)}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {currentTeacher.photo_url ? (
                                            <img src={currentTeacher.photo_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-secondary/10 flex flex-col items-center justify-center text-secondary">
                                                <ImageIcon className="h-10 w-10 mb-2" />
                                                <span className="text-xs">Subir Foto</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <p className="text-white text-xs font-bold">Cambiar</p>
                                        </div>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handlePhotoSelect(e.target.files)} />
                                    </div>
                                    <p className="text-xs text-text-secondary mt-2">Arrastra una imagen o haz clic</p>
                                </div>

                                <div className="space-y-3 p-4 bg-background rounded-lg border border-secondary/20">
                                    <h4 className="text-sm font-bold text-accent border-b border-secondary/20 pb-1">Datos Contractuales</h4>
                                    <div>
                                        <label className={labelClass}>Fecha de Ingreso</label>
                                        <input type="date" name="admission_date" value={currentTeacher.admission_date} onChange={handleInputChange} className={inputClass} required />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Tipo de Contrato (Horas)</label>
                                        <select name="contract_hours" value={currentTeacher.contract_hours} onChange={handleInputChange} className={inputClass}>
                                            <option value="11">11 Horas</option>
                                            <option value="22">22 Horas</option>
                                            <option value="33">33 Horas</option>
                                            <option value="44">44 Horas</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Estado</label>
                                        <select name="status" value={currentTeacher.status} onChange={handleInputChange} className={inputClass}>
                                            <option value="Activo">Activo</option>
                                            <option value="Inactivo">Inactivo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Detailed Form */}
                            <div className="md:col-span-2 space-y-6">
                                <form id="teacher-form" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-accent border-b border-secondary/20 pb-1 uppercase tracking-wider">Información Personal</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Nombre Completo</label>
                                                <input type="text" name="name" value={currentTeacher.name} onChange={handleInputChange} className={inputClass} required />
                                            </div>
                                            <div>
                                                <label className={labelClass}>RUT / ID</label>
                                                <input type="text" name="id" value={currentTeacher.id} onChange={handleInputChange} className={inputClass} required disabled={isEditing} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Nacionalidad</label>
                                                <input type="text" name="nationality" value={currentTeacher.nationality} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Sexo</label>
                                                <select name="sex" value={currentTeacher.sex} onChange={handleInputChange} className={inputClass}>
                                                    <option value="Masculino">Masculino</option>
                                                    <option value="Femenino">Femenino</option>
                                                    <option value="Otro">Otro</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-accent border-b border-secondary/20 pb-1 uppercase tracking-wider">Perfil Académico</h4>
                                         <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Tipo (Rango Académico)</label>
                                                <select name="rank" value={currentTeacher.rank} onChange={handleInputChange} className={inputClass}>
                                                    <option value="Instructor">Instructor</option>
                                                    <option value="Profesor Auxiliar">Profesor Auxiliar</option>
                                                    <option value="Profesor Titular">Profesor Titular</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Asignaturas a Cargo (Separadas por coma)</label>
                                                <input type="text" value={subjectsInput} onChange={handleSubjectsChange} placeholder="Ej: Anatomía, Radiología I" className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Universidad Pregrado</label>
                                                <input type="text" name="university_undergrad" value={currentTeacher.university_undergrad} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Universidad Postgrado</label>
                                                <input type="text" name="university_postgrad" value={currentTeacher.university_postgrad} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-accent border-b border-secondary/20 pb-1 uppercase tracking-wider">Contacto</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 md:col-span-1">
                                                <label className={labelClass}>Email Institucional (UA)</label>
                                                <input type="email" name="email_ua" value={currentTeacher.email_ua} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div className="col-span-2 md:col-span-1">
                                                <label className={labelClass}>Email Personal</label>
                                                <input type="email" name="email_personal" value={currentTeacher.email_personal} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Teléfono</label>
                                                <input type="tel" name="phone" value={currentTeacher.phone} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </main>

                        <footer className="p-5 border-t border-secondary/20 bg-surface/95 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setIsFormOpen(false)} className="px-5 py-2 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors">Cancelar</button>
                            <button type="submit" form="teacher-form" className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-all">Guardar Ficha</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeachersModule;
