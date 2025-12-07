
import React, { useState, useEffect } from 'react';
import { Student, Teacher, Annotation } from '../types';
import { StudentService, TeacherService, AnnotationService } from '../services/dataService';
import { suggestAnnotationTags } from '../services/geminiService';
import { ChatBubbleLeftRightIcon, UsersIcon, BriefcaseIcon, ThumbUpIcon, ThumbDownIcon, CheckCircleIcon, EditIcon, TrashIcon, DownloadIcon, DocumentTextIcon, EyeIcon, EyeOffIcon, TagIcon, SparklesIcon, CloseIcon } from './icons';
import { exportToCSV } from '../utils';

interface AnnotationsModuleProps {
    currentUserId: string;
}

const AnnotationsModule: React.FC<AnnotationsModuleProps> = ({ currentUserId }) => {
    const [targetType, setTargetType] = useState<'Student' | 'Teacher'>('Student');
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedTargetId, setSelectedTargetId] = useState('');
    const [noteType, setNoteType] = useState<'Positive' | 'Negative'>('Positive');
    const [content, setContent] = useState('');
    const [privacy, setPrivacy] = useState<'Public' | 'Private'>('Public');
    const [tags, setTags] = useState<string[]>([]);
    const [recentAnnotations, setRecentAnnotations] = useState<Annotation[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isTagging, setIsTagging] = useState(false);
    
    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Permission Logic: Admin OR Teacher
    const isTeacher = currentUserId === 'DOCENTE' || currentUserId === '10611061';

    useEffect(() => {
        const loadData = async () => {
            const [s, t, a] = await Promise.all([
                StudentService.getAll(),
                TeacherService.getAll(),
                AnnotationService.getAll()
            ]);
            setStudents(s);
            setTeachers(t);
            setRecentAnnotations(a);
        };
        loadData();
    }, []);

    const handleContentBlur = async () => {
        if (!content.trim() || isTagging) return;
        setIsTagging(true);
        const suggestedTags = await suggestAnnotationTags(content);
        if (suggestedTags && suggestedTags.length > 0) {
            setTags(suggestedTags);
        }
        setIsTagging(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTargetId || !content.trim()) return;

        setIsSaving(true);
        
        try {
            const annotationData: Annotation = {
                id: isEditing && editingId ? editingId : `NOTE-${Date.now()}`,
                targetId: selectedTargetId,
                targetType: targetType,
                authorId: currentUserId,
                type: noteType,
                content: content,
                date: new Date().toISOString(),
                privacy: privacy,
                tags: tags
            };

            if (isEditing && editingId) {
                await AnnotationService.update(annotationData);
                setRecentAnnotations(prev => prev.map(a => a.id === editingId ? annotationData : a));
                alert("Anotación actualizada exitosamente.");
            } else {
                const saved = await AnnotationService.create(annotationData);
                setRecentAnnotations(prev => [saved, ...prev]);
                alert("Anotación registrada exitosamente.");
            }
            
            // Reset form
            setContent('');
            setTags([]);
            setPrivacy('Public');
            setIsEditing(false);
            setEditingId(null);
            
        } catch (error) {
            console.error(error);
            alert("Error al guardar la anotación.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (note: Annotation) => {
        setTargetType(note.targetType);
        setSelectedTargetId(note.targetId);
        setNoteType(note.type);
        setContent(note.content);
        setPrivacy(note.privacy || 'Public');
        setTags(note.tags || []);
        setIsEditing(true);
        setEditingId(note.id);
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta anotación?")) {
            try {
                await AnnotationService.delete(id);
                setRecentAnnotations(prev => prev.filter(a => a.id !== id));
            } catch (error) {
                console.error("Error deleting annotation", error);
            }
        }
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditingId(null);
        setContent('');
        setTags([]);
    };

    const handleExport = () => {
        const dataToExport = visibleAnnotations.map(a => ({
            ID: a.id,
            Fecha: a.date,
            Tipo: a.type === 'Positive' ? 'Mérito' : 'Demérito',
            Sujeto: getTargetName(a.targetId, a.targetType),
            Rol: a.targetType === 'Student' ? 'Residente' : 'Docente',
            Observacion: a.content,
            Etiquetas: a.tags?.join(', '),
            Privacidad: a.privacy,
            AutorID: a.authorId
        }));
        exportToCSV(dataToExport, `Anotaciones_${new Date().toISOString().split('T')[0]}`);
    };

    const handlePrint = () => {
        window.print();
    };

    const getTargetName = (id: string, type: 'Student' | 'Teacher') => {
        if (type === 'Student') return students.find(s => s.id === id)?.name || id;
        return teachers.find(t => t.id === id)?.name || id;
    };

    // Filter annotations based on privacy
    const visibleAnnotations = recentAnnotations.filter(note => {
        if (isTeacher) return true; // Teachers see all
        return note.privacy !== 'Private'; // Residents only see Public
    });

    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                        <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary" /> Libro de Anotaciones
                    </h2>
                    <p className="text-text-secondary mt-1">Registro de méritos, deméritos y observaciones de conducta.</p>
                </div>
                <div className="flex gap-2 print:hidden">
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary bg-surface border border-secondary/30 rounded-lg hover:bg-secondary/10 transition-colors" title="Descargar CSV/Excel">
                        <DocumentTextIcon className="h-4 w-4" /> Exportar
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary bg-surface border border-secondary/30 rounded-lg hover:bg-secondary/10 transition-colors" title="Imprimir PDF">
                        <DownloadIcon className="h-4 w-4" /> PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column - Only visible to Teachers for creating new notes */}
                {isTeacher && (
                    <div className="lg:col-span-1 space-y-6 print:hidden">
                        <div className={`bg-surface p-6 rounded-xl shadow-lg border ${isEditing ? 'border-primary' : 'border-secondary/20'}`}>
                            <h3 className="font-bold text-lg mb-4 text-text-primary border-b border-secondary/20 pb-2">
                                {isEditing ? 'Editar Anotación' : 'Nueva Anotación'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                
                                {/* Target Type Selector */}
                                <div className="flex bg-background rounded-lg p-1 border border-secondary/20">
                                    <button
                                        type="button"
                                        onClick={() => { setTargetType('Student'); setSelectedTargetId(''); }}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${targetType === 'Student' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-secondary/10'}`}
                                    >
                                        <UsersIcon className="h-4 w-4" /> Residente
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setTargetType('Teacher'); setSelectedTargetId(''); }}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${targetType === 'Teacher' ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-secondary/10'}`}
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
                                        value={selectedTargetId} 
                                        onChange={(e) => setSelectedTargetId(e.target.value)}
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary"
                                        required
                                    >
                                        <option value="">Seleccione...</option>
                                        {targetType === 'Student' 
                                            ? students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                            : teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                                        }
                                    </select>
                                </div>

                                {/* Annotation Type & Privacy */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Tipo</label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setNoteType('Positive')}
                                                className={`flex-1 py-2 rounded-lg border flex justify-center ${noteType === 'Positive' ? 'bg-success/10 border-success text-success' : 'border-secondary/20 hover:bg-secondary/5'}`}
                                            >
                                                <ThumbUpIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNoteType('Negative')}
                                                className={`flex-1 py-2 rounded-lg border flex justify-center ${noteType === 'Negative' ? 'bg-danger/10 border-danger text-danger' : 'border-secondary/20 hover:bg-secondary/5'}`}
                                            >
                                                <ThumbDownIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Visibilidad</label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPrivacy('Public')}
                                                className={`flex-1 py-2 rounded-lg border flex justify-center items-center gap-1 text-xs font-bold ${privacy === 'Public' ? 'bg-primary/10 border-primary text-primary' : 'border-secondary/20 hover:bg-secondary/5'}`}
                                            >
                                                <EyeIcon className="h-4 w-4" /> Pública
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPrivacy('Private')}
                                                className={`flex-1 py-2 rounded-lg border flex justify-center items-center gap-1 text-xs font-bold ${privacy === 'Private' ? 'bg-secondary/20 border-secondary text-text-primary' : 'border-secondary/20 hover:bg-secondary/5'}`}
                                                title="Solo visible para docentes"
                                            >
                                                <EyeOffIcon className="h-4 w-4" /> Privada
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Observación Detallada</label>
                                    <textarea 
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        onBlur={handleContentBlur}
                                        rows={5}
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary resize-none"
                                        placeholder="Describa el hecho o conducta observada..."
                                        required
                                    />
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider flex items-center gap-1">
                                        <TagIcon className="h-3 w-3" /> Etiquetas {isTagging && <span className="text-accent text-[10px] animate-pulse">(IA sugiriendo...)</span>}
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
                                        {tags.map((tag, idx) => (
                                            <span key={idx} className="bg-accent/10 text-accent text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                {tag}
                                                <button type="button" onClick={() => setTags(prev => prev.filter((_, i) => i !== idx))} className="hover:text-danger"><CloseIcon className="h-3 w-3" /></button>
                                            </span>
                                        ))}
                                    </div>
                                    <input 
                                        type="text"
                                        placeholder="Añadir etiqueta manual (Enter)..."
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-2 text-xs"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = (e.target as HTMLInputElement).value.trim();
                                                if (val) {
                                                    setTags(prev => [...prev, val]);
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }
                                        }}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    {isEditing && (
                                        <button 
                                            type="button"
                                            onClick={cancelEdit}
                                            className="px-4 py-3 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors font-medium text-text-secondary"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <button 
                                        type="submit"
                                        disabled={isSaving || !selectedTargetId}
                                        className="flex-grow bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircleIcon className="h-5 w-5" /> {isEditing ? 'Actualizar' : 'Registrar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* History Column - Expands if user is not teacher */}
                <div className={`${isTeacher ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
                    <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-text-secondary" /> Historial Reciente
                    </h3>
                    
                    {visibleAnnotations.length === 0 ? (
                        <div className="bg-surface/50 border border-secondary/20 p-8 rounded-xl text-center text-text-secondary">
                            No hay anotaciones visibles registradas.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {visibleAnnotations.map(note => (
                                <div key={note.id} className={`bg-surface p-4 rounded-xl shadow-sm border flex gap-4 transition-all hover:shadow-md group relative ${note.privacy === 'Private' ? 'border-l-4 border-l-secondary/50 border-y-secondary/20 border-r-secondary/20 bg-secondary/5' : 'border-secondary/20'}`}>
                                    {/* Action Buttons */}
                                    {isTeacher && (
                                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(note); }} className="p-1.5 hover:bg-primary/20 rounded text-primary" title="Editar">
                                                <EditIcon className="h-4 w-4" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} className="p-1.5 hover:bg-danger/20 rounded text-danger" title="Eliminar">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}

                                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${note.type === 'Positive' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                        {note.type === 'Positive' ? <ThumbUpIcon className="h-6 w-6" /> : <ThumbDownIcon className="h-6 w-6" />}
                                    </div>
                                    <div className="flex-grow pr-16">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-text-primary">{getTargetName(note.targetId, note.targetType)}</h4>
                                            <div className="flex items-center gap-2">
                                                {note.privacy === 'Private' && (
                                                    <span className="text-xs bg-secondary/20 text-text-secondary px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                                                        <EyeOffIcon className="h-3 w-3" /> Privado
                                                    </span>
                                                )}
                                                <span className="text-xs text-text-secondary">{new Date(note.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mb-2 flex-wrap">
                                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${note.type === 'Positive' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                {note.type === 'Positive' ? 'Mérito' : 'Demérito'}
                                            </span>
                                            {note.tags?.map(tag => (
                                                <span key={tag} className="text-xs bg-surface border border-secondary/20 text-text-secondary px-2 py-0.5 rounded flex items-center gap-1">
                                                    <TagIcon className="h-3 w-3 opacity-50" /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-sm text-text-primary leading-relaxed bg-background/50 p-3 rounded-lg border border-secondary/10">
                                            "{note.content}"
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

export default AnnotationsModule;
