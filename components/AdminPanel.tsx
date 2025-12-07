
import React, { useState } from 'react';
import { ServerIcon, UsersIcon, ShieldExclamationIcon, CheckCircleIcon, PlusIcon, CloseIcon, TrashIcon, EditIcon } from './icons';
import { UserRole } from '../types';

// Extended type for local state management including status
interface AdminUser {
    id: string;
    name: string;
    email: string;
    roles: UserRole[];
    isActive: boolean;
}

const AdminPanel: React.FC = () => {
    const [activeSection, setActiveSection] = useState<'users' | 'settings'>('users');
    
    // Local state for users management
    const [users, setUsers] = useState<AdminUser[]>([
        { id: '10611061', name: 'Marcelo Avila', email: 'marcelo.avila@uantof.cl', roles: ['ADMIN', 'TEACHER'], isActive: true },
        { id: 'DOCENTE', name: 'Dra. Ana Fuentes', email: 'ana.fuentes@ua.cl', roles: ['TEACHER'], isActive: true },
        { id: 'RES-001', name: 'Juan Pérez', email: 'juan.perez@ua.cl', roles: ['RESIDENT'], isActive: true },
    ]);

    // Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState<{ name: string; email: string; roles: Set<UserRole> }>({
        name: '',
        email: '',
        roles: new Set(['RESIDENT']) // Default role
    });

    const toggleUserStatus = (id: string) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
    };

    const handleDeleteUser = (id: string) => {
        if(confirm('¿Estás seguro de eliminar este usuario?')) {
            setUsers(prev => prev.filter(u => u.id !== id));
        }
    };

    const handleRoleChange = (role: UserRole) => {
        setNewUser(prev => {
            const newRoles = new Set(prev.roles);
            if (newRoles.has(role)) {
                newRoles.delete(role);
            } else {
                newRoles.add(role);
            }
            return { ...prev, roles: newRoles };
        });
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.name || !newUser.email || newUser.roles.size === 0) {
            alert('Por favor complete todos los campos y seleccione al menos un rol.');
            return;
        }

        const userToAdd: AdminUser = {
            id: `USER-${Date.now()}`,
            name: newUser.name,
            email: newUser.email,
            roles: Array.from(newUser.roles),
            isActive: true
        };

        setUsers(prev => [userToAdd, ...prev]);
        setIsModalOpen(false);
        setNewUser({ name: '', email: '', roles: new Set(['RESIDENT']) }); // Reset form
    };

    const availableRoles: UserRole[] = ['ADMIN', 'TEACHER', 'RESIDENT'];

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-surface p-6 rounded-xl border border-secondary/20 shadow-sm">
                <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <ServerIcon className="h-6 w-6 text-primary" /> Administración del Sistema
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                    Gestión de usuarios, roles y configuración global. Acceso exclusivo de Administrador.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="col-span-1 space-y-2">
                    <button 
                        onClick={() => setActiveSection('users')}
                        className={`w-full text-left px-4 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors ${activeSection === 'users' ? 'bg-primary text-white shadow-lg' : 'bg-surface text-text-secondary hover:bg-secondary/10'}`}
                    >
                        <UsersIcon className="h-5 w-5" /> Usuarios y Roles
                    </button>
                    <button 
                        onClick={() => setActiveSection('settings')}
                        className={`w-full text-left px-4 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors ${activeSection === 'settings' ? 'bg-primary text-white shadow-lg' : 'bg-surface text-text-secondary hover:bg-secondary/10'}`}
                    >
                        <ShieldExclamationIcon className="h-5 w-5" /> Configuración Global
                    </button>
                </div>

                {/* Content */}
                <div className="col-span-3 bg-surface rounded-xl border border-secondary/20 p-6 min-h-[400px]">
                    {activeSection === 'users' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-secondary/10 pb-4">
                                <h3 className="text-xl font-bold text-text-primary">Gestión de Usuarios</h3>
                                <button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
                                >
                                    <PlusIcon className="h-4 w-4" /> Nuevo Usuario
                                </button>
                            </div>
                            
                            <div className="bg-surface rounded-lg border border-secondary/20 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-secondary/10 uppercase text-xs font-bold text-text-secondary">
                                        <tr>
                                            <th className="p-4">Usuario / Email</th>
                                            <th className="p-4">Roles Asignados</th>
                                            <th className="p-4 text-center">Estado</th>
                                            <th className="p-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary/10">
                                        {users.map(user => (
                                            <tr key={user.id} className={`transition-colors ${!user.isActive ? 'bg-secondary/5 opacity-70' : 'hover:bg-background/50'}`}>
                                                <td className="p-4">
                                                    <div className="font-bold text-text-primary">{user.name}</div>
                                                    <div className="text-xs text-text-secondary">{user.email}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {user.roles.map(role => (
                                                            <span key={role} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border 
                                                                ${role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                                                                  role === 'TEACHER' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                                                                  'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                                                {role === 'TEACHER' ? 'DOCENTE' : role === 'RESIDENT' ? 'RESIDENTE' : 'ADMIN'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    {/* Custom Toggle Switch */}
                                                    <button 
                                                        onClick={() => toggleUserStatus(user.id)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${user.isActive ? 'bg-success' : 'bg-gray-300'}`}
                                                        title={user.isActive ? "Deshabilitar Usuario" : "Habilitar Usuario"}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                    <div className="text-[10px] mt-1 font-semibold text-text-secondary">
                                                        {user.isActive ? 'Habilitado' : 'Deshabilitado'}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button className="p-1.5 text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Editar">
                                                            <EditIcon className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-1.5 text-secondary hover:text-danger hover:bg-danger/10 rounded transition-colors" 
                                                            title="Eliminar"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSection === 'settings' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-text-primary border-b border-secondary/10 pb-2">Configuración del Sistema</h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-secondary/20 rounded-lg">
                                    <div>
                                        <p className="font-bold text-text-primary">Modo Mantenimiento</p>
                                        <p className="text-xs text-text-secondary">Deshabilita el acceso a residentes</p>
                                    </div>
                                    <div className="w-12 h-6 bg-secondary/30 rounded-full relative cursor-pointer">
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-secondary/20 rounded-lg">
                                    <div>
                                        <p className="font-bold text-text-primary">Notificaciones por Email</p>
                                        <p className="text-xs text-text-secondary">Enviar correos automáticos en bitácora</p>
                                    </div>
                                    <div className="w-12 h-6 bg-success rounded-full relative cursor-pointer">
                                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface w-full max-w-lg rounded-xl shadow-2xl flex flex-col border border-secondary/20 animate-fade-in-up">
                        <header className="p-5 border-b border-secondary/20 bg-secondary/5 rounded-t-xl flex justify-between items-center">
                            <h3 className="text-xl font-bold text-text-primary">Registrar Nuevo Usuario</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-secondary/20 rounded-full"><CloseIcon /></button>
                        </header>
                        
                        <form onSubmit={handleCreateUser} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-1.5">Nombre Completo</label>
                                <input 
                                    type="text" 
                                    value={newUser.name}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Ej: Dr. Juan Pérez"
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-1.5">Correo Electrónico</label>
                                <input 
                                    type="email" 
                                    value={newUser.email}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="ejemplo@uantof.cl"
                                    className="w-full bg-background border border-secondary/30 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-2">Roles Asignados</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {availableRoles.map(role => (
                                        <label key={role} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${newUser.roles.has(role) ? 'border-primary bg-primary/5' : 'border-secondary/20 hover:bg-secondary/5'}`}>
                                            <input 
                                                type="checkbox" 
                                                checked={newUser.roles.has(role)}
                                                onChange={() => handleRoleChange(role)}
                                                className="w-5 h-5 text-primary rounded focus:ring-primary"
                                            />
                                            <span className="font-medium text-text-primary">
                                                {role === 'ADMIN' ? 'Administrador (Acceso Total)' : role === 'TEACHER' ? 'Docente (Gestión Académica)' : 'Residente (Alumno)'}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors font-medium text-text-secondary"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-all"
                                >
                                    Crear Usuario
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
