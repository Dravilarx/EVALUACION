
import React, { useState, useEffect, useRef } from 'react';
import { AppDocument, Student, Teacher } from '../types';
import { DocumentService, StudentService, TeacherService } from '../services/dataService';
import { DocumentTextIcon, UsersIcon, BriefcaseIcon, AcademicIcon, PlusIcon, CloudUploadIcon, FilterIcon, TrashIcon, DownloadIcon, EyeIcon, EyeOffIcon, CloseIcon } from './icons';

interface DocumentsModuleProps {
    // Props if needed
}

const DocumentsModule: React.FC<DocumentsModuleProps> = () => {
    const [activeTab, setActiveTab] = useState<'program' | 'residents' | 'teachers'>('program');
    const [documents, setDocuments] = useState<AppDocument[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedOwnerId, setSelectedOwnerId] = useState(''); // For resident/teacher tabs

    // Upload Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [newDocTitle, setNewDocTitle] = useState('');
    const [newDocCategory, setNewDocCategory] = useState('Académico');
    const [newDocVisibility, setNewDocVisibility] = useState('public');
    const [newDocOwnerId, setNewDocOwnerId] = useState(''); // For assigning to specific user
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [docs, st, te] = await Promise.all([
                DocumentService.getAll(),
                StudentService.getAll(),
                TeacherService.getAll()
            ]);
            setDocuments(docs);
            setStudents(st);
            setTeachers(te);
        } catch (error) {
            console.error("Error loading documents data", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDocuments = documents.filter(doc => {
        let matchesTab = false;
        if (activeTab === 'program') matchesTab = doc.ownerType === 'Program';
        if (activeTab === 'residents') matchesTab = doc.ownerType === 'Student';
        if (activeTab === 'teachers') matchesTab = doc.ownerType === 'Teacher';

        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? doc.category === selectedCategory : true;
        const matchesOwner = selectedOwnerId ? doc.ownerId === selectedOwnerId : true;

        return matchesTab && matchesSearch && matchesCategory && matchesOwner;
    });

    // Upload Handlers
    const handleFileSelect = (files: FileList | null) => {
        if (files && files.length > 0) {
            setUploadFile(files[0]);
            if (!newDocTitle) {
                setNewDocTitle(files[0].name.split('.')[0]); // Auto-fill title
            }
        }
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>, dragging: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(dragging);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        handleDrag(e, false);
        handleFileSelect(e.dataTransfer.files);
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !newDocTitle) return;

        // Determine owner type based on current tab or selection
        let ownerType: 'Program' | 'Student' | 'Teacher' = 'Program';
        let ownerId = undefined;

        if (activeTab === 'residents') {
            ownerType = 'Student';
            ownerId = newDocOwnerId || selectedOwnerId; // Use form selection or filter selection
            if (!ownerId) {
                alert("Debe seleccionar un residente.");
                return;
            }
        } else if (activeTab === 'teachers') {
            ownerType = 'Teacher';
            ownerId = newDocOwnerId || selectedOwnerId;
            if (!ownerId) {
                alert("Debe seleccionar un docente.");
                return;
            }
        }

        const newDoc: AppDocument = {
            id: `DOC-${Date.now()}`,
            title: newDocTitle,
            type: uploadFile.name.split('.').pop()?.toUpperCase() || 'FILE',
            category: newDocCategory as any,
            uploadDate: new Date().toISOString(),
            ownerType,
            ownerId,
            visibility: activeTab === 'program' ? newDocVisibility as any : 'teachers_only', // Default visibility for personal docs
            url: URL.createObjectURL(uploadFile) // Mock URL
        };

        try {
            await DocumentService.create(newDoc);
            setDocuments(prev => [newDoc, ...prev]);
            closeUploadModal();
        } catch (error) {
            console.error("Upload failed", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este documento?")) {
            await DocumentService.delete(id);
            setDocuments(prev => prev.filter(d => d.id !== id));
        }
    };

    const openUploadModal = () => {
        setUploadFile(null);
        setNewDocTitle('');
        setNewDocOwnerId(selectedOwnerId); // Pre-fill if filter is active
        setIsUploadModalOpen(true);
    };

    const closeUploadModal = () => {
        setIsUploadModalOpen(false);
    };

    const getOwnerName = (doc: AppDocument) => {
        if (doc.ownerType === 'Program') return 'Programa';
        if (doc.ownerType === 'Student') return students.find(s => s.id === doc.ownerId)?.name || doc.ownerId;
        if (doc.ownerType === 'Teacher') return teachers.find(t => t.id === doc.ownerId)?.name || doc.ownerId;
        return 'Desconocido';
    };

    const getVisibilityIcon = (v: string) => {
        switch(v) {
            case 'public': return <span className="flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-0.5 rounded"><EyeIcon className="h-3 w-3"/> Público</span>;
            case 'residents_only': return <span className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded"><UsersIcon className="h-3 w-3"/> Residentes</span>;
            case 'teachers_only': return <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded"><BriefcaseIcon className="h-3 w-3"/> Docentes</span>;
            case 'private': return <span className="flex items-center gap-1 text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded"><EyeOffIcon className="h-3 w-3"/> Privado</span>;
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in-up">
            
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                        <DocumentTextIcon className="h-8 w-8 text-primary" /> Repositorio de Documentos
                    </h2>
                    <p className="text-text-secondary">Gestión centralizada de archivos del programa.</p>
                </div>
                
                <div className="flex bg-surface p-1 rounded-lg border border-secondary/20">
                    <button 
                        onClick={() => { setActiveTab('program'); setSelectedOwnerId(''); }}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'program' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-secondary/10'}`}
                    >
                        <AcademicIcon className="h-4 w-4" /> Programa
                    </button>
                    <button 
                        onClick={() => { setActiveTab('residents'); setSelectedOwnerId(''); }}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'residents' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-secondary/10'}`}
                    >
                        <UsersIcon className="h-4 w-4" /> Residentes
                    </button>
                    <button 
                        onClick={() => { setActiveTab('teachers'); setSelectedOwnerId(''); }}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'teachers' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-secondary/10'}`}
                    >
                        <BriefcaseIcon className="h-4 w-4" /> Docentes
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-surface p-4 rounded-xl shadow-sm border border-secondary/20 flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-grow flex gap-3">
                    <div className="relative flex-grow md:max-w-xs">
                        <input 
                            type="text" 
                            placeholder="Buscar documentos..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background border border-secondary/30 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                        <FilterIcon className="absolute left-3 top-2.5 h-4 w-4 text-secondary" />
                    </div>
                    
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-background border border-secondary/30 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">Todas las Categorías</option>
                        <option value="Académico">Académico</option>
                        <option value="Administrativo">Administrativo</option>
                        <option value="Legal">Legal</option>
                        <option value="Médico">Médico</option>
                    </select>

                    {/* Owner Filter for Residents/Teachers Tabs */}
                    {activeTab === 'residents' && (
                        <select 
                            value={selectedOwnerId} 
                            onChange={(e) => setSelectedOwnerId(e.target.value)}
                            className="bg-background border border-secondary/30 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary md:w-64"
                        >
                            <option value="">Todos los Residentes</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}
                    {activeTab === 'teachers' && (
                        <select 
                            value={selectedOwnerId} 
                            onChange={(e) => setSelectedOwnerId(e.target.value)}
                            className="bg-background border border-secondary/30 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary md:w-64"
                        >
                            <option value="">Todos los Docentes</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    )}
                </div>

                <button 
                    onClick={openUploadModal}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
                >
                    <CloudUploadIcon className="h-5 w-5" /> Subir Documento
                </button>
            </div>

            {/* Document Grid */}
            <div className="flex-grow overflow-y-auto">
                {loading ? (
                    <div className="text-center p-8 text-text-secondary">Cargando documentos...</div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="text-center p-12 border-2 border-dashed border-secondary/20 rounded-xl">
                        <DocumentTextIcon className="h-16 w-16 text-secondary/30 mx-auto mb-4" />
                        <p className="text-lg font-medium text-text-secondary">No se encontraron documentos.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDocuments.map(doc => (
                            <div key={doc.id} className="bg-surface rounded-xl border border-secondary/20 shadow-sm hover:shadow-md transition-all group flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
                                
                                <div className="p-5 flex-grow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="p-3 bg-secondary/10 rounded-lg text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            <DocumentTextIcon className="h-8 w-8" />
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] font-bold bg-background border border-secondary/20 px-2 py-0.5 rounded uppercase tracking-wider text-text-secondary">
                                                {doc.type}
                                            </span>
                                            {activeTab === 'program' && getVisibilityIcon(doc.visibility)}
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-bold text-text-primary mb-1 line-clamp-2" title={doc.title}>{doc.title}</h3>
                                    
                                    <div className="text-xs text-text-secondary mt-2 space-y-1">
                                        <p><span className="font-semibold">Categoría:</span> {doc.category}</p>
                                        <p><span className="font-semibold">Fecha:</span> {new Date(doc.uploadDate).toLocaleDateString()}</p>
                                        {activeTab !== 'program' && (
                                            <p className="truncate"><span className="font-semibold">Propietario:</span> {getOwnerName(doc)}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-background/50 border-t border-secondary/10 p-3 flex justify-between items-center">
                                    <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                                        <DownloadIcon className="h-4 w-4" /> Descargar
                                    </button>
                                    <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-secondary hover:text-danger hover:bg-danger/10 rounded transition-colors" title="Eliminar">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-xl shadow-2xl w-full max-w-lg border border-secondary/20 flex flex-col">
                        <header className="p-5 border-b border-secondary/20 flex justify-between items-center bg-secondary/5 rounded-t-xl">
                            <h3 className="text-xl font-bold text-text-primary">Subir Documento</h3>
                            <button onClick={closeUploadModal} className="p-2 rounded-full hover:bg-secondary/20"><CloseIcon /></button>
                        </header>
                        
                        <form onSubmit={handleUploadSubmit} className="p-6 space-y-5">
                            {/* File Drop Zone */}
                            <div 
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-secondary/30 hover:border-primary/50'}`}
                                onDragEnter={(e) => handleDrag(e, true)}
                                onDragLeave={(e) => handleDrag(e, false)}
                                onDragOver={(e) => handleDrag(e, true)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <CloudUploadIcon className={`h-12 w-12 mb-3 ${isDragging ? 'text-primary' : 'text-secondary'}`} />
                                {uploadFile ? (
                                    <div className="text-center">
                                        <p className="font-bold text-primary">{uploadFile.name}</p>
                                        <p className="text-xs text-text-secondary">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="font-medium text-text-primary">Arrastra tu archivo aquí</p>
                                        <p className="text-sm text-text-secondary">o haz clic para seleccionar</p>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                            </div>

                            {/* Metadata Fields */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Título del Documento</label>
                                <input 
                                    type="text" 
                                    value={newDocTitle}
                                    onChange={(e) => setNewDocTitle(e.target.value)}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                                    placeholder="Ej: Reglamento Interno 2024"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Categoría</label>
                                    <select 
                                        value={newDocCategory}
                                        onChange={(e) => setNewDocCategory(e.target.value)}
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                                    >
                                        <option value="Académico">Académico</option>
                                        <option value="Administrativo">Administrativo</option>
                                        <option value="Legal">Legal</option>
                                        <option value="Médico">Médico</option>
                                    </select>
                                </div>
                                {activeTab === 'program' && (
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Visibilidad</label>
                                        <select 
                                            value={newDocVisibility}
                                            onChange={(e) => setNewDocVisibility(e.target.value)}
                                            className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                                        >
                                            <option value="public">Todos (Público)</option>
                                            <option value="residents_only">Solo Residentes</option>
                                            <option value="teachers_only">Solo Docentes</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Owner Selection for Admin Uploads */}
                            {activeTab !== 'program' && (
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase">
                                        Asignar a {activeTab === 'residents' ? 'Residente' : 'Docente'}
                                    </label>
                                    <select 
                                        value={newDocOwnerId}
                                        onChange={(e) => setNewDocOwnerId(e.target.value)}
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                                        required
                                    >
                                        <option value="">Seleccione...</option>
                                        {activeTab === 'residents' 
                                            ? students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                            : teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                                        }
                                    </select>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3 border-t border-secondary/10">
                                <button type="button" onClick={closeUploadModal} className="px-5 py-2.5 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors font-bold text-text-secondary text-sm">Cancelar</button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-all text-sm flex items-center gap-2">
                                    <CloudUploadIcon className="h-4 w-4"/> Guardar Documento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentsModule;
