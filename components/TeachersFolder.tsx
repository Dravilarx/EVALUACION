
import React, { useState, useEffect, useMemo } from 'react';
import { Teacher, Annotation, Activity, Student, Subject, Quiz, Attempt, CompetencyEvaluation, PresentationEvaluation, SurveyResult, MentorshipSlot } from '../types';
import { TeacherService, AnnotationService, ActivityService, StudentService, SubjectService, QuizService, AttemptService, CompetencyService, PresentationService, SurveyService, MentorshipService } from '../services/dataService';
import { FolderIcon, BriefcaseIcon, ThumbUpIcon, ThumbDownIcon, ChatBubbleLeftRightIcon, GlobeIcon, ClipboardCheckIcon, ChartBarIcon, ScreenIcon, ArrowUpRightIcon, CheckCircleIcon, BellIcon, CalendarIcon } from './icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface TeachersFolderProps {
    currentUserId: string;
    onNavigateToEvaluation: (module: 'surveys' | 'presentation', studentId: string, subjectId: string) => void;
}

const TeachersFolder: React.FC<TeachersFolderProps> = ({ currentUserId, onNavigateToEvaluation }) => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    
    // Data for Pending Calculation
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [competencies, setCompetencies] = useState<CompetencyEvaluation[]>([]);
    const [presentations, setPresentations] = useState<PresentationEvaluation[]>([]);
    const [surveys, setSurveys] = useState<SurveyResult[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'annotations' | 'activities' | 'mentorship' | 'feedback'>('pending');

    // Mentorship Data
    const [mentorshipSlots, setMentorshipSlots] = useState<MentorshipSlot[]>([]);

    useEffect(() => {
        const loadData = async () => {
            const [tData, sData, subData, qData, aData, cData, pData, survData] = await Promise.all([
                TeacherService.getAll(),
                StudentService.getAll(),
                SubjectService.getAll(),
                QuizService.getAll(),
                AttemptService.getAll(),
                CompetencyService.getAll(),
                PresentationService.getAll(),
                SurveyService.getAll()
            ]);
            setTeachers(tData);
            setStudents(sData);
            setSubjects(subData);
            setQuizzes(qData);
            setAttempts(aData);
            setCompetencies(cData);
            setPresentations(pData);
            setSurveys(survData);
            setLoading(false);
        };
        loadData();
    }, [currentUserId]);

    useEffect(() => {
        const loadDetails = async () => {
            if (selectedTeacher) {
                const [notes, acts, slots] = await Promise.all([
                    AnnotationService.getByTarget(selectedTeacher.id),
                    ActivityService.getByParticipant(selectedTeacher.id),
                    MentorshipService.getByTeacher(selectedTeacher.id)
                ]);
                setAnnotations(notes);
                setActivities(acts);
                setMentorshipSlots(slots);
            }
        };
        loadDetails();
    }, [selectedTeacher]);

    // Logic to calculate Pending Evaluations
    const pendingEvaluations = useMemo(() => {
        if (!selectedTeacher) return [];

        const pendingItems: Array<{
            studentId: string;
            studentName: string;
            subjectId: string;
            subjectName: string;
            missingType: 'Competency' | 'Presentation';
        }> = [];

        subjects.forEach(subject => {
            const isLead = subject.lead_teacher_id === selectedTeacher.id;
            const isParticipant = subject.participating_teachers_ids.includes(selectedTeacher.id);
            
            if (isLead || isParticipant || currentUserId === 'DOCENTE') {
                const subjectQuizzes = quizzes.filter(q => q.asignatura === subject.name || q.asignatura === "Interdisciplinario");
                
                students.forEach(student => {
                    const hasWrittenGrade = subjectQuizzes.some(quiz => 
                        attempts.some(a => a.id_cuestionario === quiz.id_cuestionario && a.alumno_id === student.id && (a.estado === 'entregado' || a.estado === 'pendiente_revision'))
                    );

                    if (hasWrittenGrade) {
                        const hasCompetency = competencies.some(c => c.studentId === student.id && c.subjectId === subject.id);
                        if (!hasCompetency) {
                            pendingItems.push({
                                studentId: student.id,
                                studentName: student.name,
                                subjectId: subject.id,
                                subjectName: subject.name,
                                missingType: 'Competency'
                            });
                        }

                        const hasPresentation = presentations.some(p => p.studentId === student.id && p.subjectId === subject.id);
                        if (!hasPresentation) {
                            pendingItems.push({
                                studentId: student.id,
                                studentName: student.name,
                                subjectId: subject.id,
                                subjectName: subject.name,
                                missingType: 'Presentation'
                            });
                        }
                    }
                });
            }
        });

        return pendingItems;
    }, [selectedTeacher, subjects, students, quizzes, attempts, competencies, presentations, currentUserId]);

    // Feedback Chart Data
    const feedbackData = useMemo(() => {
        if (!selectedTeacher) return [];
        // Filter surveys for this teacher
        const teacherSurveys = surveys.filter(s => s.teacherId === selectedTeacher.id && s.status !== 'Pending');
        
        // Mocking monthly aggregation for demo since dates are mostly current
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        return months.map(month => {
            // Generate pseudo-random average between 4.0 and 7.0 for visualization
            const base = 5.5;
            const variation = (Math.random() * 2) - 1; 
            return {
                name: month,
                rating: parseFloat((base + variation).toFixed(1))
            };
        });
    }, [selectedTeacher, surveys]);

    const handleSlotClick = async (day: string, hour: string) => {
        // Teacher interaction in Folder: Toggle Availability only.
        // Assuming Folder is mostly teacher-facing for management.
        if (!selectedTeacher) return;

        const existingSlot = mentorshipSlots.find(s => s.day === day && s.hour === hour);

        if (existingSlot) {
            if (existingSlot.status === 'booked' && !confirm(`¿Cancelar reserva de ${existingSlot.studentName}?`)) {
                return;
            }
            await MentorshipService.delete(existingSlot.id);
            setMentorshipSlots(prev => prev.filter(s => s.id !== existingSlot.id));
        } else {
            const newSlot: MentorshipSlot = {
                id: `MS-${Date.now()}`,
                teacherId: selectedTeacher.id,
                day,
                hour,
                status: 'available'
            };
            await MentorshipService.create(newSlot);
            setMentorshipSlots(prev => [...prev, newSlot]);
        }
    };

    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-100px)] animate-fade-in-up">
            
            {/* Top Selection Panel */}
            <div className="w-full bg-surface rounded-xl shadow-sm border border-secondary/20 p-4 flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <BriefcaseIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Carpeta Docente</h2>
                        <p className="text-sm text-text-secondary">Seleccione un docente para revisar su actividad</p>
                    </div>
                </div>
                
                <div className="w-full md:w-80">
                    <select
                        className="w-full p-2.5 bg-background border border-secondary/30 rounded-lg outline-none focus:ring-2 focus:ring-primary text-text-primary shadow-sm"
                        value={selectedTeacher?.id || ''}
                        onChange={(e) => {
                            const teacher = teachers.find(t => t.id === e.target.value);
                            setSelectedTeacher(teacher || null);
                        }}
                    >
                        <option value="">-- Seleccionar Docente --</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className={`w-full flex-grow bg-surface rounded-xl shadow-sm border border-secondary/20 flex flex-col overflow-hidden relative`}>
                {selectedTeacher ? (
                    <div className="flex flex-col h-full">
                        {/* Header Profile */}
                        <div className="p-6 border-b border-secondary/20 bg-gradient-to-r from-primary/5 to-transparent">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                                    {selectedTeacher.photo_url ? <img src={selectedTeacher.photo_url} className="w-full h-full object-cover" /> : <FolderIcon className="h-8 w-8 text-primary"/>}
                                </div>
                                <div className="flex-grow">
                                    <h2 className="text-2xl font-bold text-text-primary">{selectedTeacher.name}</h2>
                                    <p className="text-text-secondary">{selectedTeacher.rank}</p>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">{selectedTeacher.contract_hours} Hrs</span>
                                        <span className="bg-secondary/10 text-text-secondary px-2 py-0.5 rounded text-xs">{selectedTeacher.email_ua}</span>
                                        {selectedTeacher.subSpecialties?.map(sub => (
                                            <span key={sub} className="bg-cyan-50 text-cyan-600 border border-cyan-100 px-2 py-0.5 rounded text-xs">{sub}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Tabs */}
                            <div className="flex gap-6 mt-6 border-b border-secondary/10 overflow-x-auto">
                                <button 
                                    onClick={() => setActiveTab('pending')}
                                    className={`pb-2 px-1 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    Evaluaciones Pendientes
                                    {pendingEvaluations.length > 0 && <span className="bg-danger text-white text-[10px] px-1.5 rounded-full shadow-sm">{pendingEvaluations.length}</span>}
                                </button>
                                <button 
                                    onClick={() => setActiveTab('annotations')}
                                    className={`pb-2 px-1 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'annotations' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    Observaciones
                                </button>
                                <button 
                                    onClick={() => setActiveTab('activities')}
                                    className={`pb-2 px-1 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'activities' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    Extensión
                                </button>
                                <button 
                                    onClick={() => setActiveTab('mentorship')}
                                    className={`pb-2 px-1 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'mentorship' ? 'border-purple-600 text-purple-600' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    Mentoría
                                </button>
                                <button 
                                    onClick={() => setActiveTab('feedback')}
                                    className={`pb-2 px-1 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'feedback' ? 'border-orange-500 text-orange-500' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                                >
                                    Evolución Docente
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-grow overflow-y-auto p-6 bg-background/30">
                            
                            {/* Notification Banner */}
                            {pendingEvaluations.length > 0 && activeTab !== 'pending' && (
                                <div className="mb-6 bg-warning/10 border border-warning/30 p-4 rounded-xl flex items-start gap-4 shadow-sm animate-fade-in-down">
                                    <div className="p-2 bg-warning/20 rounded-full text-warning shrink-0">
                                        <BellIcon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-text-primary">
                                            {selectedTeacher.id === currentUserId ? 'Tienes' : 'El docente tiene'} {pendingEvaluations.length} evaluación(es) pendiente(s)
                                        </h4>
                                        <div className="mt-2 space-y-1">
                                            <button onClick={() => setActiveTab('pending')} className="block text-xs text-text-secondary hover:text-primary hover:underline text-left">
                                                • Ver evaluaciones pendientes de cierre
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Pending Evaluations Tab */}
                            {activeTab === 'pending' && (
                                <>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                                            <ClipboardCheckIcon className="h-5 w-5 text-warning" /> Pendientes de Cierre
                                        </h3>
                                        <span className="text-xs text-text-secondary bg-surface px-2 py-1 rounded border border-secondary/20">
                                            Se activan tras la nota escrita
                                        </span>
                                    </div>

                                    {pendingEvaluations.length === 0 ? (
                                        <div className="text-center p-12 border-2 border-dashed border-secondary/20 rounded-xl">
                                            <CheckCircleIcon className="h-12 w-12 text-success/50 mx-auto mb-3" />
                                            <p className="text-text-primary font-bold">¡Todo al día!</p>
                                            <p className="text-text-secondary text-sm">No hay evaluaciones pendientes para los alumnos con nota escrita.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {pendingEvaluations.map((item, index) => (
                                                <div key={`${item.studentId}-${item.subjectId}-${item.missingType}-${index}`} className="bg-surface p-5 rounded-xl shadow-sm border border-secondary/20 hover:border-primary/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in-up">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`p-3 rounded-lg ${item.missingType === 'Competency' ? 'bg-indigo-50 text-indigo-600' : 'bg-cyan-50 text-cyan-600'}`}>
                                                            {item.missingType === 'Competency' ? <ChartBarIcon className="h-6 w-6" /> : <ScreenIcon className="h-6 w-6" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-bold bg-warning/10 text-warning px-2 py-0.5 rounded border border-warning/20">PENDIENTE</span>
                                                                <span className="text-xs text-text-secondary">{item.missingType === 'Competency' ? 'Competencias Personales' : 'Presentación'}</span>
                                                            </div>
                                                            <h4 className="font-bold text-text-primary text-lg">{item.studentName}</h4>
                                                            <p className="text-sm text-text-secondary">{item.subjectName}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <button 
                                                        onClick={() => onNavigateToEvaluation(
                                                            item.missingType === 'Competency' ? 'surveys' : 'presentation',
                                                            item.studentId,
                                                            item.subjectId
                                                        )}
                                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm shadow-md transition-all text-white
                                                            ${item.missingType === 'Competency' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-cyan-600 hover:bg-cyan-700'}
                                                        `}
                                                    >
                                                        {item.missingType === 'Competency' ? 'Evaluar Competencias' : 'Evaluar Presentación'}
                                                        <ArrowUpRightIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Mentorship Calendar Tab */}
                            {activeTab === 'mentorship' && (
                                <div className="animate-fade-in-up">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                                            <CalendarIcon className="h-5 w-5 text-purple-600" /> Disponibilidad para Mentoría
                                        </h3>
                                        <div className="text-xs text-text-secondary flex gap-4">
                                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 rounded"></div> Disponible</span>
                                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded"></div> Reservado</span>
                                            <span className="flex items-center gap-1"><div className="w-3 h-3 border border-secondary/20 bg-surface rounded"></div> No Disponible</span>
                                        </div>
                                    </div>
                                    
                                    <div className="overflow-x-auto bg-background/50 p-4 rounded-xl border border-secondary/10">
                                        <div className="min-w-[600px] grid grid-cols-6 gap-2">
                                            <div className="p-2"></div> {/* Corner */}
                                            {days.map(day => (
                                                <div key={day} className="text-center font-bold text-text-secondary py-2">{day}</div>
                                            ))}
                                            
                                            {hours.map(hour => (
                                                <React.Fragment key={hour}>
                                                    <div className="text-right pr-4 text-xs font-mono text-text-secondary py-3 flex items-center justify-end">{hour}</div>
                                                    {days.map(day => {
                                                        const slot = mentorshipSlots.find(s => s.day === day && s.hour === hour);
                                                        const isAvailable = slot?.status === 'available';
                                                        const isBooked = slot?.status === 'booked';
                                                        
                                                        let cellClass = "bg-surface border-secondary/20 opacity-50"; 
                                                        let title = "Click para habilitar";
                                                        let content = "";

                                                        if (isBooked) {
                                                            cellClass = "bg-red-500 border-red-600 text-white hover:bg-red-600";
                                                            title = `Reservado por ${slot.studentName}`;
                                                            content = slot.studentName?.split(' ')[0] || "Ocupado";
                                                        } else if (isAvailable) {
                                                            cellClass = "bg-purple-500 border-purple-600 text-white hover:bg-purple-600";
                                                            title = "Disponible (Click para eliminar)";
                                                            content = "Libre";
                                                        } else {
                                                            cellClass += " hover:bg-secondary/10";
                                                        }

                                                        return (
                                                            <button
                                                                key={`${day}-${hour}`}
                                                                onClick={() => handleSlotClick(day, hour)}
                                                                className={`rounded-lg transition-all border h-10 flex items-center justify-center text-[10px] font-bold ${cellClass}`}
                                                                title={title}
                                                            >
                                                                {content}
                                                            </button>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-secondary mt-4 text-center">
                                        * Haz clic en los bloques para gestionar disponibilidad. Las reservas aparecen en rojo.
                                    </p>
                                </div>
                            )}

                            {/* Feedback Chart Tab */}
                            {activeTab === 'feedback' && (
                                <div className="animate-fade-in-up h-full flex flex-col">
                                    <h3 className="font-bold text-lg text-text-primary mb-6 flex items-center gap-2">
                                        <ChartBarIcon className="h-5 w-5 text-orange-500" /> Evolución de Calificación Docente
                                    </h3>
                                    
                                    <div className="bg-surface p-6 rounded-xl border border-secondary/20 shadow-sm flex-grow min-h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={feedbackData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                                                <YAxis domain={[1, 7]} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                                                <Tooltip 
                                                    cursor={{fill: '#f1f5f9'}}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Bar dataKey="rating" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} name="Calificación Promedio" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="text-xs text-text-secondary mt-4 text-center">
                                        Promedio mensual basado en encuestas estudiantiles anónimas (Escala 1.0 - 7.0).
                                    </p>
                                </div>
                            )}

                            {/* Annotations Tab */}
                            {activeTab === 'annotations' && (
                                <>
                                    <h3 className="font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
                                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-accent" /> Registro de Observaciones
                                    </h3>
                                    
                                    {annotations.length === 0 ? (
                                        <div className="text-center p-8 border-2 border-dashed border-secondary/20 rounded-xl">
                                            <p className="text-text-secondary">No hay anotaciones registradas.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-secondary/20">
                                            {annotations.map(note => (
                                                <div key={note.id} className="relative pl-10">
                                                    <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-surface ${note.type === 'Positive' ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                                                        {note.type === 'Positive' ? <ThumbUpIcon className="h-4 w-4" /> : <ThumbDownIcon className="h-4 w-4" />}
                                                    </div>
                                                    <div className="bg-surface p-4 rounded-xl shadow-sm border border-secondary/20">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${note.type === 'Positive' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                                {note.type === 'Positive' ? 'Reconocimiento' : 'Observación'}
                                                            </span>
                                                            <span className="text-xs text-text-secondary">{new Date(note.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-sm text-text-primary mb-2 leading-relaxed">"{note.content}"</p>
                                                        <p className="text-xs text-text-secondary italic">Registrado por: {note.authorId}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Activities Tab */}
                            {activeTab === 'activities' && (
                                <>
                                    <h3 className="font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
                                        <GlobeIcon className="h-5 w-5 text-cyan-600" /> Actividades y Extensión
                                    </h3>
                                    
                                    {activities.length === 0 ? (
                                        <div className="text-center p-8 border-2 border-dashed border-secondary/20 rounded-xl">
                                            <p className="text-text-secondary">No hay actividades registradas.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {activities.map(activity => (
                                                <div key={activity.id} className="bg-surface p-4 rounded-xl shadow-sm border border-secondary/20 flex gap-4 transition-all hover:shadow-md">
                                                    <div className="flex-shrink-0 w-12 text-center bg-cyan-50 rounded-lg py-2 border border-cyan-100">
                                                        <div className="text-xs font-bold text-cyan-600 uppercase">{new Date(activity.date).getFullYear()}</div>
                                                        <div className="text-xs text-cyan-800">{new Date(activity.date).toLocaleDateString('es-ES', { month: 'short' })}</div>
                                                    </div>
                                                    <div className="flex-grow">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="font-bold text-text-primary">{activity.title}</h4>
                                                            <span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded font-bold">{activity.type}</span>
                                                        </div>
                                                        <p className="text-xs text-text-secondary mb-2">{activity.institution} • Rol: {activity.role}</p>
                                                        <p className="text-sm text-text-primary leading-relaxed bg-background/50 p-2 rounded border border-secondary/10">
                                                            {activity.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-60 p-8">
                        <FolderIcon className="h-16 w-16 text-primary mb-4" />
                        <h3 className="text-xl font-bold text-text-primary">Selecciona un Docente</h3>
                        <p className="text-text-secondary">Para ver sus registros y evaluaciones pendientes.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeachersFolder;
