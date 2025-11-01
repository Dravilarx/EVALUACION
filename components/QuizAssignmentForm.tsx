import React, { useState, useEffect, useMemo } from 'react';
import { Quiz, Student } from '../types';
import { CloseIcon, CalendarIcon, AssignUserIcon } from './icons';

interface QuizAssignmentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (quizId: string, updatedData: Partial<Quiz>) => void;
    quiz: Quiz;
    allStudents: Student[];
}

const QuizAssignmentForm: React.FC<QuizAssignmentFormProps> = ({ isOpen, onClose, onSave, quiz, allStudents }) => {
    const [assignedStudents, setAssignedStudents] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [timeLimit, setTimeLimit] = useState(quiz.tiempo_limite_minutos);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen && quiz) {
            setAssignedStudents(quiz.alumnos_asignados);
            const toLocalISOString = (date: Date) => {
                const tzoffset = (new Date()).getTimezoneOffset() * 60000;
                const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, -1);
                return localISOTime.substring(0, 16);
            };
            setStartDate(toLocalISOString(new Date(quiz.ventana_disponibilidad.inicio)));
            setEndDate(toLocalISOString(new Date(quiz.ventana_disponibilidad.fin)));
            setTimeLimit(quiz.tiempo_limite_minutos);
            setSearchTerm(''); // Reset search on open
        }
    }, [quiz, isOpen]);

    const filteredStudents = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) return allStudents;
        return allStudents.filter(student =>
            student.name.toLowerCase().includes(lowercasedFilter) ||
            student.course.toLowerCase().includes(lowercasedFilter)
        );
    }, [allStudents, searchTerm]);

    if (!isOpen || !quiz) return null;

    const handleStudentToggle = (studentId: string) => {
        setAssignedStudents(prev => 
            prev.includes(studentId) 
                ? prev.filter(id => id !== studentId) 
                : [...prev, studentId]
        );
    };

    const handleSelectAllFiltered = () => {
        const filteredStudentIds = filteredStudents.map(s => s.id);
        const allFilteredSelected = filteredStudentIds.every(id => assignedStudents.includes(id));
        
        if (allFilteredSelected) {
            setAssignedStudents(prev => prev.filter(id => !filteredStudentIds.includes(id)));
        } else {
            setAssignedStudents(prev => [...new Set([...prev, ...filteredStudentIds])]);
        }
    };

    const areAllFilteredSelected = useMemo(() => {
       if (filteredStudents.length === 0) return false;
       return filteredStudents.every(s => assignedStudents.includes(s.id));
    }, [filteredStudents, assignedStudents]);

    const handleSave = () => {
        const updatedData: Partial<Quiz> = {
            alumnos_asignados: assignedStudents,
            tiempo_limite_minutos: timeLimit,
            ventana_disponibilidad: {
                inicio: new Date(startDate).toISOString(),
                fin: new Date(endDate).toISOString(),
            },
        };
        onSave(quiz.id_cuestionario, updatedData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-secondary/20 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold">Asignar Cuestionario</h3>
                        <p className="text-sm text-text-secondary">{quiz.titulo}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary/50"><CloseIcon /></button>
                </header>
                
                <main className="p-6 overflow-y-auto space-y-4">
                    <div className="space-y-2">
                         <h4 className="font-semibold text-accent flex items-center gap-2"><AssignUserIcon /> Alumnos</h4>
                         <input 
                             type="text"
                             placeholder="Buscar por nombre o curso..."
                             value={searchTerm}
                             onChange={e => setSearchTerm(e.target.value)}
                             className="w-full bg-background border border-secondary/30 rounded p-2 mb-2"
                         />
                         <div className="bg-background p-3 rounded-lg max-h-60 overflow-y-auto border border-secondary/30">
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-secondary/30">
                                <label htmlFor="select-all" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        id="select-all"
                                        checked={areAllFilteredSelected}
                                        onChange={handleSelectAllFiltered}
                                        className="form-checkbox text-primary focus:ring-primary"
                                    />
                                    Seleccionar Todos (Filtrados)
                                </label>
                                <span className="text-xs text-text-secondary">{assignedStudents.length} / {allStudents.length} seleccionados</span>
                            </div>
                            <div className="space-y-1">
                                {filteredStudents.map(student => (
                                    <label key={student.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/20 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={assignedStudents.includes(student.id)}
                                            onChange={() => handleStudentToggle(student.id)}
                                            className="form-checkbox text-primary focus:ring-primary"
                                        />
                                        <div>
                                            <p className="font-medium">{student.name}</p>
                                            <p className="text-xs text-text-secondary">{student.id} - {student.course}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                         </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-accent flex items-center gap-2"><CalendarIcon /> Configuración de Disponibilidad</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-background p-3 rounded-lg border border-secondary/30">
                             <div>
                                <label className="block text-sm font-medium text-text-secondary">Inicio</label>
                                <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-surface border border-secondary/30 rounded p-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">Fin</label>
                                <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-surface border border-secondary/30 rounded p-2 text-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-text-secondary">Tiempo Límite (minutos)</label>
                                <input type="number" min="1" value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value, 10))} className="w-full bg-surface border border-secondary/30 rounded p-2 text-sm" />
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="p-4 border-t border-secondary/20 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark font-semibold transition-colors">Guardar Asignación</button>
                </footer>
            </div>
        </div>
    );
};

export default QuizAssignmentForm;