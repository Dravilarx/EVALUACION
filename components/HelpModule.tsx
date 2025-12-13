
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { PaperAirplaneIcon, RefreshIcon, QuestionMarkCircleIcon, SparklesIcon, ChatBubbleLeftRightIcon, BookOpenIcon, FilterIcon, ChevronRightIcon } from './icons';
import { LogService, DocumentService } from '../services/dataService';
import { generateDynamicFAQ, FAQCategory } from '../services/geminiService';

interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
}

const BASE_SYSTEM_INSTRUCTION = `
Eres el "Asistente de Manual de Usuario" del sistema EvalúaMed (GRUA - Gestión Radiología Universidad Antofagasta).
Tu objetivo es responder preguntas sobre CÓMO usar la plataforma y sobre la DOCUMENTACIÓN almacenada.

**ESTRUCTURA DEL SISTEMA Y FUNCIONALIDADES:**

1.  **ROLES:**
    *   **Administrador:** Acceso total.
    *   **Docente:** Gestiona asignaturas, crea cuestionarios, evalúa competencias.
    *   **Residente (Alumno):** Responde cuestionarios, ve su progreso, firma actas.

2.  **MÓDULOS PRINCIPALES:**
    *   **Inicio:** Alertas, casos del día.
    *   **Evaluación Escrita:** Banco de preguntas y Cuestionarios.
    *   **Competencias Personales & Presentación:** Rúbricas de evaluación.
    *   **Carpeta Residentes:** Hoja de vida, notas, documentos.
    *   **Gestión / Documentos:** Repositorio central de archivos.
    *   **Comunicación:** Mensajería y Encuestas.

**ESTILO DE RESPUESTA:**
*   Sé directo, amable y útil.
*   Usa formato Markdown.
*   Si te preguntan sobre un reglamento o documento específico, usa la información proporcionada en el "CONTEXTO DE DOCUMENTOS" si está disponible.
`;

const SUGGESTED_QUESTIONS = [
    "¿Cómo creo un nuevo cuestionario?",
    "¿Cómo evalúo una competencia?",
    "¿Qué dice el reglamento de residentes?",
    "¿Cómo subo un documento?",
    "¿Qué hace el asistente de IA?"
];

// Fallback Static FAQs if no logs exist yet
const STATIC_FAQS: FAQCategory[] = [
    {
        category: "Primeros Pasos",
        items: [
            { q: "¿Cómo inicio sesión?", a: "Utilice sus credenciales institucionales (correo UA y contraseña). Si es su primera vez, solicite acceso a la coordinación." },
            { q: "¿Puedo cambiar mi rol?", a: "Los roles son asignados por el administrador. Contacte a soporte si requiere permisos adicionales." },
        ]
    },
    {
        category: "Evaluaciones",
        items: [
            { q: "¿Cómo creo un cuestionario?", a: "Vaya a 'Evaluación Escrita' > 'Cuestionarios', haga clic en 'Crear' y seleccione preguntas del banco o cree nuevas." },
        ]
    }
];

const HelpModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'chat' | 'faq'>('chat');
    
    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'welcome', role: 'model', text: '¡Hola! Soy el asistente virtual de EvalúaMed. Puedo ayudarte a navegar el sistema o responder dudas sobre los documentos cargados. ¿En qué te ayudo?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Context Loading State
    const [documentContext, setDocumentContext] = useState('');

    // FAQ State
    const [faqs, setFaqs] = useState<FAQCategory[]>(STATIC_FAQS);
    const [faqSearch, setFaqSearch] = useState('');
    const [openFaq, setOpenFaq] = useState<string | null>(null);
    const [isGeneratingFaqs, setIsGeneratingFaqs] = useState(false);
    const [lastFaqUpdate, setLastFaqUpdate] = useState<number>(0); 

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (activeTab === 'chat') scrollToBottom();
    }, [messages, activeTab]);

    // Load Documents for Context
    useEffect(() => {
        const loadDocs = async () => {
            const docs = await DocumentService.getAll();
            // Filter relevant docs (e.g., program or public docs) and extract text
            const contextText = docs
                .filter(d => d.textContent && (d.visibility === 'public' || d.ownerType === 'Program'))
                .map(d => `--- DOCUMENTO: ${d.title} (${d.category}) ---\n${d.textContent}\n--- FIN DOCUMENTO ---`)
                .join('\n\n');
            
            if (contextText) {
                setDocumentContext(`\n\n**CONTEXTO DE DOCUMENTOS DEL SISTEMA:**\n${contextText}`);
            }
        };
        loadDocs();
    }, []);

    // Intelligent FAQ Loader
    useEffect(() => {
        if (activeTab === 'faq') {
            const now = Date.now();
            if (now - lastFaqUpdate > 300000) {
                loadDynamicFaqs();
            }
        }
    }, [activeTab]);

    const loadDynamicFaqs = async () => {
        setIsGeneratingFaqs(true);
        try {
            const logs = await LogService.getAll();
            const helpQueries = logs
                .filter(log => log.action === 'HELP_QUERY')
                .map(log => log.details);

            if (helpQueries.length > 0) {
                const dynamicFaqs = await generateDynamicFAQ(helpQueries, BASE_SYSTEM_INSTRUCTION);
                setFaqs(dynamicFaqs);
                setLastFaqUpdate(Date.now());
            }
        } catch (error) {
            console.error("Failed to generate dynamic FAQs", error);
        } finally {
            setIsGeneratingFaqs(false);
        }
    };

    const handleSendMessage = async (text: string = inputValue) => {
        if (!text.trim()) return;

        LogService.logAction({
            action: 'HELP_QUERY',
            module: 'Help',
            details: text,
            userId: 'CURRENT_USER', 
            userName: 'Usuario',
            userRole: 'RESIDENT'
        });

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: text };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsThinking(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            // Combine system instruction with document context
            const fullSystemInstruction = BASE_SYSTEM_INSTRUCTION + documentContext;

            const chat = ai.chats.create({
                model: "gemini-2.5-flash",
                config: {
                    systemInstruction: fullSystemInstruction
                },
                history: history
            });

            const result = await chat.sendMessage({ message: text });
            const responseText = result.text;

            if (responseText) {
                setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: responseText }]);
            } else {
                throw new Error("Respuesta vacía del modelo");
            }
        } catch (error) {
            console.error("Error chatting with manual bot:", error);
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: 'Lo siento, tuve un problema al consultar el manual. Por favor intenta de nuevo.' }]);
        } finally {
            setIsThinking(false);
        }
    };

    const filteredFaqs = useMemo(() => {
        if (!faqSearch) return faqs;
        const lowerSearch = faqSearch.toLowerCase();
        return faqs.map(cat => ({
            ...cat,
            items: cat.items.filter(item => 
                item.q.toLowerCase().includes(lowerSearch) || 
                item.a.toLowerCase().includes(lowerSearch)
            )
        })).filter(cat => cat.items.length > 0);
    }, [faqSearch, faqs]);

    const toggleFaq = (question: string) => {
        setOpenFaq(prev => prev === question ? null : question);
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col animate-fade-in-up max-w-4xl mx-auto">
            <div className="bg-surface rounded-xl shadow-lg border border-secondary/20 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="bg-surface border-b border-secondary/20">
                    <div className="p-4 flex items-center gap-3 border-b border-secondary/10 bg-primary/5">
                        <div className="p-2 bg-primary/10 rounded-full text-primary">
                            <QuestionMarkCircleIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">Centro de Ayuda Inteligente</h2>
                            <p className="text-xs text-text-secondary">Soporte y consulta de documentos.</p>
                        </div>
                    </div>
                    <div className="flex px-4 pt-2 gap-6">
                        <button 
                            onClick={() => setActiveTab('chat')}
                            className={`pb-2 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'chat' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                        >
                            <ChatBubbleLeftRightIcon className="h-4 w-4" /> Asistente Virtual
                        </button>
                        <button 
                            onClick={() => setActiveTab('faq')}
                            className={`pb-2 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'faq' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                        >
                            <BookOpenIcon className="h-4 w-4" /> Preguntas Frecuentes
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto bg-background/50 relative">
                    {activeTab === 'chat' ? (
                        <div className="p-6 space-y-6 min-h-full flex flex-col">
                            {/* Chat Messages */}
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm whitespace-pre-wrap text-sm leading-relaxed ${
                                        msg.role === 'user' 
                                            ? 'bg-primary text-white rounded-br-none' 
                                            : 'bg-surface border border-secondary/20 rounded-bl-none text-text-primary'
                                    }`}>
                                        {msg.role === 'model' && (
                                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-accent uppercase tracking-wider">
                                                <SparklesIcon className="h-3 w-3" /> Asistente GRUA
                                            </div>
                                        )}
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            
                            {isThinking && (
                                <div className="flex justify-start">
                                    <div className="bg-surface border border-secondary/20 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
                                        <RefreshIcon className="h-4 w-4 animate-spin text-primary" />
                                        <span className="text-xs text-text-secondary">Consultando manual y documentos...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Intelligent Header */}
                            <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl flex items-start gap-3">
                                <SparklesIcon className="h-6 w-6 text-accent shrink-0 mt-1" />
                                <div>
                                    <h4 className="text-sm font-bold text-accent">Preguntas Dinámicas</h4>
                                    <p className="text-xs text-text-secondary mt-1">
                                        Esta sección se actualiza automáticamente analizando las dudas más comunes de los usuarios.
                                        {isGeneratingFaqs && <span className="ml-2 font-bold animate-pulse">Actualizando ahora...</span>}
                                    </p>
                                </div>
                            </div>

                            {/* FAQ Search */}
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Buscar en preguntas frecuentes..." 
                                    value={faqSearch}
                                    onChange={(e) => setFaqSearch(e.target.value)}
                                    className="w-full bg-surface border border-secondary/30 rounded-xl pl-10 pr-4 py-3 shadow-sm outline-none focus:ring-2 focus:ring-accent transition-all"
                                />
                                <FilterIcon className="absolute left-3 top-3.5 h-5 w-5 text-text-secondary" />
                            </div>

                            {/* FAQ List */}
                            <div className="space-y-6">
                                {filteredFaqs.map((category, idx) => (
                                    <div key={idx} className="bg-surface rounded-xl border border-secondary/20 shadow-sm overflow-hidden animate-fade-in-up">
                                        <div className="bg-secondary/5 px-4 py-2 border-b border-secondary/10">
                                            <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">{category.category}</h3>
                                        </div>
                                        <div className="divide-y divide-secondary/10">
                                            {category.items.map((item, i) => (
                                                <div key={i} className="group">
                                                    <button 
                                                        onClick={() => toggleFaq(item.q)}
                                                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-background/50 transition-colors"
                                                    >
                                                        <span className="font-medium text-text-primary text-sm">{item.q}</span>
                                                        <ChevronRightIcon 
                                                            className={`h-4 w-4 text-text-secondary transition-transform duration-200 ${openFaq === item.q ? 'rotate-90' : ''}`} 
                                                        />
                                                    </button>
                                                    {openFaq === item.q && (
                                                        <div className="px-4 pb-4 pt-0 text-sm text-text-secondary leading-relaxed bg-background/30 animate-fade-in-down">
                                                            <div className="pt-2 border-t border-secondary/5">
                                                                {item.a}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {filteredFaqs.length === 0 && (
                                    <div className="text-center p-8 text-text-secondary">
                                        <p>No se encontraron resultados para "{faqSearch}"</p>
                                        <button 
                                            onClick={() => { setFaqSearch(''); setActiveTab('chat'); }}
                                            className="mt-2 text-accent font-bold hover:underline"
                                        >
                                            Preguntar al Asistente
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Chat Input Footer (Only visible if activeTab === 'chat') */}
                {activeTab === 'chat' && (
                    <>
                        {/* Suggestions Chips (Only visible in chat) */}
                        {messages.length < 3 && (
                            <div className="p-4 bg-surface border-t border-secondary/10 overflow-x-auto flex gap-2">
                                {SUGGESTED_QUESTIONS.map((q, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => handleSendMessage(q)}
                                        className="whitespace-nowrap px-3 py-1.5 rounded-full bg-secondary/10 hover:bg-primary/10 text-text-secondary hover:text-primary text-xs font-medium transition-colors border border-secondary/20"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Chat Input */}
                        <div className="p-4 bg-surface border-t border-secondary/20 flex gap-2">
                            <input 
                                type="text" 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Escribe tu pregunta o duda sobre un reglamento..."
                                className="flex-grow bg-background border border-secondary/30 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                disabled={isThinking}
                            />
                            <button 
                                onClick={() => handleSendMessage()}
                                disabled={!inputValue.trim() || isThinking}
                                className="p-3 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                            >
                                <PaperAirplaneIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default HelpModule;
