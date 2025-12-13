
import React, { useEffect, useState, useMemo } from 'react';
import { Quiz, BulletinEntry, Question, Student, Attempt, Message, Teacher, MentorshipSlot } from '../types';
import { PlayIcon, UsersIcon, BriefcaseIcon, ClipboardCheckIcon, CalendarIcon, ChartBarIcon, RefreshIcon, NewspaperIcon, ChevronRightIcon, ClockIcon, SparklesIcon, CheckCircleIcon, XCircleIcon, ExclamationIcon, TrendingUpIcon, MailIcon, BellIcon, AcademicIcon } from './icons';
import { QuestionService, QuizService, AttemptService, TeacherService, StudentService, BulletinService, MessageService, MentorshipService } from '../services/dataService';
import { calculateGrade, getGradeColor } from '../utils';

interface DashboardProps {
    currentUserId: string;
    onNavigate: (module: string) => void;
}

// --- SUB-COMPONENTS ---

const StatCard: React.FC<{ title: string; value: string | number; subtext: string; icon: React.ReactNode; colorClass: string }> = ({ title, value, subtext, icon, colorClass }) => (
    <div className="bg-surface p-4 rounded-xl shadow-sm border border-secondary/10 flex items-center justify-between hover:shadow-md transition-all group">
        <div>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-2xl font-extrabold text-text-primary">{value}</p>
                <span className="text-[10px] text-text-secondary bg-secondary/5 px-1.5 py-0.5 rounded">{subtext}</span>
            </div>
        </div>
        <div className={`p-3 rounded-lg ${colorClass} group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
    </div>
);

const HeroCaseOfTheDay: React.FC<{ questions: Question[] }> = ({ questions }) => {
    const [question, setQuestion] = useState<Question | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
        if (questions.length > 0) {
            const today = new Date();
            const seed = today.getFullYear() * 1000 + today.getMonth() * 100 + today.getDate();
            const randomIndex = seed % questions.length;
            setQuestion(questions[randomIndex]);
        }
    }, [questions]);

    if (!question) return (
        <div className="bg-surface rounded-xl border border-secondary/20 p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
            <SparklesIcon className="h-8 w-8 text-secondary/30 mb-2" />
            <p className="text-sm text-text-secondary">No hay caso del día disponible.</p>
        </div>
    );

    const isCorrect = (optId: string) => {
        if (question.tipo_pregunta === 'multiple_choice') {
            return question.alternativas?.find(a => a.id === optId)?.es_correcta;
        }
        return question.respuesta_correcta_vf === optId;
    };

    const handleOption = (id: string) => {
        if(isRevealed) return;
        setSelectedOption(id);
        setIsRevealed(true);
    };

    return (
        <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden relative h-full flex flex-col">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-accent"></div>
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-secondary/10 flex justify-between items-center bg-primary/5">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="text-yellow-500 h-5 w-5 fill-yellow-500" />
                    <h3 className="font-bold text-text-primary">Caso del Día</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-white px-2 py-1 rounded shadow-sm border border-primary/10">
                    {question.especialidad}
                </span>
            </div>

            <div className="p-6 flex-grow flex flex-col justify-center">
                <p className="text-base font-medium text-text-primary mb-6 leading-relaxed">
                    {question.enunciado}
                </p>

                {!isRevealed ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {question.alternativas ? (
                            question.alternativas.map(alt => (
                                <button 
                                    key={alt.id}
                                    onClick={() => handleOption(alt.id)}
                                    className="text-left px-4 py-3 rounded-lg border border-secondary/20 hover:border-primary/50 hover:bg-primary/5 text-sm transition-all flex items-center gap-3 group"
                                >
                                    <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary text-xs font-bold flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                        {alt.id}
                                    </span>
                                    <span className="text-text-secondary group-hover:text-text-primary">{alt.texto}</span>
                                </button>
                            ))
                        ) : (
                            ['Verdadero', 'Falso'].map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => handleOption(opt)}
                                    className="text-center px-4 py-3 rounded-lg border border-secondary/20 hover:border-primary/50 hover:bg-primary/5 text-sm font-bold transition-all"
                                >
                                    {opt}
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    <div className={`p-4 rounded-xl border-l-4 animate-fade-in-up ${isCorrect(selectedOption!) ? 'bg-success/5 border-success' : 'bg-danger/5 border-danger'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            {isCorrect(selectedOption!) ? (
                                <><CheckCircleIcon className="h-5 w-5 text-success" /> <span className="font-bold text-success">¡Correcto!</span></>
                            ) : (
                                <><XCircleIcon className="h-5 w-5 text-danger" /> <span className="font-bold text-danger">Incorrecto</span></>
                            )}
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            {isCorrect(selectedOption!) ? question.feedback_correcto : question.feedback_incorrecto}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const TabbedInfoFeed: React.FC<{ 
    messages: Message[]; 
    news: BulletinEntry[]; 
    events: BulletinEntry[]; 
    teachers: Teacher[];
    onNavigate: (module: string) => void;
}> = ({ messages, news, events, teachers, onNavigate }) => {
    const [activeTab, setActiveTab] = useState<'messages' | 'news'>('messages');

    return (
        <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden h-full flex flex-col min-h-[400px]">
            {/* Custom Tab Header */}
            <div className="flex border-b border-secondary/10">
                <button 
                    onClick={() => setActiveTab('messages')}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'messages' ? 'text-primary bg-primary/5' : 'text-text-secondary hover:bg-secondary/5'}`}
                >
                    <MailIcon className="h-4 w-4" /> Buzón
                    {messages.length > 0 && <span className="w-2 h-2 rounded-full bg-danger absolute top-3 right-4"></span>}
                    {activeTab === 'messages' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('news')}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'news' ? 'text-accent bg-accent/5' : 'text-text-secondary hover:bg-secondary/5'}`}
                >
                    <NewspaperIcon className="h-4 w-4" /> Noticias
                    {activeTab === 'news' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent"></div>}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 relative">
                
                {activeTab === 'messages' && (
                    <>
                        {messages.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary opacity-60">
                                <MailIcon className="h-12 w-12 mb-2" />
                                <p className="text-sm">Bandeja vacía</p>
                            </div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} onClick={() => onNavigate('messaging')} className="p-3 bg-background rounded-lg border border-secondary/10 hover:border-primary/30 cursor-pointer transition-all group">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-xs text-text-primary">{msg.senderName}</span>
                                        <span className="text-[10px] text-text-secondary">{new Date(msg.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs font-medium text-text-primary truncate">{msg.subject}</p>
                                    <p className="text-[10px] text-text-secondary line-clamp-2 mt-0.5">{msg.content}</p>
                                </div>
                            ))
                        )}
                        <div className="sticky bottom-0 pt-2 bg-gradient-to-t from-surface to-transparent text-center">
                            <button onClick={() => onNavigate('messaging')} className="text-xs font-bold text-primary hover:underline">Ir al Buzón</button>
                        </div>
                    </>
                )}

                {activeTab === 'news' && (
                    <>
                        {news.map(item => (
                            <div key={item.id} onClick={() => onNavigate('news')} className="flex gap-3 p-3 bg-background rounded-lg border border-secondary/10 hover:border-accent/30 cursor-pointer transition-all">
                                <div className={`w-1 shrink-0 rounded-full ${item.priority ? 'bg-warning' : 'bg-accent'}`}></div>
                                <div>
                                    <span className="text-[9px] font-bold uppercase text-text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">{item.category}</span>
                                    <h4 className="text-xs font-bold text-text-primary mt-1 leading-snug">{item.title}</h4>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

const TaskRow: React.FC<{ title: string; subtitle: string; status: 'risk' | 'pending' | 'success' | 'mentorship'; actionLabel?: string; onClick?: () => void }> = ({ title, subtitle, status, actionLabel, onClick }) => {
    const statusColors = {
        risk: 'bg-danger/10 text-danger border-danger/20',
        pending: 'bg-warning/10 text-warning border-warning/20',
        success: 'bg-success/10 text-success border-success/20',
        mentorship: 'bg-purple-100 text-purple-700 border-purple-200'
    };

    const icons = {
        risk: <ExclamationIcon className="h-4 w-4" />,
        pending: <ClockIcon className="h-4 w-4" />,
        success: <TrendingUpIcon className="h-4 w-4" />,
        mentorship: <CalendarIcon className="h-4 w-4" />
    };

    return (
        <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-secondary/10 hover:border-secondary/30 transition-all">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-2 rounded-full ${statusColors[status]}`}>
                    {icons[status]}
                </div>
                <div className="min-w-0">
                    <h4 className="text-xs font-bold text-text-primary truncate">{title}</h4>
                    <p className="text-[10px] text-text-secondary truncate">{subtitle}</p>
                </div>
            </div>
            {actionLabel && (
                <button 
                    onClick={onClick}
                    className="px-3 py-1.5 bg-surface border border-secondary/20 hover:bg-secondary/10 rounded-md text-[10px] font-bold text-text-primary transition-colors whitespace-nowrap"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ currentUserId, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ activeQuizzes: 0, totalQuestions: 0, recentActivity: 0, averageScore: 0 });
    const [pendingQuizzes, setPendingQuizzes] = useState<Quiz[]>([]);
    const [latestNews, setLatestNews] = useState<BulletinEntry[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<BulletinEntry[]>([]);
    const [recentMessages, setRecentMessages] = useState<Message[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [userName, setUserName] = useState("");
    const [caseOfTheDayQuestions, setCaseOfTheDayQuestions] = useState<Question[]>([]);
    const [alerts, setAlerts] = useState<{name: string, issue: string, id: string}[]>([]);
    const [studentProgress, setStudentProgress] = useState<Student | null>(null);
    const [mentorshipBookings, setMentorshipBookings] = useState<MentorshipSlot[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [qs, quizzes, attempts, teachersData, stList, bulletin, messages, mentorships] = await Promise.all([
                    QuestionService.getAll(),
                    QuizService.getAll(),
                    AttemptService.getAll(),
                    TeacherService.getAll(),
                    StudentService.getAll(),
                    BulletinService.getAll(),
                    MessageService.getInbox(currentUserId),
                    MentorshipService.getAll() // Fetch all slots initially
                ]);

                setTeachers(teachersData);

                // 1. Identification
                const isTeacher = currentUserId === 'DOCENTE' || currentUserId === '10611061';
                if (isTeacher) {
                    setUserName("Doctor(a)");
                    // Fake Alerts logic for demo
                    const riskStudents = stList.slice(0, 3).map(s => ({ name: s.name, issue: 'Promedio bajo (4.2)', id: s.id }));
                    setAlerts(riskStudents);
                    
                    // Filter Mentorships for Teacher (where I am booked)
                    const myMentorships = mentorships.filter(s => s.teacherId === currentUserId && s.status === 'booked');
                    setMentorshipBookings(myMentorships);

                } else {
                    const me = stList.find(s => s.id === currentUserId);
                    setUserName(me ? me.name.split(' ')[0] : "Residente");
                    setStudentProgress(me || null);

                    // Filter Mentorships for Student (where I am the student)
                    const myMentorships = mentorships.filter(s => s.studentId === currentUserId);
                    setMentorshipBookings(myMentorships);
                }

                // 2. Stats
                const now = new Date();
                const activeQuizzes = quizzes.filter(q => new Date(q.ventana_disponibilidad.fin) > now);
                const myPending = isTeacher 
                    ? activeQuizzes.slice(0, 5) 
                    : activeQuizzes.filter(q => q.alumnos_asignados.includes(currentUserId)).slice(0, 5);
                
                setPendingQuizzes(myPending);
                setCaseOfTheDayQuestions(qs.filter(q => q.es_caso_del_dia));
                setStats({
                    activeQuizzes: activeQuizzes.length,
                    totalQuestions: qs.length,
                    recentActivity: attempts.length,
                    averageScore: 0 // Calc later if needed
                });

                // 3. Feed Data
                setRecentMessages(messages.filter(m => !m.readBy.includes(currentUserId)).slice(0, 5));
                setLatestNews(bulletin.filter(b => b.category === 'Noticia' || b.category === 'Aviso').slice(0, 5));
                setUpcomingEvents(bulletin.filter(b => b.category === 'Evento' || b.category === 'Académico').slice(0, 5));

            } catch (error) {
                console.error("Dashboard data error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUserId]);

    if (loading) return <div className="flex h-full items-center justify-center"><RefreshIcon className="h-10 w-10 animate-spin text-primary" /></div>;

    const isTeacher = currentUserId === 'DOCENTE' || currentUserId === '10611061';

    return (
        <div className="space-y-6 animate-fade-in-up pb-10 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-secondary/10 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Hola, {userName}</h1>
                    <p className="text-text-secondary text-sm">Aquí tienes el resumen de hoy.</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Fecha Actual</p>
                    <p className="text-lg font-mono text-text-primary">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                    title="Cuestionarios Activos" 
                    value={stats.activeQuizzes} 
                    subtext="En curso" 
                    icon={<ClipboardCheckIcon className="h-6 w-6 text-indigo-600" />} 
                    colorClass="bg-indigo-50"
                />
                <StatCard 
                    title="Banco de Preguntas" 
                    value={stats.totalQuestions} 
                    subtext="Items totales" 
                    icon={<ChartBarIcon className="h-6 w-6 text-emerald-600" />} 
                    colorClass="bg-emerald-50"
                />
                <StatCard 
                    title={isTeacher ? "Residentes" : "Mi Progreso"} 
                    value={isTeacher ? "12" : "R1"} 
                    subtext={isTeacher ? "Activos" : "Nivel Actual"} 
                    icon={<UsersIcon className="h-6 w-6 text-sky-600" />} 
                    colorClass="bg-sky-50"
                />
                <StatCard 
                    title="Mensajes Nuevos" 
                    value={recentMessages.length} 
                    subtext="Sin leer" 
                    icon={<MailIcon className="h-6 w-6 text-amber-600" />} 
                    colorClass="bg-amber-50"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column (2/3) - Action Oriented */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Case of the Day Hero */}
                    <div className="h-64">
                        <HeroCaseOfTheDay questions={caseOfTheDayQuestions} />
                    </div>

                    {/* Split Row: Alerts & Pending */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Alerts / Progress */}
                        <div className="bg-surface rounded-xl border border-secondary/20 shadow-sm p-5">
                            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                                {isTeacher ? <BellIcon className="h-5 w-5 text-danger"/> : <TrendingUpIcon className="h-5 w-5 text-success"/>}
                                {isTeacher ? "Alertas Académicas" : "Mi Estado"}
                            </h3>
                            <div className="space-y-3">
                                {isTeacher ? (
                                    alerts.length > 0 ? alerts.map((alert, idx) => (
                                        <TaskRow 
                                            key={idx} 
                                            title={alert.name} 
                                            subtitle={alert.issue} 
                                            status="risk" 
                                            actionLabel="Ver"
                                            onClick={() => onNavigate('residents')}
                                        />
                                    )) : <p className="text-sm text-text-secondary italic">Sin alertas pendientes.</p>
                                ) : (
                                    // Student Progress Summary
                                    <>
                                        <div className="bg-background rounded-lg p-3 border border-secondary/10">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>Progreso Anual</span>
                                                <span className="font-bold">75%</span>
                                            </div>
                                            <div className="h-2 bg-secondary/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-success w-3/4"></div>
                                            </div>
                                        </div>
                                        <TaskRow title="Evaluación Semestral" subtitle="Próxima semana" status="pending" />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Pending Quizzes & Mentorships */}
                        <div className="bg-surface rounded-xl border border-secondary/20 shadow-sm p-5">
                            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                                <ClockIcon className="h-5 w-5 text-warning"/> Agenda y Tareas
                            </h3>
                            <div className="space-y-3">
                                {/* Mentorship Bookings */}
                                {mentorshipBookings.map(slot => {
                                    const teacher = teachers.find(t => t.id === slot.teacherId);
                                    return (
                                        <TaskRow
                                            key={slot.id}
                                            title={`Mentoría: ${slot.day} ${slot.hour}`}
                                            subtitle={isTeacher ? `Con: ${slot.studentName}` : `Con: ${teacher?.name}`}
                                            status="mentorship"
                                            actionLabel="Ver"
                                            onClick={() => isTeacher ? onNavigate('teachers_folder') : onNavigate('teachers')}
                                        />
                                    );
                                })}

                                {pendingQuizzes.length > 0 ? pendingQuizzes.map(quiz => (
                                    <TaskRow 
                                        key={quiz.id_cuestionario}
                                        title={quiz.titulo}
                                        subtitle={`Vence: ${new Date(quiz.ventana_disponibilidad.fin).toLocaleDateString()}`}
                                        status="pending"
                                        actionLabel="Iniciar"
                                        onClick={() => onNavigate('evaluations')}
                                    />
                                )) : null}
                                
                                {pendingQuizzes.length === 0 && mentorshipBookings.length === 0 && (
                                    <p className="text-sm text-text-secondary italic">No hay tareas pendientes.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (1/3) - Info Feed */}
                <div className="lg:col-span-1 h-full">
                    <TabbedInfoFeed 
                        messages={recentMessages} 
                        news={latestNews} 
                        events={upcomingEvents}
                        teachers={teachers}
                        onNavigate={onNavigate} 
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
