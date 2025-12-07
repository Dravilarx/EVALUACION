
import React, { useEffect, useState, useMemo } from 'react';
import { Quiz, BulletinEntry, Question, Student, Attempt, QuestionType, Message } from '../types';
import { PlayIcon, UsersIcon, BriefcaseIcon, ClipboardCheckIcon, CalendarIcon, ChartBarIcon, RefreshIcon, NewspaperIcon, ChevronRightIcon, ClockIcon, SparklesIcon, CheckCircleIcon, XCircleIcon, StarIcon, ExclamationIcon, TrendingUpIcon, CloseIcon, MailIcon } from './icons';
import { QuestionService, QuizService, AttemptService, TeacherService, StudentService, BulletinService, MessageService } from '../services/dataService';
import { calculateGrade, getGradeColor } from '../utils';

interface DashboardProps {
    currentUserId: string;
    onNavigate: (module: string) => void;
}

// --- SUB-COMPONENTS ---

const StatCard: React.FC<{ title: string; value: string | number; subtext: string; icon: React.ReactNode; colorClass?: string }> = ({ title, value, subtext, icon, colorClass = "bg-primary/10 text-primary" }) => (
    <div className="bg-surface p-4 rounded-xl shadow-sm border border-secondary/20 flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1 text-text-primary">{value}</p>
            <p className="text-[10px] text-text-secondary mt-0.5">{subtext}</p>
        </div>
        <div className={`p-2 rounded-xl ${colorClass}`}>
            {icon}
        </div>
    </div>
);

const MessagesWidget: React.FC<{ messages: Message[]; onNavigate: () => void }> = ({ messages, onNavigate }) => {
    return (
        <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden flex flex-col h-full min-h-[220px]">
            <div className="px-4 py-3 border-b border-secondary/20 flex justify-between items-center bg-background/50">
                <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                    <MailIcon className="text-primary h-4 w-4"/> Mensajería
                </h3>
                <button onClick={onNavigate} className="text-[10px] text-primary hover:underline font-semibold flex items-center">
                    Buzón <ChevronRightIcon className="h-3 w-3" />
                </button>
            </div>
            <div className="p-3 space-y-2 flex-grow overflow-y-auto max-h-[250px]">
                {messages.length > 0 ? (
                    messages.map(msg => (
                        <div key={msg.id} className="group cursor-pointer p-2 rounded-lg hover:bg-secondary/5 border border-secondary/10 transition-colors" onClick={onNavigate}>
                            <div className="flex justify-between items-start mb-0.5">
                                <span className="font-bold text-text-primary text-xs truncate pr-2">{msg.senderName}</span>
                                <span className="text-[10px] text-text-secondary whitespace-nowrap">{new Date(msg.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs font-semibold text-text-secondary truncate">{msg.subject}</p>
                            <p className="text-[10px] text-text-secondary truncate opacity-70">{msg.content}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-text-secondary text-xs">
                        No hay mensajes nuevos.
                    </div>
                )}
            </div>
        </div>
    );
};

const CaseOfTheDayWidget: React.FC<{ questions: Question[] }> = ({ questions }) => {
    const [question, setQuestion] = useState<Question | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (questions.length > 0) {
            const today = new Date();
            const seed = today.getFullYear() * 1000 + today.getMonth() * 100 + today.getDate();
            const randomIndex = seed % questions.length;
            setQuestion(questions[randomIndex]);
        }
    }, [questions]);

    if (!question) return (
        <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-secondary/10 p-3 rounded-full mb-2">
                <SparklesIcon className="h-6 w-6 text-secondary/50" />
            </div>
            <p className="text-text-secondary text-xs">No hay "Casos del Día" disponibles.</p>
        </div>
    );

    const handleOptionClick = (optId: string) => {
        if (isRevealed) return;
        setSelectedOption(optId);
        setIsRevealed(true);
    };

    const isCorrect = (optId: string) => {
        if (question.tipo_pregunta === QuestionType.MultipleChoice) {
            return question.alternativas?.find(a => a.id === optId)?.es_correcta;
        }
        return question.respuesta_correcta_vf === optId;
    };

    const renderContent = () => (
        <div className="flex flex-col h-full">
            <div className="p-6 overflow-y-auto flex-grow">
                <p className="text-base font-medium mb-6 leading-relaxed bg-background/50 p-4 rounded-lg border border-secondary/10">
                    {question.enunciado}
                </p>
                <div className="space-y-3">
                    {question.tipo_pregunta === QuestionType.MultipleChoice && question.alternativas?.map(alt => {
                        let btnClass = "border-secondary/20 hover:bg-secondary/5";
                        if (isRevealed) {
                            if (alt.es_correcta) btnClass = "bg-success/10 border-success text-success font-bold";
                            else if (selectedOption === alt.id) btnClass = "bg-danger/10 border-danger text-danger";
                            else btnClass = "opacity-50 border-transparent";
                        } else if (selectedOption === alt.id) {
                            btnClass = "border-primary bg-primary/5";
                        }
                        return (
                            <button key={alt.id} onClick={(e) => { e.stopPropagation(); handleOptionClick(alt.id); }} disabled={isRevealed} className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${btnClass} flex justify-between items-center shadow-sm group`}>
                                <span className="group-hover:text-primary transition-colors">{alt.texto}</span>
                                {isRevealed && alt.es_correcta && <CheckCircleIcon className="h-5 w-5 text-success" />}
                                {isRevealed && selectedOption === alt.id && !alt.es_correcta && <XCircleIcon className="h-5 w-5 text-danger" />}
                            </button>
                        )
                    })}
                    {question.tipo_pregunta === QuestionType.TrueFalse && ['Verdadero', 'Falso'].map(opt => {
                         let btnClass = "border-secondary/20 hover:bg-secondary/5";
                         if (isRevealed) {
                             if (question.respuesta_correcta_vf === opt) btnClass = "bg-success/10 border-success text-success font-bold";
                             else if (selectedOption === opt) btnClass = "bg-danger/10 border-danger text-danger";
                             else btnClass = "opacity-50 border-transparent";
                         }
                         return (
                            <button key={opt} onClick={(e) => { e.stopPropagation(); handleOptionClick(opt); }} disabled={isRevealed} className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${btnClass} flex justify-between items-center shadow-sm group`}>
                                <span className="group-hover:text-primary transition-colors">{opt}</span>
                                {isRevealed && question.respuesta_correcta_vf === opt && <CheckCircleIcon className="h-5 w-5 text-success" />}
                            </button>
                         )
                    })}
                </div>
                {isRevealed && (
                    <div className="mt-6 p-4 bg-secondary/10 rounded-xl text-sm animate-fade-in-up border-l-4 border-primary">
                        <span className="font-bold block mb-1 text-primary">Retroalimentación:</span>
                        <p className="text-text-primary leading-relaxed">{selectedOption && isCorrect(selectedOption) ? question.feedback_correcto : question.feedback_incorrecto}</p>
                    </div>
                )}
            </div>
        </div>
    );

    if (isExpanded) {
        return (
            <>
                <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 h-full min-h-[220px] flex items-center justify-center cursor-pointer hover:bg-secondary/5 transition-colors opacity-50" onClick={() => setIsExpanded(true)}>
                    <span className="text-sm font-medium text-text-secondary flex items-center gap-2"><PlayIcon className="h-4 w-4"/> Continuar</span>
                </div>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative animate-scale-in border border-secondary/20">
                        <div className="p-4 border-b border-secondary/10 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
                            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2"><SparklesIcon className="text-yellow-500 h-5 w-5"/> Caso del Día</h3>
                            <button onClick={() => setIsExpanded(false)} className="p-1 rounded-full hover:bg-secondary/20 transition-colors"><CloseIcon className="h-6 w-6" /></button>
                        </div>
                        {renderContent()}
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="bg-surface rounded-xl shadow-lg border border-primary/20 overflow-hidden flex flex-col h-full min-h-[220px] relative cursor-pointer group hover:shadow-xl hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1" onClick={() => setIsExpanded(true)}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
            <div className="p-4 border-b border-secondary/10 flex justify-between items-center bg-gradient-to-b from-primary/5 to-transparent">
                <h3 className="font-bold text-sm text-text-primary flex items-center gap-2"><SparklesIcon className="text-yellow-500 h-4 w-4"/> Caso del Día</h3>
                <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">{question.especialidad}</span>
            </div>
            <div className="p-4 flex-grow flex flex-col justify-between">
                <div className="relative">
                    <p className="text-xs text-text-primary font-medium leading-relaxed line-clamp-4 mb-2 opacity-80 group-hover:opacity-100 transition-opacity">{question.enunciado}</p>
                    <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-surface to-transparent"></div>
                </div>
                <div className="mt-2 flex justify-center">
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-lg group-hover:bg-accent group-hover:text-white transition-all flex items-center gap-2 shadow-sm">
                        <PlayIcon className="h-3 w-3" /> Resolver
                    </span>
                </div>
            </div>
        </div>
    );
};

const ResidencyProgressWidget: React.FC<{ student: Student }> = ({ student }) => {
    const startDate = new Date(student.admission_date);
    const now = new Date();
    const totalDurationMs = 3 * 365 * 24 * 60 * 60 * 1000;
    const elapsedMs = now.getTime() - startDate.getTime();
    const percentComplete = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));
    const yearProgress = (percentComplete % 33.33) * 3;

    return (
        <div className="bg-surface p-4 rounded-xl shadow-sm border border-secondary/20 h-full flex flex-col justify-center min-h-[150px]">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="font-bold text-sm text-text-primary flex items-center gap-2"><TrendingUpIcon className="text-success h-4 w-4"/> Progreso</h3>
                    <p className="text-[10px] text-text-secondary">Cohorte {new Date(student.admission_date).getFullYear()}</p>
                </div>
                <div className="text-right">
                    <span className="text-lg font-bold text-primary">{percentComplete.toFixed(0)}%</span>
                </div>
            </div>
            <div className="relative pt-1">
                <div className="overflow-hidden h-2 mb-2 text-xs flex rounded-full bg-secondary/10 relative">
                    <div style={{ width: `${percentComplete}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="bg-background rounded-lg p-1.5 text-center border border-secondary/10">
                    <p className="text-[8px] text-text-secondary uppercase">Año</p>
                    <p className="font-bold text-xs text-text-primary">{yearProgress.toFixed(0)}%</p>
                </div>
                <div className="bg-background rounded-lg p-1.5 text-center border border-secondary/10">
                    <p className="text-[8px] text-text-secondary uppercase">Nivel</p>
                    <p className="font-bold text-xs text-accent">{student.level}</p>
                </div>
            </div>
        </div>
    );
};

const SmartAlertsWidget: React.FC<{ students: Student[], attempts: Attempt[] }> = ({ students, attempts }) => {
    const atRiskStudents = useMemo(() => {
        return students.map(student => {
            const studentAttempts = attempts.filter(a => a.alumno_id === student.id && a.estado === 'entregado');
            if (studentAttempts.length === 0) return null;
            const totalGrade = studentAttempts.reduce((sum, a) => sum + (a.nota || 0), 0);
            const avg = totalGrade / studentAttempts.length;
            const lastAttempt = studentAttempts[0];
            const isRisk = avg < 4.5 || (lastAttempt && (lastAttempt.nota || 0) < 4.0);
            if (isRisk) {
                return { ...student, avg, lastGrade: lastAttempt?.nota || 0 };
            }
            return null;
        }).filter(Boolean) as (Student & { avg: number, lastGrade: number })[];
    }, [students, attempts]);

    if (atRiskStudents.length === 0) return (
        <div className="bg-surface p-4 rounded-xl shadow-sm border border-secondary/20 h-full flex flex-col items-center justify-center text-center min-h-[150px]">
            <CheckCircleIcon className="h-8 w-8 text-success mb-2" />
            <p className="font-medium text-text-primary text-xs">Sin alertas</p>
        </div>
    );

    return (
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 shadow-sm animate-fade-in-up h-full overflow-y-auto max-h-[220px]">
            <h3 className="font-bold text-sm text-danger flex items-center gap-2 mb-2"><ExclamationIcon className="h-4 w-4"/> Alertas</h3>
            <div className="space-y-2">
                {atRiskStudents.slice(0, 3).map(student => (
                    <div key={student.id} className="bg-surface p-2 rounded-lg border-l-4 border-danger shadow-sm flex justify-between items-center">
                        <div>
                            <p className="font-bold text-text-primary text-xs truncate w-24">{student.name}</p>
                            <p className="text-[9px] text-text-secondary">Prom: {student.avg.toFixed(1)}</p>
                        </div>
                        <span className="text-[9px] font-bold text-danger bg-danger/10 px-1.5 py-0.5 rounded">Riesgo</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const NewsWidget: React.FC<{ news: BulletinEntry[]; onNavigate: () => void }> = ({ news, onNavigate }) => (
    <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden h-full flex flex-col min-h-[220px]">
        <div className="px-4 py-3 border-b border-secondary/20 flex justify-between items-center bg-background/50">
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                <NewspaperIcon className="text-primary h-4 w-4"/> Noticias
            </h3>
            <button onClick={onNavigate} className="text-[10px] text-primary hover:underline font-semibold flex items-center">
                Ver todo <ChevronRightIcon className="h-3 w-3" />
            </button>
        </div>
        <div className="p-3 space-y-3 flex-grow overflow-y-auto max-h-[250px]">
            {news.length > 0 ? (
                news.map(item => (
                    <div key={item.id} className="group cursor-pointer border-b border-secondary/10 last:border-0 pb-2 last:pb-0" onClick={onNavigate}>
                        <div className="flex justify-between items-start mb-0.5">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${item.category === 'Aviso' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{item.category}</span>
                            <span className="text-[9px] text-text-secondary">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1">{item.title}</h4>
                        <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-2">{item.summary}</p>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-text-secondary text-xs">No hay noticias.</div>
            )}
        </div>
    </div>
);

const EventsWidget: React.FC<{ events: BulletinEntry[]; onNavigate: () => void }> = ({ events, onNavigate }) => (
    <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden h-full flex flex-col min-h-[220px]">
        <div className="px-4 py-3 border-b border-secondary/20 flex justify-between items-center bg-background/50">
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                <CalendarIcon className="text-accent h-4 w-4"/> Actividades
            </h3>
            <button onClick={onNavigate} className="text-[10px] text-primary hover:underline font-semibold flex items-center">
                Agenda <ChevronRightIcon className="h-3 w-3" />
            </button>
        </div>
        <div className="p-3 space-y-2 flex-grow overflow-y-auto max-h-[250px]">
            {events.length > 0 ? (
                events.map(item => (
                    <div key={item.id} className="flex gap-2 group cursor-pointer p-1.5 rounded hover:bg-secondary/5 transition-colors" onClick={onNavigate}>
                        <div className="flex-shrink-0 w-9 text-center bg-secondary/10 rounded-lg py-1 px-0.5 h-fit">
                            <div className="text-[8px] font-bold text-accent uppercase">{new Date(item.date).toLocaleDateString('es-ES', { month: 'short' })}</div>
                            <div className="text-sm font-bold text-text-primary leading-none">{new Date(item.date).getDate()}</div>
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1">{item.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-text-secondary flex items-center gap-1"><ClockIcon className="h-2.5 w-2.5" /> {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                <span className="text-[9px] font-medium text-text-secondary bg-secondary/10 px-1 rounded truncate">{item.category}</span>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-text-secondary text-xs">No hay eventos.</div>
            )}
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ currentUserId, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ activeQuizzes: 0, totalQuestions: 0, recentActivity: 0, averageScore: 0, activeTeachers: 0 });
    const [pendingQuizzes, setPendingQuizzes] = useState<Quiz[]>([]);
    const [latestNews, setLatestNews] = useState<BulletinEntry[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<BulletinEntry[]>([]);
    const [recentMessages, setRecentMessages] = useState<Message[]>([]);
    const [userName, setUserName] = useState("Doctor(a)");
    const [caseOfTheDayQuestions, setCaseOfTheDayQuestions] = useState<Question[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [allAttempts, setAllAttempts] = useState<Attempt[]>([]);
    const [currentStudentProfile, setCurrentStudentProfile] = useState<Student | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [qs, quizzes, attempts, teachers, stList, bulletin, messages] = await Promise.all([
                    QuestionService.getAll(),
                    QuizService.getAll(),
                    AttemptService.getAll(),
                    TeacherService.getAll(),
                    StudentService.getAll(),
                    BulletinService.getAll(),
                    MessageService.getInbox(currentUserId)
                ]);

                setCaseOfTheDayQuestions(qs.filter(q => q.es_caso_del_dia));
                setStudents(stList);
                setAllAttempts(attempts);
                
                // Limit messages to 5
                setRecentMessages(messages.filter(m => !m.readBy.includes(currentUserId)).slice(0, 5));

                const isAdminOrTeacher = currentUserId === 'DOCENTE' || currentUserId === '10611061';
                if (isAdminOrTeacher) {
                    setUserName("Doctor(a)");
                } else {
                    const student = stList.find(s => s.id === currentUserId);
                    if (student) {
                        setUserName(student.name.split(' ')[0]);
                        setCurrentStudentProfile(student);
                    }
                }

                const now = new Date();
                const activeQuizzesList = quizzes.filter(q => new Date(q.ventana_disponibilidad.fin) > now);
                let upcomingQuizzes = activeQuizzesList;
                if (!isAdminOrTeacher) {
                    upcomingQuizzes = activeQuizzesList.filter(q => q.alumnos_asignados.includes(currentUserId));
                }
                
                // Limit Pending to 5
                upcomingQuizzes = upcomingQuizzes.sort((a, b) => new Date(a.ventana_disponibilidad.fin).getTime() - new Date(b.ventana_disponibilidad.fin).getTime()).slice(0, 5);

                const completedAttempts = attempts.filter(a => a.estado === 'entregado');
                const totalScore = completedAttempts.reduce((acc, curr) => acc + (curr.porcentaje || 0), 0);
                const avgScore = completedAttempts.length ? (totalScore / completedAttempts.length) : 0;

                setStats({
                    activeQuizzes: activeQuizzesList.length,
                    totalQuestions: qs.length,
                    recentActivity: completedAttempts.length,
                    averageScore: avgScore,
                    activeTeachers: teachers.filter(t => t.status === 'Activo').length
                });

                setPendingQuizzes(upcomingQuizzes);
                
                // Limit News to 5
                const newsItems = bulletin.filter(b => {
                        const isNews = ['Noticia', 'Aviso'].includes(b.category);
                        const isVisible = isAdminOrTeacher ? true : (b.visibility === 'public' || b.visibility === 'residents');
                        return isNews && isVisible;
                    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

                // Limit Events to 5
                const eventItems = bulletin.filter(b => {
                        const isEvent = ['Evento', 'Académico'].includes(b.category);
                        const isVisible = isAdminOrTeacher ? true : (b.visibility === 'public' || b.visibility === 'residents');
                        return isEvent && isVisible;
                    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);

                setLatestNews(newsItems);
                setUpcomingEvents(eventItems);

            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUserId]);

    if (loading) return <div className="flex h-full items-center justify-center"><RefreshIcon className="h-10 w-10 animate-spin text-primary" /></div>;

    const isTeacher = currentUserId === 'DOCENTE' || currentUserId === '10611061';

    return (
        <div className="space-y-5 animate-fade-in-up pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Hola, {userName}</h2>
                    <p className="text-sm text-text-secondary">Resumen de Radiología.</p>
                </div>
                <div className="text-xs font-medium text-text-secondary bg-surface px-3 py-1.5 rounded-lg border border-secondary/20 shadow-sm">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 <StatCard title="Cuestionarios" value={stats.activeQuizzes} subtext="Activos" icon={<ClipboardCheckIcon className="h-5 w-5" />} colorClass="bg-indigo-500/10 text-indigo-500"/>
                <StatCard title="Evaluaciones" value={stats.recentActivity} subtext="Completadas" icon={<UsersIcon className="h-5 w-5" />} colorClass="bg-emerald-500/10 text-emerald-500"/>
                 <StatCard title="Promedio" value={`${stats.averageScore.toFixed(0)}%`} subtext="Cohorte" icon={<ChartBarIcon className="h-5 w-5" />} colorClass="bg-amber-500/10 text-amber-500"/>
                <StatCard title="Docentes" value={stats.activeTeachers} subtext="Activos" icon={<BriefcaseIcon className="h-5 w-5" />} colorClass="bg-sky-500/10 text-sky-500"/>
            </div>
            
            {/* 3-COLUMN COMPACT LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 h-full">
                {/* COLUMN 1: Alerts & Case of Day */}
                <div className="flex flex-col gap-5">
                    <div className="flex-shrink-0">
                        {isTeacher ? <SmartAlertsWidget students={students} attempts={allAttempts} /> : currentStudentProfile && <ResidencyProgressWidget student={currentStudentProfile} />}
                    </div>
                    <div className="flex-grow min-h-[220px]">
                        <CaseOfTheDayWidget questions={caseOfTheDayQuestions} />
                    </div>
                </div>

                {/* COLUMN 2: Pending & Messages */}
                <div className="flex flex-col gap-5">
                     <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden flex flex-col h-full max-h-[350px]">
                        <div className="px-4 py-3 border-b border-secondary/20 flex justify-between items-center bg-background/50">
                            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2"><ClipboardCheckIcon className="text-primary h-4 w-4"/> Pendientes</h3>
                        </div>
                        <div className="p-3 overflow-y-auto flex-grow">
                            {pendingQuizzes.length > 0 ? (
                                <div className="space-y-2">
                                    {pendingQuizzes.map(quiz => (
                                        <div key={quiz.id_cuestionario} className="p-2.5 bg-background rounded-lg border border-secondary/10 hover:border-primary/30 transition-all group">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[9px] font-bold bg-danger/10 text-danger px-1.5 py-0.5 rounded">VENCE PRONTO</span>
                                                <span className="text-[9px] text-text-secondary flex items-center gap-1"><CalendarIcon className="h-2.5 w-2.5"/> {new Date(quiz.ventana_disponibilidad.fin).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="font-bold text-xs text-text-primary group-hover:text-primary transition-colors line-clamp-1">{quiz.titulo}</h4>
                                            <button onClick={() => onNavigate('evaluations')} className="mt-2 w-full py-1 rounded bg-primary hover:bg-primary-dark text-white font-medium text-[10px] transition-all shadow-sm flex items-center justify-center gap-1"><PlayIcon className="h-3 w-3" /> Ver</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8"><p className="text-text-primary font-medium text-xs">¡Estás al día!</p></div>
                            )}
                        </div>
                    </div>
                    <div className="flex-grow min-h-[220px]">
                        <MessagesWidget messages={recentMessages} onNavigate={() => onNavigate('messaging')} />
                    </div>
                </div>

                {/* COLUMN 3: Events & News */}
                <div className="flex flex-col gap-5">
                    <div className="flex-1 min-h-[220px]">
                        <EventsWidget events={upcomingEvents} onNavigate={() => onNavigate('news')} />
                    </div>
                    <div className="flex-1 min-h-[220px]">
                        <NewsWidget news={latestNews} onNavigate={() => onNavigate('news')} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
