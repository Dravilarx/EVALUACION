
import React, { useState, useEffect, useMemo } from 'react';
import { Teacher, Annotation, Activity, Student, Subject, Quiz, Attempt, CompetencyEvaluation, PresentationEvaluation } from '../types';
import { TeacherService, AnnotationService, ActivityService, StudentService, SubjectService, QuizService, AttemptService, CompetencyService, PresentationService } from '../services/dataService';
import { FolderIcon, BriefcaseIcon, ThumbUpIcon, ThumbDownIcon, ChatBubbleLeftRightIcon, GlobeIcon, ClipboardCheckIcon, ChartBarIcon, ScreenIcon, ArrowUpRightIcon, CheckCircleIcon } from './icons';

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
    
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'annotations' | 'activities'>('pending');

    useEffect(() => {
        const loadData = async () => {
            const [tData, sData, subData, qData, aData, cData, pData] = await Promise.all([
                TeacherService.getAll(),
                StudentService.getAll(),
                SubjectService.getAll(),
                QuizService.getAll(),
                AttemptService.getAll(),
                CompetencyService.getAll(),
                PresentationService.getAll()
            ]);
            setTeachers(tData);
            setStudents(sData);
            setSubjects(subData);
            setQuizzes(qData);
            setAttempts(aData);
            setCompetencies(cData);
            setPresentations(pData);
            setLoading(false);
        };
        loadData();
    }, [currentUserId]);

    useEffect(() => {
        const loadDetails = async () => {
            if (selectedTeacher) {
                const [notes, acts] = await Promise.all([
                    AnnotationService.getByTarget(selectedTeacher.id),
                    ActivityService.getByParticipant(selectedTeacher.id),
                ]);
                setAnnotations(notes);
                setActivities(acts);
            }
        };
        loadDetails();
    }, [selectedTeacher]);

    const filteredTeachers = teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Logic to calculate Pending Evaluations
    // Trigger: When a Written Grade (Quiz) exists for a student in a subject.
    const pendingEvaluations = useMemo(() => {
        if (!selectedTeacher) return [];

        const pendingItems: Array<{
            studentId: string;
            studentName: string;
            subjectId: string;
            subjectName: string;
            missingType: 'Competency' | 'Presentation';
        }> = [];

        // Iterate over all subjects
        subjects.forEach(subject => {
            // Check if teacher is involved (Lead or Participant)
            const isLead = subject.lead_teacher_id === selectedTeacher.id;
            const isParticipant = subject.participating_teachers_ids.includes(selectedTeacher.id);
            
            // Only show pending tasks if the selected teacher is involved in the subject
            // OR if the current user is 'DOCENTE' (Super Admin view) inspecting any teacher.
            if (isLead || isParticipant || currentUserId === 'DOCENTE') {
                
                // Identify Students who have started the written part (Trigger)
                const subjectQuizzes = quizzes.filter(q => q.asignatura === subject.name || q.asignatura === "Interdisciplinario");
                
                students.forEach(student => {
                    // Check for Written Grade
                    const hasWrittenGrade = subjectQuizzes.some(quiz => 
                        attempts.some(a => a.id_cuestionario === quiz.id_cuestionario && a.alumno_id === student.id && (a.estado === 'entregado' || a.estado === 'pendiente_revision'))
                    );

                    if (hasWrittenGrade) {
                        // Check Missing Competencies
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

                        // Check Missing Presentation
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


    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 animate-fade-in-up">
            
            {/* Sidebar List */}
            <div className="w-full md:w-1/3 bg-surface rounded-xl shadow-sm border border-secondary/20 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-secondary/20 bg-background/50">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                        <BriefcaseIcon className="h-5 w-5 text-primary" /> Docentes
                    </h2>
                    <input 
                        type="text" 
                        placeholder="Buscar docente..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background border border-secondary/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-1">
                    {loading ? <p className="text-center p-4 text-text-secondary">Cargando...</p> : 
                     filteredTeachers.map(teacher => (
                        <button
                            key={teacher.id}
                            onClick={() => setSelectedTeacher(teacher)}
                            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedTeacher?.id === teacher.id ? 'bg-primary text-white shadow-md' : 'hover:bg-secondary/10 text-text-primary'}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${selectedTeacher?.id === teacher.id ? 'bg-white text-primary' : 'bg-primary/10 text-primary'}`}>
                                {teacher.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-bold truncate">{teacher.name}</p>
                                <p className={`text-xs truncate ${selectedTeacher?.id === teacher.id ? 'text-white/80' : 'text-text-secondary'}`}>{teacher.rank}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className={`w-full md:w-2/3 bg-surface rounded-xl shadow-sm border border-secondary/20 flex flex-col overflow-hidden relative`}>
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
                                    <div className="flex gap-2 mt-2">
                                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">{selectedTeacher.contract_hours} Hrs</span>
                                        <span className="bg-secondary/10 text-text-secondary px-2 py-0.5 rounded text-xs">{selectedTeacher.email_ua}</span>
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
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-grow overflow-y-auto p-6 bg-background/30">
                            
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
