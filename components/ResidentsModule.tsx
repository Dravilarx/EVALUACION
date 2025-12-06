
import React, { useState, useEffect, useRef } from 'react';
import { Student } from '../types';
import { StudentService } from '../services/dataService';
import { UsersIcon, PlusIcon, EditIcon, TrashIcon, DuplicateIcon, CloseIcon, ImageIcon, CheckCircleIcon } from './icons';

interface ResidentsModuleProps {
    currentUserId: string;
}

const emptyResident: Student = {
    id: '',
    name: '',
    email_ua: '',
    email_personal: '',
    phone: '',
    admission_date: new Date().toISOString().split('T')[0],
    level: 'R1',
    status: 'Activo',
    origin_university: '',
    nationality: 'Chilena',
    sex: 'Otro',
    photo_url: '',
    course: 'Radiología'
};

const ResidentsModule: React.FC<ResidentsModuleProps> = ({ currentUserId }) => {
    const [residents, setResidents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentResident, setCurrentResident] = useState<Student>(emptyResident);
    const [isEditing, setIsEditing] = useState(false);
    
    // Drag and Drop state
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isTeacher = currentUserId === 'DOCENTE';

    useEffect(() => {
        loadResidents();
    }, []);

    const loadResidents = async () => {
        setLoading(true);
        try {
            const data = await StudentService.getAll();
            setResidents(data);
        } catch (error) {
            console.error("Failed to load residents", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateLevel = (admissionDate: string): "R1" | "R2" | "R3" | "Egresado" => {
        if (!admissionDate) return "R1";
        const start = new Date(admissionDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const diffYears = diffDays / 365.25;

        if (diffYears < 1) return "R1";
        if (diffYears < 2) return "R2";
        if (diffYears < 3) return "R3";
        return "Egresado";
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
            setCurrentResident(prev => ({ ...prev, photo_url: base64 }));
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
        setCurrentResident(prev => {
            const updated = { ...prev, [name]: value };
            // Auto-calculate level if admission date changes
            if (name === 'admission_date') {
                updated.level = calculateLevel(value);
            }
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await StudentService.update(currentResident);
                setResidents(prev => prev.map(r => r.id === currentResident.id ? currentResident : r));
            } else {
                await StudentService.create(currentResident);
                setResidents(prev => [currentResident, ...prev]);
            }
            setIsFormOpen(false);
        } catch (error) {
            console.error("Error saving resident", error);
            alert("Error al guardar el residente");
        }
    };

    const handleEdit = (resident: Student) => {
        setCurrentResident(resident);
        setIsEditing(true);
        setIsFormOpen(true);
    };

    const handleDuplicate = (resident: Student) => {
        const copy = { 
            ...resident, 
            id: `${resident.id}-COPY`, 
            name: `${resident.name} (Copia)`,
            email_ua: '', 
            email_personal: '' 
        };
        setCurrentResident(copy);
        setIsEditing(false); // Mode create based on copy
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este perfil? Esta acción es irreversible.")) {
            try {
                await StudentService.delete(id);
                setResidents(prev => prev.filter(r => r.id !== id));
            } catch (error) {
                console.error("Error deleting resident", error);
            }
        }
    };

    const handleDownload = (resident: Student) => {
        // Mock download functionality
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resident, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", `perfil_${resident.name.replace(/\s+/g, '_')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleNew = () => {
        setCurrentResident(emptyResident);
        setIsEditing(false);
        setIsFormOpen(true);
    };

    const filteredResidents = residents.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inputClass = "w-full bg-background border border-secondary/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none";
    const labelClass = "block text-xs font-semibold text-text-secondary mb-1";

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                        <UsersIcon className="h-8 w-8 text-primary" /> Residentes
                    </h2>
                    <p className="text-text-secondary">Gestión de fichas académicas y personales</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o RUT..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-background border border-secondary/30 rounded-lg px-4 py-2 text-sm flex-grow md:w-64"
                    />
                    {isTeacher && (
                        <button 
                            onClick={handleNew}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
                        >
                            <PlusIcon className="h-5 w-5" /> <span className="hidden sm:inline">Nuevo Residente</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Residents Table */}
            <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/10 text-text-secondary uppercase text-xs font-bold border-b border-secondary/20">
                            <tr>
                                <th className="px-6 py-4">Residente</th>
                                <th className="px-6 py-4">Nivel / Estado</th>
                                <th className="px-6 py-4 hidden md:table-cell">Contacto</th>
                                <th className="px-6 py-4 hidden lg:table-cell">Ingreso</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/20">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-text-secondary">Cargando residentes...</td></tr>
                            ) : filteredResidents.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-text-secondary">No se encontraron residentes.</td></tr>
                            ) : (
                                filteredResidents.map(resident => (
                                    <tr key={resident.id} className="hover:bg-secondary/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-secondary/20 overflow-hidden flex-shrink-0 border border-secondary/30">
                                                    {resident.photo_url ? (
                                                        <img src={resident.photo_url} alt={resident.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <UsersIcon className="h-full w-full p-2 text-secondary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-text-primary">{resident.name}</div>
                                                    <div className="text-xs text-text-secondary">{resident.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex w-fit px-2 py-0.5 rounded text-xs font-bold ${
                                                    resident.level === 'R1' ? 'bg-blue-100 text-blue-700' :
                                                    resident.level === 'R2' ? 'bg-purple-100 text-purple-700' :
                                                    resident.level === 'R3' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {resident.level}
                                                </span>
                                                <span className={`text-xs ${resident.status === 'Activo' ? 'text-success' : 'text-danger'}`}>
                                                    ● {resident.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="text-text-secondary">
                                                <div>{resident.email_ua}</div>
                                                <div className="text-xs opacity-75">{resident.phone}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell text-text-secondary">
                                            {new Date(resident.admission_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleDownload(resident)} className="p-1.5 hover:bg-secondary/20 rounded text-text-secondary" title="Descargar Ficha">
                                                    <CheckCircleIcon className="h-4 w-4" /> {/* Using CheckCircle as Download placeholder */}
                                                </button>
                                                {isTeacher && (
                                                    <>
                                                        <button onClick={() => handleDuplicate(resident)} className="p-1.5 hover:bg-secondary/20 rounded text-text-secondary" title="Duplicar">
                                                            <DuplicateIcon className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleEdit(resident)} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded text-text-secondary" title="Editar">
                                                            <EditIcon className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(resident.id)} className="p-1.5 hover:bg-danger/20 hover:text-danger rounded text-text-secondary" title="Eliminar">
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
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
                                {isEditing ? `Editar: ${currentResident.name}` : 'Nuevo Residente'}
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
                                        {currentResident.photo_url ? (
                                            <img src={currentResident.photo_url} alt="Profile" className="w-full h-full object-cover" />
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
                                    <h4 className="text-sm font-bold text-accent border-b border-secondary/20 pb-1">Datos Académicos</h4>
                                    <div>
                                        <label className={labelClass}>Fecha de Ingreso</label>
                                        <input type="date" name="admission_date" value={currentResident.admission_date} onChange={handleInputChange} className={inputClass} required />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Nivel (Calculado)</label>
                                        <input type="text" value={currentResident.level} disabled className={`${inputClass} bg-secondary/10 cursor-not-allowed font-bold`} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Estado</label>
                                        <select name="status" value={currentResident.status} onChange={handleInputChange} className={inputClass}>
                                            <option value="Activo">Activo</option>
                                            <option value="Suspendido">Suspendido</option>
                                            <option value="Egresado">Egresado</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Detailed Form */}
                            <div className="md:col-span-2 space-y-6">
                                <form id="resident-form" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-accent border-b border-secondary/20 pb-1 uppercase tracking-wider">Información Personal</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Nombre Completo</label>
                                                <input type="text" name="name" value={currentResident.name} onChange={handleInputChange} className={inputClass} required />
                                            </div>
                                            <div>
                                                <label className={labelClass}>RUT / ID</label>
                                                <input type="text" name="id" value={currentResident.id} onChange={handleInputChange} className={inputClass} required disabled={isEditing} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Nacionalidad</label>
                                                <input type="text" name="nationality" value={currentResident.nationality} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Sexo</label>
                                                <select name="sex" value={currentResident.sex} onChange={handleInputChange} className={inputClass}>
                                                    <option value="Masculino">Masculino</option>
                                                    <option value="Femenino">Femenino</option>
                                                    <option value="Otro">Otro</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-accent border-b border-secondary/20 pb-1 uppercase tracking-wider">Contacto</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 md:col-span-1">
                                                <label className={labelClass}>Email Institucional (UA)</label>
                                                <input type="email" name="email_ua" value={currentResident.email_ua} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div className="col-span-2 md:col-span-1">
                                                <label className={labelClass}>Email Personal</label>
                                                <input type="email" name="email_personal" value={currentResident.email_personal} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Teléfono</label>
                                                <input type="tel" name="phone" value={currentResident.phone} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-accent border-b border-secondary/20 pb-1 uppercase tracking-wider">Antecedentes</h4>
                                        <div>
                                            <label className={labelClass}>Universidad de Origen (Pregrado)</label>
                                            <input type="text" name="origin_university" value={currentResident.origin_university} onChange={handleInputChange} className={inputClass} />
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </main>

                        <footer className="p-5 border-t border-secondary/20 bg-surface/95 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setIsFormOpen(false)} className="px-5 py-2 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors">Cancelar</button>
                            <button type="submit" form="resident-form" className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-all">Guardar Ficha</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResidentsModule;
