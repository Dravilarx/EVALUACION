
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
