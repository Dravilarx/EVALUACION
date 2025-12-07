
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Message, Student, Teacher, MessageAttachment } from '../types';
import { MessageService, StudentService, TeacherService } from '../services/dataService';
import { InboxIcon, PaperAirplaneIcon, TrashIcon, UserGroupIcon, PlusIcon, CloseIcon, RefreshIcon, MailIcon, PaperClipIcon, ImageIcon, VideoIcon, LinkIcon, FileIcon, CloudUploadIcon, CheckCircleIcon, ZoomInIcon, ZoomOutIcon, DownloadIcon } from './icons';

interface MessagingModuleProps {
    currentUserId: string;
    currentUserName: string;
    initialDraft?: { recipients: string[]; subject: string; content: string } | null;
    onClearDraft?: () => void;
}

const MessagingModule: React.FC<MessagingModuleProps> = ({ currentUserId, currentUserName, initialDraft, onClearDraft }) => {
    const [view, setView] = useState<'inbox' | 'sent' | 'compose' | 'read'>('inbox');
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);

    // Compose State
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    const [recipientSearch, setRecipientSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    // Link Input State
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    // Image Viewer State
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle Initial Draft (Deep linking to compose)
    useEffect(() => {
        if (initialDraft) {
            setView('compose');
            setSelectedRecipients(initialDraft.recipients);
            setSubject(initialDraft.subject);
            setContent(initialDraft.content);
            if (onClearDraft) onClearDraft();
        }
    }, [initialDraft, onClearDraft]);

    useEffect(() => {
        loadData();
    }, [view]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [s, t] = await Promise.all([
                StudentService.getAll(),
                TeacherService.getAll()
            ]);
            setStudents(s);
            setTeachers(t);

            if (view === 'inbox') {
                const inbox = await MessageService.getInbox(currentUserId);
                setMessages(inbox);
            } else if (view === 'sent') {
                const sent = await MessageService.getSent(currentUserId);
                setMessages(sent);
            }
        } catch (error) {
            console.error("Error loading messages", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReadMessage = async (msg: Message) => {
        setSelectedMessage(msg);
        setView('read');
        if (!msg.readBy.includes(currentUserId) && view === 'inbox') {
            await MessageService.markAsRead(msg.id, currentUserId);
            // Optimistic update
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, readBy: [...m.readBy, currentUserId] } : m));
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        if (confirm("¿Eliminar este mensaje?")) {
            await MessageService.deleteMessage(msgId, currentUserId);
            setMessages(prev => prev.filter(m => m.id !== msgId));
            if (view === 'read') setView('inbox');
        }
    };

    // --- IMAGE VIEWER LOGIC ---
    const handleImageClick = (src: string) => {
        setZoomedImage(src);
        setZoomLevel(1);
    };

    const handleZoomIn = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoomLevel(prev => Math.min(prev + 0.5, 3));
    };

    const handleZoomOut = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
    };

    // --- ATTACHMENT LOGIC ---

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileSelect = async (files: FileList | null) => {
        if (!files) return;
        
        const newAttachments: MessageAttachment[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            let type: 'image' | 'video' | 'file' = 'file';
            
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('video/')) type = 'video';

            try {
                const base64 = await fileToBase64(file);
                newAttachments.push({
                    type,
                    url: base64,
                    name: file.name
                });
            } catch (error) {
                console.error("Error processing file", file.name, error);
            }
        }
        setAttachments(prev => [...prev, ...newAttachments]);
    };

    const handleAddLink = () => {
        setShowLinkInput(true);
    };

    const confirmAddLink = () => {
        if (linkUrl.trim()) {
            const validUrl = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
            setAttachments(prev => [...prev, {
                type: 'link',
                url: validUrl,
                name: linkUrl
            }]);
            setLinkUrl('');
            setShowLinkInput(false);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>, dragging: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(dragging);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        handleDrag(e, false);
        handleFileSelect(e.dataTransfer.files);
    };

    // --- COMPOSE LOGIC: AUTOCOMPLETE & CHIPS ---

    const groups = useMemo(() => [
        { id: 'ALL_RESIDENTS', label: 'Todos los Residentes' },
        { id: 'R1', label: 'Residentes R1' },
        { id: 'R2', label: 'Residentes R2' },
        { id: 'R3', label: 'Residentes R3' },
        { id: 'ALL_TEACHERS', label: 'Todos los Docentes' }
    ], []);

    // Combine all users for search
    const allUsers = useMemo(() => {
        const s = students.map(st => ({ id: st.id, name: st.name, role: `Residente ${st.level}`, type: 'student' }));
        const t = teachers.map(te => ({ id: te.id, name: te.name, role: 'Docente', type: 'teacher' }));
        return [...t, ...s];
    }, [students, teachers]);

    // Filtered suggestions based on search text and excluding already selected
    const suggestions = useMemo(() => {
        if (!recipientSearch.trim()) return [];
        const lowerSearch = recipientSearch.toLowerCase();
        return allUsers.filter(u => 
            !selectedRecipients.includes(u.id) && 
            (u.name.toLowerCase().includes(lowerSearch) || u.role.toLowerCase().includes(lowerSearch))
        );
    }, [recipientSearch, allUsers, selectedRecipients]);

    const addRecipient = (id: string) => {
        if (!selectedRecipients.includes(id)) {
            setSelectedRecipients(prev => [...prev, id]);
        }
        setRecipientSearch('');
        setShowDropdown(false);
    };

    const removeRecipient = (idToRemove: string) => {
        setSelectedRecipients(prev => prev.filter(id => id !== idToRemove));
    };

    const handleGroupSelect = (groupId: string) => {
        let idsToAdd: string[] = [];
        switch (groupId) {
            case 'ALL_RESIDENTS':
                idsToAdd = students.map(s => s.id);
                break;
            case 'R1':
            case 'R2':
            case 'R3':
                idsToAdd = students.filter(s => s.level === groupId).map(s => s.id);
                break;
            case 'ALL_TEACHERS':
                idsToAdd = teachers.map(t => t.id);
                break;
        }
        
        // Add unique IDs that aren't already selected
        const newIds = idsToAdd.filter(id => !selectedRecipients.includes(id));
        if (newIds.length > 0) {
            setSelectedRecipients(prev => [...prev, ...newIds]);
        }
    };

    const handleSendMessage = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault(); // Prevent any default behavior
        
        console.log("Attempting to send message...");

        // Explicit Validation
        if (selectedRecipients.length === 0) {
            alert("Por favor, seleccione al menos un destinatario.");
            return;
        }
        if (!subject.trim()) {
            alert("El campo 'Asunto' es obligatorio.");
            return;
        }
        if (!content.trim() && attachments.length === 0) {
            alert("Debe escribir un mensaje o agregar adjuntos.");
            return;
        }

        setIsSending(true);
        try {
            // Determine group label if all recipients match a specific group for better display in "Sent" folder
            let groupLabel = undefined;
            if (selectedRecipients.length > 1) {
                if (selectedRecipients.length >= students.length && students.length > 0) groupLabel = "Todos los Residentes";
                else if (selectedRecipients.length >= teachers.length && teachers.length > 0) groupLabel = "Todos los Docentes";
                else groupLabel = `${selectedRecipients.length} destinatarios`;
            }

            const senderNameFinal = currentUserName || "Usuario Desconocido";

            const newMessage: Message = {
                id: `MSG-${Date.now()}`,
                senderId: currentUserId,
                senderName: senderNameFinal, 
                recipientIds: selectedRecipients,
                recipientGroupLabel: groupLabel,
                subject: subject,
                content: content,
                timestamp: new Date().toISOString(),
                readBy: [],
                isDeletedBy: [],
                attachments: attachments
            };

            console.log("Sending message payload:", newMessage);
            await MessageService.sendMessage(newMessage);
            
            alert("Mensaje enviado correctamente.");
            
            // Cleanup and redirect
            setSubject('');
            setContent('');
            setSelectedRecipients([]);
            setRecipientSearch('');
            setAttachments([]);
            setLinkUrl('');
            setShowLinkInput(false);
            
            // Force reload of Sent items before switching view
            await loadData(); 
            setView('sent');

        } catch (error) {
            console.error("Failed to send message:", error);
            alert("Error al enviar mensaje. Por favor intente nuevamente.");
        } finally {
            setIsSending(false);
        }
    };

    const getUserName = (id: string) => {
        const u = allUsers.find(user => user.id === id);
        return u ? u.name : id;
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 animate-fade-in-up">
            {/* Sidebar */}
            <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
                <button 
                    type="button"
                    onClick={() => { 
                        setView('compose'); 
                        setSelectedRecipients([]); 
                        setRecipientSearch(''); 
                        setSubject(''); 
                        setContent(''); 
                        setAttachments([]);
                        setShowLinkInput(false);
                        setLinkUrl('');
                    }}
                    className="bg-primary hover:bg-primary-dark text-white p-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all mb-4"
                >
                    <PlusIcon className="h-5 w-5" /> Redactar
                </button>

                <button 
                    type="button"
                    onClick={() => setView('inbox')}
                    className={`p-3 rounded-xl font-medium flex items-center gap-3 transition-colors ${view === 'inbox' ? 'bg-white shadow text-primary' : 'text-text-secondary hover:bg-secondary/10'}`}
                >
                    <InboxIcon className="h-5 w-5" /> Buzón de Entrada
                </button>
                <button 
                    type="button"
                    onClick={() => setView('sent')}
                    className={`p-3 rounded-xl font-medium flex items-center gap-3 transition-colors ${view === 'sent' ? 'bg-white shadow text-primary' : 'text-text-secondary hover:bg-secondary/10'}`}
                >
                    <PaperAirplaneIcon className="h-5 w-5" /> Enviados
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-grow bg-surface rounded-xl shadow-sm border border-secondary/20 overflow-hidden flex flex-col relative">
                
                {/* List View (Inbox/Sent) */}
                {(view === 'inbox' || view === 'sent') && (
                    <div className="flex flex-col h-full">
                        <header className="p-4 border-b border-secondary/20 flex justify-between items-center bg-secondary/5">
                            <h3 className="font-bold text-lg text-text-primary capitalize">{view === 'inbox' ? 'Buzón de Entrada' : 'Mensajes Enviados'}</h3>
                            <button type="button" onClick={loadData} className="p-2 hover:bg-secondary/20 rounded-full text-text-secondary"><RefreshIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></button>
                        </header>
                        <div className="flex-grow overflow-y-auto">
                            {messages.length === 0 ? (
                                <div className="p-10 text-center text-text-secondary opacity-60">
                                    <MailIcon className="h-16 w-16 mx-auto mb-4" />
                                    <p>No hay mensajes.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-secondary/10">
                                    {messages.map(msg => {
                                        const isRead = msg.readBy.includes(currentUserId) || view === 'sent';
                                        const hasAttachments = (msg.attachments?.length || 0) > 0;
                                        return (
                                            <div 
                                                key={msg.id} 
                                                onClick={() => handleReadMessage(msg)}
                                                className={`p-4 hover:bg-primary/5 cursor-pointer transition-colors flex gap-4 items-center ${!isRead ? 'bg-primary/5' : ''}`}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${!isRead ? 'bg-primary' : 'bg-secondary'}`}>
                                                    {msg.senderName.charAt(0)}
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <h4 className={`text-sm truncate pr-2 ${!isRead ? 'font-bold text-text-primary' : 'font-medium text-text-primary'}`}>
                                                            {view === 'sent' ? `Para: ${msg.recipientGroupLabel || msg.recipientIds.length + ' destinatarios'}` : msg.senderName}
                                                        </h4>
                                                        <span className="text-xs text-text-secondary shrink-0">{new Date(msg.timestamp).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className={`text-sm truncate ${!isRead ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                                                        {hasAttachments && <PaperClipIcon className="inline h-3 w-3 mr-1" />}
                                                        {msg.subject}
                                                    </p>
                                                    <p className="text-xs text-text-secondary truncate mt-0.5 opacity-80">{msg.content || '(Sin texto)'}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Read View */}
                {view === 'read' && selectedMessage && (
                    <div className="flex flex-col h-full animate-fade-in-right">
                        <header className="p-4 border-b border-secondary/20 flex justify-between items-center">
                            <button type="button" onClick={() => setView('inbox')} className="text-sm font-bold text-text-secondary hover:text-primary flex items-center gap-1">
                                &larr; Volver
                            </button>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => handleDeleteMessage(selectedMessage.id)} className="p-2 hover:bg-danger/10 text-danger rounded-full" title="Eliminar"><TrashIcon className="h-5 w-5" /></button>
                            </div>
                        </header>
                        <div className="p-6 overflow-y-auto flex-grow">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">{selectedMessage.subject}</h2>
                            
                            {/* Sender Info - Prominent Display */}
                            <div className="bg-background/50 p-4 rounded-xl border border-secondary/10 flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
                                    {selectedMessage.senderName.charAt(0)}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-text-secondary uppercase tracking-wider font-bold">De:</span>
                                        <span className="font-bold text-lg text-text-primary">{selectedMessage.senderName}</span>
                                    </div>
                                    <div className="flex flex-col mt-1">
                                        <span className="text-xs text-text-secondary uppercase tracking-wider font-bold">Para:</span>
                                        <span className="text-sm text-text-secondary">
                                            {selectedMessage.recipientGroupLabel 
                                                ? selectedMessage.recipientGroupLabel 
                                                : selectedMessage.recipientIds.map(id => getUserName(id)).join(', ')
                                            }
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right text-xs text-text-secondary">
                                    <p>{new Date(selectedMessage.timestamp).toLocaleDateString()}</p>
                                    <p>{new Date(selectedMessage.timestamp).toLocaleTimeString()}</p>
                                </div>
                            </div>

                            <div className="prose text-text-primary whitespace-pre-wrap leading-relaxed text-sm p-4 bg-background rounded-lg border border-secondary/5">
                                {selectedMessage.content}
                            </div>

                            {/* Attachments Display */}
                            {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                                <div className="mt-6 border-t border-secondary/20 pt-4">
                                    <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <PaperClipIcon className="h-4 w-4" /> Adjuntos ({selectedMessage.attachments.length})
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {selectedMessage.attachments.map((att, idx) => (
                                            <div key={idx} className="group relative rounded-lg border border-secondary/20 overflow-hidden bg-background hover:shadow-md transition-all">
                                                {att.type === 'image' && (
                                                    <div 
                                                        onClick={() => handleImageClick(att.url)} 
                                                        className="block aspect-square cursor-pointer group-hover:opacity-90 transition-opacity"
                                                    >
                                                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                {att.type === 'video' && (
                                                    <div className="aspect-square bg-black flex items-center justify-center relative">
                                                        <video src={att.url} controls className="w-full h-full object-contain" />
                                                    </div>
                                                )}
                                                {(att.type === 'link' || att.type === 'file') && (
                                                    <a href={att.url} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center aspect-square p-4 text-center hover:bg-secondary/5 transition-colors">
                                                        <div className={`p-3 rounded-full mb-2 ${att.type === 'link' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                                            {att.type === 'link' ? <LinkIcon className="h-6 w-6" /> : <FileIcon className="h-6 w-6" />}
                                                        </div>
                                                        <span className="text-xs font-medium truncate w-full" title={att.name}>{att.name}</span>
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Compose View */}
                {view === 'compose' && (
                    <div className="flex flex-col h-full animate-fade-in-up">
                        <header className="p-4 border-b border-secondary/20 bg-secondary/5 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-text-primary">Nuevo Mensaje</h3>
                            <button type="button" onClick={() => setView('inbox')} className="p-1 hover:bg-secondary/20 rounded-full"><CloseIcon /></button>
                        </header>
                        
                        <div className="p-6 overflow-y-auto flex-grow space-y-4 relative"
                             onDragEnter={(e) => handleDrag(e, true)}
                             onDragLeave={(e) => handleDrag(e, false)}
                             onDragOver={(e) => handleDrag(e, true)}
                             onDrop={handleDrop}
                        >
                            {/* Drag Overlay */}
                            {isDragging && (
                                <div className="absolute inset-0 bg-primary/10 border-4 border-dashed border-primary z-50 flex items-center justify-center backdrop-blur-sm pointer-events-none">
                                    <div className="bg-surface p-6 rounded-xl shadow-lg flex flex-col items-center animate-bounce">
                                        <CloudUploadIcon className="h-12 w-12 text-primary mb-2" />
                                        <p className="text-lg font-bold text-primary">Suelte los archivos aquí</p>
                                    </div>
                                </div>
                            )}

                            {/* Recipient Selector */}
                            <div className="space-y-2 relative">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">Para:</label>
                                    <div className="flex flex-wrap gap-1 justify-end">
                                        {groups.map(g => (
                                            <button 
                                                type="button"
                                                key={g.id}
                                                onClick={() => handleGroupSelect(g.id)}
                                                className="px-2 py-0.5 bg-secondary/10 hover:bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-transparent hover:border-primary/30 transition-colors flex items-center gap-1"
                                            >
                                                <UserGroupIcon className="h-3 w-3" /> {g.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div 
                                    className="min-h-[42px] w-full bg-background border border-secondary/30 rounded-lg p-1.5 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all"
                                    onClick={() => document.getElementById('recipient-input')?.focus()}
                                >
                                    {selectedRecipients.map(id => {
                                        const user = allUsers.find(u => u.id === id);
                                        return (
                                            <span key={id} className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-primary/20 animate-scale-in">
                                                {user ? user.name : id}
                                                <button 
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeRecipient(id); }}
                                                    className="hover:text-danger rounded-full p-0.5"
                                                >
                                                    <CloseIcon className="h-3 w-3" />
                                                </button>
                                            </span>
                                        );
                                    })}
                                    
                                    <input 
                                        id="recipient-input"
                                        type="text" 
                                        value={recipientSearch}
                                        onChange={(e) => { setRecipientSearch(e.target.value); setShowDropdown(true); }}
                                        onFocus={() => setShowDropdown(true)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !recipientSearch && selectedRecipients.length > 0) {
                                                removeRecipient(selectedRecipients[selectedRecipients.length - 1]);
                                            }
                                        }}
                                        placeholder={selectedRecipients.length === 0 ? "Busca personas o selecciona grupos..." : ""}
                                        className="flex-grow bg-transparent outline-none text-sm min-w-[150px] text-text-primary placeholder-secondary/50 h-7"
                                        autoComplete="off"
                                    />
                                </div>

                                {showDropdown && (recipientSearch || suggestions.length > 0) && (
                                    <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-1 bg-surface border border-secondary/20 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                        {suggestions.length > 0 ? (
                                            suggestions.map(user => (
                                                <button 
                                                    type="button"
                                                    key={user.id}
                                                    onClick={() => addRecipient(user.id)}
                                                    className="w-full text-left px-4 py-2 hover:bg-primary/5 flex items-center justify-between group transition-colors"
                                                >
                                                    <div>
                                                        <p className="text-sm font-bold text-text-primary group-hover:text-primary">{user.name}</p>
                                                        <p className="text-xs text-text-secondary">{user.role}</p>
                                                    </div>
                                                    <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"><PlusIcon className="h-4 w-4"/></span>
                                                </button>
                                            ))
                                        ) : (
                                            recipientSearch && <div className="p-3 text-sm text-text-secondary text-center italic">No se encontraron usuarios.</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wider">Asunto</label>
                                <input 
                                    type="text" 
                                    placeholder="Escribe el asunto..." 
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="w-full bg-transparent border-b border-secondary/30 p-2 text-lg font-bold outline-none focus:border-primary placeholder-secondary/50"
                                />
                            </div>

                            <textarea 
                                placeholder="Escribe tu mensaje aquí o arrastra archivos..." 
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="w-full bg-transparent border-none p-2 outline-none h-48 resize-none placeholder-secondary/50"
                            />

                            {/* Attachment Previews */}
                            {attachments.length > 0 && (
                                <div className="flex gap-2 flex-wrap pb-2">
                                    {attachments.map((att, idx) => (
                                        <div key={idx} className="relative group bg-background border border-secondary/20 rounded-lg p-2 flex items-center gap-2 max-w-[200px]">
                                            {att.type === 'image' ? (
                                                <img src={att.url} alt="thumb" className="w-8 h-8 rounded object-cover" />
                                            ) : att.type === 'video' ? (
                                                <VideoIcon className="w-8 h-8 text-secondary" />
                                            ) : (
                                                <LinkIcon className="w-8 h-8 text-blue-500" />
                                            )}
                                            <span className="text-xs truncate flex-grow">{att.name || 'Archivo'}</span>
                                            <button 
                                                onClick={() => removeAttachment(idx)}
                                                className="bg-danger text-white rounded-full p-0.5 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <CloseIcon className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Toolbar */}
                            <div className="flex gap-2 border-t border-secondary/10 pt-2 items-center">
                                <input 
                                    type="file" 
                                    multiple 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    onChange={(e) => handleFileSelect(e.target.files)} 
                                />
                                
                                {!showLinkInput ? (
                                    <>
                                        <button 
                                            type="button" 
                                            onClick={() => fileInputRef.current?.click()} 
                                            className="p-2 text-text-secondary hover:bg-secondary/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                        >
                                            <PaperClipIcon className="h-4 w-4" /> Adjuntar
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleAddLink}
                                            className="p-2 text-text-secondary hover:bg-secondary/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                        >
                                            <LinkIcon className="h-4 w-4" /> Enlace
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 flex-grow animate-fade-in-right">
                                        <LinkIcon className="h-4 w-4 text-primary" />
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="Pegar URL aquí..."
                                            value={linkUrl}
                                            onChange={(e) => setLinkUrl(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') confirmAddLink();
                                                if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl(''); }
                                            }}
                                            className="flex-grow bg-background border border-secondary/30 rounded px-2 py-1 text-sm outline-none focus:border-primary"
                                        />
                                        <button 
                                            onClick={confirmAddLink}
                                            className="p-1 text-success hover:bg-success/10 rounded"
                                            title="Añadir"
                                        >
                                            <CheckCircleIcon className="h-4 w-4" />
                                        </button>
                                        <button 
                                            onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
                                            className="p-1 text-danger hover:bg-danger/10 rounded"
                                            title="Cancelar"
                                        >
                                            <CloseIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <footer className="p-4 border-t border-secondary/20 flex justify-end gap-3 bg-surface z-[60] relative">
                            <button type="button" onClick={() => setView('inbox')} className="px-5 py-2 rounded-lg text-text-secondary hover:bg-secondary/10 transition-colors">Descartar</button>
                            <button 
                                type="button"
                                onClick={handleSendMessage} 
                                disabled={isSending}
                                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSending ? <RefreshIcon className="animate-spin h-5 w-5" /> : <PaperAirplaneIcon className="h-5 w-5" />}
                                {isSending ? 'Enviando...' : 'Enviar Mensaje'}
                            </button>
                        </footer>
                    </div>
                )}
            </div>

            {/* Image Viewer Modal */}
            {zoomedImage && (
                <div 
                    className="fixed inset-0 bg-black/95 z-[70] flex flex-col items-center justify-center animate-fade-in"
                    onClick={() => setZoomedImage(null)}
                >
                    {/* Toolbar */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-surface/10 backdrop-blur-md border border-white/10 rounded-full px-6 py-2 shadow-2xl z-10" onClick={e => e.stopPropagation()}>
                        <button onClick={handleZoomOut} className="p-2 text-white/70 hover:text-white transition-colors" title="Alejar"><ZoomOutIcon className="h-6 w-6" /></button>
                        <span className="text-white text-sm font-mono w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={handleZoomIn} className="p-2 text-white/70 hover:text-white transition-colors" title="Acercar"><ZoomInIcon className="h-6 w-6" /></button>
                        <div className="w-px h-6 bg-white/20 mx-2"></div>
                        <a href={zoomedImage} download="adjunto-imagen" className="p-2 text-white/70 hover:text-white transition-colors" onClick={e => e.stopPropagation()} title="Descargar"><DownloadIcon className="h-5 w-5" /></a>
                        <button onClick={() => setZoomedImage(null)} className="p-2 text-white/70 hover:text-danger transition-colors ml-2" title="Cerrar"><CloseIcon className="h-6 w-6" /></button>
                    </div>
                    
                    {/* Image */}
                    <div className="w-full h-full overflow-auto flex items-center justify-center p-4 cursor-zoom-out">
                        <img 
                            src={zoomedImage} 
                            alt="Vista previa" 
                            className="max-w-[95vw] max-h-[95vh] object-contain transition-transform duration-200"
                            style={{ transform: `scale(${zoomLevel})` }}
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessagingModule;
