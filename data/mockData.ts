
import { Question, Quiz, Attempt, QuestionType, Student, Teacher, Subject, BulletinEntry } from '../types';

export const mockStudents: Student[] = [
  { 
    id: "18.123.456-7", 
    name: "Juan Pérez García", 
    course: "Radiología",
    email_ua: "juan.perez@ua.cl",
    email_personal: "jperez@gmail.com",
    phone: "+56912345678",
    admission_date: "2024-03-01",
    level: "R1",
    status: "Activo",
    origin_university: "Universidad de Antofagasta",
    nationality: "Chilena",
    sex: "Masculino",
    photo_url: "https://i.pravatar.cc/150?u=juan"
  },
  { 
    id: "19.876.543-2", 
    name: "Ana Gómez Fernández", 
    course: "Radiología",
    email_ua: "ana.gomez@ua.cl",
    email_personal: "ana.gomez@hotmail.com",
    phone: "+56987654321",
    admission_date: "2023-03-01",
    level: "R2",
    status: "Activo",
    origin_university: "Universidad de Chile",
    nationality: "Chilena",
    sex: "Femenino",
    photo_url: "https://i.pravatar.cc/150?u=ana"
  },
  { 
    id: "25.333.111-K", 
    name: "Carlos Rodríguez López", 
    course: "Radiología",
    email_ua: "c.rodriguez@ua.cl",
    email_personal: "carlos.rod@gmail.com",
    phone: "+56955556666",
    admission_date: "2022-03-01",
    level: "R3",
    status: "Activo",
    origin_university: "Universidad Católica del Norte",
    nationality: "Colombiana",
    sex: "Masculino",
    photo_url: ""
  },
  {
    id: "SPIDER-MAN-01",
    name: "Peter Parker",
    course: "Radiología",
    email_ua: "peter.parker@ua.cl",
    email_personal: "spidey@avengers.com",
    phone: "+1234567890",
    admission_date: "2024-03-01",
    level: "R1",
    status: "Activo",
    origin_university: "Midtown High",
    nationality: "Estadounidense",
    sex: "Masculino",
    photo_url: "https://i.pravatar.cc/150?u=peterparker"
  },
  { 
    id: "17.999.888-1", 
    name: "María Sánchez Martín", 
    course: "Radiología",
    email_ua: "maria.sanchez@ua.cl",
    email_personal: "msanchez@live.cl",
    phone: "+56911223344",
    admission_date: "2024-03-01",
    level: "R1",
    status: "Suspendido",
    origin_university: "Universidad de Concepción",
    nationality: "Chilena",
    sex: "Femenino",
    photo_url: "https://i.pravatar.cc/150?u=maria"
  },
  { 
    id: "16.555.444-3", 
    name: "Pedro González Ruiz", 
    course: "Radiología",
    email_ua: "pedro.gonzalez@ua.cl",
    email_personal: "pgonzalez@gmail.com",
    phone: "+56999887766",
    admission_date: "2021-03-01",
    level: "Egresado",
    status: "Egresado",
    origin_university: "Universidad de los Andes",
    nationality: "Chilena",
    sex: "Masculino",
    photo_url: ""
  },
];

export const mockTeachers: Teacher[] = [
    {
        id: "10.111.222-3",
        name: "Dr. Marcelo Avila",
        email_ua: "marcelo.avila@ua.cl",
        email_personal: "mavila@clinica.cl",
        phone: "+56999999999",
        admission_date: "2015-03-01",
        rank: "Profesor Titular",
        contract_hours: "44",
        subjects_in_charge: ["Radiología Torácica", "Neurorradiología"],
        status: "Activo",
        university_undergrad: "Universidad de Chile",
        university_postgrad: "Harvard Medical School",
        nationality: "Chilena",
        sex: "Masculino",
        photo_url: "https://i.pravatar.cc/150?u=marcelo"
    },
    {
        id: "12.333.444-5",
        name: "Dra. Ana Fuentes",
        email_ua: "ana.fuentes@ua.cl",
        email_personal: "afuentes@gmail.com",
        phone: "+56988888888",
        admission_date: "2018-05-15",
        rank: "Profesor Auxiliar",
        contract_hours: "22",
        subjects_in_charge: ["Ultrasonido Doppler"],
        status: "Activo",
        university_undergrad: "Universidad de Concepción",
        university_postgrad: "Universidad Católica de Chile",
        nationality: "Chilena",
        sex: "Femenino",
        photo_url: "https://i.pravatar.cc/150?u=anafuentes"
    }
];

export const mockSubjects: Subject[] = [
    {
        id: "SUBJ-001",
        name: "Radiología Torácica",
        code: "RAD-TOR-101",
        lead_teacher_id: "10.111.222-3", // Dr. Marcelo Avila
        participating_teachers_ids: ["12.333.444-5"] // Dra. Ana Fuentes
    },
    {
        id: "SUBJ-002",
        name: "Neurorradiología",
        code: "RAD-NEU-201",
        lead_teacher_id: "10.111.222-3", // Dr. Marcelo Avila
        participating_teachers_ids: []
    },
    {
        id: "SUBJ-003",
        name: "Ultrasonido Doppler",
        code: "RAD-ECO-301",
        lead_teacher_id: "12.333.444-5", // Dra. Ana Fuentes
        participating_teachers_ids: ["10.111.222-3"] // Dr. Marcelo Avila
    }
];

export const mockBulletinEntries: BulletinEntry[] = [
    {
        id: '1',
        category: "Académico",
        date: new Date().toISOString(), // Today
        title: "Reunión Clínica Semanal",
        summary: "Se recuerda a todos los residentes la asistencia obligatoria a la reunión de casos clínicos en el Auditorio Central.",
        content: "La reunión se llevará a cabo a las 08:00 AM. Se discutirán casos de Neurorradiología y Musculoesquelético. La asistencia es obligatoria para todos los niveles de residencia.",
        author: "Dr. Marcelo Avila",
        attachments: {
            images: [],
            files: [{ name: "programa_reunion.pdf", type: "application/pdf", data: "" }],
            links: ["https://zoom.us/j/123456"]
        },
        priority: true
    },
    {
        id: '2',
        category: "Aviso",
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        title: "Entrega de Evaluaciones Semestrales",
        summary: "El plazo para subir las rúbricas de rotación vence este viernes a las 23:59 hrs.",
        content: "Recuerden que deben subir sus rúbricas firmadas por el docente encargado de la rotación al portal de gestión académica. No se aceptarán entregas fuera de plazo.",
        author: "Secretaría Docente",
        attachments: {
            images: [],
            files: [],
            links: []
        },
        priority: true
    },
    {
        id: '3',
        category: "Evento",
        date: "2025-10-12T09:00:00.000Z",
        title: "Congreso Chileno de Radiología",
        summary: "Abiertas las inscripciones con descuento para residentes UA. Cupos limitados.",
        content: "El congreso se realizará en Santiago. La universidad ofrece 5 becas completas para residentes que presenten trabajos libres. Consultar bases en secretaría.",
        author: "Dra. Ana Fuentes",
        attachments: {
            images: ["https://picsum.photos/seed/congreso/400/200"],
            files: [{ name: "bases_beca.docx", type: "application/msword", data: "" }],
            links: ["https://sochradi.cl"]
        },
        priority: false
    },
    {
        id: '4',
        category: "Aviso",
        date: "2025-10-10T02:00:00.000Z",
        title: "Mantenimiento Programado",
        summary: "La plataforma GRUA estará en mantenimiento el sábado de 02:00 a 04:00 AM.",
        content: "Durante este periodo no se podrá acceder al banco de preguntas ni realizar evaluaciones. Agradecemos su comprensión.",
        author: "Soporte TI",
        attachments: {
            images: [],
            files: [],
            links: []
        },
        priority: false
    }
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
    veces_utilizada: 5,
    rating: 2
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
    rating: 0
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
    rating: 3
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
    alumnos_asignados: ["18.123.456-7", "19.876.543-2"],
    tiempo_limite_minutos: 20,
    ventana_disponibilidad: {
      inicio: new Date().toISOString(),
      fin: new Date(Date.now() + 86400000 * 2).toISOString(),
    },
    link_acceso: "https://app.evaluaciones/quiz/QUIZ-0001",
    proctoring: { habilitado: false },
    intentos_permitidos: 1,
    docente_creador: "Marcelo Avila",
    asignatura: "Radiología Torácica", // Changed from "Radiología" to match mockSubjects
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
    asignatura: "Neurorradiología", // Changed from "Interdisciplinario" to match mockSubjects
  }
];

export const initialAttempts: Attempt[] = [
    {
        id_intento: "ATT-0001",
        id_cuestionario: "QUIZ-0001",
        alumno_id: "18.123.456-7",
        inicio: new Date(Date.now() - 3600000).toISOString(),
        fin: new Date(Date.now() - 3600000 + 600000).toISOString(),
        respuestas: [
            { codigo_pregunta: "RAD-MAR-0001", respuesta: "A", puntaje_obtenido: 5 },
        ],
        puntaje_total_obtenido: 5,
        puntaje_total_posible: 5,
        porcentaje: 100.00,
        nota: 7.0,
        tiempo_utilizado_seg: 600,
        estado: "entregado"
    },
    {
        id_intento: "ATT-0002",
        id_cuestionario: "QUIZ-0001",
        alumno_id: "19.876.543-2",
        inicio: new Date(Date.now() - 7200000).toISOString(),
        fin: new Date(Date.now() - 7200000 + 900000).toISOString(),
        respuestas: [
            { codigo_pregunta: "RAD-MAR-0001", respuesta: "B", puntaje_obtenido: 0 },
        ],
        puntaje_total_obtenido: 0,
        puntaje_total_posible: 5,
        porcentaje: 0.00,
        nota: 1.0,
        tiempo_utilizado_seg: 900,
        estado: "entregado"
    }
];
