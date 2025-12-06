
import React from 'react';
import { 
    HomeIcon, 
    BookOpenIcon, 
    BriefcaseIcon, 
    ClipboardCheckIcon, 
    AcademicIcon, 
    FolderIcon, 
    NewspaperIcon, 
    ChartBarIcon, 
    DocumentTextIcon, 
    MenuIcon,
    MoonIcon,
    SunIcon,
    SettingsIcon,
    UsersIcon,
    ScreenIcon,
    ChatBubbleLeftRightIcon,
    GlobeIcon,
    TableIcon,
    FileIcon,
    LogOutIcon
} from './icons';
import { Student } from '../types';

interface LayoutProps {
    children: React.ReactNode;
    activeModule: string;
    setActiveModule: (module: any) => void;
    currentUser: string;
    isTeacher: boolean;
    students: Student[];
    onLogout: () => void;
    darkMode: boolean;
    toggleDarkMode: () => void;
    onUserChange: (userId: string) => void;
}

const SidebarItem: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    isActive: boolean; 
    isExpanded: boolean; 
    onClick: () => void;
    disabled?: boolean; 
}> = ({ icon, label, isActive, isExpanded, onClick, disabled }) => (
    <button 
        onClick={!disabled ? onClick : undefined}
        disabled={disabled}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
        ${disabled 
            ? 'opacity-30 cursor-not-allowed grayscale text-text-secondary' 
            : isActive 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'text-text-secondary hover:bg-secondary/10 hover:text-text-primary'
        }
        ${!isExpanded && 'justify-center'}
        `}
        title={!isExpanded ? label : ''}
    >
        <div className={`transition-transform duration-200 ${isActive && !disabled ? 'scale-110' : 'group-hover:scale-110'}`}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `h-5 w-5 ${isActive && !disabled ? 'text-primary' : 'currentColor'}` })}
        </div>
        {isExpanded && <span className="whitespace-nowrap text-sm">{label}</span>}
        
        {isActive && !disabled && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"></div>}
    </button>
);

const Layout: React.FC<LayoutProps> = ({ 
    children, 
    activeModule, 
    setActiveModule, 
    currentUser, 
    isTeacher, 
    students,
    onLogout,
    darkMode,
    toggleDarkMode,
    onUserChange
}) => {
    const [isSidebarOpen, setSidebarOpen] = React.useState(true);
    const userProfile = isTeacher ? { name: "Docente Coordinador", role: "Administrador" } : students.find(s => s.id === currentUser) || { name: "Usuario", role: "Residente" };

    // Helper to determine if a module is accessible based on role
    // Rules: Residents access: Dashboard, Subjects, Teachers, Residents (List), Residents Folder (Personal), Grades (Personal), Evaluations (Take), Polls, News.
    const isModuleDisabled = (moduleName: string) => {
        if (isTeacher) return false; // Teachers access everything

        const allowedForResidents = [
            'dashboard', 
            'subjects', 
            'teachers', 
            'residents', 
            'residents_folder', 
            'grades', 
            'evaluations', // Essential for taking quizzes
            'poll',        // Essential for student feedback
            'news',        // General info
            'documents'    // General info
        ];

        return !allowedForResidents.includes(moduleName);
    };

    return (
        <div className={`bg-background text-text-primary min-h-screen flex overflow-hidden font-sans transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
            {/* Sidebar Navigation */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-surface border-r border-secondary/20 flex flex-col transition-all duration-300 z-30 flex-shrink-0 shadow-sm relative`}>
                
                {/* Role Indicator Strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isTeacher ? 'bg-primary' : 'bg-emerald-500'}`}></div>

                <div className="p-4 flex items-center justify-between h-16 border-b border-secondary/20 ml-1">
                    <div className={`flex items-center gap-3 overflow-hidden transition-all ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-md ${isTeacher ? 'bg-primary shadow-primary/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}>G</div>
                        <span className="text-xl font-bold tracking-tight text-text-primary">GRUA</span>
                    </div>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1.5 rounded-md hover:bg-secondary/20 text-text-secondary">
                        <MenuIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-center transition-colors ${isTeacher ? 'text-primary bg-primary/5' : 'text-emerald-600 bg-emerald-500/10'} mx-3 mt-2 rounded`}>
                    {isSidebarOpen ? (isTeacher ? 'Modo Docente' : 'Modo Residente') : (isTeacher ? 'D' : 'R')}
                </div>

                <nav className="flex-grow py-4 px-3 space-y-1 overflow-y-auto ml-1">
                    <SidebarItem icon={<HomeIcon />} label="Inicio" isActive={activeModule === 'dashboard'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('dashboard')} disabled={isModuleDisabled('dashboard')} />
                    
                    <div className={`pt-4 pb-2 px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider opacity-60 transition-opacity ${!isSidebarOpen && 'text-center'}`}>
                        {isSidebarOpen ? 'Académico' : '•••'}
                    </div>

                    <SidebarItem icon={<BookOpenIcon />} label="Asignaturas" isActive={activeModule === 'subjects'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('subjects')} disabled={isModuleDisabled('subjects')} />
                    <SidebarItem icon={<BriefcaseIcon />} label="Docentes" isActive={activeModule === 'teachers'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('teachers')} disabled={isModuleDisabled('teachers')} />
                    <SidebarItem icon={<UsersIcon />} label="Residentes" isActive={activeModule === 'residents'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('residents')} disabled={isModuleDisabled('residents')} />

                    <div className={`pt-4 pb-2 px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider opacity-60 transition-opacity ${!isSidebarOpen && 'text-center'}`}>
                        {isSidebarOpen ? 'Evaluaciones' : '•••'}
                    </div>

                    <SidebarItem icon={<ChartBarIcon />} label="Competencias Personales" isActive={activeModule === 'surveys'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('surveys')} disabled={isModuleDisabled('surveys')} />
                    <SidebarItem icon={<ScreenIcon />} label="Presentación" isActive={activeModule === 'presentation'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('presentation')} disabled={isModuleDisabled('presentation')} />
                    <SidebarItem icon={<ClipboardCheckIcon />} label="Evaluación escrita" isActive={activeModule === 'evaluations'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('evaluations')} disabled={isModuleDisabled('evaluations')} />
                    <SidebarItem icon={<TableIcon />} label="Libro de Notas" isActive={activeModule === 'grades'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('grades')} disabled={isModuleDisabled('grades')} />

                    <div className={`pt-4 pb-2 px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider opacity-60 transition-opacity ${!isSidebarOpen && 'text-center'}`}>
                        {isSidebarOpen ? 'Gestión' : '•••'}
                    </div>

                    <SidebarItem icon={<AcademicIcon />} label="Carpeta Residentes" isActive={activeModule === 'residents_folder'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('residents_folder')} disabled={isModuleDisabled('residents_folder')} />
                    <SidebarItem icon={<FolderIcon />} label="Carpeta Docentes" isActive={activeModule === 'teachers_folder'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('teachers_folder')} disabled={isModuleDisabled('teachers_folder')} />
                    <SidebarItem icon={<ChatBubbleLeftRightIcon />} label="Anotaciones" isActive={activeModule === 'annotations'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('annotations')} disabled={isModuleDisabled('annotations')} />
                    <SidebarItem icon={<GlobeIcon />} label="Extensión" isActive={activeModule === 'activities'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('activities')} disabled={isModuleDisabled('activities')} />

                    <div className={`pt-4 pb-2 px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider opacity-60 transition-opacity ${!isSidebarOpen && 'text-center'}`}>
                        {isSidebarOpen ? 'Comunicación' : '•••'}
                    </div>

                    <SidebarItem icon={<NewspaperIcon />} label="Cartelera UA" isActive={activeModule === 'news'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('news')} disabled={isModuleDisabled('news')} />
                    <SidebarItem icon={<DocumentTextIcon />} label="Documentos" isActive={activeModule === 'documents'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('documents')} disabled={isModuleDisabled('documents')} />
                    <SidebarItem icon={<FileIcon />} label="Encuesta" isActive={activeModule === 'poll'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('poll')} disabled={isModuleDisabled('poll')} />
                </nav>

                <div className="p-4 border-t border-secondary/20 bg-background/50 ml-1">
                    <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
                         {isSidebarOpen ? (
                             <div className="flex-grow overflow-hidden">
                                 <p className="text-sm font-semibold truncate text-text-primary">{userProfile.name}</p>
                                 <p className="text-xs text-text-secondary truncate">{(userProfile as any).role}</p>
                             </div>
                         ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ${isTeacher ? 'bg-primary' : 'bg-emerald-500'}`}>
                                {isTeacher ? 'A' : 'R'}
                            </div>
                         )}
                         {isSidebarOpen && (
                             <button onClick={onLogout} className="p-2 text-text-secondary hover:text-danger transition-colors" title="Reiniciar Sesión">
                                 <LogOutIcon className="h-5 w-5" />
                             </button>
                         )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow flex flex-col h-screen overflow-hidden">
                {/* Global Header */}
                <header className="h-16 bg-surface border-b border-secondary/20 flex items-center justify-between px-6 flex-shrink-0 z-20 shadow-sm transition-colors duration-300">
                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="opacity-60 hidden sm:inline">Programa de Especialización</span>
                        <span className="hidden sm:inline">/</span>
                        <span className="font-semibold text-text-primary capitalize text-lg">
                            {activeModule === 'evaluations' ? 'Evaluación escrita' : 
                             activeModule === 'dashboard' ? 'Inicio' : 
                             activeModule === 'residents_folder' ? 'Carpeta Residentes' :
                             activeModule === 'teachers_folder' ? 'Carpeta Docentes' :
                             activeModule === 'residents' ? 'Residentes' :
                             activeModule === 'news' ? 'Cartelera UA' :
                             activeModule === 'surveys' ? 'Competencias Personales' :
                             activeModule === 'presentation' ? 'Presentación' :
                             activeModule === 'grades' ? 'Libro de Notas' :
                             activeModule === 'poll' ? 'Encuesta Docente' :
                             activeModule.replace('_', ' ')}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Dev User Switcher */}
                        <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${isTeacher ? 'bg-primary/5 border-primary/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                            <UsersIcon className={`h-4 w-4 ${isTeacher ? 'text-primary' : 'text-emerald-600'}`} />
                            <select 
                                value={currentUser} 
                                onChange={(e) => onUserChange(e.target.value)}
                                className="bg-transparent border-none text-sm text-text-primary focus:ring-0 cursor-pointer outline-none font-medium"
                            >
                                <option value="DOCENTE">👨‍🏫 Docente Coordinador</option>
                                <optgroup label="Residentes">
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>👨‍⚕️ {s.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        <button 
                            onClick={toggleDarkMode} 
                            className="p-2 rounded-full text-text-secondary hover:bg-secondary/10 hover:text-primary transition-all"
                            title={darkMode ? "Activar Modo Claro" : "Activar Modo Oscuro"}
                        >
                            {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                        </button>
                        <div className="w-px h-6 bg-secondary/20"></div>
                        <button className="p-2 rounded-full text-text-secondary hover:bg-secondary/10 hover:text-primary transition-all">
                            <SettingsIcon className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                {/* Module Content Wrapper */}
                <div className="flex-grow p-6 overflow-y-auto bg-background scrollbar-thin scrollbar-thumb-secondary/30 transition-colors duration-300 relative">
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
