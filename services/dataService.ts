
import { Question, Quiz, Attempt, Student, Teacher, Subject, BulletinEntry, SurveyResult, Annotation, Activity, CompetencyEvaluation, PresentationEvaluation, Acta, ProcedureLog, LogEntry, ChangeRequest, Message, AppDocument } from '../types';
import { initialQuestions, initialQuizzes, initialAttempts, mockStudents, mockTeachers, mockSubjects, mockBulletinEntries, mockDocuments } from '../data/mockData';

// Simula la latencia de red de Firebase
const DELAY = 500;
const simulateNetwork = <T>(data: T): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), DELAY));
};

// Bases de datos "en memoria" (Simulando colecciones de Firebase)
let dbQuestions = [...initialQuestions];
let dbQuizzes = [...initialQuizzes];
let dbAttempts = [...initialAttempts];
let dbStudents = [...mockStudents];
let dbTeachers = [...mockTeachers];
let dbSubjects = [...mockSubjects];
let dbBulletin = [...mockBulletinEntries];
let dbDocuments = [...mockDocuments]; // New Documents DB
let dbSurveys: SurveyResult[] = [];
let dbAnnotations: Annotation[] = [];
let dbActivities: Activity[] = [];
let dbCompetencies: CompetencyEvaluation[] = [];
let dbPresentations: PresentationEvaluation[] = [];
let dbActas: Acta[] = []; 
let dbProcedures: ProcedureLog[] = [];
let dbLogs: LogEntry[] = [];
let dbRequests: ChangeRequest[] = [];

// Initialize some mock messages
let dbMessages: Message[] = [
    {
        id: 'MSG-001',
        senderId: '10.111.222-3', // Dr. Marcelo Avila
        senderName: 'Dr. Marcelo Avila',
        recipientIds: ['18.123.456-7', '19.876.543-2'], // Juan & Ana
        recipientGroupLabel: 'Residentes en Turno',
        subject: 'Cambio de horario Reunión Clínica',
        content: 'Estimados, la reunión de mañana se mueve para las 09:00 AM en el auditorio principal.',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        readBy: ['18.123.456-7'],
        isDeletedBy: []
    },
    {
        id: 'MSG-002',
        senderId: '12.333.444-5', // Dra. Ana Fuentes
        senderName: 'Dra. Ana Fuentes',
        recipientIds: ['10.111.222-3'], // Marcelo
        subject: 'Consulta sobre caso difícil',
        content: 'Hola Marcelo, ¿tienes un minuto para revisar una RM de cerebro? Tengo dudas con el diagnóstico diferencial.',
        timestamp: new Date().toISOString(), // Today
        readBy: [],
        isDeletedBy: []
    }
];

// --- MESSAGE SERVICE ---
export const MessageService = {
    getInbox: async (userId: string): Promise<Message[]> => {
        const inbox = dbMessages.filter(m => 
            m.recipientIds.includes(userId) && 
            !m.isDeletedBy.includes(userId)
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return simulateNetwork(inbox);
    },
    getSent: async (userId: string): Promise<Message[]> => {
        const sent = dbMessages.filter(m => 
            m.senderId === userId && 
            !m.isDeletedBy.includes(userId)
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return simulateNetwork(sent);
    },
    sendMessage: async (message: Message): Promise<Message> => {
        dbMessages.unshift(message);
        return simulateNetwork(message);
    },
    markAsRead: async (messageId: string, userId: string): Promise<void> => {
        dbMessages = dbMessages.map(m => {
            if (m.id === messageId && !m.readBy.includes(userId)) {
                return { ...m, readBy: [...m.readBy, userId] };
            }
            return m;
        });
        return simulateNetwork(undefined);
    },
    deleteMessage: async (messageId: string, userId: string): Promise<void> => {
        dbMessages = dbMessages.map(m => {
            if (m.id === messageId && !m.isDeletedBy.includes(userId)) {
                return { ...m, isDeletedBy: [...m.isDeletedBy, userId] };
            }
            return m;
        });
        return simulateNetwork(undefined);
    },
    getUnreadCount: async (userId: string): Promise<number> => {
        const count = dbMessages.filter(m => 
            m.recipientIds.includes(userId) && 
            !m.isDeletedBy.includes(userId) &&
            !m.readBy.includes(userId)
        ).length;
        return simulateNetwork(count);
    }
};

// --- LOGGING SERVICE ---
export const LogService = {
    logAction: async (entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> => {
        const newLog: LogEntry = {
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...entry
        };
        dbLogs.unshift(newLog);
        console.log(`[AUDIT LOG] ${newLog.action}: ${newLog.details} by ${newLog.userName}`);
    },
    getAll: async (): Promise<LogEntry[]> => {
        return simulateNetwork([...dbLogs]);
    },
    getRequests: async (): Promise<ChangeRequest[]> => {
        return simulateNetwork([...dbRequests]);
    },
    createRequest: async (request: Omit<ChangeRequest, 'id' | 'date' | 'status'>): Promise<ChangeRequest> => {
        const newReq: ChangeRequest = {
            id: `REQ-${Date.now()}`,
            date: new Date().toISOString(),
            status: 'PENDING',
            ...request
        };
        dbRequests.unshift(newReq);
        return simulateNetwork(newReq);
    }
};

export const QuestionService = {
    getAll: async (): Promise<Question[]> => {
        return simulateNetwork([...dbQuestions]);
    },
    create: async (question: Question): Promise<Question> => {
        dbQuestions.unshift(question);
        return simulateNetwork(question);
    },
    update: async (question: Question): Promise<Question> => {
        dbQuestions = dbQuestions.map(q => q.codigo_pregunta === question.codigo_pregunta ? question : q);
        return simulateNetwork(question);
    },
    delete: async (id: string): Promise<void> => {
        dbQuestions = dbQuestions.filter(q => q.codigo_pregunta !== id);
        return simulateNetwork(undefined);
    }
};

export const QuizService = {
    getAll: async (): Promise<Quiz[]> => {
        return simulateNetwork([...dbQuizzes]);
    },
    create: async (quiz: Quiz): Promise<Quiz> => {
        dbQuizzes.unshift(quiz);
        return simulateNetwork(quiz);
    },
    update: async (quiz: Quiz): Promise<Quiz> => {
        dbQuizzes = dbQuizzes.map(q => q.id_cuestionario === quiz.id_cuestionario ? quiz : q);
        return simulateNetwork(quiz);
    },
    delete: async (id: string): Promise<void> => {
        dbQuizzes = dbQuizzes.filter(q => q.id_cuestionario !== id);
        return simulateNetwork(undefined);
    }
};

export const AttemptService = {
    getAll: async (): Promise<Attempt[]> => {
        return simulateNetwork([...dbAttempts]);
    },
    create: async (attempt: Attempt): Promise<Attempt> => {
        dbAttempts.push(attempt);
        return simulateNetwork(attempt);
    },
    update: async (attempt: Attempt): Promise<Attempt> => {
        dbAttempts = dbAttempts.map(a => a.id_intento === attempt.id_intento ? attempt : a);
        return simulateNetwork(attempt);
    }
};

export const StudentService = {
    getAll: async (): Promise<Student[]> => {
        return simulateNetwork([...dbStudents]);
    },
    create: async (student: Student): Promise<Student> => {
        dbStudents.unshift(student);
        return simulateNetwork(student);
    },
    update: async (student: Student): Promise<Student> => {
        dbStudents = dbStudents.map(s => s.id === student.id ? student : s);
        return simulateNetwork(student);
    },
    delete: async (id: string): Promise<void> => {
        dbStudents = dbStudents.filter(s => s.id !== id);
        return simulateNetwork(undefined);
    }
};

export const TeacherService = {
    getAll: async (): Promise<Teacher[]> => {
        return simulateNetwork([...dbTeachers]);
    },
    create: async (teacher: Teacher): Promise<Teacher> => {
        dbTeachers.unshift(teacher);
        return simulateNetwork(teacher);
    },
    update: async (teacher: Teacher): Promise<Teacher> => {
        dbTeachers = dbTeachers.map(t => t.id === teacher.id ? teacher : t);
        return simulateNetwork(teacher);
    },
    delete: async (id: string): Promise<void> => {
        dbTeachers = dbTeachers.filter(t => t.id !== id);
        return simulateNetwork(undefined);
    }
};

export const SubjectService = {
    getAll: async (): Promise<Subject[]> => {
        return simulateNetwork([...dbSubjects]);
    },
    create: async (subject: Subject): Promise<Subject> => {
        subject.id = `SUBJ-${Date.now()}`;
        dbSubjects.unshift(subject);
        return simulateNetwork(subject);
    },
    update: async (subject: Subject): Promise<Subject> => {
        dbSubjects = dbSubjects.map(s => s.id === subject.id ? subject : s);
        return simulateNetwork(subject);
    },
    delete: async (id: string): Promise<void> => {
        dbSubjects = dbSubjects.filter(s => s.id !== id);
        return simulateNetwork(undefined);
    }
};

export const BulletinService = {
    getAll: async (): Promise<BulletinEntry[]> => {
        return simulateNetwork([...dbBulletin].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    },
    create: async (entry: BulletinEntry): Promise<BulletinEntry> => {
        entry.id = `NEWS-${Date.now()}`;
        dbBulletin.unshift(entry);
        return simulateNetwork(entry);
    },
    update: async (entry: BulletinEntry): Promise<BulletinEntry> => {
        dbBulletin = dbBulletin.map(e => e.id === entry.id ? entry : e);
        return simulateNetwork(entry);
    },
    delete: async (id: string): Promise<void> => {
        dbBulletin = dbBulletin.filter(e => e.id !== id);
        return simulateNetwork(undefined);
    }
};

export const DocumentService = {
    getAll: async (): Promise<AppDocument[]> => {
        return simulateNetwork([...dbDocuments].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
    },
    create: async (doc: AppDocument): Promise<AppDocument> => {
        dbDocuments.unshift(doc);
        return simulateNetwork(doc);
    },
    update: async (doc: AppDocument): Promise<AppDocument> => {
        dbDocuments = dbDocuments.map(d => d.id === doc.id ? doc : d);
        return simulateNetwork(doc);
    },
    delete: async (id: string): Promise<void> => {
        dbDocuments = dbDocuments.filter(d => d.id !== id);
        return simulateNetwork(undefined);
    },
    getByOwner: async (ownerId: string): Promise<AppDocument[]> => {
        // Returns documents owned by user OR Program documents visible to them
        // Note: Logic for 'Program' docs visibility is usually handled in the UI filter
        const docs = dbDocuments.filter(d => d.ownerId === ownerId).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
        return simulateNetwork(docs);
    }
};

export const SurveyService = {
    getAll: async (): Promise<SurveyResult[]> => {
        return simulateNetwork([...dbSurveys]);
    },
    create: async (survey: SurveyResult): Promise<SurveyResult> => {
        dbSurveys.unshift(survey);
        return simulateNetwork(survey);
    },
    update: async (survey: SurveyResult): Promise<SurveyResult> => {
        dbSurveys = dbSurveys.map(s => s.id === survey.id ? survey : s);
        return simulateNetwork(survey);
    }
};

export const AnnotationService = {
    getAll: async (): Promise<Annotation[]> => {
        return simulateNetwork([...dbAnnotations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    },
    create: async (annotation: Annotation): Promise<Annotation> => {
        dbAnnotations.unshift(annotation);
        return simulateNetwork(annotation);
    },
    update: async (annotation: Annotation): Promise<Annotation> => {
        dbAnnotations = dbAnnotations.map(a => a.id === annotation.id ? annotation : a);
        return simulateNetwork(annotation);
    },
    delete: async (id: string): Promise<void> => {
        dbAnnotations = dbAnnotations.filter(a => a.id !== id);
        return simulateNetwork(undefined);
    },
    getByTarget: async (targetId: string): Promise<Annotation[]> => {
        const results = dbAnnotations
            .filter(a => a.targetId === targetId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return simulateNetwork(results);
    }
};

export const ActivityService = {
    getAll: async (): Promise<Activity[]> => {
        return simulateNetwork([...dbActivities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    },
    create: async (activity: Activity): Promise<Activity> => {
        dbActivities.unshift(activity);
        return simulateNetwork(activity);
    },
    update: async (activity: Activity): Promise<Activity> => {
        dbActivities = dbActivities.map(a => a.id === activity.id ? activity : a);
        return simulateNetwork(activity);
    },
    delete: async (id: string): Promise<void> => {
        dbActivities = dbActivities.filter(a => a.id !== id);
        return simulateNetwork(undefined);
    },
    getByParticipant: async (participantId: string): Promise<Activity[]> => {
        const results = dbActivities
            .filter(a => a.participantId === participantId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return simulateNetwork(results);
    }
};

export const CompetencyService = {
    getAll: async (): Promise<CompetencyEvaluation[]> => {
        return simulateNetwork([...dbCompetencies].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    },
    create: async (evalData: CompetencyEvaluation): Promise<CompetencyEvaluation> => {
        console.log("DB: Inserting Competency", evalData);
        dbCompetencies.unshift(evalData);
        return simulateNetwork(evalData);
    },
    update: async (evalData: CompetencyEvaluation): Promise<CompetencyEvaluation> => {
        dbCompetencies = dbCompetencies.map(c => c.id === evalData.id ? evalData : c);
        return simulateNetwork(evalData);
    },
    delete: async (id: string): Promise<void> => {
        dbCompetencies = dbCompetencies.filter(c => c.id !== id);
        return simulateNetwork(undefined);
    },
    getByStudent: async (studentId: string): Promise<CompetencyEvaluation[]> => {
        const results = dbCompetencies.filter(c => c.studentId === studentId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return simulateNetwork(results);
    }
};

export const PresentationService = {
    getAll: async (): Promise<PresentationEvaluation[]> => {
        return simulateNetwork([...dbPresentations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    },
    create: async (evalData: PresentationEvaluation): Promise<PresentationEvaluation> => {
        console.log("DB: Inserting Presentation", evalData);
        dbPresentations.unshift(evalData);
        return simulateNetwork(evalData);
    },
    update: async (evalData: PresentationEvaluation): Promise<PresentationEvaluation> => {
        dbPresentations = dbPresentations.map(p => p.id === evalData.id ? evalData : p);
        return simulateNetwork(evalData);
    },
    delete: async (id: string): Promise<void> => {
        dbPresentations = dbPresentations.filter(p => p.id !== id);
        return simulateNetwork(undefined);
    },
    getByStudent: async (studentId: string): Promise<PresentationEvaluation[]> => {
        const results = dbPresentations.filter(p => p.studentId === studentId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return simulateNetwork(results);
    }
};

export const ActaService = {
    getAll: async (): Promise<Acta[]> => {
        return simulateNetwork([...dbActas].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()));
    },
    create: async (acta: Acta): Promise<Acta> => {
        dbActas.unshift(acta);
        return simulateNetwork(acta);
    },
    update: async (acta: Acta): Promise<Acta> => {
        dbActas = dbActas.map(a => a.id === acta.id ? acta : a);
        return simulateNetwork(acta);
    }
};

export const ProcedureService = {
    getAll: async (): Promise<ProcedureLog[]> => {
        return simulateNetwork([...dbProcedures]);
    },
    logProcedure: async (studentId: string, subjectId: string, procedureId: string): Promise<ProcedureLog> => {
        const existing = dbProcedures.find(p => p.studentId === studentId && p.subjectId === subjectId && p.procedureId === procedureId);
        
        if (existing) {
            existing.count += 1;
            existing.status = 'Pending';
            return simulateNetwork(existing);
        } else {
            const newLog: ProcedureLog = {
                id: `PROC-LOG-${Date.now()}`,
                studentId,
                subjectId,
                procedureId,
                count: 1,
                validatedCount: 0,
                status: 'Pending'
            };
            dbProcedures.push(newLog);
            return simulateNetwork(newLog);
        }
    },
    validateProcedures: async (studentId: string, subjectId: string): Promise<void> => {
        dbProcedures = dbProcedures.map(p => {
            if (p.studentId === studentId && p.subjectId === subjectId) {
                return { ...p, validatedCount: p.count, status: 'Validated' };
            }
            return p;
        });
        return simulateNetwork(undefined);
    }
};
