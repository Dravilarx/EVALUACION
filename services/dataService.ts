
import { Question, Quiz, Attempt, Student, Teacher, Subject, BulletinEntry, SurveyResult, Annotation, Activity, CompetencyEvaluation, PresentationEvaluation, Acta } from '../types';
import { initialQuestions, initialQuizzes, initialAttempts, mockStudents, mockTeachers, mockSubjects, mockBulletinEntries } from '../data/mockData';

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
let dbSurveys: SurveyResult[] = [];
let dbAnnotations: Annotation[] = [];
let dbActivities: Activity[] = [];
let dbCompetencies: CompetencyEvaluation[] = [];
let dbPresentations: PresentationEvaluation[] = [];
let dbActas: Acta[] = []; // New collection for Actas

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
