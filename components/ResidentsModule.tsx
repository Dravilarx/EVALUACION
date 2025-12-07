
import React, { useState, useEffect, useRef } from 'react';
import { Student, AppDocument } from '../types';
import { StudentService, LogService, DocumentService } from '../services/dataService';
import { UsersIcon, PlusIcon, EditIcon, TrashIcon, DuplicateIcon, CloseIcon, ImageIcon, CheckCircleIcon, FilterIcon, DownloadIcon, DocumentTextIcon, ShieldExclamationIcon, FileIcon, CloudUploadIcon } from './icons';
import { exportToCSV } from '../utils';

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
    graduation_date: '',
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
    
    // Document Management State
    const [activeModalTab, setActiveModalTab] = useState<'info' | 'docs'>('info');
    const [residentDocuments, setResidentDocuments] = useState<AppDocument[]>([]);
    const docInputRef = useRef<HTMLInputElement>(null);

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        level: '',
        status: ''
    });
    
    // Drag and Drop state
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Permission Logic
    const isAdmin = currentUserId === '10611061'; // Marcelo's ID
    const isTeacher = currentUserId === 'DOCENTE' || isAdmin;
    const canEdit = isTeacher; // Teachers and Admin can edit
    const canDelete = isAdmin; // Only Admin can delete

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

    const loadDocuments = async (studentId: string) => {
        if (!studentId) return;
        const docs = await DocumentService.getByOwner(studentId);
        setResidentDocuments(docs);
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
            if (name === 'admission_date') {
                updated.level = calculateLevel(value);
            }
            return updated;
        });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit) return;

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

    // --- DOCUMENT HANDLERS ---
    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (!currentResident.id) {
            alert("Debe ingresar un RUT/ID válido para subir documentos.");
            return;
        }

        const file = e.target.files[0];
        const newDoc: AppDocument = {
            id: `DOC-${Date.now()}`,
            title: file.name,
            type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
            category: 'Administrativo', 
            uploadDate: new Date().toISOString(),
            ownerType: 'Student',
            ownerId: currentResident.id,
            visibility: 'teachers_only',
            url: URL.createObjectURL(file)
        };

        await DocumentService.create(newDoc);
        setResidentDocuments(prev => [newDoc, ...prev]);
    };

    const handleDeleteDocument = async (id: string) => {
        if(confirm("¿Eliminar documento?")) {
            await DocumentService.delete(id);
            setResidentDocuments(prev => prev.filter(d => d.id !== id));
        }
    };

    const handleEdit = (resident: Student) => {
        if (!canEdit) return;
        setCurrentResident(resident);
        setIsEditing(true);
        setActiveModalTab('info');
        loadDocuments(resident.id);
        setIsFormOpen(true);
    };

    const handleDuplicate = (resident: Student) => {
        if (!canEdit) return;
        const copy = { 
            ...resident, 
            id: `${resident.id}-COPY`, 
            name: `${resident.name} (Copia)`,
            email_ua: '', 
            email_personal: '' 
        };
        setCurrentResident(copy);
        setResidentDocuments([]); 
        setIsEditing(false); 
        setActiveModalTab('info');
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (canDelete) {
            if (confirm("¿Estás seguro de eliminar este perfil? Esta acción es irreversible.")) {
                try {
                    await StudentService.delete(id);
                    setResidents(prev => prev.filter(r => r.id !== id));
                } catch (error) {
                    console.error("Error deleting resident", error);
                }
            }
        } else if (isTeacher) {
            alert("Solicitud de eliminación enviada al administrador.");
        }
    };

    const handleDownload = (resident: Student) => {
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
        setResidentDocuments([]);
        setIsEditing(false);
        setActiveModalTab('info');
        setIsFormOpen(true);
    };

    const handleExport = () => {
        const dataToExport = filteredResidents.map(r => ({
            Nombre: r.name,
            RUT: r.id,
            Nivel: r.level,
            Estado: r.status,
            Email: r.email_ua,
            Ingreso: r.admission_date,
            Universidad: r.origin_university
        }));
        exportToCSV(dataToExport, `Residentes_${new Date().toISOString().split('T')[0]}`);
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredResidents = residents.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              r.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = filters.level ? r.level === filters.level : true;
        const matchesStatus = filters.status ? r.status === filters.status : true;
        return matchesSearch && matchesLevel && matchesStatus;
    });

    const getRiskLevel = (id: string) => {
        const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        if (sum % 5 === 0) return 'high';
        if (sum % 3 === 0) return 'medium';
        return 'low';
    };

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
                <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o RUT..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-background border border-secondary/30 rounded-lg px-4 py-2 text-sm flex-grow md:w-64 print:hidden"
                    />
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary bg-surface border border-secondary/30 rounded-lg hover:bg-secondary/10 transition-colors print:hidden" title="Descargar CSV/Excel">
                        <DocumentTextIcon className="h-4 w-4" />
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary bg-surface border border-secondary/30 rounded-lg hover:bg-secondary/10 transition-colors print:hidden" title="Imprimir PDF">
                        <DownloadIcon className="h-4 w-4" />
                    </button>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-3 py-2 rounded-lg border transition-colors print:hidden ${showFilters ? 'bg-secondary text-white border-secondary' : 'bg-background border-secondary/30 text-text-secondary hover:border-primary'}`}
                        title="Filtros Avanzados"
                    >
                        <FilterIcon className="h-5 w-5" />
                    </button>
                    {/* ONLY TEACHER OR ADMIN CAN CREATE */}
                    {canEdit && (
                        <button 
                            onClick={handleNew}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20 print:hidden"
                        >
                            <PlusIcon className="h-5 w-5" /> <span className="hidden sm:inline">Nuevo Residente</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible Filters */}
            {showFilters && (
                <div className="bg-surface p-4 rounded-xl border border-secondary/20 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-down print:hidden">
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Nivel</label>
                        <select name="level" value={filters.level} onChange={handleFilterChange} className={inputClass}>
                            <option value="">Todos</option>
                            <option value="R1">R1</option>
                            <option value="R2">R2</option>
                            <option value="R3">R3</option>
                            <option value="Egresado">Egresado</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Estado</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className={inputClass}>
                            <option value="">Todos</option>
                            <option value="Activo">Activo</option>
                            <option value="Suspendido">Suspendido</option>
                            <option value="Egresado">Egresado</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Residents Table */}
            <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/10 text-text-secondary uppercase text-xs font-bold border-b border-secondary/20">
                            <tr>
                                <th className="px-6 py-4">Residente</th>
                                <th className="px-6 py-4">Nivel / Estado</th>
                                <th className="px-6 py-4 hidden md:table-cell">Contacto</th>
                                <th className="px-6 py-4 text-center">Riesgo (Est.)</th>
                                <th className="px-6 py-4 text-center print:hidden">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/20">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-text-secondary">Cargando residentes...</td></tr>
                            ) : filteredResidents.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-text-secondary">No se encontraron residentes.</td></tr>
                            ) : (
                                filteredResidents.map(resident => {
                                    const risk = getRiskLevel(resident.id);
                                    return (
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
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center">
                                                    <span className={`w-3 h-3 rounded-full ${
                                                        risk === 'high' ? 'bg-danger animate-pulse' : 
                                                        risk === 'medium' ? 'bg-warning' : 'bg-success'
                                                    }`} title={risk === 'high' ? 'Alto Riesgo' : risk === 'medium' ? 'Riesgo Medio' : 'Bajo Riesgo'}></span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 print:hidden">
                                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); handleDownload(resident); }} className="p-1.5 hover:bg-secondary/20 rounded text-text-secondary" title="Descargar Ficha">
                                                        <CheckCircleIcon className="h-4 w-4" />
                                                    </button>
                                                    {canEdit && (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDuplicate(resident); }} className="p-1.5 hover:bg-secondary/20 rounded text-text-secondary" title="Duplicar">
                                                                <DuplicateIcon className="h-4 w-4" />
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(resident); }} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded text-text-secondary" title="Editar">
                                                                <EditIcon className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {isTeacher && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(resident.id, resident.name); }} 
                                                            className={`p-1.5 rounded text-text-secondary ${canDelete ? 'hover:bg-danger/20 hover:text-danger' : 'hover:bg-warning/20 hover:text-warning'}`}
                                                            title={canDelete ? "Eliminar" : "Solicitar Eliminación"}
                                                        >
                                                            {canDelete ? <TrashIcon className="h-4 w-4" /> : <ShieldExclamationIcon className="h-4 w-4" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
                    <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-secondary/20">
                        <header className="p-5 border-b border-secondary/20 flex justify-between items-center bg-surface/95 rounded-t-xl">
                            <h3 className="text-xl font-bold text-text-primary">
                                {isEditing ? `Editar: ${currentResident.name}` : 'Nuevo Residente'}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-secondary/20"><CloseIcon /></button>
                        </header>
                        
                        {/* Tab Switcher inside Modal */}
                        <div className="px-6 pt-4 border-b border-secondary/10 flex gap-4">
                            <button 
                                onClick={() => setActiveModalTab('info')}
                                className={`pb-2 px-2 text-sm font-bold border-b-2 transition-colors ${activeModalTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                            >
                                Información Personal
                            </button>
                            <button 
                                onClick={() => setActiveModalTab('docs')}
                                className={`pb-2 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeModalTab === 'docs' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                            >
                                Documentos <span className="bg-secondary/20 px-1.5 rounded-full text-[10px] text-text-primary">{residentDocuments.length}</span>
                            </button>
                        </div>

                        <main className="p-6 overflow-y-auto">
                            {activeModalTab === 'info' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                                            <div>
                                                <label className={labelClass}>Fecha de Egreso (Estimada)</label>
                                                <input type="date" name="graduation_date" value={currentResident.graduation_date || ''} onChange={handleInputChange} className={inputClass} />
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
                                </div>
                            )}

                            {activeModalTab === 'docs' && (
                                <div className="space-y-6">
                                    <div className="bg-background/50 border border-secondary/20 p-4 rounded-lg flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-text-primary">Subir Nuevo Documento</h4>
                                            <p className="text-xs text-text-secondary">Archivos se guardarán en el repositorio central bajo este residente.</p>
                                            {!currentResident.id && <p className="text-xs text-danger font-bold mt-1">Requiere RUT/ID para subir</p>}
                                        </div>
                                        <label className={`bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold cursor-pointer transition-colors flex items-center gap-2 ${!currentResident.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <CloudUploadIcon className="h-5 w-5" />
                                            <span>Seleccionar Archivo</span>
                                            <input type="file" className="hidden" ref={docInputRef} onChange={handleDocumentUpload} disabled={!currentResident.id} />
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        {residentDocuments.length === 0 ? (
                                            <div className="text-center p-8 border-2 border-dashed border-secondary/20 rounded-xl text-text-secondary">
                                                No hay documentos asociados a este residente.
                                            </div>
                                        ) : (
                                            residentDocuments.map(doc => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-surface border border-secondary/20 rounded-lg hover:border-primary/30 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-red-100 rounded text-red-600">
                                                            <DocumentTextIcon className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-text-primary">{doc.title}</p>
                                                            <p className="text-xs text-text-secondary">{doc.category} • {new Date(doc.uploadDate).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <a href={doc.url} download className="p-2 hover:bg-secondary/10 rounded text-primary" title="Descargar"><DownloadIcon className="h-4 w-4" /></a>
                                                        <button onClick={() => handleDeleteDocument(doc.id)} className="p-2 hover:bg-danger/10 rounded text-danger" title="Eliminar"><TrashIcon className="h-4 w-4" /></button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </main>

                        <footer className="p-5 border-t border-secondary/20 bg-surface/95 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setIsFormOpen(false)} className="px-5 py-2 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors">Cancelar</button>
                            {/* Only save if user has edit permission */}
                            {canEdit && activeModalTab === 'info' && <button type="submit" form="resident-form" className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-all">Guardar Ficha</button>}
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResidentsModule;
