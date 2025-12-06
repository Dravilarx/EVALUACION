
import React, { useState, useEffect } from 'react';
import { Student, Teacher, Annotation } from '../types';
import { StudentService, TeacherService, AnnotationService } from '../services/dataService';
import { ChatBubbleLeftRightIcon, UsersIcon, BriefcaseIcon, ThumbUpIcon, ThumbDownIcon, CheckCircleIcon } from './icons';

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
    const [recentAnnotations, setRecentAnnotations] = useState<Annotation[]>([]);
    const [isSaving, setIsSaving] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTargetId || !content.trim()) return;

        setIsSaving(true);
        const newAnnotation: Annotation = {
            id: `NOTE-${Date.now()}`,
            targetId: selectedTargetId,
            targetType: targetType,
            authorId: currentUserId,
            type: noteType,
            content: content,
            date: new Date().toISOString()
        };

        try {
            const saved = await AnnotationService.create(newAnnotation);
            setRecentAnnotations(prev => [saved, ...prev]);
            setContent('');
            alert("Anotación registrada exitosamente.");
        } catch (error) {
            console.error(error);
            alert("Error al guardar la anotación.");
        } finally {
            setIsSaving(false);
        }
    };

    const getTargetName = (id: string, type: 'Student' | 'Teacher') => {
        if (type === 'Student') return students.find(s => s.id === id)?.name || id;
        return teachers.find(t => t.id === id)?.name || id;
    };

    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
            <div>
                <h2 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary" /> Libro de Anotaciones
                </h2>
                <p className="text-text-secondary mt-1">Registro de méritos, deméritos y observaciones de conducta.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface p-6 rounded-xl shadow-lg border border-secondary/20">
                        <h3 className="font-bold text-lg mb-4 text-text-primary border-b border-secondary/20 pb-2">Nueva Anotación</h3>
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

                            {/* Annotation Type */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Tipo de Nota</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNoteType('Positive')}
                                        className={`flex-1 p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${noteType === 'Positive' ? 'border-success bg-success/10 text-success' : 'border-secondary/20 text-text-secondary hover:border-success/50'}`}
                                    >
                                        <ThumbUpIcon className="h-6 w-6" />
                                        <span className="font-bold text-sm">Positiva</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNoteType('Negative')}
                                        className={`flex-1 p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${noteType === 'Negative' ? 'border-danger bg-danger/10 text-danger' : 'border-secondary/20 text-text-secondary hover:border-danger/50'}`}
                                    >
                                        <ThumbDownIcon className="h-6 w-6" />
                                        <span className="font-bold text-sm">Negativa</span>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Observación Detallada</label>
                                <textarea 
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={5}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary resize-none"
                                    placeholder="Describa el hecho o conducta observada..."
                                    required
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSaving || !selectedTargetId}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckCircleIcon className="h-5 w-5" /> Registrar Anotación
                            </button>
                        </form>
                    </div>
                </div>

                {/* History Column */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-text-secondary" /> Historial Reciente
                    </h3>
                    
                    {recentAnnotations.length === 0 ? (
                        <div className="bg-surface/50 border border-secondary/20 p-8 rounded-xl text-center text-text-secondary">
                            No hay anotaciones registradas.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentAnnotations.map(note => (
                                <div key={note.id} className="bg-surface p-4 rounded-xl shadow-sm border border-secondary/20 flex gap-4 transition-all hover:shadow-md">
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${note.type === 'Positive' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                        {note.type === 'Positive' ? <ThumbUpIcon className="h-6 w-6" /> : <ThumbDownIcon className="h-6 w-6" />}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-text-primary">{getTargetName(note.targetId, note.targetType)}</h4>
                                            <span className="text-xs text-text-secondary">{new Date(note.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                                            {note.targetType === 'Student' ? 'Residente' : 'Docente'} • {note.type === 'Positive' ? <span className="text-success">Mérito</span> : <span className="text-danger">Demérito</span>}
                                        </p>
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
