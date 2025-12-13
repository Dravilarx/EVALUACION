
import React, { useState, useEffect, useRef } from 'react';
import { ProgramInfo, ProgramAuthority } from '../types';
import { ProgramInfoService } from '../services/dataService';
import { BuildingIcon, UsersIcon, EditIcon, CheckCircleIcon, PlusIcon, TrashIcon, ImageIcon, CloseIcon, SparklesIcon } from './icons';

interface ProgramInfoModuleProps {
    currentUserId: string;
}

const ProgramInfoModule: React.FC<ProgramInfoModuleProps> = ({ currentUserId }) => {
    const [info, setInfo] = useState<ProgramInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'about' | 'team'>('about');
    const [isEditing, setIsEditing] = useState(false);
    
    // Edit States
    const [editForm, setEditForm] = useState<ProgramInfo | null>(null);
    const [editingAuthorityId, setEditingAuthorityId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Permission Logic: Only Admin (10611061) can edit
    const isAdmin = currentUserId === '10611061';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await ProgramInfoService.get();
            setInfo(data);
            setEditForm(data); // Initialize edit form
        } catch (error) {
            console.error("Error loading program info", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof ProgramInfo, value: string) => {
        if (!editForm) return;
        setEditForm({ ...editForm, [field]: value });
    };

    // --- Authority Management ---

    const handleAddAuthority = () => {
        if (!editForm) return;
        const newAuth: ProgramAuthority = {
            id: `AUTH-${Date.now()}`,
            name: '',
            position: '',
            bio: '',
            email: ''
        };
        setEditForm({
            ...editForm,
            authorities: [...editForm.authorities, newAuth]
        });
        setEditingAuthorityId(newAuth.id);
        setActiveTab('team');
    };

    const handleAuthorityChange = (id: string, field: keyof ProgramAuthority, value: string) => {
        if (!editForm) return;
        const updatedAuths = editForm.authorities.map(auth => 
            auth.id === id ? { ...auth, [field]: value } : auth
        );
        setEditForm({ ...editForm, authorities: updatedAuths });
    };

    const handleDeleteAuthority = (id: string) => {
        if (!editForm) return;
        if(confirm("¿Eliminar este miembro del equipo?")) {
            setEditForm({
                ...editForm,
                authorities: editForm.authorities.filter(a => a.id !== id)
            });
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, authId: string) => {
        const file = e.target.files?.[0];
        if (file && editForm) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                const updatedAuths = editForm.authorities.map(auth => 
                    auth.id === authId ? { ...auth, photoUrl: base64 } : auth
                );
                setEditForm({ ...editForm, authorities: updatedAuths });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!editForm) return;
        try {
            await ProgramInfoService.update(editForm);
            setInfo(editForm);
            setIsEditing(false);
            setEditingAuthorityId(null);
            alert("Información actualizada correctamente.");
        } catch (error) {
            console.error("Error saving info", error);
            alert("Error al guardar los cambios.");
        }
    };

    const handleCancel = () => {
        setEditForm(info); // Revert
        setIsEditing(false);
        setEditingAuthorityId(null);
    };

    if (loading || !info) return <div className="p-8 text-center text-text-secondary">Cargando información del programa...</div>;

    return (
        <div className="flex flex-col h-full animate-fade-in-up">
            {/* Header */}
            <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/20 flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                        <BuildingIcon className="h-8 w-8 text-primary" /> Nosotros
                    </h2>
                    <p className="text-text-secondary mt-1">Información Institucional y Autoridades del Programa.</p>
                </div>
                {isAdmin && !isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
                    >
                        <EditIcon className="h-5 w-5" /> Editar Contenido
                    </button>
                )}
                {isEditing && (
                    <div className="flex gap-3">
                        <button onClick={handleCancel} className="px-4 py-2 border border-secondary/30 rounded-lg hover:bg-secondary/10 transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="bg-success hover:bg-success/80 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2">
                            <CheckCircleIcon className="h-5 w-5" /> Guardar Cambios
                        </button>
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-6 border-b border-secondary/20 mb-6 px-2">
                <button 
                    onClick={() => setActiveTab('about')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'about' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    Información del Programa
                </button>
                <button 
                    onClick={() => setActiveTab('team')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'team' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    Autoridades y Equipo
                </button>
            </div>

            <div className="flex-grow overflow-y-auto pb-10">
                {activeTab === 'about' && (
                    <div className="space-y-8 max-w-4xl mx-auto">
                        {/* Description Section */}
                        <div className="bg-surface p-8 rounded-xl shadow-sm border border-secondary/20">
                            <h3 className="text-xl font-bold text-text-primary mb-4 border-b border-secondary/10 pb-2">Descripción General</h3>
                            {isEditing ? (
                                <textarea 
                                    value={editForm?.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-4 text-sm focus:ring-2 focus:ring-primary outline-none min-h-[150px]"
                                />
                            ) : (
                                <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">{info.description}</p>
                            )}
                        </div>

                        {/* Mission & Vision Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-surface p-8 rounded-xl shadow-sm border border-secondary/20">
                                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                                    <span className="bg-primary/10 p-1.5 rounded-lg"><CheckCircleIcon className="h-5 w-5"/></span> Misión
                                </h3>
                                {isEditing ? (
                                    <textarea 
                                        value={editForm?.mission}
                                        onChange={(e) => handleInputChange('mission', e.target.value)}
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none min-h-[120px]"
                                    />
                                ) : (
                                    <p className="text-text-secondary text-sm leading-relaxed">{info.mission}</p>
                                )}
                            </div>
                            <div className="bg-surface p-8 rounded-xl shadow-sm border border-secondary/20">
                                <h3 className="text-lg font-bold text-accent mb-4 flex items-center gap-2">
                                    <span className="bg-accent/10 p-1.5 rounded-lg"><SparklesIcon className="h-5 w-5"/></span> Visión
                                </h3>
                                {isEditing ? (
                                    <textarea 
                                        value={editForm?.vision}
                                        onChange={(e) => handleInputChange('vision', e.target.value)}
                                        className="w-full bg-background border border-secondary/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-accent outline-none min-h-[120px]"
                                    />
                                ) : (
                                    <p className="text-text-secondary text-sm leading-relaxed">{info.vision}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="max-w-6xl mx-auto">
                        {isEditing && (
                            <div className="mb-6 flex justify-end">
                                <button 
                                    onClick={handleAddAuthority}
                                    className="bg-secondary/10 hover:bg-secondary/20 text-text-primary px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                                >
                                    <PlusIcon className="h-5 w-5" /> Agregar Miembro
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(isEditing ? editForm?.authorities : info.authorities).map((auth) => (
                                <div key={auth.id} className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden group relative flex flex-col">
                                    {/* Action Buttons for Edit Mode */}
                                    {isEditing && (
                                        <div className="absolute top-2 right-2 flex gap-1 z-10">
                                            <button 
                                                onClick={() => handleDeleteAuthority(auth.id)}
                                                className="p-1.5 bg-white text-danger rounded-full shadow hover:bg-red-50"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="h-32 bg-gradient-to-r from-primary/10 to-accent/10 relative">
                                        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                                            <div className="w-24 h-24 rounded-full border-4 border-surface bg-white shadow-md overflow-hidden relative group/avatar">
                                                {auth.photoUrl ? (
                                                    <img src={auth.photoUrl} alt={auth.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-secondary/10 text-secondary">
                                                        <UsersIcon className="h-10 w-10" />
                                                    </div>
                                                )}
                                                {isEditing && (
                                                    <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 cursor-pointer transition-opacity">
                                                        <ImageIcon className="h-6 w-6 text-white" />
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, auth.id)} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-12 p-6 text-center flex-grow flex flex-col">
                                        {isEditing ? (
                                            <div className="space-y-3 w-full">
                                                <input 
                                                    type="text" 
                                                    value={auth.name}
                                                    onChange={(e) => handleAuthorityChange(auth.id, 'name', e.target.value)}
                                                    placeholder="Nombre Completo"
                                                    className="w-full text-center font-bold border-b border-secondary/30 focus:border-primary outline-none bg-transparent"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={auth.position}
                                                    onChange={(e) => handleAuthorityChange(auth.id, 'position', e.target.value)}
                                                    placeholder="Cargo / Título"
                                                    className="w-full text-center text-sm text-primary font-medium border-b border-secondary/30 focus:border-primary outline-none bg-transparent"
                                                />
                                                <textarea 
                                                    value={auth.bio}
                                                    onChange={(e) => handleAuthorityChange(auth.id, 'bio', e.target.value)}
                                                    placeholder="Breve reseña biográfica..."
                                                    rows={3}
                                                    className="w-full text-center text-xs text-text-secondary border border-secondary/20 rounded p-2 focus:border-primary outline-none bg-background/50 resize-none"
                                                />
                                                <input 
                                                    type="email" 
                                                    value={auth.email}
                                                    onChange={(e) => handleAuthorityChange(auth.id, 'email', e.target.value)}
                                                    placeholder="Email de contacto"
                                                    className="w-full text-center text-xs text-text-secondary border-b border-secondary/30 focus:border-primary outline-none bg-transparent"
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-xl font-bold text-text-primary">{auth.name}</h3>
                                                <p className="text-sm font-bold text-primary mb-3">{auth.position}</p>
                                                <p className="text-sm text-text-secondary leading-relaxed mb-4 flex-grow">{auth.bio}</p>
                                                {auth.email && (
                                                    <span className="text-xs text-text-secondary bg-secondary/10 px-3 py-1 rounded-full">{auth.email}</span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {(isEditing ? editForm?.authorities : info.authorities).length === 0 && (
                            <div className="text-center p-12 text-text-secondary border-2 border-dashed border-secondary/20 rounded-xl">
                                No hay miembros registrados en el equipo.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgramInfoModule;
