import React, { useState, useMemo } from 'react';
import { Quiz, Question, StudentStats, QuestionStats, QuizStats } from '../types';

type Tab = 'alumnos' | 'preguntas' | 'cuestionarios';

interface StatsDashboardProps {
    studentStats: StudentStats[];
    questionStats: QuestionStats[];
    quizStats: QuizStats[];
    quizzes: Quiz[];
    questions: Question[];
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
            active ? 'bg-surface border-b-2 border-accent text-accent' : 'text-text-secondary hover:bg-surface/50'
        }`}
    >
        {children}
    </button>
);

const StatisticsDashboard: React.FC<StatsDashboardProps> = ({ studentStats, questionStats, quizStats, quizzes, questions }) => {
    const [activeTab, setActiveTab] = useState<Tab>('alumnos');

    // Filters state
    const [studentFilter, setStudentFilter] = useState('');
    const [questionFilter, setQuestionFilter] = useState({ text: '', especialidad: '', docente: '' });
    const [quizFilter, setQuizFilter] = useState({ text: '', asignatura: '', docente: '' });

    // Memoized filter options
    const questionDocentes = useMemo(() => [...new Set(questions.map(q => q.docente_creador))], [questions]);
    const questionEspecialidades = useMemo(() => [...new Set(questions.map(q => q.especialidad))], [questions]);
    const quizDocentes = useMemo(() => [...new Set(quizzes.map(q => q.docente_creador))], [quizzes]);
    const quizAsignaturas = useMemo(() => [...new Set(quizzes.map(q => q.asignatura))], [quizzes]);

    // Memoized filtered data
    const filteredStudentStats = useMemo(() => {
        const searchText = studentFilter.toLowerCase();
        if (!searchText) return studentStats;
        return studentStats.filter(s => 
            s.studentName.toLowerCase().includes(searchText) || 
            s.studentCourse.toLowerCase().includes(searchText)
        );
    }, [studentStats, studentFilter]);

    const filteredQuestionStats = useMemo(() => {
        return questionStats.filter(q => {
            const searchText = questionFilter.text.toLowerCase();
            const textMatch = !searchText || q.enunciado.toLowerCase().includes(searchText);
            const especialidadMatch = !questionFilter.especialidad || q.especialidad === questionFilter.especialidad;
            const docenteMatch = !questionFilter.docente || q.docente_creador === questionFilter.docente;
            return textMatch && especialidadMatch && docenteMatch;
        });
    }, [questionStats, questionFilter]);
    
    const filteredQuizStats = useMemo(() => {
        return quizStats.filter(q => {
            const searchText = quizFilter.text.toLowerCase();
            const textMatch = !searchText || q.quizTitle.toLowerCase().includes(searchText);
            const asignaturaMatch = !quizFilter.asignatura || q.asignatura === quizFilter.asignatura;
            const docenteMatch = !quizFilter.docente || q.docente_creador === quizFilter.docente;
            return textMatch && asignaturaMatch && docenteMatch;
        });
    }, [quizStats, quizFilter]);


    const renderContent = () => {
        switch (activeTab) {
            case 'alumnos':
                return (
                    <div className="space-y-4">
                        <input type="text" placeholder="Buscar por nombre o curso de alumno..." value={studentFilter} onChange={e => setStudentFilter(e.target.value)} className="w-full bg-background border border-secondary/30 rounded p-2" />
                        <div className="bg-surface rounded-lg shadow-md border border-secondary/20 max-h-[60vh] overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-secondary/20 sticky top-0">
                                    <tr>
                                        <th className="p-3">Alumno</th>
                                        <th className="p-3">Curso</th>
                                        <th className="p-3 text-center">Intentos</th>
                                        <th className="p-3 text-center">Nota Media</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudentStats.map(s => (
                                        <tr key={s.studentId} className="border-b border-secondary/20 hover:bg-secondary/10">
                                            <td className="p-3 font-medium">{s.studentName}</td>
                                            <td className="p-3 text-text-secondary">{s.studentCourse}</td>
                                            <td className="p-3 text-center">{s.attemptCount}</td>
                                            <td className="p-3 text-center font-semibold">{s.averageScore.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'preguntas':
                 return (
                    <div className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="text" placeholder="Buscar por enunciado..." value={questionFilter.text} onChange={e => setQuestionFilter(prev => ({...prev, text: e.target.value}))} className="w-full bg-background border border-secondary/30 rounded p-2 md:col-span-3" />
                             <select value={questionFilter.especialidad} onChange={e => setQuestionFilter(prev => ({...prev, especialidad: e.target.value}))} className="w-full bg-background border border-secondary/30 rounded p-2">
                                 <option value="">Toda Especialidad</option>
                                 {questionEspecialidades.map(e => <option key={e} value={e}>{e}</option>)}
                             </select>
                             <select value={questionFilter.docente} onChange={e => setQuestionFilter(prev => ({...prev, docente: e.target.value}))} className="w-full bg-background border border-secondary/30 rounded p-2">
                                 <option value="">Todo Docente</option>
                                 {questionDocentes.map(d => <option key={d} value={d}>{d}</option>)}
                             </select>
                         </div>
                        <div className="bg-surface rounded-lg shadow-md border border-secondary/20 max-h-[60vh] overflow-y-auto">
                           <table className="w-full text-sm text-left">
                                <thead className="bg-secondary/20 sticky top-0">
                                    <tr>
                                        <th className="p-3 w-2/4">Pregunta</th>
                                        <th className="p-3">Especialidad</th>
                                        <th className="p-3 text-center">Intentos</th>
                                        <th className="p-3 text-center">% Acierto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQuestionStats.sort((a,b) => a.successRate - b.successRate).map(q => (
                                        <tr key={q.codigo_pregunta} className="border-b border-secondary/20 hover:bg-secondary/10">
                                            <td className="p-3">
                                                <p className="font-medium truncate" title={q.enunciado}>{q.enunciado}</p>
                                                <p className="text-xs text-text-secondary font-mono">{q.codigo_pregunta}</p>
                                            </td>
                                            <td className="p-3 text-text-secondary">{q.especialidad}</td>
                                            <td className="p-3 text-center">{q.totalAnswers}</td>
                                            <td className={`p-3 text-center font-semibold ${q.successRate < 40 ? 'text-danger' : q.successRate > 80 ? 'text-success' : ''}`}>{q.successRate.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'cuestionarios':
                 return (
                    <div className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="text" placeholder="Buscar por título..." value={quizFilter.text} onChange={e => setQuizFilter(prev => ({...prev, text: e.target.value}))} className="w-full bg-background border border-secondary/30 rounded p-2 md:col-span-3" />
                             <select value={quizFilter.asignatura} onChange={e => setQuizFilter(prev => ({...prev, asignatura: e.target.value}))} className="w-full bg-background border border-secondary/30 rounded p-2">
                                 <option value="">Toda Asignatura</option>
                                 {quizAsignaturas.map(a => <option key={a} value={a}>{a}</option>)}
                             </select>
                             <select value={quizFilter.docente} onChange={e => setQuizFilter(prev => ({...prev, docente: e.target.value}))} className="w-full bg-background border border-secondary/30 rounded p-2">
                                 <option value="">Todo Docente</option>
                                 {quizDocentes.map(d => <option key={d} value={d}>{d}</option>)}
                             </select>
                         </div>
                        <div className="bg-surface rounded-lg shadow-md border border-secondary/20 max-h-[60vh] overflow-y-auto">
                           <table className="w-full text-sm text-left">
                                <thead className="bg-secondary/20 sticky top-0">
                                    <tr>
                                        <th className="p-3 w-2/4">Cuestionario</th>
                                        <th className="p-3">Asignatura</th>
                                        <th className="p-3 text-center">Participantes</th>
                                        <th className="p-3 text-center">Nota Media</th>
                                        <th className="p-3 text-center">Tiempo Medio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQuizStats.map(q => (
                                        <tr key={q.quizId} className="border-b border-secondary/20 hover:bg-secondary/10">
                                            <td className="p-3 font-medium">{q.quizTitle}</td>
                                            <td className="p-3 text-text-secondary">{q.asignatura}</td>
                                            <td className="p-3 text-center">{q.participantCount}</td>
                                            <td className="p-3 text-center font-semibold">{q.averageScore.toFixed(1)}%</td>
                                            <td className="p-3 text-center">{Math.round(q.averageTimeSeconds / 60)} min</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Panel de Estadísticas</h2>
            
            <div className="border-b border-secondary/20">
                <TabButton active={activeTab === 'alumnos'} onClick={() => setActiveTab('alumnos')}>Por Alumno</TabButton>
                <TabButton active={activeTab === 'preguntas'} onClick={() => setActiveTab('preguntas')}>Por Pregunta</TabButton>
                <TabButton active={activeTab === 'cuestionarios'} onClick={() => setActiveTab('cuestionarios')}>Por Cuestionario</TabButton>
            </div>
            
            <div className="mt-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default StatisticsDashboard;