
export enum QuestionType {
  MultipleChoice = "multiple_choice",
  TrueFalse = "true_false",
  FreeResponse = "free_response",
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
  creado_desde: "banco" | "ia";
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
}

export interface Subject {
    id: string;
    name: string;
    code: string;
    lead_teacher_id: string; // ID del docente a cargo
    participating_teachers_ids: string[]; // IDs de docentes participantes
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
}

export interface Answer {
    codigo_pregunta: string;
    respuesta: string;
    puntaje_obtenido: number;
    // feedback_docente?: string; // Removed per simplification request
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
}

export interface Activity {
    id: string;
    type: 'Curso' | 'Congreso' | 'Estadía' | 'Publicación' | 'Poster' | 'Vinculación';
    title: string;
    date: string;
    institution: string;
    role: string; // e.g. Asistente, Expositor, Autor
    description: string;
    participantId: string;
    participantType: 'Student' | 'Teacher';
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
