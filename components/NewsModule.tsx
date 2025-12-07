
import React, { useState, useEffect, useRef } from 'react';
import { BulletinEntry, Student } from '../types';
import { BulletinService } from '../services/dataService';
import { NewspaperIcon, PlusIcon, CalendarIcon, FilterIcon, EditIcon, TrashIcon, CloseIcon, CheckCircleIcon, EyeIcon, UsersIcon, BriefcaseIcon, CloudUploadIcon, PaperClipIcon, LinkIcon, FileIcon, ImageIcon, VideoIcon } from './icons';

interface NewsModuleProps {
    students: Student[];
    currentUserId: string;
}

const emptyEntry: BulletinEntry = {
    id: '',
    title: '',
    category: 'Noticia',
    date: new Date().toISOString(),
    summary: '',
    content: '',
    author: '',
    attachments: { images: [], files: [], links: [] },
    priority: false,
    visibility: 'public'
};

const NewsModule: React.FC<NewsModuleProps> = ({ students, currentUserId }) => {
    const [bulletins, setBulletins] = useState<BulletinEntry[]>([]);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingEntry, setEditingEntry] = useState<BulletinEntry>(emptyEntry);
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Attachment States
    const [isDragging, setIsDragging] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Permission Logic: Admin (10611061) OR Teacher (DOCENTE)
    const canManage = currentUserId === 'DOCENTE' || currentUserId === '10611061';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await BulletinService.getAll();
        setBulletins(data);
        setLoading(false);
    };

    // --- ATTACHMENT HANDLERS ---

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
        
        const newImages: string[] = [];
        const newFiles: { name: string; type: string; data?: string }[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const base64 = await fileToBase64(file);
                if (file.type.startsWith('image/')) {
                    newImages.push(base64);
                } else {
                    newFiles.push({
                        name: file.name,
                        type: file.type,
                        data: base64
                    });
                }
            } catch (error) {
                console.error("Error processing file", file.name, error);
            }
        }

        setEditingEntry(prev => ({
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

    const confirmAddLink = () => {
        if (linkUrl.trim()) {
            const validUrl = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
            setEditingEntry(prev => ({
                ...prev,
                attachments: {
                    ...prev.attachments,
                    links: [...prev.attachments.links, validUrl]
                }
            }));
            setLinkUrl('');
            setShowLinkInput(false);
        }
    };

    const removeAttachment = (type: 'image' | 'file' | 'link', index: number) => {
        setEditingEntry(prev => {
            const newAttachments = { ...prev.attachments };
            if (type === 'image') {
                newAttachments.images = newAttachments.images.filter((_, i) => i !== index);
            } else if (type === 'file') {
                newAttachments.files = newAttachments.files.filter((_, i) => i !== index);
            } else if (type === 'link') {
                newAttachments.links = newAttachments.links.filter((_, i) => i !== index);
            }
            return { ...prev, attachments: newAttachments };
        });
    };

    // --- FORM HANDLERS ---

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEntry.title || !editingEntry.content) return;

        const entryToSave = {
            ...editingEntry,
            id: editingEntry.id || `NEWS-${Date.now()}`,
            author: editingEntry.author || (currentUserId === '10611061' ? 'Administración' : 'Docencia'),
            date: editingEntry.date || new Date().toISOString()
        };

        try {
            if (editingEntry.id) {
                await BulletinService.update(entryToSave);
                setBulletins(prev => prev.map(b => b.id === entryToSave.id ? entryToSave : b));
            } else {
                const created = await BulletinService.create(entryToSave);
                setBulletins(prev => [created, ...prev]);
            }
            setView('list');
        } catch (error) {
            console.error("Error saving bulletin", error);
        }
    };

    const handleDelete = async (id: string) => {
        if(confirm('¿Eliminar esta publicación?')) {
            await BulletinService.delete(id);
            setBulletins(prev => prev.filter(b => b.id !== id));
        }
    };

    const handleEdit = (entry: BulletinEntry) => {
        setEditingEntry(entry);
        setView('form');
    };

    const handleNew = () => {
        setEditingEntry({ ...emptyEntry, date: new Date().toISOString().slice(0, 16) });
        setView('form');
    };

    const filteredBulletins = bulletins.filter(b => {
        const categoryMatch = filterCategory ? b.category === filterCategory : true;
        const roleMatch = canManage ? true : (b.visibility === 'public' || b.visibility === 'residents');
        return categoryMatch && roleMatch;
    });

    const inputClass = "w-full bg-background border border-secondary/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none";
    const labelClass = "block text-xs font-semibold text-text-secondary mb-1";

    const getVisibilityBadge = (visibility: string) => {
        switch(visibility) {
            case 'teachers': return <span className="flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200"><BriefcaseIcon className="h-3 w-3"/> Solo Docentes</span>;
            case 'residents': return <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200"><UsersIcon className="h-3 w-3"/> Solo Residentes</span>;
            default: return <span className="flex items-center gap-1 text-[10px] bg-secondary/10 text-text-secondary px-2 py-0.5 rounded border border-secondary/20"><EyeIcon className="h-3 w-3"/> Público</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                        <NewspaperIcon className="h-8 w-8 text-primary" /> Noticias y Avisos
                    </h2>
                    <p className="text-text-secondary">Novedades y comunicados del departamento.</p>
                </div>
                
                <div className="flex gap-2 items-center w-full md:w-auto">
                    {canManage && view === 'list' && (
                        <button 
                            onClick={handleNew}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
                        >
                            <PlusIcon className="h-5 w-5" /> Nueva Publicación
                        </button>
                    )}
                    {view === 'form' && (
                        <button 
                            onClick={() => setView('list')}
                            className="bg-secondary/10 hover:bg-secondary/20 text-text-primary px-4 py-2 rounded-lg font-bold transition-all"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            {view === 'list' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button 
                            onClick={() => setFilterCategory('')} 
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${!filterCategory ? 'bg-primary text-white border-primary' : 'bg-surface border-secondary/30 text-text-secondary hover:bg-secondary/10'}`}
                        >
                            Todas
                        </button>
                        {['Noticia', 'Aviso', 'Evento', 'Académico'].map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setFilterCategory(cat)} 
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${filterCategory === cat ? 'bg-primary text-white border-primary' : 'bg-surface border-secondary/30 text-text-secondary hover:bg-secondary/10'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            <div className="text-center p-8 text-text-secondary">Cargando noticias...</div>
                        ) : filteredBulletins.length === 0 ? (
                            <div className="text-center p-8 border-2 border-dashed border-secondary/20 rounded-xl text-text-secondary">
                                No hay publicaciones visibles en esta categoría.
                            </div>
                        ) : (
                            filteredBulletins.map(item => (
                                <div key={item.id} className={`bg-surface p-5 rounded-xl shadow-sm border border-secondary/20 hover:shadow-md transition-all ${item.priority ? 'border-l-4 border-l-warning' : ''}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                                item.category === 'Aviso' ? 'bg-orange-100 text-orange-700' : 
                                                item.category === 'Evento' ? 'bg-purple-100 text-purple-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {item.category}
                                            </span>
                                            {/* Visibility Badge */}
                                            {canManage && getVisibilityBadge(item.visibility)}
                                            
                                            <span className="text-xs text-text-secondary flex items-center gap-1">
                                                <CalendarIcon className="h-3 w-3" /> {new Date(item.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {canManage && (
                                            <div className="flex gap-1">
                                                <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-secondary/10 rounded text-primary"><EditIcon className="h-4 w-4" /></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-secondary/10 rounded text-danger"><TrashIcon className="h-4 w-4" /></button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-text-primary mb-2">{item.title}</h3>
                                    <p className="text-sm text-text-secondary mb-3">{item.summary}</p>
                                    
                                    {/* Preview Content */}
                                    <div className="p-3 bg-background rounded-lg text-sm text-text-primary border border-secondary/10 whitespace-pre-wrap">
                                        {item.content}
                                    </div>

                                    {/* Attachments Preview */}
                                    {(item.attachments.images.length > 0 || item.attachments.files.length > 0 || item.attachments.links.length > 0) && (
                                        <div className="mt-3 flex gap-2 flex-wrap">
                                            {item.attachments.images.map((_, i) => <span key={i} className="text-xs bg-secondary/10 px-2 py-1 rounded flex items-center gap-1"><ImageIcon className="h-3 w-3"/> Imagen</span>)}
                                            {item.attachments.files.map((_, i) => <span key={i} className="text-xs bg-secondary/10 px-2 py-1 rounded flex items-center gap-1"><FileIcon className="h-3 w-3"/> Archivo</span>)}
                                            {item.attachments.links.map((l, i) => <a key={i} href={l} target="_blank" rel="noreferrer" className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded flex items-center gap-1 hover:underline"><LinkIcon className="h-3 w-3"/> Link</a>)}
                                        </div>
                                    )}

                                    {item.priority && (
                                        <div className="mt-3 flex items-center gap-1 text-xs font-bold text-warning">
                                            <FilterIcon className="h-3 w-3" /> Publicación Prioritaria
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {view === 'form' && (
                <div className="bg-surface rounded-xl shadow-lg border border-secondary/20 overflow-hidden max-w-3xl mx-auto">
                    <header className="p-5 border-b border-secondary/20 bg-secondary/5">
                        <h3 className="font-bold text-lg text-text-primary">
                            {editingEntry.id ? 'Editar Publicación' : 'Nueva Publicación'}
                        </h3>
                    </header>
                    
                    <form onSubmit={handleSave} className="p-6 space-y-4">
                        {/* Title */}
                        <div>
                            <label className={labelClass}>Título</label>
                            <input 
                                type="text" 
                                value={editingEntry.title} 
                                onChange={e => setEditingEntry({...editingEntry, title: e.target.value})} 
                                className={inputClass} 
                                placeholder="Título del comunicado"
                                required 
                            />
                        </div>
                        
                        {/* Metadata Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>Categoría</label>
                                <select 
                                    value={editingEntry.category}
                                    onChange={e => setEditingEntry({...editingEntry, category: e.target.value as any})}
                                    className={inputClass}
                                >
                                    <option value="Noticia">Noticia</option>
                                    <option value="Aviso">Aviso</option>
                                    <option value="Evento">Evento</option>
                                    <option value="Académico">Académico</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Visibilidad</label>
                                <select 
                                    value={editingEntry.visibility}
                                    onChange={e => setEditingEntry({...editingEntry, visibility: e.target.value as any})}
                                    className={inputClass}
                                >
                                    <option value="public">Todos (Público)</option>
                                    <option value="teachers">Solo Docentes</option>
                                    <option value="residents">Solo Residentes</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Fecha</label>
                                <input 
                                    type="datetime-local" 
                                    value={editingEntry.date.slice(0, 16)} 
                                    onChange={e => setEditingEntry({...editingEntry, date: new Date(e.target.value).toISOString()})} 
                                    className={inputClass} 
                                />
                            </div>
                        </div>

                        {/* Summary */}
                        <div>
                            <label className={labelClass}>Resumen (Bajada)</label>
                            <input 
                                type="text" 
                                value={editingEntry.summary} 
                                onChange={e => setEditingEntry({...editingEntry, summary: e.target.value})} 
                                className={inputClass} 
                                placeholder="Breve descripción para la vista previa"
                            />
                        </div>

                        {/* Content Area with Drag & Drop */}
                        <div 
                            className={`relative space-y-2 rounded-xl p-1 transition-all ${isDragging ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                            onDragEnter={(e) => handleDrag(e, true)}
                            onDragLeave={(e) => handleDrag(e, false)}
                            onDragOver={(e) => handleDrag(e, true)}
                            onDrop={handleDrop}
                        >
                            <label className={labelClass}>Contenido Detallado</label>
                            <textarea 
                                value={editingEntry.content} 
                                onChange={e => setEditingEntry({...editingEntry, content: e.target.value})} 
                                className={`${inputClass} min-h-[150px] resize-none`} 
                                placeholder="Escribe el mensaje aquí o arrastra archivos para adjuntar..."
                                required 
                            />

                            {isDragging && (
                                <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-xl flex items-center justify-center z-10 pointer-events-none">
                                    <div className="bg-surface p-4 rounded-lg shadow-lg flex flex-col items-center">
                                        <CloudUploadIcon className="h-8 w-8 text-primary mb-2" />
                                        <span className="font-bold text-primary">Soltar archivos aquí</span>
                                    </div>
                                </div>
                            )}

                            {/* Attachments Toolbar */}
                            <div className="flex gap-2 items-center pt-2">
                                <input 
                                    type="file" 
                                    multiple 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    onChange={(e) => handleFileSelect(e.target.files)} 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current?.click()} 
                                    className="p-2 text-text-secondary hover:bg-secondary/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border border-secondary/20"
                                >
                                    <PaperClipIcon className="h-4 w-4" /> Adjuntar Archivo
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowLinkInput(!showLinkInput)}
                                    className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border border-secondary/20 ${showLinkInput ? 'bg-primary/10 text-primary border-primary/30' : 'text-text-secondary hover:bg-secondary/10'}`}
                                >
                                    <LinkIcon className="h-4 w-4" /> Agregar Link
                                </button>

                                {showLinkInput && (
                                    <div className="flex items-center gap-2 flex-grow animate-fade-in-right">
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="Pegar URL aquí..."
                                            value={linkUrl}
                                            onChange={(e) => setLinkUrl(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') { e.preventDefault(); confirmAddLink(); }
                                            }}
                                            className="flex-grow bg-background border border-secondary/30 rounded px-2 py-1 text-sm outline-none focus:border-primary h-8"
                                        />
                                        <button type="button" onClick={confirmAddLink} className="p-1 text-success hover:bg-success/10 rounded"><CheckCircleIcon className="h-4 w-4" /></button>
                                        <button type="button" onClick={() => setShowLinkInput(false)} className="p-1 text-danger hover:bg-danger/10 rounded"><CloseIcon className="h-4 w-4" /></button>
                                    </div>
                                )}
                            </div>

                            {/* Attachments List */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                {editingEntry.attachments.images.map((img, idx) => (
                                    <div key={`img-${idx}`} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-secondary/20">
                                        <img src={img} alt="attachment" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeAttachment('image', idx)} className="absolute top-1 right-1 bg-danger text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><CloseIcon className="h-3 w-3"/></button>
                                    </div>
                                ))}
                                {editingEntry.attachments.files.map((file, idx) => (
                                    <div key={`file-${idx}`} className="relative group bg-background border border-secondary/20 rounded-lg p-2 flex items-center gap-2 max-w-[200px]">
                                        <FileIcon className="h-5 w-5 text-secondary" />
                                        <span className="text-xs truncate flex-grow">{file.name}</span>
                                        <button type="button" onClick={() => removeAttachment('file', idx)} className="text-danger opacity-0 group-hover:opacity-100"><CloseIcon className="h-4 w-4"/></button>
                                    </div>
                                ))}
                                {editingEntry.attachments.links.map((link, idx) => (
                                    <div key={`link-${idx}`} className="relative group bg-blue-50 border border-blue-100 rounded-lg p-2 flex items-center gap-2 max-w-[200px]">
                                        <LinkIcon className="h-4 w-4 text-blue-500" />
                                        <span className="text-xs truncate text-blue-700 flex-grow">{link}</span>
                                        <button type="button" onClick={() => removeAttachment('link', idx)} className="text-danger opacity-0 group-hover:opacity-100"><CloseIcon className="h-4 w-4"/></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Priority Toggle */}
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="priority"
                                checked={editingEntry.priority}
                                onChange={e => setEditingEntry({...editingEntry, priority: e.target.checked})}
                                className="rounded text-primary focus:ring-primary h-4 w-4"
                            />
                            <label htmlFor="priority" className="text-sm font-bold text-text-secondary cursor-pointer">Marcar como Prioritario</label>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-4 flex justify-end gap-3 border-t border-secondary/10 mt-4">
                            <button 
                                type="button" 
                                onClick={() => setView('list')}
                                className="px-5 py-2 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors font-bold text-text-secondary"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all"
                            >
                                Guardar Publicación
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default NewsModule;
