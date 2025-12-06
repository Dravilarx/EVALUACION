
import React, { useState, useEffect } from 'react';
import { Student } from './types';
import { StudentService } from './services/dataService';
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
import GradesModule from './components/GradesModule'; // Import GradesModule
import Layout from './components/Layout';
// import Login from './components/Login'; // Login disabled for testing
import Dashboard from './components/Dashboard';
import { DocumentTextIcon } from './components/icons';

// Mock Placeholders for new sections
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

type Module = 'dashboard' | 'subjects' | 'residents' | 'teachers' | 'news' | 'evaluations' | 'residents_folder' | 'teachers_folder' | 'surveys' | 'presentation' | 'documents' | 'poll' | 'annotations' | 'activities' | 'grades';

const App: React.FC = () => {
    // Session State - Login Disabled for Testing
    // const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    // Default to DOCENTE (Teacher) for clean dev experience
    const [currentUserId, setCurrentUserId] = useState<string>('DOCENTE'); 
    
    // Data State
    const [students, setStudents] = useState<Student[]>([]);
    
    // UI State
    const [activeModule, setActiveModule] = useState<Module>('dashboard');
    const [darkMode, setDarkMode] = useState(false);
    
    // Deep linking / Navigation Params State
    const [targetQuizId, setTargetQuizId] = useState<string | null>(null);
    const [targetSurveyId, setTargetSurveyId] = useState<string | null>(null);
    const [evalParams, setEvalParams] = useState<{ studentId: string; subjectId: string } | null>(null);
    
    // Initial Load
    useEffect(() => {
        const fetchStudents = async () => {
            const data = await StudentService.getAll();
            setStudents(data);
        };
        fetchStudents();

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
        // Reset to default instead of logging out
        setCurrentUserId('DOCENTE');
        setActiveModule('dashboard');
        alert("Sesión reiniciada a Docente Coordinador.");
    };

    const handleNavigateToPoll = (processId: string) => {
        setTargetSurveyId(processId);
        setActiveModule('poll');
    };

    // Handler to switch module and start quiz
    const handleStartQuizFromFolder = (quizId: string) => {
        setTargetQuizId(quizId);
        setActiveModule('evaluations');
    };

    // Handler to jump to specific evaluation forms
    const handleGoToEvaluationForm = (module: 'surveys' | 'presentation', studentId: string, subjectId: string) => {
        setEvalParams({ studentId, subjectId });
        setActiveModule(module);
    };

    // Dev Mode User Switcher
    const handleUserChange = (newUserId: string) => {
        setCurrentUserId(newUserId);
    };

    // Role Logic
    const isTeacher = currentUserId === 'DOCENTE';

    // Route Rendering
    const renderModule = () => {
        switch (activeModule) {
            case 'evaluations':
                return <EvaluationsModule 
                    currentUserId={currentUserId} 
                    students={students} 
                    initialQuizId={targetQuizId}
                    onClearInitialQuizId={() => setTargetQuizId(null)}
                />;
            case 'dashboard':
                return <Dashboard 
                    currentUserId={currentUserId}
                    onNavigate={(module) => setActiveModule(module as Module)}
                />;
            case 'subjects':
                return <SubjectsModule />;
            case 'teachers':
                return <TeachersModule />;
            case 'residents':
                return <ResidentsModule currentUserId={currentUserId} />; // Pass prop
            case 'news':
                return <NewsModule />;
            case 'surveys':
                return <SurveysModule 
                    currentUserId={currentUserId} 
                    initialStudentId={evalParams?.studentId}
                    initialSubjectId={evalParams?.subjectId}
                    onClearParams={() => setEvalParams(null)}
                />;
            case 'presentation':
                return <PresentationModule 
                    currentUserId={currentUserId}
                    initialStudentId={evalParams?.studentId}
                    initialSubjectId={evalParams?.subjectId}
                    onClearParams={() => setEvalParams(null)}
                />;
            case 'grades': // New route
                return <GradesModule currentUserId={currentUserId} />;
            case 'poll':
                return <PollModule 
                    currentUserId={currentUserId}
                    initialSurveyId={targetSurveyId}
                    onClearInitialSurveyId={() => setTargetSurveyId(null)}
                    onComplete={() => {
                        // We stay in the poll module to show the repository
                    }} 
                />;
            case 'residents_folder':
                return <ResidentsFolder 
                    currentUserId={currentUserId} 
                    onNavigateToPoll={handleNavigateToPoll}
                    onGoToEvaluations={() => setActiveModule('evaluations')}
                    onStartQuiz={handleStartQuizFromFolder}
                />;
             case 'teachers_folder':
                return <TeachersFolder 
                    currentUserId={currentUserId} 
                    onNavigateToEvaluation={handleGoToEvaluationForm}
                />;
             case 'annotations':
                return <AnnotationsModule currentUserId={currentUserId} />;
             case 'activities':
                return <ActivitiesModule currentUserId={currentUserId} />;
             case 'documents':
                return <PlaceholderModule title="Documentos" description="Biblioteca de documentos institucionales y normativas." icon={<DocumentTextIcon className="h-12 w-12"/>} />;
            default:
                return <div>Módulo no encontrado</div>;
        }
    };

    return (
        <Layout 
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            currentUser={currentUserId}
            isTeacher={isTeacher}
            students={students}
            onLogout={handleLogout}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
            onUserChange={handleUserChange} // Pass switcher handler
        >
            {renderModule()}
        </Layout>
    );
};

export default App;
