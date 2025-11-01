import { Question, Quiz, Attempt, QuestionType, Student } from '../types';

export const mockStudents: Student[] = [
  { id: "ALU-001", name: "Juan Pérez García", course: "Radiología Avanzada" },
  { id: "ALU-002", name: "Ana Gómez Fernández", course: "Radiología Avanzada" },
  { id: "ALU-003", name: "Carlos Rodríguez López", course: "Cardiología Clínica" },
  { id: "ALU-004", name: "María Sánchez Martín", course: "Cardiología Clínica" },
  { id: "ALU-005", name: "Pedro González Ruiz", course: "Neurología I" },
];


export const initialQuestions: Question[] = [
  {
    codigo_pregunta: "RAD-MAR-0001",
    tipo_pregunta: QuestionType.MultipleChoice,
    enunciado: "En TC de abdomen, ¿cuál hallazgo sugiere hidronefrosis izquierda?",
    alternativas: [
      { id: "A", texto: "Aumento del calibre de pelvis renal izquierda ~30-35 mm", es_correcta: true },
      { id: "B", texto: "Atrofia cortical difusa bilateral", es_correcta: false },
      { id: "C", texto: "Vejiga colapsada postmiccional", es_correcta: false },
      { id: "D", texto: "Calcificaciones en plexos coroideos", es_correcta: false }
    ],
    feedback_correcto: "Correcto. La dilatación de la pelvis renal (≈33 mm) es compatible con hidronefrosis.",
    feedback_incorrecto: "Revisa signos imagenológicos de dilatación pielocalicial; atrofia cortical y hallazgos encefálicos no aplican.",
    adjuntos: {
      imagenes: ["https://picsum.photos/seed/rad001/600/400"],
      videos: [],
      links: []
    },
    docente_creador: "Marcelo Avila",
    especialidad: "Radiología",
    dificultad: 2,
    tema: "TC abdominal",
    subtema: "Vía urinaria",
    etiquetas: ["urología", "hidronefrosis"],
    tiene_multimedia: true,
    fecha_creacion: new Date().toISOString().split('T')[0],
    veces_utilizada: 5
  },
  {
    codigo_pregunta: "CAR-ANA-0001",
    tipo_pregunta: QuestionType.TrueFalse,
    enunciado: "La fracción de eyección normal del ventrículo izquierdo en un adulto sano es típicamente inferior al 40%.",
    respuesta_correcta_vf: "Falso",
    feedback_correcto: "Correcto. Una fracción de eyección normal suele estar por encima del 50-55%.",
    feedback_incorrecto: "Incorrecto. Valores por debajo del 40% indican disfunción sistólica.",
    adjuntos: { imagenes: [], videos: [], links: [] },
    docente_creador: "Ana Fuentes",
    especialidad: "Cardiología",
    dificultad: 1,
    tema: "Ecocardiografía",
    subtema: "Función ventricular",
    etiquetas: ["FEVI", "Insuficiencia cardíaca"],
    tiene_multimedia: false,
    fecha_creacion: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    veces_utilizada: 12,
  },
   {
    codigo_pregunta: "NEU-LUC-0002",
    tipo_pregunta: QuestionType.FreeResponse,
    enunciado: "Describa brevemente los 3 hallazgos clave en una punción lumbar que sugieren meningitis bacteriana.",
    criterios_rubrica: [
        {"criterio": "Menciona pleocitosis con predominio de neutrófilos", "max_puntos": 2, "descriptor": "Identifica el aumento de células y su tipo."},
        {"criterio": "Menciona hipoglucorraquia (glucosa baja en LCR)", "max_puntos": 2, "descriptor": "Reconoce el consumo de glucosa por bacterias."},
        {"criterio": "Menciona hiperproteinorraquia (proteínas altas)", "max_puntos": 1, "descriptor": "Asocia el aumento de proteínas con la inflamación."}
    ],
    feedback_correcto: "Respuesta esperada incluye: 1. Pleocitosis a predominio polimorfonuclear, 2. Hipoglucorraquia, 3. Hiperproteinorraquia.",
    feedback_incorrecto: "Faltó mencionar alguno de los tres pilares diagnósticos en LCR para meningitis bacteriana.",
    adjuntos: { imagenes: [], videos: [], links: [] },
    docente_creador: "Lucía Vera",
    especialidad: "Neurología",
    dificultad: 4,
    tema: "Infecciones del SNC",
    subtema: "Meningitis",
    etiquetas: ["LCR", "diagnóstico"],
    tiene_multimedia: false,
    fecha_creacion: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
    veces_utilizada: 8,
  }
];

export const initialQuizzes: Quiz[] = [
  {
    id_cuestionario: "QUIZ-0001",
    titulo: "Hidronefrosis y Vía Urinaria",
    descripcion: "Evaluación breve de hallazgos en TC.",
    preguntas: [
      { codigo_pregunta: "RAD-MAR-0001", puntaje: 5 },
    ],
    creado_desde: "banco",
    alumnos_asignados: ["ALU-001", "ALU-002"],
    tiempo_limite_minutos: 20,
    ventana_disponibilidad: {
      inicio: new Date().toISOString(),
      fin: new Date(Date.now() + 86400000 * 2).toISOString(),
    },
    link_acceso: "https://app.evaluaciones/quiz/QUIZ-0001",
    proctoring: { habilitado: false },
    intentos_permitidos: 1,
    docente_creador: "Marcelo Avila",
    asignatura: "Radiología",
  },
  {
    id_cuestionario: "QUIZ-0002",
    titulo: "Conceptos Básicos de Cardiología y Neurología",
    descripcion: "Evaluación de conocimientos fundamentales.",
    preguntas: [
      { codigo_pregunta: "CAR-ANA-0001", puntaje: 3 },
      { codigo_pregunta: "NEU-LUC-0002", puntaje: 5 },
    ],
    creado_desde: "banco",
    alumnos_asignados: [],
    tiempo_limite_minutos: 30,
    ventana_disponibilidad: {
      inicio: new Date().toISOString(),
      fin: new Date(Date.now() + 86400000 * 7).toISOString(),
    },
    link_acceso: "https://app.evaluaciones/quiz/QUIZ-0002",
    proctoring: { habilitado: false },
    intentos_permitidos: 1,
    docente_creador: "Equipo Docente",
    asignatura: "Interdisciplinario",
  }
];

export const initialAttempts: Attempt[] = [
    {
        id_intento: "ATT-0001",
        id_cuestionario: "QUIZ-0001",
        alumno_id: "ALU-001",
        inicio: new Date(Date.now() - 3600000).toISOString(),
        fin: new Date(Date.now() - 3600000 + 600000).toISOString(),
        respuestas: [
            { codigo_pregunta: "RAD-MAR-0001", respuesta: "A", puntaje_obtenido: 5 },
        ],
        puntaje_total_obtenido: 5,
        puntaje_total_posible: 5,
        porcentaje: 100.00,
        tiempo_utilizado_seg: 600,
        estado: "entregado"
    },
    {
        id_intento: "ATT-0002",
        id_cuestionario: "QUIZ-0001",
        alumno_id: "ALU-002",
        inicio: new Date(Date.now() - 7200000).toISOString(),
        fin: new Date(Date.now() - 7200000 + 900000).toISOString(),
        respuestas: [
            { codigo_pregunta: "RAD-MAR-0001", respuesta: "B", puntaje_obtenido: 0 },
        ],
        puntaje_total_obtenido: 0,
        puntaje_total_posible: 5,
        porcentaje: 0.00,
        tiempo_utilizado_seg: 900,
        estado: "entregado"
    }
];