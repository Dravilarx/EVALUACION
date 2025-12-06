
import React, { useEffect, useState } from 'react';
import { Quiz, BulletinEntry } from '../types';
import { PlayIcon, UsersIcon, BriefcaseIcon, ClipboardCheckIcon, CalendarIcon, ChartBarIcon, RefreshIcon, NewspaperIcon, ChevronRightIcon, ClockIcon } from './icons';
import { QuestionService, QuizService, AttemptService, TeacherService, StudentService, BulletinService } from '../services/dataService';

interface DashboardProps {
    currentUserId: string;
    onNavigate: (module: string) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; subtext: string; icon: React.ReactNode; colorClass?: string }> = ({ title, value, subtext, icon, colorClass = "bg-primary/10 text-primary" }) => (
    <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary/20 flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="text-3xl font-bold mt-2 text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary mt-1">{subtext}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
            {icon}
        </div>
    </div>
);

const NewsWidget: React.FC<{ news: BulletinEntry[]; onNavigate: () => void }> = ({ news, onNavigate }) => (
    <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden h-full flex flex-col">
        <div className="p-5 border-b border-secondary/20 flex justify-between items-center bg-background/50">
            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                <NewspaperIcon className="text-primary h-5 w-5"/> Noticias Recientes
            </h3>
            <button onClick={onNavigate} className="text-xs text-primary hover:underline font-semibold flex items-center">
                Ver todo <ChevronRightIcon className="h-3 w-3" />
            </button>
        </div>
        <div className="p-4 space-y-4 flex-grow overflow-y-auto max-h-[300px]">
            {news.length > 0 ? (
                news.map(item => (
                    <div key={item.id} className="group cursor-pointer border-b border-secondary/10 last:border-0 pb-3 last:pb-0" onClick={onNavigate}>
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded 
                                ${item.category === 'Aviso' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                {item.category}
                            </span>
                            <span className="text-[10px] text-text-secondary">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-2">{item.title}</h4>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{item.summary}</p>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-text-secondary text-sm">
                    No hay noticias recientes.
                </div>
            )}
        </div>
    </div>
);

const EventsWidget: React.FC<{ events: BulletinEntry[]; onNavigate: () => void }> = ({ events, onNavigate }) => (
    <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden h-full flex flex-col">
        <div className="p-5 border-b border-secondary/20 flex justify-between items-center bg-background/50">
            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                <CalendarIcon className="text-accent h-5 w-5"/> Próximas Actividades
            </h3>
            <button onClick={onNavigate} className="text-xs text-primary hover:underline font-semibold flex items-center">
                Agenda <ChevronRightIcon className="h-3 w-3" />
            </button>
        </div>
        <div className="p-4 space-y-3 flex-grow overflow-y-auto max-h-[300px]">
            {events.length > 0 ? (
                events.map(item => (
                    <div key={item.id} className="flex gap-3 group cursor-pointer p-2 rounded hover:bg-secondary/5 transition-colors" onClick={onNavigate}>
                        <div className="flex-shrink-0 w-12 text-center bg-secondary/10 rounded-lg py-1 px-1 h-fit">
                            <div className="text-[10px] font-bold text-accent uppercase">{new Date(item.date).toLocaleDateString('es-ES', { month: 'short' })}</div>
                            <div className="text-lg font-bold text-text-primary leading-none">{new Date(item.date).getDate()}</div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1">{item.title}</h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] text-text-secondary flex items-center gap-1">
                                    <ClockIcon className="h-3 w-3" /> {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                <span className="text-[10px] font-medium text-text-secondary bg-secondary/10 px-1.5 rounded">
                                    {item.category}
                                </span>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-text-secondary text-sm">
                    No hay eventos próximos.
                </div>
            )}
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ currentUserId, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeQuizzes: 0,
        totalQuestions: 0,
        recentActivity: 0,
        averageScore: 0,
        activeTeachers: 0
    });
    const [pendingQuizzes, setPendingQuizzes] = useState<Quiz[]>([]);
    const [latestNews, setLatestNews] = useState<BulletinEntry[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<BulletinEntry[]>([]);
    const [userName, setUserName] = useState("Doctor(a)");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [questions, quizzes, attempts, teachers, students, bulletin] = await Promise.all([
                    QuestionService.getAll(),
                    QuizService.getAll(),
                    AttemptService.getAll(),
                    TeacherService.getAll(),
                    StudentService.getAll(),
                    BulletinService.getAll()
                ]);

                // Determine User Name
                if (currentUserId === 'DOCENTE') {
                    setUserName("Doctor(a)");
                } else {
                    const student = students.find(s => s.id === currentUserId);
                    if (student) setUserName(student.name.split(' ')[0]);
                }

                // Calculate Stats
                const now = new Date();
                const activeQuizzesList = quizzes.filter(q => new Date(q.ventana_disponibilidad.fin) > now);
                
                // Pending for the user (simulated logic for dashboard summary)
                const upcomingQuizzes = activeQuizzesList
                    .sort((a, b) => new Date(a.ventana_disponibilidad.fin).getTime() - new Date(b.ventana_disponibilidad.fin).getTime())
                    .slice(0, 4); // Show top 4 pending

                const completedAttempts = attempts.filter(a => a.estado === 'entregado');
                const totalScore = completedAttempts.reduce((acc, curr) => acc + (curr.porcentaje || 0), 0);
                const avgScore = completedAttempts.length ? (totalScore / completedAttempts.length) : 0;

                setStats({
                    activeQuizzes: activeQuizzesList.length,
                    totalQuestions: questions.length,
                    recentActivity: completedAttempts.length,
                    averageScore: avgScore,
                    activeTeachers: teachers.filter(t => t.status === 'Activo').length
                });

                setPendingQuizzes(upcomingQuizzes);
                
                // Separate News and Events
                // News: "Noticia", "Aviso" -> Sorted Descending (Newest first)
                const newsItems = bulletin
                    .filter(b => ['Noticia', 'Aviso'].includes(b.category))
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 3);

                // Events: "Evento", "Académico" -> Sorted Ascending (Closest upcoming first)
                const eventItems = bulletin
                    .filter(b => ['Evento', 'Académico'].includes(b.category))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 3);

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

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3 opacity-60">
                     <RefreshIcon className="h-10 w-10 animate-spin text-primary" />
                     <p className="font-medium">Cargando resumen...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary">Hola, {userName}</h2>
                    <p className="text-text-secondary mt-1">Aquí tienes el resumen de hoy en Radiología.</p>
                </div>
                <div className="text-sm text-text-secondary bg-surface px-4 py-2 rounded-lg border border-secondary/20 shadow-sm">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard 
                    title="Cuestionarios Activos"
                    value={stats.activeQuizzes}
                    subtext={`${stats.totalQuestions} preguntas en banco`}
                    icon={<ClipboardCheckIcon className="h-6 w-6" />}
                    colorClass="bg-indigo-500/10 text-indigo-500"
                />
                <StatCard 
                    title="Actividad Reciente"
                    value={stats.recentActivity}
                    subtext="Evaluaciones completadas"
                    icon={<UsersIcon className="h-6 w-6" />}
                    colorClass="bg-emerald-500/10 text-emerald-500"
                />
                 <StatCard 
                    title="Promedio General"
                    value={`${stats.averageScore.toFixed(1)}%`}
                    subtext="Rendimiento cohortes"
                    icon={<ChartBarIcon className="h-6 w-6" />}
                    colorClass="bg-amber-500/10 text-amber-500"
                />
                <StatCard 
                    title="Docentes"
                    value={stats.activeTeachers}
                    subtext="Coordinadores activos"
                    icon={<BriefcaseIcon className="h-6 w-6" />}
                    colorClass="bg-sky-500/10 text-sky-500"
                />
            </div>
            
            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Pending Activities Section (Left - 2 Columns) */}
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden h-full">
                        <div className="p-5 border-b border-secondary/20 flex justify-between items-center bg-background/50">
                            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                                <ClipboardCheckIcon className="text-primary h-5 w-5"/> Pendientes Prioritarios
                            </h3>
                        </div>
                        <div className="p-4">
                            {pendingQuizzes.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {pendingQuizzes.map(quiz => (
                                        <div key={quiz.id_cuestionario} className="p-4 bg-background rounded-lg border border-secondary/10 hover:border-primary/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold bg-danger/10 text-danger px-1.5 py-0.5 rounded">VENCE PRONTO</span>
                                                    <span className="text-xs text-text-secondary flex items-center gap-1"><CalendarIcon className="h-3 w-3"/> {new Date(quiz.ventana_disponibilidad.fin).toLocaleDateString()}</span>
                                                </div>
                                                <h4 className="font-bold text-text-primary group-hover:text-primary transition-colors">{quiz.titulo}</h4>
                                                <p className="text-xs text-text-secondary mt-1">{quiz.asignatura} • {quiz.tiempo_limite_minutos} min</p>
                                            </div>
                                            <button 
                                                onClick={() => onNavigate('evaluations')}
                                                className="flex-shrink-0 flex items-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm transition-all shadow-lg shadow-primary/20"
                                            >
                                                <PlayIcon className="h-4 w-4" /> Ver
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="bg-success/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <ClipboardCheckIcon className="h-8 w-8 text-success" />
                                    </div>
                                    <p className="text-text-primary font-medium">¡Estás al día!</p>
                                    <p className="text-sm text-text-secondary">No hay evaluaciones pendientes.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* News & Calendar Section (Right - 1 Column) */}
                <div className="lg:col-span-1 space-y-6">
                    <EventsWidget events={upcomingEvents} onNavigate={() => onNavigate('news')} />
                    <NewsWidget news={latestNews} onNavigate={() => onNavigate('news')} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
