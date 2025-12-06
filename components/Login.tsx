
import React, { useState } from 'react';
import { Student } from '../types';
import { SparklesIcon, BriefcaseIcon, UsersIcon } from './icons';

interface LoginProps {
    onLogin: (role: string, studentId?: string) => void;
    students: Student[];
}

const Login: React.FC<LoginProps> = ({ onLogin, students }) => {
    const [role, setRole] = useState<'admin' | 'resident'>('admin');
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate network request
        setTimeout(() => {
            if (role === 'admin') {
                onLogin('DOCENTE');
            } else {
                if (selectedStudent) {
                    onLogin(selectedStudent);
                }
            }
            setLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-text-primary p-4">
            <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-xl border border-secondary/20 relative overflow-hidden">
                
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl text-white font-bold text-3xl mb-4 shadow-lg bg-primary shadow-primary/30">
                        G
                    </div>
                    <h1 className="text-2xl font-bold">Bienvenido a GRUA</h1>
                    <p className="text-text-secondary mt-2 text-sm">Gestión Radiología Universidad Antofagasta</p>
                </div>

                <div className="flex bg-secondary/10 p-1 rounded-lg mb-6">
                    <button 
                        onClick={() => setRole('admin')}
                        className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${role === 'admin' ? 'bg-surface text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        <BriefcaseIcon className="h-4 w-4" /> Docente
                    </button>
                    <button 
                        onClick={() => setRole('resident')}
                        className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${role === 'resident' ? 'bg-surface text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        <UsersIcon className="h-4 w-4" /> Residente
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {role === 'admin' && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Correo Institucional</label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-background border border-secondary/30 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="admin@uantof.cl"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Contraseña</label>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-background border border-secondary/30 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </>
                    )}

                    {role === 'resident' && (
                        <div>
                             <label className="block text-xs font-semibold text-text-secondary mb-1.5">Seleccionar Residente (Demo)</label>
                             <select 
                                value={selectedStudent} 
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                className="w-full bg-background border border-secondary/30 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all appearance-none"
                                required
                             >
                                <option value="">Seleccione un usuario...</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} - {s.course}</option>
                                ))}
                             </select>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading || (role === 'resident' && !selectedStudent)}
                        className="w-full text-white font-semibold py-2.5 rounded-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 bg-primary hover:bg-primary-dark shadow-primary/25"
                    >
                        {loading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
                    </button>
                </form>

                <p className="text-center text-xs text-text-secondary mt-6">
                    © 2024 Departamento de Radiología UA
                </p>
            </div>
        </div>
    );
};

export default Login;
