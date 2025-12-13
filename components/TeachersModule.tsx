
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Teacher, AppDocument, MentorshipSlot, Student } from '../types';
import { TeacherService, DocumentService, MentorshipService, StudentService } from '../services/dataService';
import { BriefcaseIcon, PlusIcon, EditIcon, TrashIcon, DuplicateIcon, CloseIcon, CheckCircleIcon, FilterIcon, DownloadIcon, DocumentTextIcon, CloudUploadIcon, EyeIcon, CalendarIcon } from './icons';
import { exportToCSV } from '../utils';

const emptyTeacher: Teacher = {
    id: '',
    name: '',
    email_ua: '',
    email_personal: '',
    phone: '',
    admission_date: new Date().toISOString().split('T')[0],
    rank: 'Instructor',
    contract_hours: '22',
    subjects_in_charge: [],
    status: 'Activo',
    university_undergrad: '',
    university_postgrad: '',
    nationality: 'Chilena',
    sex: 'Otro',
    photo_url: '',
    subSpecialties: []
};

interface TeachersModuleProps {
    currentUserId: string;
}

const TeachersModule: React.FC<TeachersModuleProps> = ({ currentUserId }) => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // UI State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [currentTeacher, setCurrentTeacher] = useState<Teacher>(emptyTeacher);
    const [isEditing, setIsEditing] = useState(false);
    
    // Availability/Mentorship State
    const [mentorshipSlots, setMentorshipSlots] = useState<MentorshipSlot[]>([]);
    const [currentStudentName, setCurrentStudentName] = useState('');
    
    // Documents State
    const [activeModalTab, setActiveModalTab] = useState<'info' | 'docs'>('info');
    const [teacherDocuments, setTeacherDocuments] = useState<AppDocument[]>([]);
    const docInputRef = useRef<HTMLInputElement>(null);

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        rank: '',
        status: '',
        specialty: '' // New Filter
    });

    const isTeacher = currentUserId === 'DOCENTE' || currentUserId === '10611061';

    // Mock Calendar Data
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];

    useEffect(() => {
        loadTeachers();
        if (!isTeacher) {
            // Get student name for booking
            StudentService.getAll().then(students => {
                const me = students.find(s => s.id === currentUserId);
                if (me) setCurrentStudentName(me.name);
            });
        }
    }, [currentUserId]);

    const loadTeachers = async () => {
        setLoading(true);
        try {
            const data = await TeacherService.getAll();
            setTeachers(data);
        } catch (error) {
            console.error("Failed to load teachers", error);
        } finally {
            setLoading(false);
        }
    };

    const loadDocuments = async (teacherId: string) => {
        if (!teacherId) return;
        const docs = await DocumentService.getByOwner(teacherId);
        setTeacherDocuments(docs);
    };

    const loadMentorshipSlots = async (teacherId: string) => {
        const slots = await MentorshipService.getByTeacher(teacherId);
        setMentorshipSlots(slots);
    };

    // Calculate unique universities for autocomplete suggestions
    const uniqueUniversities = useMemo(() => {
        const unis = new Set<string>();
        teachers.forEach(t => {
            if (t.university_undergrad) unis.add(t.university_undergrad);
            if (t.university_postgrad) unis.add(t.university_postgrad);
        });
        return Array.from(unis).sort();
    }, [teachers]);

    // Unique Specialties
    const uniqueSpecialties = useMemo(() => {
        const specs = new Set<string>();
        teachers.forEach(t => t.subSpecialties?.forEach(s => specs.add(s)));
        return Array.from(specs).sort();
    }, [teachers]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentTeacher(prev => ({ ...prev, [name]: value }));
    };

    const handleSpecialtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const specs = value.split(',').map(s => s.trim()).filter(s => s);
        setCurrentTeacher(prev => ({ ...prev, subSpecialties: specs }));
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await TeacherService.update(currentTeacher);
                setTeachers(prev => prev.map(t => t.id === currentTeacher.id ? currentTeacher : t));
            } else {
                await TeacherService.create(currentTeacher);
                setTeachers(prev => [currentTeacher, ...prev]);
            }
            setIsFormOpen(false);
        } catch (error) {
            console.error("Error saving teacher", error);
        }
    };

    const handleEdit = (teacher: Teacher) => {
        if (!isTeacher) return;
        setCurrentTeacher(teacher);
        setIsEditing(true);
        setActiveModalTab('info');
        loadDocuments(teacher.id);
        setIsFormOpen(true);
    };

    const handleViewDetail = (teacher: Teacher) => {
        setCurrentTeacher(teacher);
        loadMentorshipSlots(teacher.id);
        setIsDetailOpen(true);
    };

    // --- MENTORSHIP HANDLERS ---
    const handleSlotClick = async (day: string, hour: string) => {
        const existingSlot = mentorshipSlots.find(s => s.day === day && s.hour === hour);

        if (isTeacher) {
            // Teacher Mode: Toggle Availability
            if (existingSlot) {
                // If booked, maybe confirm cancellation?
                if (existingSlot.status === 'booked' && !confirm(`¿Cancelar reserva de ${existingSlot.studentName}?`)) {
                    return;
                }
                // Delete slot (make unavailable)
                await MentorshipService.delete(existingSlot.id);
                setMentorshipSlots(prev => prev.filter(s => s.id !== existingSlot.id));
            } else {
                // Create Available Slot
                const newSlot: MentorshipSlot = {
                    id: `MS-${Date.now()}`,
                    teacherId: currentTeacher.id,
                    day,
                    hour,
                    status: 'available'
                };
                await MentorshipService.create(newSlot);
                setMentorshipSlots(prev => [...prev, newSlot]);
            }
        } else {
            // Resident Mode: Book or Cancel Own Booking
            if (!existingSlot) return; // Cannot book unavailable slot

            if (existingSlot.status === 'available') {
                // Book it
                if (confirm(`¿Reservar mentoría el ${day} a las ${hour}?`)) {
                    const booked = await MentorshipService.book(existingSlot.id, currentUserId, currentStudentName);
                    setMentorshipSlots(prev => prev.map(s => s.id === booked.id ? booked : s));
                }
            } else if (existingSlot.studentId === currentUserId) {
                // Cancel my booking
                if (confirm(`¿Cancelar tu reserva?`)) {
                    const cancelled = await MentorshipService.cancelBooking(existingSlot.id);
                    setMentorshipSlots(prev => prev.map(s => s.id === cancelled.id ? cancelled : s));
                }
            }
        }
    };

    // --- DOCUMENT HANDLERS ---
    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (!currentTeacher.id) {
            alert("Debe ingresar un RUT/ID válido para subir documentos.");
            return;
        }

        const file = e.target.files[0];
        const newDoc: AppDocument = {
            id: `DOC-${Date.now()}`,
            title: file.name,
            type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
            category: 'Administrativo', 
            uploadDate: new Date().toISOString(),
            ownerType: 'Teacher',
            ownerId: currentTeacher.id,
            visibility: 'private', // Default to private for teachers usually
            url: URL.createObjectURL(file)
        };

        await DocumentService.create(newDoc);
        setTeacherDocuments(prev => [newDoc, ...prev]);
    };

    const handleDeleteDocument = async (id: string) => {
        if(confirm("¿Eliminar documento?")) {
            await DocumentService.delete(id);
            setTeacherDocuments(prev => prev.filter(d => d.id !== id));
        }
    };

    const handleDuplicate = (teacher: Teacher) => {
        const copy = { 
            ...teacher, 
            id: `${teacher.id}-COPY`, 
            name: `${teacher.name} (Copia)`,
            email_ua: '', 
            email_personal: '' 
        };
        setCurrentTeacher(copy);
        setTeacherDocuments([]); // Don't copy docs
        setIsEditing(false);
        setActiveModalTab('info');
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este docente?")) {
            try {
                await TeacherService.delete(id);
                setTeachers(prev => prev.filter(t => t.id !== id));
            } catch (error) {
                console.error("Error deleting teacher", error);
            }
        }
    };

    const handleDownload = (teacher: Teacher) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(teacher, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", `docente_${teacher.name.replace(/\s+/g, '_')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleNew = () => {
        setCurrentTeacher(emptyTeacher);
        setTeacherDocuments([]);
        setIsEditing(false);
        setActiveModalTab('info');
        setIsFormOpen(true);
    };

    const handleExport = () => {
        const dataToExport = filteredTeachers.map(t => ({
            Nombre: t.name,
            ID: t.id,
            Jerarquia: t.rank,
            Horas: t.contract_hours,
            Email: t.email_ua,
            Estado: t.status,
            Ingreso: t.admission_date,
            SubEspecialidades: t.subSpecialties?.join(', ')
        }));
        exportToCSV(dataToExport, `Docentes_${new Date().toISOString().split('T')[0]}`);
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredTeachers = teachers.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRank = filters.rank ? t.rank === filters.rank : true;
        const matchesStatus = filters.status ? t.status === filters.status : true;
        const matchesSpecialty = filters.specialty ? t.subSpecialties?.includes(filters.specialty) : true;
        
        return matchesSearch && matchesRank && matchesStatus && matchesSpecialty;
    });

    const inputClass = "w-full bg-background border border-secondary/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none";
    const labelClass = "block text-xs font-semibold text-text-secondary mb-1";

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                        <BriefcaseIcon className="h-8 w-8 text-primary" /> Cuerpo Docente
                    </h2>
                    <p className="text-text-secondary">Gestión de académicos y disponibilidad de mentoría.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o RUT..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-background border border-secondary/30 rounded-lg px-4 py-2 text-sm flex-grow md:w-64 print:hidden"
                    />
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary bg-surface border border-secondary/30 rounded-lg hover:bg-secondary/10 transition-colors print:hidden" title="Descargar CSV/Excel">
                        <DocumentTextIcon className="h-4 w-4" />
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary bg-surface border border-secondary/30 rounded-lg hover:bg-secondary/10 transition-colors print:hidden" title="Imprimir PDF">
                        <DownloadIcon className="h-4 w-4" />
                    </button>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-3 py-2 rounded-lg border transition-colors print:hidden ${showFilters ? 'bg-secondary text-white border-secondary' : 'bg-background border-secondary/30 text-text-secondary hover:border-primary'}`}
                        title="Filtros Avanzados"
                    >
                        <FilterIcon className="h-5 w-5" />
                    </button>
                    {isTeacher && (
                        <button 
                            onClick={handleNew}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20 print:hidden"
                        >
                            <PlusIcon className="h-5 w-5" /> <span className="hidden sm:inline">Nuevo Docente</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible Filters */}
            {showFilters && (
                <div className="bg-surface p-4 rounded-xl border border-secondary/20 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-down print:hidden">
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Jerarquía Académica</label>
                        <select name="rank" value={filters.rank} onChange={handleFilterChange} className={inputClass}>
                            <option value="">Todas</option>
                            <option value="Profesor Titular">Profesor Titular</option>
                            <option value="Profesor Asociado">Profesor Asociado</option>
                            <option value="Profesor Auxiliar">Profesor Auxiliar</option>
                            <option value="Instructor">Instructor</option>
                            <option value="Instructor Adjunto">Instructor Adjunto</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Sub-especialidad</label>
                        <select name="specialty" value={filters.specialty} onChange={handleFilterChange} className={inputClass}>
                            <option value="">Todas</option>
                            {uniqueSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Estado</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className={inputClass}>
                            <option value="">Todos</option>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                            <option value="Sabático">Sabático</option>
                        </select>
                    </div>
                </div>
            )}

            <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/10 text-text-secondary uppercase text-xs font-bold border-b border-secondary/20">
                            <tr>
                                <th className="px-6 py-4">Docente</th>
                                <th className="px-6 py-4">Jerarquía / Horas</th>
                                <th className="px-6 py-4 hidden md:table-cell">Sub-especialidades</th>
                                <th className="px-6 py-4 hidden md:table-cell">Contacto</th>
                                <th className="px-6 py-4 text-center print:hidden">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/20">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-text-secondary">Cargando docentes...</td></tr>
                            ) : filteredTeachers.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-text-secondary">No se encontraron docentes.</td></tr>
                            ) : (
                                filteredTeachers.map(teacher => (
                                    <tr 
                                        key={teacher.id} 
                                        className="hover:bg-secondary/5 transition-colors group cursor-pointer"
                                        onClick={() => handleViewDetail(teacher)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-secondary/20 overflow-hidden flex-shrink-0 border border-secondary/30 flex items-center justify-center">
                                                    {teacher.photo_url ? (
                                                        <img src={teacher.photo_url} alt={teacher.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <BriefcaseIcon className="h-5 w-5 text-secondary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-text-primary">{teacher.name}</div>
                                                    <div className="text-xs text-text-secondary">{teacher.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-text-primary">{teacher.rank}</span>
                                                <span className="text-xs text-text-secondary bg-secondary/10 px-2 py-0.5 rounded w-fit">
                                                    {teacher.contract_hours} Horas - {teacher.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {teacher.subSpecialties?.map((spec, i) => (
                                                    <span key={i} className="text-[10px] bg-cyan-50 text-cyan-600 border border-cyan-100 px-1.5 py-0.5 rounded">
                                                        {spec}
                                                    </span>
                                                ))}
                                                {(!teacher.subSpecialties || teacher.subSpecialties.length === 0) && <span className="text-xs text-text-secondary italic">General</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="text-text-secondary">
                                                <div>{teacher.email_ua}</div>
                                                <div className="text-xs opacity-75">{teacher.phone}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 print:hidden">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); handleViewDetail(teacher); }} className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded transition-colors font-bold text-xs px-3" title="Ver Perfil">
                                                    <EyeIcon className="h-4 w-4 inline mr-1" /> Ver
                                                </button>
                                                {isTeacher && (
                                                    <>
                                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(teacher); }} className="p-1.5 hover:bg-primary/20 hover:text-primary rounded text-text-secondary" title="Editar">
                                                            <EditIcon className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(teacher.id); }} className="p-1.5 hover:bg-danger/20 hover:text-danger rounded text-text-secondary" title="Eliminar">
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DETAIL / MENTORSHIP VIEW MODAL */}
            {isDetailOpen && currentTeacher && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
                    <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-secondary/20">
                        <header className="p-6 border-b border-secondary/20 flex justify-between items-start bg-secondary/5 rounded-t-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-primary/10 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
                                    {currentTeacher.photo_url ? (
                                        <img src={currentTeacher.photo_url} alt={currentTeacher.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <BriefcaseIcon className="h-8 w-8 text-primary" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-text-primary">{currentTeacher.name}</h3>
                                    <p className="text-text-secondary">{currentTeacher.rank} • {currentTeacher.email_ua}</p>
                                    <div className="flex gap-2 mt-1">
                                        {currentTeacher.subSpecialties?.map(s => <span key={s} className="text-xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">{s}</span>)}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailOpen(false)} className="p-2 rounded-full hover:bg-secondary/20"><CloseIcon /></button>
                        </header>

                        <div className="p-6 overflow-y-auto">
                            <h4 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2 border-b border-secondary/10 pb-2">
                                <CalendarIcon className="h-5 w-5 text-purple-600" /> Disponibilidad para Mentoría
                            </h4>
                            
                            <div className="flex justify-between items-center mb-4 text-xs">
                                <div className="flex gap-4">
                                    {isTeacher ? (
                                        <>
                                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 rounded"></div> Disponible</span>
                                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded"></div> Reservado</span>
                                            <span className="flex items-center gap-1"><div className="w-3 h-3 border border-secondary/20 rounded"></div> No Disponible</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 rounded"></div> Disponible (Click para reservar)</span>
                                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-success rounded"></div> Tu Reserva</span>
                                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-300 rounded"></div> Ocupado</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="overflow-x-auto bg-background/50 p-4 rounded-xl border border-secondary/10">
                                <div className="min-w-[600px] grid grid-cols-6 gap-2">
                                    <div className="p-2"></div> 
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
                                                const isMyBooking = isBooked && slot?.studentId === currentUserId;
                                                
                                                let cellClass = "bg-surface border-secondary/20 opacity-50"; // Default Empty
                                                let title = "No Disponible";
                                                let content = "";

                                                if (isTeacher) {
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
                                                        title = "Click para habilitar";
                                                    }
                                                } else {
                                                    // Resident View
                                                    if (isMyBooking) {
                                                        cellClass = "bg-success border-success text-white font-bold hover:bg-success/80";
                                                        title = "Tu Reserva (Click para cancelar)";
                                                        content = "Tu Reserva";
                                                    } else if (isBooked) {
                                                        cellClass = "bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed";
                                                        title = "Ocupado";
                                                        content = "Ocupado";
                                                    } else if (isAvailable) {
                                                        cellClass = "bg-purple-500 border-purple-600 text-white cursor-pointer hover:bg-purple-600 shadow-sm animate-pulse";
                                                        title = "Disponible - Click para reservar";
                                                        content = "Reservar";
                                                    }
                                                }

                                                return (
                                                    <button
                                                        key={`${day}-${hour}`}
                                                        onClick={() => handleSlotClick(day, hour)}
                                                        className={`rounded-lg transition-all border h-10 flex items-center justify-center text-[10px] font-bold ${cellClass}`}
                                                        title={title}
                                                        disabled={!isTeacher && isBooked && !isMyBooking}
                                                    >
                                                        {content}
                                                    </button>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-text-secondary mt-3 text-center italic">
                                {isTeacher 
                                    ? "* Haz clic en un bloque vacío para habilitarlo. Haz clic en uno habilitado para eliminarlo."
                                    : "* Selecciona un bloque morado para reservar una sesión de mentoría."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
                    <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-secondary/20">
                        <header className="p-5 border-b border-secondary/20 flex justify-between items-center bg-surface/95 rounded-t-xl">
                            <h3 className="text-xl font-bold text-text-primary">
                                {isEditing ? `Editar: ${currentTeacher.name}` : 'Nuevo Docente'}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-full hover:bg-secondary/20"><CloseIcon /></button>
                        </header>
                        
                        {/* Tab Switcher */}
                        <div className="px-6 pt-4 border-b border-secondary/10 flex gap-4">
                            <button 
                                onClick={() => setActiveModalTab('info')}
                                className={`pb-2 px-2 text-sm font-bold border-b-2 transition-colors ${activeModalTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                            >
                                Ficha Docente
                            </button>
                            <button 
                                onClick={() => setActiveModalTab('docs')}
                                className={`pb-2 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeModalTab === 'docs' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                            >
                                Documentos <span className="bg-secondary/20 px-1.5 rounded-full text-[10px] text-text-primary">{teacherDocuments.length}</span>
                            </button>
                        </div>

                        <main className="p-6 overflow-y-auto">
                            {activeModalTab === 'info' && (
                                <form id="teacher-form" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-accent border-b border-secondary/20 pb-1 uppercase tracking-wider">Información Profesional</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Nombre Completo</label>
                                                <input type="text" name="name" value={currentTeacher.name} onChange={handleInputChange} className={inputClass} required />
                                            </div>
                                            <div>
                                                <label className={labelClass}>RUT / ID</label>
                                                <input type="text" name="id" value={currentTeacher.id} onChange={handleInputChange} className={inputClass} required disabled={isEditing} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Jerarquía Académica</label>
                                                <select name="rank" value={currentTeacher.rank} onChange={handleInputChange} className={inputClass}>
                                                    <option value="Profesor Titular">Profesor Titular</option>
                                                    <option value="Profesor Asociado">Profesor Asociado</option>
                                                    <option value="Profesor Auxiliar">Profesor Auxiliar</option>
                                                    <option value="Instructor">Instructor</option>
                                                    <option value="Instructor Adjunto">Instructor Adjunto</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Horas Contrato</label>
                                                <select name="contract_hours" value={currentTeacher.contract_hours} onChange={handleInputChange} className={inputClass}>
                                                    <option value="11">11 Hrs</option>
                                                    <option value="22">22 Hrs</option>
                                                    <option value="33">33 Hrs</option>
                                                    <option value="44">44 Hrs</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className={labelClass}>Sub-especialidades (separadas por coma)</label>
                                                <input 
                                                    type="text" 
                                                    value={currentTeacher.subSpecialties?.join(', ') || ''} 
                                                    onChange={handleSpecialtyChange}
                                                    className={inputClass}
                                                    placeholder="Ej: Neurorradiología, Intervencionista" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-accent border-b border-secondary/20 pb-1 uppercase tracking-wider">Contacto</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Email Institucional (UA)</label>
                                                <input type="email" name="email_ua" value={currentTeacher.email_ua} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Email Personal</label>
                                                <input type="email" name="email_personal" value={currentTeacher.email_personal} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Teléfono</label>
                                                <input type="tel" name="phone" value={currentTeacher.phone} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Estado</label>
                                                <select name="status" value={currentTeacher.status} onChange={handleInputChange} className={inputClass}>
                                                    <option value="Activo">Activo</option>
                                                    <option value="Inactivo">Inactivo</option>
                                                    <option value="Sabático">Sabático</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-accent border-b border-secondary/20 pb-1 uppercase tracking-wider">Antecedentes Académicos</h4>
                                        <datalist id="universities-list">
                                            {uniqueUniversities.map(u => <option key={u} value={u} />)}
                                        </datalist>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Universidad Pregrado</label>
                                                <input 
                                                    list="universities-list"
                                                    type="text" 
                                                    name="university_undergrad" 
                                                    value={currentTeacher.university_undergrad} 
                                                    onChange={handleInputChange} 
                                                    className={inputClass}
                                                    placeholder="Seleccione o escriba..." 
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Universidad Postgrado / Especialidad</label>
                                                <input 
                                                    list="universities-list"
                                                    type="text" 
                                                    name="university_postgrad" 
                                                    value={currentTeacher.university_postgrad} 
                                                    onChange={handleInputChange} 
                                                    className={inputClass} 
                                                    placeholder="Seleccione o escriba..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            )}

                            {activeModalTab === 'docs' && (
                                <div className="space-y-6">
                                    <div className="bg-background/50 border border-secondary/20 p-4 rounded-lg flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-text-primary">Subir Nuevo Documento</h4>
                                            <p className="text-xs text-text-secondary">Archivos se guardarán en el repositorio central bajo este docente.</p>
                                            {!currentTeacher.id && <p className="text-xs text-danger font-bold mt-1">Requiere RUT/ID para subir</p>}
                                        </div>
                                        <label className={`bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold cursor-pointer transition-colors flex items-center gap-2 ${!currentTeacher.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <CloudUploadIcon className="h-5 w-5" />
                                            <span>Seleccionar Archivo</span>
                                            <input type="file" className="hidden" ref={docInputRef} onChange={handleDocumentUpload} disabled={!currentTeacher.id} />
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        {teacherDocuments.length === 0 ? (
                                            <div className="text-center p-8 border-2 border-dashed border-secondary/20 rounded-xl text-text-secondary">
                                                No hay documentos asociados a este docente.
                                            </div>
                                        ) : (
                                            teacherDocuments.map(doc => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-surface border border-secondary/20 rounded-lg hover:border-primary/30 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-100 rounded text-blue-600">
                                                            <DocumentTextIcon className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-text-primary">{doc.title}</p>
                                                            <p className="text-xs text-text-secondary">{doc.category} • {new Date(doc.uploadDate).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <a href={doc.url} download className="p-2 hover:bg-secondary/10 rounded text-primary" title="Descargar"><DownloadIcon className="h-4 w-4" /></a>
                                                        <button onClick={() => handleDeleteDocument(doc.id)} className="p-2 hover:bg-danger/10 rounded text-danger" title="Eliminar"><TrashIcon className="h-4 w-4" /></button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </main>

                        <footer className="p-5 border-t border-secondary/20 bg-surface/95 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setIsFormOpen(false)} className="px-5 py-2 rounded-lg border border-secondary/30 hover:bg-secondary/10 transition-colors">Cancelar</button>
                            {activeModalTab === 'info' && <button type="submit" form="teacher-form" className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-all">Guardar Ficha</button>}
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeachersModule;
