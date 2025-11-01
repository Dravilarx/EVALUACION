
import { QuestionType } from './types';

export const ESPECIALIDADES = ["Radiología", "Cardiología", "Neurología", "Pediatría", "Cirugía General"];
export const DIFICULTADES = [1, 2, 3, 4, 5];
export const TIPOS_PREGUNTA = [
  { value: QuestionType.MultipleChoice, label: "Selección Múltiple" },
  { value: QuestionType.TrueFalse, label: "Verdadero/Falso" },
  { value: QuestionType.FreeResponse, label: "Respuesta Libre" },
];
