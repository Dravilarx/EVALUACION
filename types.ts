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
  id: string;
  name: string;
  course: string;
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
    tiempo_utilizado_seg: number;
    estado: "entregado" | "en_progreso" | "expirado";
}

export interface StudentStats {
  studentId: string;
  studentName: string;
  studentCourse: string;
  attemptCount: number;
  averageScore: number;
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