
import React, { useEffect, useState } from 'react';
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
    LogOutIcon,
    TerminalIcon,
    ServerIcon,
    ShieldExclamationIcon,
    MailIcon,
    IdentificationIcon,
    QuestionMarkCircleIcon,
    GraduationCapIcon,
    BuildingIcon // Added
} from './icons';
import { Student, UserRole, UserProfile, MODULE_PERMISSIONS } from '../types';
import { MessageService } from '../services/dataService'; // Import Service

interface LayoutProps {
    children: React.ReactNode;
    activeModule: string;
    setActiveModule: (module: any) => void;
    currentUser: UserProfile;
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
    special?: boolean;
    badge?: number; // Added badge prop
}> = ({ icon, label, isActive, isExpanded, onClick, special, badge }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
        ${isActive 
                ? 'bg-primary/10 text-primary font-medium' 
                : special ? 'text-purple-600 hover:bg-purple-50' : 'text-text-secondary hover:bg-secondary/10 hover:text-text-primary'
        }
        ${!isExpanded && 'justify-center'}
        `}
        title={!isExpanded ? label : ''}
    >
        <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'} relative`}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `h-5 w-5 ${isActive ? 'text-primary' : 'currentColor'}` })}
            {!isExpanded && badge && badge > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full border border-surface"></span>
            )}
        </div>
        {isExpanded && (
            <div className="flex justify-between items-center w-full">
                <span className="whitespace-nowrap text-sm">{label}</span>
                {badge && badge > 0 && (
                    <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
                )}
            </div>
        )}
        
        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"></div>}
    </button>
);

const Layout: React.FC<LayoutProps> = ({ 
    children, 
    activeModule, 
    setActiveModule, 
    currentUser, 
    students,
    onLogout,
    darkMode,
    toggleDarkMode,
    onUserChange
}) => {
    const [isSidebarOpen, setSidebarOpen] = React.useState(true);
    const [unreadMessages, setUnreadMessages] = useState(0);

    // Poll for unread messages
    useEffect(() => {
        const checkMessages = async () => {
            const count = await MessageService.getUnreadCount(currentUser.id);
            setUnreadMessages(count);
        };
        checkMessages();
        const interval = setInterval(checkMessages, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, [currentUser.id]);
    
    // Helper to determine if a module is accessible based on role via MATRIX
    const isModuleAllowed = (moduleName: string) => {
        const allowedRoles = MODULE_PERMISSIONS[moduleName];
        if (!allowedRoles) return false; // Block if not defined
        return allowedRoles.includes(currentUser.activeRole);
    };

    // Helper to check if a section header should be displayed
    const isSectionVisible = (modulesToCheck: string[]) => {
        return modulesToCheck.some(m => isModuleAllowed(m));
    };

    const getRoleBadge = (role: UserRole) => {
        switch(role) {
            case 'ADMIN': return 'bg-purple-100 text-purple-700';
            case 'TEACHER': return 'bg-primary/5 text-primary';
            case 'RESIDENT': return 'bg-emerald-500/10 text-emerald-600';
        }
    };

    return (
        <div className={`bg-background text-text-primary min-h-screen flex overflow-hidden font-sans transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
            {/* Sidebar Navigation */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-surface border-r border-secondary/20 flex flex-col transition-all duration-300 z-30 flex-shrink-0 shadow-sm relative print:hidden`}>
                
                {/* Role Indicator Strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${currentUser.activeRole === 'ADMIN' ? 'bg-purple-600' : currentUser.activeRole === 'TEACHER' ? 'bg-primary' : 'bg-emerald-500'}`}></div>

                <div className="p-4 flex items-center justify-between h-16 border-b border-secondary/20 ml-1">
                    <div className={`flex items-center gap-3 overflow-hidden transition-all ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-md ${currentUser.activeRole === 'ADMIN' ? 'bg-purple-600' : currentUser.activeRole === 'TEACHER' ? 'bg-primary' : 'bg-emerald-500'}`}>G</div>
                        <span className="text-xl font-bold tracking-tight text-text-primary">GRUA</span>
                    </div>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1.5 rounded-md hover:bg-secondary/20 text-text-secondary">
                        <MenuIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-center transition-colors ${getRoleBadge(currentUser.activeRole)} mx-3 mt-2 rounded`}>
                    {isSidebarOpen ? (
                        currentUser.activeRole === 'ADMIN' ? 'Administrativo' : currentUser.activeRole === 'TEACHER' ? 'Docente' : 'Residente'
                    ) : (
                        currentUser.activeRole.charAt(0)
                    )}
                </div>

                <nav className="flex-grow py-4 px-3 space-y-1 overflow-y-auto ml-1">
                    {isModuleAllowed('dashboard') && (
                        <SidebarItem icon={<HomeIcon />} label="Inicio" isActive={activeModule === 'dashboard'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('dashboard')} />
                    )}
                    
                    {/* System Admin */}
                    {isSectionVisible(['audit_log', 'admin_panel', 'change_requests']) && (
                        <div className={`pt-4 pb-2 px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider opacity-60 transition-opacity ${!isSidebarOpen && 'text-center'}`}>
                            {isSidebarOpen ? 'Sistema' : '•••'}
                        </div>
                    )}
                    
                    {isModuleAllowed('audit_log') && <SidebarItem icon={<TerminalIcon />} label="Bitácora" isActive={activeModule === 'audit_log'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('audit_log')} special />}
                    {isModuleAllowed('admin_panel') && <SidebarItem icon={<ServerIcon />} label="Administración" isActive={activeModule === 'admin_panel'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('admin_panel')} />}
                    {isModuleAllowed('change_requests') && <SidebarItem icon={<ShieldExclamationIcon />} label="Solicitudes" isActive={activeModule === 'change_requests'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('change_requests')} />}

                    {/* Academic */}
                    {isSectionVisible(['program_info', 'subjects', 'teachers', 'residents', 'alumni']) && (
                        <div className={`pt-4 pb-2 px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider opacity-60 transition-opacity ${!isSidebarOpen && 'text-center'}`}>
                            {isSidebarOpen ? 'Académico' : '•••'}
                        </div>
                    )}

                    {isModuleAllowed('program_info') && <SidebarItem icon={<BuildingIcon />} label="Nosotros" isActive={activeModule === 'program_info'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('program_info')} />}
                    {isModuleAllowed('subjects') && <SidebarItem icon={<BookOpenIcon />} label="Asignaturas" isActive={activeModule === 'subjects'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('subjects')} />}
                    {isModuleAllowed('teachers') && <SidebarItem icon={<BriefcaseIcon />} label="Docentes" isActive={activeModule === 'teachers'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('teachers')} />}
                    {isModuleAllowed('residents') && <SidebarItem icon={<UsersIcon />} label="Residentes" isActive={activeModule === 'residents'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('residents')} />}
                    {isModuleAllowed('alumni') && <SidebarItem icon={<GraduationCapIcon />} label="Exalumnos" isActive={activeModule === 'alumni'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('alumni')} />}

                    {/* Evaluations */}
                    {isSectionVisible(['surveys', 'presentation', 'evaluations', 'grades']) && (
                        <div className={`pt-4 pb-2 px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider opacity-60 transition-opacity ${!isSidebarOpen && 'text-center'}`}>
                            {isSidebarOpen ? 'Evaluaciones' : '•••'}
                        </div>
                    )}

                    {isModuleAllowed('surveys') && <SidebarItem icon={<ChartBarIcon />} label="Competencias Personales" isActive={activeModule === 'surveys'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('surveys')} />}
                    {isModuleAllowed('presentation') && <SidebarItem icon={<ScreenIcon />} label="Presentación" isActive={activeModule === 'presentation'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('presentation')} />}
                    {isModuleAllowed('evaluations') && <SidebarItem icon={<ClipboardCheckIcon />} label="Evaluación escrita" isActive={activeModule === 'evaluations'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('evaluations')} />}
                    {isModuleAllowed('grades') && <SidebarItem icon={<TableIcon />} label="Libro de Notas" isActive={activeModule === 'grades'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('grades')} />}

                    {/* Management Folders */}
                    {isSectionVisible(['residents_folder', 'teachers_folder', 'annotations', 'activities', 'curriculum']) && (
                        <div className={`pt-4 pb-2 px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider opacity-60 transition-opacity ${!isSidebarOpen && 'text-center'}`}>
                            {isSidebarOpen ? 'Gestión' : '•••'}
                        </div>
                    )}

                    {isModuleAllowed('residents_folder') && <SidebarItem icon={<AcademicIcon />} label="Carpeta Residentes" isActive={activeModule === 'residents_folder'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('residents_folder')} />}
                    {isModuleAllowed('teachers_folder') && <SidebarItem icon={<FolderIcon />} label="Carpeta Docentes" isActive={activeModule === 'teachers_folder'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('teachers_folder')} />}
                    {isModuleAllowed('annotations') && <SidebarItem icon={<ChatBubbleLeftRightIcon />} label="Anotaciones" isActive={activeModule === 'annotations'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('annotations')} />}
                    {isModuleAllowed('activities') && <SidebarItem icon={<GlobeIcon />} label="Extensión" isActive={activeModule === 'activities'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('activities')} />}
                    {isModuleAllowed('curriculum') && <SidebarItem icon={<IdentificationIcon />} label="Currículum" isActive={activeModule === 'curriculum'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('curriculum')} />}

                    {/* Communication */}
                    {isSectionVisible(['news', 'documents', 'poll', 'messaging']) && (
                        <div className={`pt-4 pb-2 px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider opacity-60 transition-opacity ${!isSidebarOpen && 'text-center'}`}>
                            {isSidebarOpen ? 'Comunicación' : '•••'}
                        </div>
                    )}

                    {isModuleAllowed('messaging') && <SidebarItem icon={<MailIcon />} label="Mensajería" isActive={activeModule === 'messaging'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('messaging')} badge={unreadMessages} />}
                    {isModuleAllowed('news') && <SidebarItem icon={<NewspaperIcon />} label="Cartelera UA" isActive={activeModule === 'news'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('news')} />}
                    {isModuleAllowed('documents') && <SidebarItem icon={<DocumentTextIcon />} label="Documentos" isActive={activeModule === 'documents'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('documents')} />}
                    {isModuleAllowed('poll') && <SidebarItem icon={<FileIcon />} label="Encuesta" isActive={activeModule === 'poll'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('poll')} />}
                </nav>

                {/* HELP ITEM AT BOTTOM */}
                <div className="p-2 mx-1 border-t border-secondary/20">
                    <SidebarItem icon={<QuestionMarkCircleIcon />} label="Ayuda / Manual" isActive={activeModule === 'help'} isExpanded={isSidebarOpen} onClick={() => setActiveModule('help')} />
                </div>

                <div className="p-4 border-t border-secondary/20 bg-background/50 ml-1">
                    <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
                         {isSidebarOpen ? (
                             <div className="flex-grow overflow-hidden">
                                 <p className="text-sm font-semibold truncate text-text-primary">{currentUser.name}</p>
                                 <p className="text-xs text-text-secondary truncate">{currentUser.id}</p>
                             </div>
                         ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ${currentUser.activeRole === 'ADMIN' ? 'bg-purple-600' : currentUser.activeRole === 'TEACHER' ? 'bg-primary' : 'bg-emerald-500'}`}>
                                {currentUser.activeRole.charAt(0)}
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
                <header className="h-16 bg-surface border-b border-secondary/20 flex items-center justify-between px-6 flex-shrink-0 z-20 shadow-sm transition-colors duration-300 print:hidden">
                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="opacity-60 hidden sm:inline">Programa de Especialización</span>
                        <span className="hidden sm:inline">/</span>
                        <span className="font-semibold text-text-primary capitalize text-lg">
                            {activeModule === 'evaluations' ? 'Evaluación escrita' : 
                             activeModule === 'dashboard' ? 'Inicio' : 
                             activeModule === 'residents_folder' ? 'Carpeta Residentes' :
                             activeModule === 'teachers_folder' ? 'Carpeta Docentes' :
                             activeModule === 'audit_log' ? 'Bitácora de Auditoría' :
                             activeModule === 'admin_panel' ? 'Administración' :
                             activeModule === 'change_requests' ? 'Solicitudes de Cambio' :
                             activeModule === 'messaging' ? 'Mensajería Interna' :
                             activeModule === 'curriculum' ? 'Constructor de CV' :
                             activeModule === 'help' ? 'Manual Interactivo' :
                             activeModule === 'alumni' ? 'Exalumnos' :
                             activeModule === 'program_info' ? 'Nosotros' :
                             activeModule.replace('_', ' ')}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Dev User Switcher */}
                        <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${currentUser.activeRole === 'ADMIN' ? 'bg-purple-50 border-purple-200' : currentUser.activeRole === 'TEACHER' ? 'bg-primary/5 border-primary/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                            <UsersIcon className={`h-4 w-4 ${currentUser.activeRole === 'ADMIN' ? 'text-purple-600' : currentUser.activeRole === 'TEACHER' ? 'text-primary' : 'text-emerald-600'}`} />
                            <select 
                                value={currentUser.id === '10611061' ? 'ADMIN' : currentUser.activeRole === 'TEACHER' ? 'TEACHER' : currentUser.id} 
                                onChange={(e) => onUserChange(e.target.value)}
                                className="bg-transparent border-none text-sm text-text-primary focus:ring-0 cursor-pointer outline-none font-medium"
                            >
                                <option value="ADMIN">🔒 Marcelo Avila (Admin)</option>
                                <option value="TEACHER">👨‍🏫 Docente Genérico</option>
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
                <div className="flex-grow p-6 overflow-y-auto bg-background scrollbar-thin scrollbar-thumb-secondary/30 transition-colors duration-300 relative print:p-0 print:bg-white">
                    <div className="max-w-7xl mx-auto h-full print:max-w-none print:h-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
