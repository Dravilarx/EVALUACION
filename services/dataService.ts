
import { 
    Student, Teacher, Subject, Question, Quiz, Attempt, BulletinEntry, 
    Message, MentorshipSlot, CompetencyEvaluation, PresentationEvaluation, 
    SurveyResult, Acta, ManualGradeEntry, FinalExam, ProcedureLog, 
    AppDocument, Annotation, Activity, LogEntry, AlumniFollowUp, ProgramInfo, ProgramAuthority, SixMonthExam
} from '../types';
import { 
    mockStudents, mockTeachers, mockSubjects, initialQuestions, 
    initialQuizzes, initialAttempts, mockBulletinEntries, mockDocuments 
} from '../data/mockData';

// --- MOCK DATABASE ---
let dbStudents = [...mockStudents];
let dbTeachers = [...mockTeachers];
let dbSubjects = [...mockSubjects];
let dbQuestions = [...initialQuestions];
let dbQuizzes = [...initialQuizzes];
let dbAttempts = [...initialAttempts];
let dbBulletin = [...mockBulletinEntries];
let dbMessages: Message[] = [
    {
        id: 'MSG-001',
        senderId: '10611061',
        senderName: 'Marcelo Avila',
        recipientIds: ['18.123.456-7'],
        subject: 'Bienvenida',
        content: 'Bienvenido al programa de radiología.',
        timestamp: new Date().toISOString(),
        readBy: [],
        isDeletedBy: []
    }
];
let dbMentorships: MentorshipSlot[] = [];
let dbCompetencies: CompetencyEvaluation[] = [];
let dbPresentations: PresentationEvaluation[] = [];
let dbSurveys: SurveyResult[] = [];
let dbActas: Acta[] = [];
let dbManualGrades: ManualGradeEntry[] = [];
let dbFinalExams: FinalExam[] = [];
let dbSixMonthExams: SixMonthExam[] = []; // New
let dbProcedures: ProcedureLog[] = [];
let dbDocuments: AppDocument[] = [...mockDocuments];
let dbAnnotations: Annotation[] = [];
let dbActivities: Activity[] = [];
let dbLogs: LogEntry[] = [];
let dbAlumniFollowUps: AlumniFollowUp[] = [];

// Program Info Data
let dbProgramInfo: ProgramInfo = {
    description: "El Programa de Especialización en Radiología de la Universidad de Antofagasta busca formar médicos especialistas con sólidas competencias en el diagnóstico por imágenes, ética profesional y compromiso con la salud pública.",
    mission: "Formar especialistas íntegros, con excelencia académica y sentido social, capaces de liderar los equipos de salud y contribuir al desarrollo de la región y el país.",
    vision: "Ser un programa referente en la formación de radiólogos en el norte de Chile, reconocido por su calidad, innovación y vinculación con el medio.",
    authorities: [
        { id: "AUTH-1", name: "Dr. Marcelo Avila", position: "Director de Programa", email: "marcelo.avila@ua.cl", bio: "Médico Radiólogo, especialista en gestión académica." },
        { id: "AUTH-2", name: "Dra. Ana Fuentes", position: "Jefa de Docencia", email: "ana.fuentes@ua.cl", bio: "Especialista en Ultrasonido y Docencia Clínica." }
    ]
};

// Helper to simulate network delay
const simulateNetwork = <T>(data: T, ms = 300): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), ms));
};

export const StudentService = {
    getAll: async () => simulateNetwork([...dbStudents]),
    create: async (student: Student) => {
        dbStudents.unshift(student);
        return simulateNetwork(student);
    },
    update: async (student: Student) => {
        dbStudents = dbStudents.map(s => s.id === student.id ? student : s);
        return simulateNetwork(student);
    },
    delete: async (id: string) => {
        dbStudents = dbStudents.filter(s => s.id !== id);
        return simulateNetwork(undefined);
    }
};

export const TeacherService = {
    getAll: async () => simulateNetwork([...dbTeachers]),
    create: async (teacher: Teacher) => {
        dbTeachers.unshift(teacher);
        return simulateNetwork(teacher);
    },
    update: async (teacher: Teacher) => {
        dbTeachers = dbTeachers.map(t => t.id === teacher.id ? teacher : t);
        return simulateNetwork(teacher);
    },
    delete: async (id: string) => {
        dbTeachers = dbTeachers.filter(t => t.id !== id);
        return simulateNetwork(undefined);
    }
};

export const SubjectService = {
    getAll: async () => simulateNetwork([...dbSubjects]),
    create: async (subject: Subject) => {
        dbSubjects.unshift(subject);
        return simulateNetwork(subject);
    },
    update: async (subject: Subject) => {
        dbSubjects = dbSubjects.map(s => s.id === subject.id ? subject : s);
        return simulateNetwork(subject);
    },
    delete: async (id: string) => {
        dbSubjects = dbSubjects.filter(s => s.id !== id);
        return simulateNetwork(undefined);
    }
};

export const QuestionService = {
    getAll: async () => simulateNetwork([...dbQuestions]),
    create: async (question: Question) => {
        dbQuestions.unshift(question);
        return simulateNetwork(question);
    },
    update: async (question: Question) => {
        dbQuestions = dbQuestions.map(q => q.codigo_pregunta === question.codigo_pregunta ? question : q);
        return simulateNetwork(question);
    },
    delete: async (id: string) => {
        dbQuestions = dbQuestions.filter(q => q.codigo_pregunta !== id);
        return simulateNetwork(undefined);
    }
};

export const QuizService = {
    getAll: async () => simulateNetwork([...dbQuizzes]),
    create: async (quiz: Quiz) => {
        dbQuizzes.unshift(quiz);
        return simulateNetwork(quiz);
    },
    update: async (quiz: Quiz) => {
        dbQuizzes = dbQuizzes.map(q => q.id_cuestionario === quiz.id_cuestionario ? quiz : q);
        return simulateNetwork(quiz);
    },
    delete: async (id: string) => {
        dbQuizzes = dbQuizzes.filter(q => q.id_cuestionario !== id);
        return simulateNetwork(undefined);
    }
};

export const AttemptService = {
    getAll: async () => simulateNetwork([...dbAttempts]),
    create: async (attempt: Attempt) => {
        dbAttempts.unshift(attempt);
        return simulateNetwork(attempt);
    },
    update: async (attempt: Attempt) => {
        dbAttempts = dbAttempts.map(a => a.id_intento === attempt.id_intento ? attempt : a);
        return simulateNetwork(attempt);
    }
};

export const BulletinService = {
    getAll: async () => simulateNetwork([...dbBulletin]),
    create: async (entry: BulletinEntry) => {
        dbBulletin.unshift(entry);
        return simulateNetwork(entry);
    },
    update: async (entry: BulletinEntry) => {
        dbBulletin = dbBulletin.map(b => b.id === entry.id ? entry : b);
        return simulateNetwork(entry);
    },
    delete: async (id: string) => {
        dbBulletin = dbBulletin.filter(b => b.id !== id);
        return simulateNetwork(undefined);
    }
};

export const MessageService = {
    getInbox: async (userId: string) => {
        const inbox = dbMessages.filter(m => m.recipientIds.includes(userId) && !m.isDeletedBy.includes(userId));
        return simulateNetwork(inbox.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    },
    getSent: async (userId: string) => {
        const sent = dbMessages.filter(m => m.senderId === userId && !m.isDeletedBy.includes(userId));
        return simulateNetwork(sent.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    },
    sendMessage: async (message: Message) => {
        dbMessages.unshift(message);
        return simulateNetwork(message);
    },
    markAsRead: async (messageId: string, userId: string) => {
        const msg = dbMessages.find(m => m.id === messageId);
        if (msg && !msg.readBy.includes(userId)) {
            msg.readBy.push(userId);
        }
        return simulateNetwork(true);
    },
    deleteMessage: async (messageId: string, userId: string) => {
        const msg = dbMessages.find(m => m.id === messageId);
        if (msg && !msg.isDeletedBy.includes(userId)) {
            msg.isDeletedBy.push(userId);
        }
        return simulateNetwork(true);
    },
    getUnreadCount: async (userId: string) => {
        const count = dbMessages.filter(m => m.recipientIds.includes(userId) && !m.readBy.includes(userId)).length;
        return simulateNetwork(count);
    }
};

export const MentorshipService = {
    getAll: async () => simulateNetwork([...dbMentorships]),
    getByTeacher: async (teacherId: string) => {
        return simulateNetwork(dbMentorships.filter(m => m.teacherId === teacherId));
    },
    create: async (slot: MentorshipSlot) => {
        dbMentorships.push(slot);
        return simulateNetwork(slot);
    },
    delete: async (id: string) => {
        dbMentorships = dbMentorships.filter(m => m.id !== id);
        return simulateNetwork(undefined);
    },
    book: async (slotId: string, studentId: string, studentName: string) => {
        const slot = dbMentorships.find(m => m.id === slotId);
        if (slot) {
            slot.status = 'booked';
            slot.studentId = studentId;
            slot.studentName = studentName;
        }
        return simulateNetwork(slot!);
    },
    cancelBooking: async (slotId: string) => {
        const slot = dbMentorships.find(m => m.id === slotId);
        if (slot) {
            slot.status = 'available';
            slot.studentId = undefined;
            slot.studentName = undefined;
        }
        return simulateNetwork(slot!);
    }
};

export const CompetencyService = {
    getAll: async () => simulateNetwork([...dbCompetencies]),
    create: async (evaluation: CompetencyEvaluation) => {
        dbCompetencies.unshift(evaluation);
        return simulateNetwork(evaluation);
    },
    update: async (evaluation: CompetencyEvaluation) => {
        dbCompetencies = dbCompetencies.map(e => e.id === evaluation.id ? evaluation : e);
        return simulateNetwork(evaluation);
    },
    delete: async (id: string) => {
        dbCompetencies = dbCompetencies.filter(e => e.id !== id);
        return simulateNetwork(undefined);
    }
};

export const PresentationService = {
    getAll: async () => simulateNetwork([...dbPresentations]),
    create: async (evaluation: PresentationEvaluation) => {
        dbPresentations.unshift(evaluation);
        return simulateNetwork(evaluation);
    },
    update: async (evaluation: PresentationEvaluation) => {
        dbPresentations = dbPresentations.map(e => e.id === evaluation.id ? evaluation : e);
        return simulateNetwork(evaluation);
    },
    delete: async (id: string) => {
        dbPresentations = dbPresentations.filter(e => e.id !== id);
        return simulateNetwork(undefined);
    }
};

export const SurveyService = {
    getAll: async () => simulateNetwork([...dbSurveys]),
    create: async (survey: SurveyResult) => {
        dbSurveys.unshift(survey);
        return simulateNetwork(survey);
    },
    update: async (survey: SurveyResult) => {
        dbSurveys = dbSurveys.map(s => s.id === survey.id ? survey : s);
        return simulateNetwork(survey);
    }
};

export const ActaService = {
    getAll: async () => simulateNetwork([...dbActas]),
    create: async (acta: Acta) => {
        dbActas.unshift(acta);
        return simulateNetwork(acta);
    },
    update: async (acta: Acta) => {
        dbActas = dbActas.map(a => a.id === acta.id ? acta : a);
        return simulateNetwork(acta);
    }
};

export const ManualGradeService = {
    getAll: async () => simulateNetwork([...dbManualGrades]),
    create: async (entry: ManualGradeEntry) => {
        // Upsert based on composite key (student+subject+type) or id
        const idx = dbManualGrades.findIndex(m => m.id === entry.id || (m.studentId === entry.studentId && m.subjectId === entry.subjectId && m.type === entry.type));
        if (idx >= 0) {
            dbManualGrades[idx] = entry;
        } else {
            dbManualGrades.unshift(entry);
        }
        return simulateNetwork(entry);
    },
    delete: async (id: string) => {
        dbManualGrades = dbManualGrades.filter(m => m.id !== id);
        return simulateNetwork(undefined);
    }
};

export const FinalExamService = {
    getAll: async () => simulateNetwork([...dbFinalExams]),
    create: async (exam: FinalExam) => {
        dbFinalExams.unshift(exam);
        return simulateNetwork(exam);
    },
    update: async (exam: FinalExam) => {
        dbFinalExams = dbFinalExams.map(e => e.id === exam.id ? exam : e);
        return simulateNetwork(exam);
    }
};

export const SixMonthExamService = {
    getAll: async () => simulateNetwork([...dbSixMonthExams]),
    create: async (exam: SixMonthExam) => {
        dbSixMonthExams.unshift(exam);
        return simulateNetwork(exam);
    },
    update: async (exam: SixMonthExam) => {
        dbSixMonthExams = dbSixMonthExams.map(e => e.id === exam.id ? exam : e);
        return simulateNetwork(exam);
    }
};

export const ProcedureService = {
    getAll: async () => simulateNetwork([...dbProcedures]),
    logProcedure: async (studentId: string, subjectId: string, procedureId: string) => {
        // Find existing log or create new
        let log = dbProcedures.find(p => p.studentId === studentId && p.subjectId === subjectId && p.procedureId === procedureId);
        if (!log) {
            log = {
                id: `PL-${Date.now()}`,
                studentId,
                subjectId,
                procedureId,
                count: 0,
                validatedCount: 0,
                status: 'Pending'
            };
            dbProcedures.push(log);
        }
        log.count++;
        return simulateNetwork(log);
    },
    validateProcedures: async (studentId: string, subjectId: string) => {
        dbProcedures.forEach(p => {
            if (p.studentId === studentId && p.subjectId === subjectId) {
                p.validatedCount = p.count;
                p.status = 'Validated';
            }
        });
        return simulateNetwork(true);
    }
};

export const DocumentService = {
    getAll: async () => simulateNetwork([...dbDocuments]),
    getByOwner: async (ownerId: string) => {
        return simulateNetwork(dbDocuments.filter(d => d.ownerId === ownerId));
    },
    create: async (doc: AppDocument) => {
        dbDocuments.unshift(doc);
        return simulateNetwork(doc);
    },
    delete: async (id: string) => {
        dbDocuments = dbDocuments.filter(d => d.id !== id);
        return simulateNetwork(undefined);
    }
};

export const AnnotationService = {
    getAll: async () => simulateNetwork([...dbAnnotations]),
    getByTarget: async (targetId: string) => {
        return simulateNetwork(dbAnnotations.filter(a => a.targetId === targetId));
    },
    create: async (note: Annotation) => {
        dbAnnotations.unshift(note);
        return simulateNetwork(note);
    },
    update: async (note: Annotation) => {
        dbAnnotations = dbAnnotations.map(a => a.id === note.id ? note : a);
        return simulateNetwork(note);
    },
    delete: async (id: string) => {
        dbAnnotations = dbAnnotations.filter(a => a.id !== id);
        return simulateNetwork(undefined);
    }
};

export const ActivityService = {
    getAll: async () => simulateNetwork([...dbActivities]),
    getByParticipant: async (participantId: string) => {
        return simulateNetwork(dbActivities.filter(a => a.participantId === participantId));
    },
    create: async (activity: Activity) => {
        dbActivities.unshift(activity);
        return simulateNetwork(activity);
    },
    update: async (activity: Activity) => {
        dbActivities = dbActivities.map(a => a.id === activity.id ? activity : a);
        return simulateNetwork(activity);
    },
    delete: async (id: string) => {
        dbActivities = dbActivities.filter(a => a.id !== id);
        return simulateNetwork(undefined);
    }
};

export const LogService = {
    getAll: async () => simulateNetwork([...dbLogs]),
    logAction: async (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
        const newLog: LogEntry = {
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...entry
        };
        dbLogs.unshift(newLog);
        return simulateNetwork(newLog);
    }
};

// --- ALUMNI SERVICE ---
export const AlumniService = {
    getFollowUps: async (): Promise<AlumniFollowUp[]> => {
        return simulateNetwork([...dbAlumniFollowUps]);
    },
    createFollowUp: async (entry: AlumniFollowUp): Promise<AlumniFollowUp> => {
        dbAlumniFollowUps.unshift(entry);
        return simulateNetwork(entry);
    },
    updateFollowUp: async (entry: AlumniFollowUp): Promise<AlumniFollowUp> => {
        dbAlumniFollowUps = dbAlumniFollowUps.map(a => a.id === entry.id ? entry : a);
        return simulateNetwork(entry);
    },
    deleteFollowUp: async (id: string): Promise<void> => {
        dbAlumniFollowUps = dbAlumniFollowUps.filter(a => a.id !== id);
        return simulateNetwork(undefined);
    },
    getByStudent: async (studentId: string): Promise<AlumniFollowUp[]> => {
        const results = dbAlumniFollowUps
            .filter(a => a.studentId === studentId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return simulateNetwork(results);
    }
};

// --- PROGRAM INFO SERVICE ---
export const ProgramInfoService = {
    get: async (): Promise<ProgramInfo> => {
        return simulateNetwork({ ...dbProgramInfo });
    },
    update: async (info: ProgramInfo): Promise<ProgramInfo> => {
        dbProgramInfo = info;
        return simulateNetwork(info);
    }
};
