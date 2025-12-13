
import { QuestionType, EvaluationCriteria } from './types';

export const ESPECIALIDADES = ["Radiología", "Cardiología", "Neurología", "Pediatría", "Cirugía General"];
export const DIFICULTADES = [1, 2, 3, 4, 5];
export const TIPOS_PREGUNTA = [
  { value: QuestionType.MultipleChoice, label: "Selección Múltiple" },
  { value: QuestionType.TrueFalse, label: "Verdadero/Falso" },
  { value: QuestionType.FreeResponse, label: "Respuesta Libre" },
];

export const COMPETENCIES_LIST: EvaluationCriteria[] = [
    { id: 1, title: "Profesionalismo", description: "Cumple tareas puntualmente, resuelve problemas y reconoce sus errores, corrigiendo su conducta por iniciativa propia." },
    { id: 2, title: "Ética y responsabilidad", description: "Adhiere y actúa acorde a principios éticos, con actitud de servicio y honestidad." },
    { id: 3, title: "Trato con pacientes y personal", description: "Es empático y respetuoso con quienes lo rodean." },
    { id: 4, title: "Conocimientos", description: "Actualizado, extenso e integrado a la práctica." },
    { id: 5, title: "Habilidades y destrezas", description: "Seguro, prolijo, criterioso. Reconoce sus limitaciones minimizando riesgos." },
    { id: 6, title: "Trabajo en equipo", description: "Se gana el respeto y confianza de sus pacientes y pares, comunicación directa y respetuosa." },
    { id: 7, title: "Juicio Clínico", description: "Sintetiza la información de manera lógica, fluida y organizada, logrando buenos diagnósticos." },
    { id: 8, title: "Autoaprendizaje", description: "Capaz de aprender por sí mismo conocimientos, habilidades, valores y actitudes." }
];

export const PRESENTATION_CRITERIA_LIST: EvaluationCriteria[] = [
    { id: 1, title: "CALIDAD DE LA PRODUCCIÓN", description: "El estudiante mantiene la atención en los auditores. Desarrolla un contenido que mantiene el interés." },
    { id: 2, title: "CLARIDAD Y PRECISION EN LA EXPOSICION", description: "El estudiante presenta de manera clara el contenido del tema. No presenta ambigüedades." },
    { id: 3, title: "DOMINIO DEL CONTENIDO", description: "El estudiante desarrolla un contenido adecuado en profundidad al tema." },
    { id: 4, title: "USO DEL TIEMPO", description: "El estudiante desarrolla el tema en un tiempo acorde al contenido." },
    { id: 5, title: "ORGANIZACIÓN Y SECUENCIA", description: "El estudiante presenta de forma organizada el tema. Se evidencia una secuencia lógica y organizada entre cada una de las partes." },
    { id: 6, title: "ACTITUD FRENTE A COMENTARIOS Y/O RETROALIMENTACIÓN", description: "El estudiante muestra una actitud receptiva frente a los comentarios de otros, que permiten profundizar y/o complementar y mejorar los conocimientos y el desarrollo del medio audiovisual." }
];

export const EVALUATION_SCALE = [
    { value: 1, label: "Nunca" },
    { value: 2, label: "Rara Vez" },
    { value: 3, label: "Pocas veces" },
    { value: 4, label: "A veces" },
    { value: 5, label: "Frecuente" },
    { value: 6, label: "Generalmente" },
    { value: 7, label: "Siempre" }
];

export const FINAL_EXAM_RUBRIC = [
    { 
        id: 1, 
        dimension: "Estudio radiológico", 
        weight: 0.10, 
        descriptors: {
            4: "Nombra el tipo de estudio con sus distintas secuencias y adquisiciones, mencionando todos los hallazgos imageneológicos.",
            3: "Nombra el tipo de estudio con sus distintas secuencias y adquisiciones, mencionando algunos hallazgos imageneológicos.",
            2: "Nombra el tipo de estudio sin referirse a las secuencias y adquisiciones, mencionando algunos hallazgos imageneológicos.",
            1: "Nombra el tipo de estudio sin las secuencias y adquisiciones, no menciona los hallazgos imageneológicos.",
            0: "No se refiere al tipo de estudio y no menciona los hallazgos imageneológicos."
        }
    },
    { 
        id: 2, 
        dimension: "Diagnóstico", 
        weight: 0.20, 
        descriptors: {
            4: "Formula diagnóstico completo basado en todos los hallazgos radiológicos, logrando su correcta interpretación y justificación.",
            3: "Formula diagnóstico completo basado en todos los hallazgos radiológicos, logrando su parcial interpretación y justificación.",
            2: "Formula diagnóstico completo basado en la mayoría de los hallazgos radiológicos, logrando su parcial interpretación y justificación.",
            1: "Formula diagnóstico incompleto sin considerar la mayoría de los hallazgos radiológicos, logrando su parcial interpretación y justificación.",
            0: "No logra formular diagnóstico en base a los hallazgo radiológicos."
        }
    },
    { 
        id: 3, 
        dimension: "Diagnósticos diferenciales", 
        weight: 0.20, 
        descriptors: {
            4: "Establece los principales diagnósticos diferenciales y los justifica.",
            3: "Establece la mayoría de los diagnósticos diferenciales y los justifica.",
            2: "Establece algunos de los diagnósticos diferenciales y los justifica parcialmente.",
            1: "Establece algunos de los diagnósticos diferenciales y no los justifica.",
            0: "No establece diagnósticos diferenciales."
        }
    },
    { 
        id: 4, 
        dimension: "Juicio Clínico", 
        weight: 0.15, 
        descriptors: {
            4: "Sintetiza toda la información relevante de manera lógica, fluida y organizada, logrando identificar agentes etiológicos, complicaciones y diagnósticos certeros orientados a soluciones.",
            3: "Sintetiza la mayoría de la información relevante de manera lógica, fluida y organizada, logrando identificar agentes etiológicos, complicaciones y diagnósticos certeros orientados a soluciones.",
            2: "Sintetiza la mayoría de la información relevante de manera lógica y organizada, pero no es capaz de lograr identificar agentes etiológicos, complicaciones ni diagnósticos certeros.",
            1: "Sintetiza solo alguna información relevante de manera lógica y no es capaz de identificar agentes etiológicos, complicaciones ni lograr diagnósticos certeros.",
            0: "No sintetiza la información relevante de manera lógica y no es capaz de identificar agentes etiológicos, complicaciones ni diagnósticos certeros."
        }
    },
    { 
        id: 5, 
        dimension: "Hallazgos Críticos y Manejo", 
        weight: 0.15, 
        descriptors: {
            4: "Reconoce todos los hallazgos críticos en el estudio imageneológico y sugiere conducta o examenes complementarios al médico tratante.",
            3: "Reconoce la mayoría de los hallazgos críticos del estudio, sugiriendo conducta o examenes complementarios al tratante.",
            2: "Reconoce la mayoría de los hallazgos críticos del estudio, pero no sugiere conducta o examenes complementarios al tratante.",
            1: "Reconoce sólo algunos hallazgos críticos del estudio, no sugiere conducta o examenes complementarios al tratante.",
            0: "No reconoce los hallazgos críticos del estudio."
        }
    },
    { 
        id: 6, 
        dimension: "Presentación", 
        weight: 0.10, 
        descriptors: {
            4: "El estudiante presenta de manera clara todo el contenido del estudio radiológico. Se evidencia una secuencia lógica y organizada entre cada una de las partes.",
            3: "El estudiante presenta de manera clara la mayoría del contenido del estudio radiológico. Se evidencia una secuencia lógica y organizada entre cada una de las partes.",
            2: "El estudiante presenta de manera clara algunos contenidos del estudio radiológico. Se evidencia parcialmente una secuencia lógica y organizada entre cada una de las partes.",
            1: "El estudiante presenta de manera clara algunos contenidos del estudio radiológico. No se evidencia una secuencia lógica y organizada entre cada una de las partes.",
            0: "El estudiante no presenta los contenidos del estudio radiológico. No se evidencia una secuencia lógica y organizada entre cada una de las partes."
        }
    },
    { 
        id: 7, 
        dimension: "Comunicación", 
        weight: 0.05, 
        descriptors: {
            4: "Expresa claramente sus ideas utilizando lenguaje técnico adecuado. Aprovecha el tiempo eficazmente.",
            3: "Expresa sus ideas utilizando lenguaje técnico adecuado. Aprovecha el tiempo eficazmente.",
            2: "Expresa sus ideas utilizando lenguaje técnico medianamente adecuado. No aprovecha el tiempo eficazmente.",
            1: "Expresa sus ideas con dificultad utilizando lenguaje técnico medianamente adecuado. No aprovecha el tiempo eficazmente.",
            0: "Expresa sus ideas con dificultad sin utilizar lenguaje técnico adecuado. No aprovecha el tiempo eficazmente."
        }
    },
    { 
        id: 8, 
        dimension: "Profesionalismo", 
        weight: 0.05, 
        descriptors: {
            4: "Demuestra conocimiento actualizado, extenso e integrado a la práctica clínica, mediante analisis crítico de la situación, promoviendo espacios de discusión de alto nivel académico.",
            3: "Demuestra conocimiento parcialmente actualizado, extenso e integrado a la práctica clínica, mediante analisis crítico de la situación, no logra generar espacios de discusión.",
            2: "Demuestra conocimiento básico de la situación, no logra generar espacios de discusión.",
            1: "Demuestra bajo conocimiento básico de la situación.",
            0: "No logra demostrar los conocimiento básicos de la situación."
        }
    }
];
