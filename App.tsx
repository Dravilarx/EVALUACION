
import React, { useState, useEffect } from 'react';
import { Student, UserRole, UserProfile, MODULE_PERMISSIONS } from './types';
import { StudentService, LogService } from './services/dataService';
import EvaluationsModule from './components/EvaluationsModule';
import ResidentsModule from './components/ResidentsModule';
import TeachersModule from './components/TeachersModule';
import SubjectsModule from './components/SubjectsModule';
import NewsModule from './components/NewsModule';
import SurveysModule from './components/SurveysModule';
import PresentationModule from './components/PresentationModule';
import PollModule from './components/PollModule';
import TeachersFolder from './components/TeachersFolder';
import ResidentsFolder from './components/ResidentsFolder';
import AnnotationsModule from './components/AnnotationsModule'; 
import ActivitiesModule from './components/ActivitiesModule'; 
import GradesModule from './components/GradesModule'; 
import AuditLog from './components/AuditLog'; 
import AdminPanel from './components/AdminPanel'; 
import MessagingModule from './components/MessagingModule';
import DocumentsModule from './components/DocumentsModule'; // Imported
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { DocumentTextIcon, ShieldExclamationIcon, MailIcon, PaperAirplaneIcon } from './components/icons';

// Mock Placeholders
const PlaceholderModule: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
    <div className="h-full flex flex-col items-center justify-center text-center opacity-60 animate-fade-in-up">
        <div className="mb-6 p-6 bg-surface rounded-full border border-secondary/20 shadow-xl text-primary">
            {icon}
        </div>
        <h2 className="text-3xl font-bold text-text-primary mb-2">{title}</h2>
        <p className="text-lg text-text-secondary max-w-md">{description}</p>
        <p className="mt-8 text-xs text-text-secondary border px-3 py-1 rounded-full border-secondary/30 bg-secondary/5">Módulo en Desarrollo - GRUA v1.0</p>
    </div>
);

// Change Requests module updated to link to messaging
const ChangeRequestModule: React.FC<{ onCreateRequest: () => void }> = ({ onCreateRequest }) => (
    <div className="space-y-6 animate-fade-in-up">
        <div className="bg-surface p-6 rounded-xl border border-secondary/20 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <ShieldExclamationIcon className="h-6 w-6 text-warning" /> Solicitudes de Cambio
                </h2>
                <p className="text-sm text-text-secondary mt-1 max-w-2xl">
                    Utilice este módulo para solicitar formalmente la eliminación o modificación de registros académicos sensibles (notas, asistencia, anotaciones). 
                    Todas las solicitudes se gestionan a través del sistema de mensajería interna seguro y son auditadas por la administración.
                </p>
            </div>
            <button 
                onClick={onCreateRequest}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
            >
                <PaperAirplaneIcon className="h-5 w-5" /> Crear Nueva Solicitud
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 bg-surface rounded-xl border border-secondary/20 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="bg-secondary/10 p-4 rounded-full mb-4">
                    <MailIcon className="h-10 w-10 text-secondary" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">Buzón de Solicitudes</h3>
                <p className="text-text-secondary mb-6 max-w-md">
                    Sus solicitudes activas y el historial de respuestas se encuentran en su buzón de mensajería.
                </p>
                <button 
                    onClick={onCreateRequest} 
                    className="text-primary font-bold hover:underline"
                >
                    Ir a Mensajería
                </button>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-secondary/20">
                <h3 className="font-bold text-text-primary mb-4 border-b border-secondary/10 pb-2">Instrucciones</h3>
                <ul className="text-sm text-text-secondary space-y-3 list-disc list-inside">
                    <li>Indique claramente el <strong>ID del registro</strong> afectado (ej: Evaluación #123).</li>
                    <li>Justifique el motivo del cambio (ej: Error de digitación, Re-calificación).</li>
                    <li>Adjunte evidencia si es necesario.</li>
                    <li>El administrador revisará su solicitud y responderá en un plazo de 48 horas hábiles.</li>
                </ul>
            </div>
        </div>
    </div>
);

type Module = 'dashboard' | 'subjects' | 'residents' | 'teachers' | 'news' | 'evaluations' | 'residents_folder' | 'teachers_folder' | 'surveys' | 'presentation' | 'documents' | 'poll' | 'annotations' | 'activities' | 'grades' | 'audit_log' | 'admin_panel' | 'change_requests' | 'messaging';

// Initial Admin User
const ADMIN_USER: UserProfile = {
    id: '10611061',
    name: 'Marcelo Avila',
    email: 'marcelo.avila@uantof.cl',
    roles: ['ADMIN', 'TEACHER'],
    activeRole: 'ADMIN'
};

const TEACHER_USER: UserProfile = {
    id: 'DOCENTE',
    name: 'Docente Genérico',
    email: 'docente@ua.cl',
    roles: ['TEACHER'],
    activeRole: 'TEACHER'
};

const App: React.FC = () => {
    // Current User State
    const [currentUser, setCurrentUser] = useState<UserProfile>(ADMIN_USER);
    
    // Data State
    const [students, setStudents] = useState<Student[]>([]);
    
    // UI State
    const [activeModule, setActiveModule] = useState<Module>('dashboard');
    const [darkMode, setDarkMode] = useState(false);
    
    // Deep linking Params
    const [targetQuizId, setTargetQuizId] = useState<string | null>(null);
    const [targetSurveyId, setTargetSurveyId] = useState<string | null>(null);
    const [evalParams, setEvalParams] = useState<{ studentId: string; subjectId: string } | null>(null);
    
    // Messaging Draft State (For Change Requests)
    const [messagingDraft, setMessagingDraft] = useState<{ recipients: string[], subject: string, content: string } | null>(null);

    // Initial Load
    useEffect(() => {
        const fetchStudents = async () => {
            const data = await StudentService.getAll();
            setStudents(data);
        };
        fetchStudents();

        // Log initial login
        LogService.logAction({
            action: 'LOGIN',
            module: 'System',
            details: 'Initial system load',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.activeRole
        });

        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setDarkMode(true);
        }
    }, []);

    useEffect(() => {
        const html = document.querySelector('html');
        if (darkMode) {
            html?.classList.add('dark');
        } else {
            html?.classList.remove('dark');
        }
    }, [darkMode]);

    const handleLogout = () => {
        setCurrentUser(ADMIN_USER);
        setActiveModule('dashboard');
        alert("Sesión reiniciada a Administrador por defecto.");
        LogService.logAction({
            action: 'LOGIN',
            module: 'Auth',
            details: 'Session reset to default Admin',
            userId: ADMIN_USER.id,
            userName: ADMIN_USER.name,
            userRole: ADMIN_USER.activeRole
        });
    };

    const handleNavigateToPoll = (processId: string) => {
        setTargetSurveyId(processId);
        setActiveModule('poll');
    };

    const handleStartQuizFromFolder = (quizId: string) => {
        setTargetQuizId(quizId);
        setActiveModule('evaluations');
    };

    const handleGoToEvaluationForm = (module: 'surveys' | 'presentation', studentId: string, subjectId: string) => {
        setEvalParams({ studentId, subjectId });
        setActiveModule(module);
    };

    const handleCreateChangeRequest = () => {
        // Pre-fill message for Admin
        setMessagingDraft({
            recipients: ['10611061'], // Marcelo Avila ID (Admin)
            subject: 'Solicitud de Cambio: [Indicar Tema]',
            content: 'Estimado Administrador,\n\nSolicito la siguiente modificación en el sistema:\n\n- Tipo de Registro: \n- ID o Detalle: \n- Motivo: \n\nAtentamente,\n' + currentUser.name
        });
        setActiveModule('messaging');
    };

    // User Switcher Logic
    const handleUserChange = (selection: string) => {
        let newUser: UserProfile;

        if (selection === 'ADMIN') {
            newUser = ADMIN_USER;
        } else if (selection === 'TEACHER') {
            newUser = TEACHER_USER;
        } else {
            // Assume Resident ID
            const student = students.find(s => s.id === selection);
            if (student) {
                newUser = {
                    id: student.id,
                    name: student.name,
                    email: student.email_ua,
                    roles: ['RESIDENT'],
                    activeRole: 'RESIDENT'
                };
            } else {
                return; // Error finding student
            }
        }

        setCurrentUser(newUser);
        
        // Security Check: Redirect if current module is forbidden for new role
        const allowedRoles = MODULE_PERMISSIONS[activeModule];
        if (!allowedRoles || !allowedRoles.includes(newUser.activeRole)) {
            setActiveModule('dashboard');
        }

        LogService.logAction({
            action: 'LOGIN',
            module: 'Auth',
            details: `Switched user context to ${newUser.name} (${newUser.activeRole})`,
            userId: newUser.id,
            userName: newUser.name,
            userRole: newUser.activeRole
        });
    };

    // Route Rendering
    const renderModule = () => {
        // Security Check: Ensure module is allowed
        const allowedRoles = MODULE_PERMISSIONS[activeModule];
        if (!allowedRoles || !allowedRoles.includes(currentUser.activeRole)) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-text-secondary animate-fade-in">
                    <ShieldExclamationIcon className="h-16 w-16 mb-4 text-danger opacity-50" />
                    <h2 className="text-xl font-bold">Acceso Denegado</h2>
                    <p>No tiene permisos para acceder a este módulo.</p>
                </div>
            );
        }

        switch (activeModule) {
            case 'evaluations':
                return <EvaluationsModule 
                    currentUserId={currentUser.id} 
                    students={students} 
                    initialQuizId={targetQuizId}
                    onClearInitialQuizId={() => setTargetQuizId(null)}
                />;
            case 'dashboard':
                return <Dashboard 
                    currentUserId={currentUser.id}
                    onNavigate={(module) => setActiveModule(module as Module)}
                />;
            case 'subjects':
                return <SubjectsModule />;
            case 'teachers':
                return <TeachersModule />;
            case 'residents':
                return <ResidentsModule currentUserId={currentUser.id} />;
            case 'news':
                return <NewsModule students={students} currentUserId={currentUser.id} />;
            case 'surveys':
                return <SurveysModule 
                    currentUserId={currentUser.id} 
                    initialStudentId={evalParams?.studentId}
                    initialSubjectId={evalParams?.subjectId}
                    onClearParams={() => setEvalParams(null)}
                />;
            case 'presentation':
                return <PresentationModule 
                    currentUserId={currentUser.id}
                    initialStudentId={evalParams?.studentId}
                    initialSubjectId={evalParams?.subjectId}
                    onClearParams={() => setEvalParams(null)}
                />;
            case 'grades': 
                return <GradesModule currentUserId={currentUser.id} />;
            case 'poll':
                return <PollModule 
                    currentUserId={currentUser.id}
                    initialSurveyId={targetSurveyId}
                    onClearInitialSurveyId={() => setTargetSurveyId(null)}
                    onComplete={() => {}} 
                />;
            case 'residents_folder':
                return <ResidentsFolder 
                    currentUserId={currentUser.id} 
                    onNavigateToPoll={handleNavigateToPoll}
                    onGoToEvaluations={() => setActiveModule('evaluations')}
                    onStartQuiz={handleStartQuizFromFolder}
                />;
             case 'teachers_folder':
                return <TeachersFolder 
                    currentUserId={currentUser.id} 
                    onNavigateToEvaluation={handleGoToEvaluationForm}
                />;
             case 'annotations':
                return <AnnotationsModule currentUserId={currentUser.id} />;
             case 'activities':
                return <ActivitiesModule currentUserId={currentUser.id} />;
             case 'documents':
                return <DocumentsModule />;
             case 'audit_log':
                return <AuditLog />;
             case 'admin_panel':
                return <AdminPanel />;
             case 'change_requests':
                return <ChangeRequestModule onCreateRequest={handleCreateChangeRequest} />;
             case 'messaging':
                return <MessagingModule 
                    currentUserId={currentUser.id} 
                    currentUserName={currentUser.name} 
                    initialDraft={messagingDraft}
                    onClearDraft={() => setMessagingDraft(null)}
                />;
            default:
                return <div>Módulo no encontrado</div>;
        }
    };

    return (
        <Layout 
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            currentUser={currentUser}
            students={students}
            onLogout={handleLogout}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
            onUserChange={handleUserChange}
        >
            {renderModule()}
        </Layout>
    );
};

export default App;
