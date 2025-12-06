
import React, { useState, useEffect, useRef } from 'react';
import { BulletinEntry } from '../types';
import { BulletinService } from '../services/dataService';
import { NewspaperIcon, CalendarIcon, ChevronRightIcon, PlusIcon, EditIcon, TrashIcon, DuplicateIcon, CloseIcon, CloudUploadIcon, PaperClipIcon, LinkIcon, FileIcon, ImageIcon, ClockIcon, LocationIcon } from './icons';

const emptyEntry: BulletinEntry = {
    id: '',
    title: '',
    category: 'Noticia',
    date: new Date().toISOString(),
    summary: '',
    content: '',
    author: 'Admin',
    attachments: { images: [], files: [], links: [] },
    priority: false
};

type Tab = 'news' | 'calendar';

const NewsModule: React.FC = () => {
    const [entries, setEntries] = useState<BulletinEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentEntry, setCurrentEntry] = useState<BulletinEntry>(emptyEntry);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('news');
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');

    // Drag & Drop
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        setLoading(true);
        try {
            const data = await BulletinService.getAll();
            setEntries(data);
        } catch (error) {
            console.error("Failed to load bulletin", error);
        } finally {
            setLoading(false);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileSelect = async (files: FileList | null) => {
        if (!files) return;
        const fileList = Array.from(files);
        
        const newImages: string[] = [];
        const newFiles: { name: string; type: string; data?: string }[] = [];

        for (const file of fileList) {
            if (file.type.startsWith('image/')) {
                try {
                    const base64 = await fileToBase64(file);
                    newImages.push(base64);
                } catch (e) { console.error("Error processing image", e); }
            } else {
                // For non-image files, we store metadata and mocked "upload" state
                newFiles.push({ name: file.name, type: file.type, data: 'mock_url_or_base64' });
            }
        }

        setCurrentEntry(prev => ({
            ...prev,
            attachments: {
                ...prev.attachments,
                images: [...prev.attachments.images, ...newImages],
                files: [...prev.attachments.files, ...newFiles]
            }
        }));
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentEntry(prev => ({ ...prev, [name]: value }));
    };

    const handleAddLink = () => {
        const url = prompt("Ingrese la URL del enlace:");
        if (url) {
            setCurrentEntry(prev => ({
                ...prev,
                attachments: { ...prev.attachments, links: [...prev.attachments.links, url] }
            }));
        }
    };

    const handleRemoveAttachment = (type: 'images' | 'files' | 'links', index: number) => {
        setCurrentEntry(prev => {
            const newAttachments = { ...prev.attachments };
            if (type === 'images') newAttachments.images = newAttachments.images.filter((_, i) => i !== index);
            if (type === 'files') newAttachments.files = newAttachments.files.filter((_, i) => i !== index);
            if (type === 'links') newAttachments.links = newAttachments.links.filter((_, i) => i !== index);
            return { ...prev, attachments: newAttachments };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await BulletinService.update(currentEntry);
                setEntries(prev => prev.map(e => e.id === currentEntry.id ? currentEntry : e));
            } else {
                await BulletinService.create(currentEntry);
                setEntries(prev => [currentEntry, ...prev]);
            }
            setIsFormOpen(false);
        } catch (error) {
            console.error("Error saving entry", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta entrada?")) {
            await BulletinService.delete(id);
            setEntries(prev => prev.filter(e => e.id !== id));
        }
    };

    const handleDuplicate = (entry: BulletinEntry) => {
        const copy = { ...entry, id: '', title: `${entry.title} (Copia)`, date: new Date().toISOString() };
        setCurrentEntry(copy);
        setIsEditing(false);
        setIsFormOpen(true);
    };

    const openEdit = (entry: BulletinEntry) => {
        setCurrentEntry(entry);
        setIsEditing(true);
        setIsFormOpen(true);
    };

    const openNew = () => {
        setCurrentEntry({
            ...emptyEntry,
            category: activeTab === 'calendar' ? 'Evento' : 'Noticia' // Default based on tab
        });
        setIsEditing(false);
        setIsFormOpen(true);
    };

    // Filter Logic
    const filteredEntries = entries.filter(e => {
        const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.summary.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesTab = false;
        if (activeTab === 'news') {
            matchesTab = ['Noticia', 'Aviso'].includes(e.category);
        } else {
            matchesTab = ['Evento', 'Académico'].includes(e.category);
        }

        return matchesSearch && matchesTab;
    });

    // Sort Logic
    // News: Newest first
    // Calendar: Upcoming dates first (Ascending)
    const sortedEntries = filteredEntries.sort((a, b) => {
        if (activeTab === 'news') {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                        {activeTab === 'news' ? <NewspaperIcon className="h-8 w-8 text-primary" /> : <CalendarIcon className="h-8 w-8 text-accent" />}
                        {activeTab === 'news' ? 'Noticias y Avisos' : 'Agenda Académica'}
                    </h2>
                    <p className="text-text-secondary">
                        {activeTab === 'news' ? 'Novedades y comunicados del departamento.' : 'Programación de eventos, congresos y reuniones.'}
                    </p>
                </div>
                <div className="flex gap-2">
                     <button onClick={openNew} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition-all">
                        <PlusIcon className="h-5 w-5" /> 
                        <span className="hidden sm:inline">Nueva {activeTab === 'news' ? 'Publicación' : 'Actividad'}</span>
                        <span className="sm:hidden">Nuevo</span>
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-secondary/20 flex gap-6">
                <button 
                    onClick={() => setActiveTab('news')}
                    className={`pb-3 px-1 font-semibold transition-colors relative ${activeTab === 'news' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    Noticias y Avisos
                </button>
                <button 
                    onClick={() => setActiveTab('calendar')}
                    className={`pb-3 px-1 font-semibold transition-colors relative ${activeTab === 'calendar' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    Agenda y Eventos
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <input 
                    type="text" 
                    placeholder={activeTab === 'news' ? "Buscar noticia..." : "Buscar evento..."}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-surface border border-secondary/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Content View */}
            {activeTab === 'news' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedEntries.map(item => (
                        <div key={item.id} className="bg-surface rounded-xl shadow-sm border border-secondary/20 p-6 hover:shadow-md transition-all group flex flex-col h-full relative">
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button onClick={() => handleDuplicate(item)} className="p-1 hover:bg-secondary/20 rounded text-text-secondary"><DuplicateIcon className="h-4 w-4" /></button>
                                <button onClick={() => openEdit(item)} className="p-1 hover:bg-primary/20 rounded text-primary"><EditIcon className="h-4 w-4" /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-1 hover:bg-danger/20 rounded text-danger"><TrashIcon className="h-4 w-4" /></button>
                            </div>

                            <div className="flex justify-between items-start mb-3 pr-16">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded 
                                    ${item.category === 'Aviso' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {item.category}
                                </span>
                                <span className="text-xs text-text-secondary flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" /> {new Date(item.date).toLocaleDateString()}
                                </span>
                            </div>

                            {item.attachments.images.length > 0 && (
                                <div className="mb-3 rounded-lg overflow-hidden h-32 w-full">
                                    <img src={item.attachments.images[0]} alt="Cover" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <h3 className="text-lg font-bold text-text-primary mb-2">{item.title}</h3>
                            <p className="text-sm text-text-secondary leading-relaxed mb-4 flex-grow line-clamp-3">{item.summary}</p>
                            
                            {(item.attachments.files.length > 0 || item.attachments.links.length > 0) && (
                                <div className="flex gap-2 mb-4 text-xs text-text-secondary">
                                    {item.attachments.files.length > 0 && <span className="flex items-center gap-1"><PaperClipIcon className="h-3 w-3"/> {item.attachments.files.length} Archivos</span>}
                                    {item.attachments.links.length > 0 && <span className="flex items-center gap-1"><LinkIcon className="h-3 w-3"/> {item.attachments.links.length} Enlaces</span>}
                                </div>
                            )}

                            <div className="flex items-center text-primary text-sm font-semibold group-hover:underline mt-auto cursor-pointer" onClick={() => openEdit(item)}>
                                Ver detalles <ChevronRightIcon className="h-4 w-4 ml-1" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // Calendar List View
                <div className="space-y-4">
                    {sortedEntries.map(item => (
                        <div key={item.id} className="bg-surface rounded-xl border border-secondary/20 p-4 hover:border-accent transition-all group flex flex-col md:flex-row gap-4 md:items-center relative">
                             <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 md:static">
                                <button onClick={() => handleDuplicate(item)} className="p-1 hover:bg-secondary/20 rounded text-text-secondary"><DuplicateIcon className="h-4 w-4" /></button>
                                <button onClick={() => openEdit(item)} className="p-1 hover:bg-primary/20 rounded text-primary"><EditIcon className="h-4 w-4" /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-1 hover:bg-danger/20 rounded text-danger"><TrashIcon className="h-4 w-4" /></button>
                            </div>

                            <div className="flex-shrink-0 flex md:flex-col items-center justify-center gap-2 md:gap-0 bg-background/50 rounded-lg p-3 md:w-24 md:h-24 border border-secondary/10">
                                <span className="text-xs font-bold text-accent uppercase tracking-wider">{new Date(item.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                                <span className="text-2xl font-bold text-text-primary">{new Date(item.date).getDate()}</span>
                                <span className="text-xs text-text-secondary">{new Date(item.date).toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                            </div>

                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded 
                                        ${item.category === 'Académico' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                                        {item.category}
                                    </span>
                                    <span className="text-xs text-text-secondary flex items-center gap-1">
                                        <ClockIcon className="h-3 w-3" /> {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-text-primary">{item.title}</h3>
                                <p className="text-sm text-text-secondary mt-1">{item.summary}</p>
                                <div className="flex gap-4 mt-2 text-xs text-text-secondary">
                                    <span className="flex items-center gap-1"><LocationIcon className="h-3 w-3"/> Auditorio / Online</span>
                                    {item.attachments.links.length > 0 && <span className="flex items-center gap-1 text-accent"><LinkIcon className="h-3 w-3"/> Link Reunión</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {sortedEntries.length === 0 && (
                <div className="text-center py-12 text-text-secondary opacity-60">
                    <NewspaperIcon className="h-12 w-12 mx-auto mb-2" />
                    <p>No hay publicaciones en esta sección.</p>
                </div>
            )}

            {/* Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-secondary/20">
                        <header className="p-5 border-b border-secondary/20 flex justify-between items-center bg-surface/95 rounded-t-xl">
                            <h3 className="text-xl font-bold text-text-primary">
                                {isEditing ? 'Editar Publicación' : activeTab === 'news' ? 'Nueva Noticia' : 'Nuevo Evento'}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-secondary/20"><CloseIcon /></button>
                        </header>
                        
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1">Título</label>
                                    <input type="text" name="title" value={currentEntry.title} onChange={handleInputChange} className="w-full bg-background border border-secondary/30 rounded-lg p-2" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1">Categoría</label>
                                    <select name="category" value={currentEntry.category} onChange={handleInputChange} className="w-full bg-background border border-secondary/30 rounded-lg p-2">
                                        <option value="Noticia">Noticia</option>
                                        <option value="Aviso">Aviso</option>
                                        <option value="Evento">Evento</option>
                                        <option value="Académico">Académico</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1">Fecha {activeTab === 'calendar' ? 'y Hora del Evento' : 'de Publicación'}</label>
                                <input type="datetime-local" name="date" value={currentEntry.date.slice(0, 16)} onChange={handleInputChange} className="w-full bg-background border border-secondary/30 rounded-lg p-2" required />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1">Resumen (Corto)</label>
                                <textarea name="summary" value={currentEntry.summary} onChange={handleInputChange} rows={2} className="w-full bg-background border border-secondary/30 rounded-lg p-2 resize-none" maxLength={200} required />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1">Contenido Detallado</label>
                                <textarea name="content" value={currentEntry.content} onChange={handleInputChange} rows={6} className="w-full bg-background border border-secondary/30 rounded-lg p-2" required />
                            </div>

                            {/* Attachments Section */}
                            <div className="border-t border-secondary/20 pt-4">
                                <h4 className="text-sm font-bold text-accent mb-3 flex items-center gap-2"><PaperClipIcon /> Adjuntos y Multimedia</h4>
                                
                                <div 
                                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-secondary/30 hover:border-primary/50'}`}
                                    onDragEnter={(e) => handleDrag(e, true)}
                                    onDragLeave={(e) => handleDrag(e, false)}
                                    onDragOver={(e) => handleDrag(e, true)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <CloudUploadIcon className="h-8 w-8 mx-auto text-secondary mb-2" />
                                    <p className="text-sm text-text-secondary">Arrastra imágenes o archivos aquí (PDF, Doc, JPG)</p>
                                    <input type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                                </div>

                                <button type="button" onClick={handleAddLink} className="text-sm text-primary hover:underline mt-2 flex items-center gap-1 font-semibold">
                                    <PlusIcon className="h-3 w-3" /> Añadir Enlace Externo
                                </button>

                                {/* Attachments List */}
                                <div className="mt-4 space-y-2">
                                    {currentEntry.attachments.images.map((img, i) => (
                                        <div key={`img-${i}`} className="flex items-center justify-between p-2 bg-background rounded border border-secondary/20">
                                            <div className="flex items-center gap-2">
                                                <ImageIcon className="text-accent h-4 w-4" />
                                                <span className="text-xs truncate max-w-[200px]">Imagen {i + 1}</span>
                                                <img src={img} className="h-6 w-6 object-cover rounded" alt="Thumb" />
                                            </div>
                                            <button type="button" onClick={() => handleRemoveAttachment('images', i)} className="text-danger"><TrashIcon className="h-4 w-4" /></button>
                                        </div>
                                    ))}
                                    {currentEntry.attachments.files.map((file, i) => (
                                        <div key={`file-${i}`} className="flex items-center justify-between p-2 bg-background rounded border border-secondary/20">
                                            <div className="flex items-center gap-2">
                                                <FileIcon className="text-gray-500 h-4 w-4" />
                                                <span className="text-xs truncate">{file.name}</span>
                                            </div>
                                            <button type="button" onClick={() => handleRemoveAttachment('files', i)} className="text-danger"><TrashIcon className="h-4 w-4" /></button>
                                        </div>
                                    ))}
                                    {currentEntry.attachments.links.map((link, i) => (
                                        <div key={`link-${i}`} className="flex items-center justify-between p-2 bg-background rounded border border-secondary/20">
                                            <div className="flex items-center gap-2">
                                                <LinkIcon className="text-blue-500 h-4 w-4" />
                                                <span className="text-xs truncate max-w-[300px] text-blue-500">{link}</span>
                                            </div>
                                            <button type="button" onClick={() => handleRemoveAttachment('links', i)} className="text-danger"><TrashIcon className="h-4 w-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>

                        <footer className="p-5 border-t border-secondary/20 bg-surface/95 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setIsFormOpen(false)} className="px-5 py-2 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors">Cancelar</button>
                            <button onClick={handleSubmit} className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-all">Guardar</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsModule;
