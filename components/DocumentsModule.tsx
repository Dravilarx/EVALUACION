
import React, { useState, useEffect, useRef } from 'react';
import { AppDocument, Student, Teacher } from '../types';
import { DocumentService, StudentService, TeacherService } from '../services/dataService';
import { parseDocumentContent } from '../services/geminiService';
import { 
    DocumentTextIcon, UsersIcon, BriefcaseIcon, AcademicIcon, 
    PlusIcon, CloudUploadIcon, FilterIcon, TrashIcon, DownloadIcon, 
    EyeIcon, EyeOffIcon, CloseIcon, SparklesIcon, TypeIcon, 
    ScreenIcon, BoldIcon, ListBulletIcon, LibraryIcon, FolderIcon 
} from './icons';

interface DocumentsModuleProps {
    // Props if needed
}

type MainSection = 'official' | 'annexes';
type AnnexTab = 'residents' | 'teachers';

const DocumentsModule: React.FC<DocumentsModuleProps> = () => {
    // Main Section Toggle: Official vs Annexes
    const [activeSection, setActiveSection] = useState<MainSection>('official');
    
    // Sub-tab for Annexes
    const [annexTab, setAnnexTab] = useState<AnnexTab>('residents');

    const [documents, setDocuments] = useState<AppDocument[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedOwnerId, setSelectedOwnerId] = useState(''); // For resident/teacher filters

    // Upload Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [newDocTitle, setNewDocTitle] = useState('');
    const [newDocCategory, setNewDocCategory] = useState('Académico');
    const [newDocVisibility, setNewDocVisibility] = useState('public');
    const [newDocOwnerId, setNewDocOwnerId] = useState('');
    const [textContentInput, setTextContentInput] = useState(''); 
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // View Content Modal
    const [viewContentDoc, setViewContentDoc] = useState<AppDocument | null>(null);
    const [isViewFullscreen, setIsViewFullscreen] = useState(false);

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
        let matchesSection = false;

        if (activeSection === 'official') {
            // Official Section: Only Program documents
            matchesSection = doc.ownerType === 'Program';
        } else {
            // Annexes Section: Based on sub-tab
            if (annexTab === 'residents') {
                matchesSection = doc.ownerType === 'Student';
            } else if (annexTab === 'teachers') {
                matchesSection = doc.ownerType === 'Teacher';
            }
        }

        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? doc.category === selectedCategory : true;
        const matchesOwner = selectedOwnerId ? doc.ownerId === selectedOwnerId : true;

        return matchesSection && matchesSearch && matchesCategory && matchesOwner;
    });

    // --- Upload Handlers ---

    const handleFileSelect = async (files: FileList | null) => {
        if (files && files.length > 0) {
            const file = files[0];
            setUploadFile(file);
            if (!newDocTitle) {
                setNewDocTitle(file.name.split('.')[0]);
            }
            
            // Auto-trigger analysis
            setIsAnalyzing(true);
            try {
                const extractedText = await parseDocumentContent(file);
                setTextContentInput(extractedText);
            } catch (error) {
                console.error("AI analysis failed", error);
                setTextContentInput("Error en el análisis automático. Puede ingresar el texto manualmente.");
            } finally {
                setIsAnalyzing(false);
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

    const insertTextAtCursor = (textToInsert: string) => {
        if (textAreaRef.current) {
            const start = textAreaRef.current.selectionStart;
            const end = textAreaRef.current.selectionEnd;
            const text = textContentInput;
            const before = text.substring(0, start);
            const after = text.substring(end, text.length);
            setTextContentInput(before + textToInsert + after);
            
            setTimeout(() => {
                textAreaRef.current?.focus();
                textAreaRef.current?.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
            }, 0);
        }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDocTitle) {
            alert("El título es obligatorio.");
            return;
        }
        
        if (uploadMode === 'file' && !uploadFile && !textContentInput) {
             alert("Debe seleccionar un archivo o ingresar contenido.");
             return;
        }

        // Determine owner based on current View Context
        let ownerType: 'Program' | 'Student' | 'Teacher' = 'Program';
        let ownerId = undefined;

        if (activeSection === 'official') {
            ownerType = 'Program';
        } else {
            // Annexes Section
            if (annexTab === 'residents') {
                ownerType = 'Student';
                ownerId = newDocOwnerId || selectedOwnerId;
                if (!ownerId) {
                    alert("Debe seleccionar un residente para asignar el anexo.");
                    return;
                }
            } else if (annexTab === 'teachers') {
                ownerType = 'Teacher';
                ownerId = newDocOwnerId || selectedOwnerId;
                if (!ownerId) {
                    alert("Debe seleccionar un docente para asignar el anexo.");
                    return;
                }
            }
        }

        const newDoc: AppDocument = {
            id: `DOC-${Date.now()}`,
            title: newDocTitle,
            type: uploadMode === 'file' ? (uploadFile?.name.split('.').pop()?.toUpperCase() || 'FILE') : 'TEXT',
            category: newDocCategory as any,
            uploadDate: new Date().toISOString(),
            ownerType,
            ownerId,
            visibility: activeSection === 'official' ? newDocVisibility as any : 'teachers_only', // Default visibility for annexes
            url: uploadFile ? URL.createObjectURL(uploadFile) : '#', 
            textContent: textContentInput 
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
        setNewDocOwnerId(selectedOwnerId);
        setTextContentInput('');
        setUploadMode('file');
        setIsUploadModalOpen(true);
    };

    const closeUploadModal = () => {
        setIsUploadModalOpen(false);
        setIsAnalyzing(false);
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
            
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                    <DocumentTextIcon className="h-8 w-8 text-primary" /> Repositorio de Documentos
                </h2>
                <p className="text-text-secondary">Gestión centralizada con análisis de IA integrado.</p>
            </div>

            {/* Main Section Toggles */}
            <div className="flex gap-6 border-b border-secondary/20 mb-6">
                <button 
                    onClick={() => { setActiveSection('official'); setSelectedOwnerId(''); }}
                    className={`pb-3 px-4 text-lg font-bold border-b-4 transition-all flex items-center gap-2 ${activeSection === 'official' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary opacity-60 hover:opacity-100'}`}
                >
                    <LibraryIcon className="h-6 w-6" /> Documentación Oficial
                </button>
                <button 
                    onClick={() => { setActiveSection('annexes'); setSelectedOwnerId(''); }}
                    className={`pb-3 px-4 text-lg font-bold border-b-4 transition-all flex items-center gap-2 ${activeSection === 'annexes' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-text-secondary hover:text-text-primary opacity-60 hover:opacity-100'}`}
                >
                    <FolderIcon className="h-6 w-6" /> Anexos y Expedientes
                </button>
            </div>

            {/* Toolbar & Sub-navigation */}
            <div className="bg-surface p-4 rounded-xl shadow-sm border border-secondary/20 flex flex-col md:flex-row gap-4 mb-6">
                
                {/* Left Side: Sub-tabs or Context Info */}
                <div className="flex items-center gap-4 border-r border-secondary/20 pr-4">
                    {activeSection === 'official' ? (
                        <div className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                            <AcademicIcon className="h-4 w-4" /> Marco Institucional
                        </div>
                    ) : (
                        <div className="flex bg-secondary/10 p-1 rounded-lg">
                            <button 
                                onClick={() => { setAnnexTab('residents'); setSelectedOwnerId(''); }}
                                className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${annexTab === 'residents' ? 'bg-surface shadow text-emerald-600' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                <UsersIcon className="h-4 w-4" /> Residentes
                            </button>
                            <button 
                                onClick={() => { setAnnexTab('teachers'); setSelectedOwnerId(''); }}
                                className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${annexTab === 'teachers' ? 'bg-surface shadow text-emerald-600' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                <BriefcaseIcon className="h-4 w-4" /> Docentes
                            </button>
                        </div>
                    )}
                </div>

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

                    {/* Owner Filter for Annexes */}
                    {activeSection === 'annexes' && annexTab === 'residents' && (
                        <select 
                            value={selectedOwnerId} 
                            onChange={(e) => setSelectedOwnerId(e.target.value)}
                            className="bg-background border border-secondary/30 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary md:w-64"
                        >
                            <option value="">Todos los Residentes</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}
                    {activeSection === 'annexes' && annexTab === 'teachers' && (
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
                    className={`text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 ${activeSection === 'official' ? 'bg-primary hover:bg-primary-dark' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                    <CloudUploadIcon className="h-5 w-5" /> 
                    {activeSection === 'official' ? 'Subir Oficial' : 'Subir Anexo'}
                </button>
            </div>

            {/* Document Grid */}
            <div className="flex-grow overflow-y-auto">
                {loading ? (
                    <div className="text-center p-8 text-text-secondary">Cargando documentos...</div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="text-center p-12 border-2 border-dashed border-secondary/20 rounded-xl bg-background/50">
                        {activeSection === 'official' ? (
                            <LibraryIcon className="h-16 w-16 text-secondary/30 mx-auto mb-4" />
                        ) : (
                            <FolderIcon className="h-16 w-16 text-secondary/30 mx-auto mb-4" />
                        )}
                        <p className="text-lg font-medium text-text-secondary">
                            {activeSection === 'official' 
                                ? "No hay documentación oficial disponible." 
                                : "No se encontraron expedientes o anexos."}
                        </p>
                        <p className="text-xs text-text-secondary mt-2">Intente ajustar los filtros.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDocuments.map(doc => (
                            <div key={doc.id} className={`bg-surface rounded-xl border shadow-sm hover:shadow-md transition-all group flex flex-col relative overflow-hidden ${activeSection === 'official' ? 'border-secondary/20' : 'border-emerald-100 hover:border-emerald-300'}`}>
                                <div className={`absolute top-0 left-0 w-full h-1 ${activeSection === 'official' ? 'bg-gradient-to-r from-primary to-accent' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}></div>
                                
                                <div className="p-5 flex-grow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-3 rounded-lg transition-colors ${activeSection === 'official' ? 'bg-primary/5 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {activeSection === 'official' ? <LibraryIcon className="h-8 w-8" /> : <FolderIcon className="h-8 w-8" />}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] font-bold bg-background border border-secondary/20 px-2 py-0.5 rounded uppercase tracking-wider text-text-secondary">
                                                {doc.type}
                                            </span>
                                            {/* AI Indicator */}
                                            {doc.textContent && (
                                                <span className="flex items-center gap-1 text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/20" title="Contenido analizado por IA">
                                                    <SparklesIcon className="h-3 w-3" /> IA Ready
                                                </span>
                                            )}
                                            {activeSection === 'official' && getVisibilityIcon(doc.visibility)}
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-bold text-text-primary mb-1 line-clamp-2 leading-snug" title={doc.title}>{doc.title}</h3>
                                    
                                    <div className="text-xs text-text-secondary mt-3 space-y-1">
                                        <p><span className="font-semibold">Categoría:</span> {doc.category}</p>
                                        <p><span className="font-semibold">Fecha:</span> {new Date(doc.uploadDate).toLocaleDateString()}</p>
                                        {activeSection === 'annexes' && (
                                            <p className="truncate text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded w-fit mt-1"><span className="font-semibold">Pertenece a:</span> {getOwnerName(doc)}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-background/50 border-t border-secondary/10 p-3 flex justify-between items-center">
                                    <div className="flex gap-2">
                                        <a href={doc.url} download className="p-1.5 text-xs font-bold text-primary flex items-center gap-1 hover:underline hover:bg-primary/5 rounded">
                                            <DownloadIcon className="h-4 w-4" /> Descargar
                                        </a>
                                        {doc.textContent && (
                                            <button 
                                                onClick={() => setViewContentDoc(doc)}
                                                className="p-1.5 text-xs font-bold text-accent flex items-center gap-1 hover:underline hover:bg-accent/5 rounded"
                                            >
                                                <EyeIcon className="h-4 w-4" /> Ver
                                            </button>
                                        )}
                                    </div>
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
                    <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] border border-secondary/20 flex flex-col">
                        <header className={`p-5 border-b border-secondary/20 flex justify-between items-center rounded-t-xl ${activeSection === 'official' ? 'bg-primary/5' : 'bg-emerald-50'}`}>
                            <div>
                                <h3 className="text-xl font-bold text-text-primary">
                                    {activeSection === 'official' ? 'Subir Documento Oficial' : 'Subir Anexo / Expediente'}
                                </h3>
                                <p className="text-xs text-text-secondary mt-1">
                                    {activeSection === 'official' 
                                        ? "Reglamentos, programas y normativa institucional." 
                                        : `Documentación personal para ${annexTab === 'residents' ? 'Residentes' : 'Docentes'}.`}
                                </p>
                            </div>
                            <button onClick={closeUploadModal} className="p-2 rounded-full hover:bg-secondary/20"><CloseIcon /></button>
                        </header>
                        
                        <div className="flex bg-secondary/10 p-1 mx-6 mt-6 rounded-lg self-center w-auto border border-secondary/20">
                            <button 
                                onClick={() => setUploadMode('file')}
                                className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 transition-all ${uploadMode === 'file' ? 'bg-surface shadow text-primary' : 'text-text-secondary hover:text-primary'}`}
                            >
                                <CloudUploadIcon className="h-4 w-4" /> Subir Archivo (IA)
                            </button>
                            <button 
                                onClick={() => setUploadMode('text')}
                                className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 transition-all ${uploadMode === 'text' ? 'bg-surface shadow text-primary' : 'text-text-secondary hover:text-primary'}`}
                            >
                                <TypeIcon className="h-4 w-4" /> Editor de Texto / Pegar
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="p-6 flex-grow flex flex-col overflow-hidden">
                            
                            {/* Metadata Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase">Título del Documento</label>
                                    <input 
                                        type="text" 
                                        value={newDocTitle}
                                        onChange={(e) => setNewDocTitle(e.target.value)}
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
                                        placeholder={activeSection === 'official' ? "Ej: Reglamento Interno 2024" : "Ej: Certificado de Título"}
                                        required
                                    />
                                </div>
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
                                        <option value="Programa">Programa</option>
                                    </select>
                                </div>
                                {activeSection === 'official' ? (
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
                                ) : (
                                    <div className="col-span-1 md:col-span-2 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                        <label className="block text-xs font-bold text-emerald-800 mb-1.5 uppercase">
                                            Asignar a {annexTab === 'residents' ? 'Residente' : 'Docente'}
                                        </label>
                                        <select 
                                            value={newDocOwnerId}
                                            onChange={(e) => setNewDocOwnerId(e.target.value)}
                                            className="w-full bg-white border border-emerald-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                            required
                                        >
                                            <option value="">Seleccione...</option>
                                            {annexTab === 'residents' 
                                                ? students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                                : teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                                            }
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Content Area */}
                            <div className="flex-grow flex flex-col min-h-0 border border-secondary/20 rounded-xl overflow-hidden bg-background">
                                {uploadMode === 'file' ? (
                                    <div className="flex flex-col h-full">
                                        <div 
                                            className={`p-6 flex flex-col items-center justify-center cursor-pointer transition-all border-b border-secondary/20 ${isDragging ? 'bg-primary/5' : 'hover:bg-surface'}`}
                                            onDragEnter={(e) => handleDrag(e, true)}
                                            onDragLeave={(e) => handleDrag(e, false)}
                                            onDragOver={(e) => handleDrag(e, true)}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <CloudUploadIcon className={`h-12 w-12 mb-2 ${isDragging ? 'text-primary' : 'text-secondary'}`} />
                                            {uploadFile ? (
                                                <div className="text-center">
                                                    <p className="font-bold text-primary">{uploadFile.name}</p>
                                                    <p className="text-xs text-text-secondary">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <p className="font-medium text-text-primary">Arrastra tu archivo aquí</p>
                                                    <p className="text-xs text-text-secondary">o haz clic para seleccionar (PDF, Word, Excel, Imagen)</p>
                                                </div>
                                            )}
                                            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                                        </div>
                                        
                                        {/* AI Analysis Preview */}
                                        <div className="flex-grow p-4 bg-surface/50 overflow-y-auto relative">
                                            {isAnalyzing && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-surface/80 backdrop-blur-sm z-10">
                                                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-lg border border-accent/20">
                                                        <SparklesIcon className="h-6 w-6 text-accent animate-spin" />
                                                        <span className="text-accent font-bold">Analizando contenido con IA...</span>
                                                    </div>
                                                </div>
                                            )}
                                            <label className="block text-xs font-bold text-text-secondary mb-2 uppercase">Contenido Extraído (Editable)</label>
                                            <textarea 
                                                ref={textAreaRef}
                                                value={textContentInput}
                                                onChange={(e) => setTextContentInput(e.target.value)}
                                                className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed"
                                                placeholder="El texto extraído por la IA aparecerá aquí..."
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full">
                                        {/* Basic Toolbar */}
                                        <div className="flex items-center gap-2 p-2 border-b border-secondary/20 bg-secondary/5">
                                            <button type="button" onClick={() => insertTextAtCursor('**Texto en negrita**')} className="p-1.5 hover:bg-secondary/10 rounded text-text-secondary hover:text-primary" title="Negrita"><BoldIcon className="h-4 w-4"/></button>
                                            <button type="button" onClick={() => insertTextAtCursor('*Texto en cursiva*')} className="p-1.5 hover:bg-secondary/10 rounded text-text-secondary hover:text-primary" title="Cursiva"><span className="italic font-serif font-bold">I</span></button>
                                            <button type="button" onClick={() => insertTextAtCursor('\n- Elemento de lista')} className="p-1.5 hover:bg-secondary/10 rounded text-text-secondary hover:text-primary" title="Lista"><ListBulletIcon className="h-4 w-4"/></button>
                                            <div className="h-4 w-px bg-secondary/20 mx-1"></div>
                                            <span className="text-xs text-text-secondary">Compatible con Markdown y pegado directo desde Notion/Word</span>
                                        </div>
                                        <textarea 
                                            ref={textAreaRef}
                                            value={textContentInput}
                                            onChange={(e) => setTextContentInput(e.target.value)}
                                            className="flex-grow w-full p-4 bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed"
                                            placeholder="Escribe o pega tu texto formateado aquí..."
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-secondary/10">
                                <button type="button" onClick={closeUploadModal} className="px-5 py-2.5 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors font-bold text-text-secondary text-sm">Cancelar</button>
                                <button 
                                    type="submit" 
                                    disabled={isAnalyzing}
                                    className={`px-5 py-2.5 rounded-lg text-white font-bold shadow-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${activeSection === 'official' ? 'bg-primary hover:bg-primary-dark' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                >
                                    <CloudUploadIcon className="h-4 w-4"/> Guardar Documento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Content Modal */}
            {viewContentDoc && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`bg-surface shadow-2xl flex flex-col border border-secondary/20 transition-all duration-300 ${isViewFullscreen ? 'fixed inset-0 w-full h-full rounded-none' : 'w-full max-w-3xl h-[80vh] rounded-xl'}`}>
                        <header className="p-5 border-b border-secondary/20 flex justify-between items-center bg-secondary/5">
                            <div>
                                <h3 className="text-xl font-bold text-text-primary">{viewContentDoc.title}</h3>
                                <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                                    <SparklesIcon className="h-3 w-3 text-accent" /> Contenido extraído / Texto
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setIsViewFullscreen(!isViewFullscreen)} 
                                    className="p-2 rounded-full hover:bg-secondary/20 text-text-secondary hover:text-primary transition-colors"
                                    title={isViewFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                                >
                                    <ScreenIcon className="h-5 w-5" />
                                </button>
                                <button onClick={() => { setViewContentDoc(null); setIsViewFullscreen(false); }} className="p-2 rounded-full hover:bg-secondary/20"><CloseIcon /></button>
                            </div>
                        </header>
                        <div className="p-8 overflow-y-auto bg-background/50 font-mono text-sm whitespace-pre-wrap leading-relaxed flex-grow">
                            {viewContentDoc.textContent || "No hay contenido de texto extraído disponible."}
                        </div>
                        <footer className="p-4 border-t border-secondary/20 flex justify-end">
                            <button onClick={() => { setViewContentDoc(null); setIsViewFullscreen(false); }} className="px-5 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark">Cerrar</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentsModule;
