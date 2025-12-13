
export enum QuestionType {
  MultipleChoice = "multiple_choice",
  TrueFalse = "true_false",
  FreeResponse = "free_response",
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'RESIDENT';

// PERMISSIONS MATRIX BASED ON IMAGE
export const MODULE_PERMISSIONS: Record<string, UserRole[]> = {
    // Row: Inicio
    dashboard: ['ADMIN', 'TEACHER', 'RESIDENT'],
    // Row: Bitacora
    audit_log: ['ADMIN'],
    // Row: administracion
    admin_panel: ['ADMIN'],
    // Row: asignaturas
    subjects: ['ADMIN', 'TEACHER', 'RESIDENT'],
    // Row: docentes
    teachers: ['ADMIN', 'TEACHER', 'RESIDENT'],
    // Row: residentes
    residents: ['ADMIN', 'TEACHER', 'RESIDENT'],
    // Row: competencias personales
    surveys: ['ADMIN'], 
    // Row: presentacion
    presentation: ['ADMIN'], 
    // Row: evaluacion escrita
    evaluations: ['ADMIN', 'TEACHER'],
    // Row: libro de notas
    grades: ['ADMIN', 'TEACHER', 'RESIDENT'],
    // Row: carpeta residentes (Checked for Admin & Resident)
    residents_folder: ['ADMIN', 'RESIDENT'],
    // Row: carpeta docentes (Checked for Admin & Teacher)
    teachers_folder: ['ADMIN', 'TEACHER'],
    // Row: anotaciones
    annotations: ['ADMIN', 'TEACHER', 'RESIDENT'],
    // Row: extension
    activities: ['ADMIN', 'TEACHER', 'RESIDENT'],
    // Row: mensajeria
    messaging: ['ADMIN', 'TEACHER', 'RESIDENT'],
    // Row: cartelera UA
    news: ['ADMIN', 'TEACHER', 'RESIDENT'],
    // Row: documentos
    documents: ['ADMIN'],
    // Row: encuesta
    poll: ['ADMIN'],
    // Row: Curriculum (NEW)
    curriculum: ['ADMIN', 'RESIDENT'],
    // Row: Help / Manual (NEW)
    help: ['ADMIN', 'TEACHER', 'RESIDENT'],
    // Row: Alumni / Ex-alumnos (NEW)
    alumni: ['ADMIN', 'TEACHER'],
    // Row: Program Info / Nosotros (NEW)
    program_info: ['ADMIN', 'TEACHER', 'RESIDENT'],
    
    // Internal/Extra features (Implicit permissions based on context)
    change_requests: ['TEACHER', 'ADMIN'],
};

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    roles: UserRole[]; // A user can have multiple roles
    activeRole: UserRole; // The role currently being used
    photo_url?: string;
}

export interface LogEntry {
    id: string;
    timestamp: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'REQUEST' | 'HELP_QUERY';
    module: string;
    details: string;
    userId: string;
    userName: string;
    userRole: UserRole;
}

export interface ChangeRequest {
    id: string;
    teacherId: string;
    teacherName: string;
    date: string;
    type: 'DELETE' | 'MODIFY_RESTRICTED';
    description: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    targetId?: string; // ID of the item to delete/modify
}

export interface MessageAttachment {
    type: 'image' | 'video' | 'link' | 'file';
    url: string;
    name?: string;
}

export interface Message {
    id: string;
    senderId: string;
    senderName: string;
    recipientIds: string[]; // Array of User IDs
    recipientGroupLabel?: string; // e.g. "Todos los R1" (Optional metadata)
    subject: string;
    content: string;
    timestamp: string;
    readBy: string[]; // Array of User IDs who have read the message
    isDeletedBy: string[]; // Soft delete per user
    attachments?: MessageAttachment[];
}

export interface Alternative {
  id: string;
  texto: string;
  es_correcta: boolean;
}

export interface RubricCriterion {
    criterio: string;
    max_puntos: number;
    descriptor: string;
}

export interface EvaluationCriteria {
    id: number;
    title: string;
    description: string;
}

export interface Attachment {
  imagenes?: string[];
  videos?: string[];
  links?: string[];
  dicomFrames?: string[]; // Array of image URLs representing slices
}

export interface Question {
  codigo_pregunta: string;
  tipo_pregunta: QuestionType;
  enunciado: string;
  alternativas?: Alternative[];
  respuesta_correcta_vf?: "Verdadero" | "Falso";
  criterios_rubrica?: RubricCriterion[];
  feedback_correcto: string;
  feedback_incorrecto: string;
  adjuntos: Attachment;
  docente_creador: string;
  especialidad: string;
  dificultad: number;
  tema: string;
  subtema: string;
  etiquetas: string[];
  tiene_multimedia: boolean;
  fecha_creacion: string;
  veces_utilizada: number;
  rating?: 0 | 1 | 2 | 3; // 0: Sin clasificar, 1-3: Estrellas de favorito
  es_caso_del_dia?: boolean; // Indica si la pregunta es elegible para el widget del dashboard
}

export interface QuizQuestion {
  codigo_pregunta: string;
  puntaje: number;
}

export interface Quiz {
  id_cuestionario: string;
  titulo: string;
  descripcion: string;
  preguntas: QuizQuestion[];
  creado_desde: "banco" | "ia" | "simulacro";
  alumnos_asignados: string[];
  tiempo_limite_minutos: number;
  ventana_disponibilidad: {
    inicio: string;
    fin: string;
  };
  link_acceso: string;
  proctoring: {
    habilitado: boolean;
  };
  intentos_permitidos: number;
  docente_creador: string;
  asignatura: string;
}

export interface Student {
  id: string; // RUN o Pasaporte
  name: string;
  email_ua: string;
  email_personal: string;
  phone: string;
  admission_date: string; // ISO Date string
  graduation_date?: string; // ISO Date string (Added)
  level: "R1" | "R2" | "R3" | "Egresado"; // Calculado
  status: "Activo" | "Suspendido" | "Egresado";
  origin_university: string;
  nationality: string;
  sex: "Masculino" | "Femenino" | "Otro";
  photo_url?: string; // Base64 o URL
  course: string; // Programa de especialidad (ej: Radiología)
}

export interface Teacher {
  id: string; // RUN
  name: string;
  email_ua: string;
  email_personal: string;
  phone: string;
  admission_date: string;
  rank: "Profesor Titular" | "Profesor Auxiliar" | "Instructor";
  contract_hours: "11" | "22" | "33" | "44";
  subjects_in_charge: string[]; // Array de asignaturas
  status: "Activo" | "Inactivo";
  university_undergrad: string;
  university_postgrad: string;
  nationality: string;
  sex: "Masculino" | "Femenino" | "Otro";
  photo_url?: string;
  subSpecialties?: string[]; // New field for specialties
}

export interface MentorshipSlot {
    id: string;
    teacherId: string;
    studentId?: string; // null/undefined = available, string = booked
    studentName?: string; // denormalized for convenience
    day: string; // 'Lun', 'Mar', 'Mié', 'Jue', 'Vie'
    hour: string; // '08:00', '09:00'
    status: 'available' | 'booked';
}

export interface SubjectProcedure {
    id: string;
    name: string;
    goal: number; // e.g. 10 ecografias
}

export interface Subject {
    id: string;
    name: string;
    code: string;
    type?: 'Standard' | 'Transversal'; // New type to distinguish
    lead_teacher_id: string; // ID del docente a cargo
    participating_teachers_ids: string[]; // IDs de docentes participantes
    syllabus_url?: string; // URL to PDF
    procedures?: SubjectProcedure[]; // Required procedures for the rotation
}

export interface BulletinEntry {
    id: string;
    title: string;
    category: "Noticia" | "Evento" | "Aviso" | "Académico";
    date: string; // ISO String
    summary: string;
    content: string; // HTML or Markdown supported conceptually
    author: string;
    attachments: {
        images: string[]; // Base64 strings
        files: { name: string; type: string; data?: string }[]; // Mock file objects
        links: string[];
    };
    priority: boolean;
    visibility: 'public' | 'teachers' | 'residents'; // New field for visibility control
    requiresConfirmation?: boolean; // New: RSVP
    confirmedBy?: string[]; // New: List of student IDs who confirmed
}

export interface Answer {
    codigo_pregunta: string;
    respuesta: string;
    puntaje_obtenido: number;
}

export interface Attempt {
    id_intento: string;
    id_cuestionario: string;
    alumno_id: string;
    inicio: string;
    fin: string;
    respuestas: Answer[];
    puntaje_total_obtenido: number;
    puntaje_total_posible: number;
    porcentaje: number;
    nota?: number; // Grade on 1.0 to 7.0 scale
    tiempo_utilizado_seg: number;
    estado: "entregado" | "en_progreso" | "expirado" | "pendiente_revision";
}

export interface StudentStats {
  studentId: string;
  studentName: string;
  studentCourse: string;
  attemptCount: number;
  averageScore: number;
  averageGrade: number; // Average Note
}

export interface QuestionStats {
  codigo_pregunta: string;
  enunciado: string;
  especialidad: string;
  docente_creador: string;
  successRate: number;
  totalAnswers: number;
  distractorBreakdown: Record<string, number>; // { "A": 10, "B": 2, "C": 5... }
}

export interface QuizStats {
  quizId: string;
  quizTitle: string;
  asignatura: string;
  docente_creador: string;
  participantCount: number;
  averageScore: number;
  averageTimeSeconds: number;
}

export interface SurveyResult {
    id: string;
    studentId: string;
    teacherId: string;
    subjectId: string;
    date: string;
    status?: 'Pending' | 'Completed'; // Added status
    responses: Record<number, string>;
    textResponses: {
        q25: string;
        q26: string;
        q27: string;
    };
}

export interface Annotation {
    id: string;
    targetId: string; // ID del alumno o docente afectado
    targetType: 'Student' | 'Teacher';
    authorId: string; // ID de quien escribe la nota
    type: 'Positive' | 'Negative';
    content: string;
    date: string;
    privacy?: 'Public' | 'Private'; // New: Visibility level
    tags?: string[]; // New: AI suggested categories
}

export interface Activity {
    id: string;
    type: 'Curso' | 'Congreso' | 'Estadía' | 'Publicación' | 'Poster' | 'Vinculación' | 'Docencia' | 'Seminario';
    title: string;
    date: string;
    institution: string;
    role: string; // e.g. Asistente, Expositor, Autor
    description: string;
    participantId: string;
    participantType: 'Student' | 'Teacher';
    doi?: string; // New: DOI/PMID
    certificateUrl?: string; // New: Proof URL
    validationStatus?: 'Pending' | 'Validated'; // New: Coordinator check
}

// NEW INTERFACES FOR REGISTRATION SYSTEM
export interface CompetencyEvaluation {
    id: string;
    studentId: string;
    teacherId: string;
    subjectId: string;
    date: string;
    scores: Record<number, number>; // Criteria ID -> Score (1-7)
    average: number;
}

export interface PresentationEvaluation {
    id: string;
    studentId: string;
    teacherId: string;
    subjectId: string;
    date: string;
    scores: Record<number, number>; // Criteria ID -> Score (1-7)
    average: number;
}

// Interface for Final Grades Record (Acta)
export interface Acta {
    id: string;
    studentId: string;
    subjectId: string;
    teacherId: string;
    generatedAt: string;
    status: 'Pendiente' | 'Aceptada';
    signature?: {
        type: 'PIN' | 'Draw';
        data: string; // "Verified" for PIN, Base64 for Draw
        timestamp: string;
    };
    content: {
        writtenGrade: number;
        competencyGrade: number;
        presentationGrade: number;
        finalGrade: number;
        competencyDetails: Record<number, number>; // ID -> Score Snapshot
        presentationDetails: Record<number, number>; // ID -> Score Snapshot
        writtenComment?: string;
    }
}

// NEW: Manual Grade Entry for overrides or historical data
export interface ManualGradeEntry {
    id: string;
    studentId: string;
    subjectId: string;
    type: 'Written' | 'Competency' | 'Presentation' | 'Transversal'; // Added Transversal
    grade: number; // 1.0 to 7.0
    date: string;
    comment?: string;
    authorId: string;
}

// --- FINAL EXAM TYPES ---
export interface FinalExam {
    id: string;
    studentId: string;
    date: string;
    commissionIds: string[]; // List of Teacher IDs
    caseTopics: string[]; // List of clinical case topics presented (1-10)
    scores: Record<number, number>; // Rubric Dimension ID -> Score (0-4)
    finalScore: number; // 0-4 scale
    finalGrade: number; // 1.0 - 7.0 scale
    comments: string;
    status: 'Pending' | 'Completed';
}

// --- NEW SIX MONTH EXAM TYPE ---
export interface SixMonthExam {
    id: string;
    studentId: string;
    date: string;
    commissionIds: string[]; 
    caseTopics: string[]; 
    scores: Record<number, number>; 
    numericGrade: number; // 1.0 - 7.0 scale
    finalStatus: 'Aprobado' | 'Reprobado' | 'Pending'; // Determined by grade > 5.0
    comments: string;
}

// NEW FOR RESIDENT TIMELINE & DOCS
export interface TimelineEvent {
    id: string;
    date: string;
    title: string;
    description: string;
    type: 'Academic' | 'Administrative' | 'Milestone';
    status: 'Completed' | 'Pending' | 'Future';
}

// REPLACED StudentDocument with unified AppDocument
export interface AppDocument {
    id: string;
    title: string;
    type: string; // PDF, JPG, etc.
    category: 'Legal' | 'Médico' | 'Académico' | 'Administrativo' | 'Programa';
    uploadDate: string;
    url?: string;
    ownerType: 'Student' | 'Teacher' | 'Program';
    ownerId?: string; // NULL if Program, otherwise StudentID or TeacherID
    visibility: 'public' | 'teachers_only' | 'residents_only' | 'private';
    textContent?: string; // New: Stores AI extracted text content for searching
}

// Keep generic type for compatibility if needed, or alias it
export type StudentDocument = AppDocument;

// NEW FOR PROCEDURE TRACKER
export interface ProcedureLog {
    id: string;
    studentId: string;
    subjectId: string;
    procedureId: string;
    count: number;
    validatedCount: number;
    status: 'Pending' | 'Validated';
}

// --- NEW CV TYPES ---
export interface CVEducation {
    id: string;
    institution: string;
    degree: string;
    startYear: string;
    endYear: string;
}

export interface CVExperience {
    id: string;
    institution: string;
    role: string;
    startYear: string;
    endYear: string;
    description: string;
}

export interface CVProgramRole {
    id: string;
    role: string; // e.g. "Jefe de Residentes", "Encargado de Programación"
    description: string;
    period: string; // e.g. "2024", "Enero-Junio 2025"
}

export interface CVData {
    fullName: string;
    rut: string;
    email: string;
    phone: string;
    specialty: string;
    summary: string;
    education: CVEducation[];
    clinicalRotations: CVExperience[]; // Derived from Subjects/Grades
    academicActivities: Activity[]; // Derived from Activities
    programRoles: CVProgramRole[]; // New: Internal roles
    skills: string[];
    languages: string[];
}

// --- ALUMNI MODULE ---
export interface AlumniFollowUp {
    id: string;
    studentId: string;
    date: string; // ISO date of contact
    currentJob: string;
    location: string;
    contactMethod: string; // Email, LinkedIn, etc.
    notes?: string;
    registeredBy: string;
}

// --- PROGRAM INFO / NOSOTROS ---
export interface ProgramAuthority {
    id: string;
    name: string;
    position: string;
    email?: string;
    photoUrl?: string; // Base64
    bio?: string;
}

export interface ProgramInfo {
    description: string;
    mission: string;
    vision: string;
    authorities: ProgramAuthority[];
}
