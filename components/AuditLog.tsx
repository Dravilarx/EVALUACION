
import React, { useState, useEffect } from 'react';
import { LogEntry } from '../types';
import { LogService } from '../services/dataService';
import { TerminalIcon, RefreshIcon, FilterIcon, ClockIcon } from './icons';

const AuditLog: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState<string>('');
    const [filterUser, setFilterUser] = useState<string>('');

    const fetchLogs = async () => {
        setLoading(true);
        const data = await LogService.getAll();
        setLogs(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchAction = filterAction ? log.action === filterAction : true;
        const matchUser = filterUser ? log.userName.toLowerCase().includes(filterUser.toLowerCase()) : true;
        return matchAction && matchUser;
    });

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center bg-surface p-5 rounded-xl border border-secondary/20 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <TerminalIcon className="h-6 w-6 text-primary" /> Bitácora de Auditoría
                    </h2>
                    <p className="text-sm text-text-secondary">Registro histórico de acciones del sistema.</p>
                </div>
                <button onClick={fetchLogs} className="p-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-primary transition-colors">
                    <RefreshIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-surface p-4 rounded-lg border border-secondary/20">
                <FilterIcon className="text-secondary h-5 w-5" />
                <select 
                    value={filterAction} 
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="bg-background border border-secondary/30 rounded px-3 py-1.5 text-sm"
                >
                    <option value="">Todas las Acciones</option>
                    <option value="LOGIN">Inicio de Sesión</option>
                    <option value="CREATE">Creación</option>
                    <option value="UPDATE">Edición</option>
                    <option value="DELETE">Eliminación</option>
                    <option value="REQUEST">Solicitud Cambio</option>
                </select>
                <input 
                    type="text" 
                    placeholder="Filtrar por usuario..." 
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="bg-background border border-secondary/30 rounded px-3 py-1.5 text-sm flex-grow"
                />
            </div>

            {/* Logs Table */}
            <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/10 text-text-secondary uppercase text-xs font-bold">
                        <tr>
                            <th className="p-4 w-40">Fecha / Hora</th>
                            <th className="p-4 w-32">Acción</th>
                            <th className="p-4 w-48">Usuario</th>
                            <th className="p-4 w-32">Rol</th>
                            <th className="p-4">Detalle</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary/10">
                        {filteredLogs.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-text-secondary">No se encontraron registros.</td></tr>
                        ) : (
                            filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-background/50 font-mono text-xs">
                                    <td className="p-4 text-text-secondary flex items-center gap-2">
                                        <ClockIcon className="h-3 w-3" />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                            log.action === 'DELETE' ? 'bg-danger/10 text-danger border-danger/20' :
                                            log.action === 'CREATE' ? 'bg-success/10 text-success border-success/20' :
                                            log.action === 'LOGIN' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                            log.action === 'REQUEST' ? 'bg-warning/10 text-warning border-warning/20' :
                                            'bg-secondary/10 text-text-secondary border-secondary/20'
                                        }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-text-primary">{log.userName}</td>
                                    <td className="p-4 text-text-secondary">{log.userRole}</td>
                                    <td className="p-4 text-text-primary">
                                        <span className="font-bold text-secondary mr-2">[{log.module}]</span>
                                        {log.details}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLog;
