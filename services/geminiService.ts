
import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType, Alternative } from '../types';
import { COMPETENCIES_LIST, PRESENTATION_CRITERIA_LIST } from '../constants';

// Per instructions, API key must be obtained from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const createAIAssistPrompt = (draftQuestion: Partial<Question>): string => {
    const questionTypeDescription = draftQuestion.tipo_pregunta === QuestionType.MultipleChoice 
        ? "de selección múltiple" 
        : draftQuestion.tipo_pregunta === QuestionType.TrueFalse 
        ? "de verdadero o falso" 
        : "de respuesta libre";
    
    // Convert alternatives to a simpler format for the prompt if they exist
    const draftContent = {
      ...draftQuestion,
      alternativas: draftQuestion.alternativas?.map(a => `(${a.id}, correcta: ${a.es_correcta}): ${a.texto}`).join('\n')
    };

    return `
      Eres un editor experto y pedagogo en el campo de la medicina. Recibirás un borrador de una pregunta de evaluación ${questionTypeDescription}.
      Tu tarea es actuar como un asistente experto para mejorarla.

      **Instrucciones:**
      1.  **Revisar y Mejorar Enunciado:** Analiza el 'enunciado' proporcionado. Si es claro, mantenlo. Si puede ser mejorado, refina su redacción para máxima claridad y precisión clínica sin cambiar el concepto fundamental.
      2.  **Revisar y Mejorar Alternativas (si aplica):** Analiza las 'alternativas'. Mejora su redacción para que sean uniformes y plausibles. Asegúrate de que los distractores sean convincentes pero inequívocamente incorrectos. No cambies cuál es la alternativa correcta.
      3.  **Generar Feedback Detallado:** Esta es la tarea más importante. Basándote en la pregunta mejorada, crea un 'feedback_correcto' que explique a fondo por qué la respuesta correcta lo es, relacionándola con principios clave.
      4.  **Generar Feedback Constructivo:** Crea un 'feedback_incorrecto' que no solo diga que es incorrecto, sino que explique los errores conceptuales comunes que llevan a elegir las otras opciones. Debe ser una guía para el aprendizaje.
      5.  **Generar Metadatos:** Basado en el contenido, genera un 'subtema' y 2-3 'etiquetas' relevantes.
      
      **Borrador de la Pregunta:**
      \`\`\`json
      ${JSON.stringify(draftContent, null, 2)}
      \`\`\`

      Devuelve SOLAMENTE el objeto JSON completo con tus mejoras y el feedback generado. No incluyas explicaciones adicionales fuera del JSON.
    `;
};


const alternativeSchema = {
    type: Type.OBJECT,
    properties: {
        texto: { type: Type.STRING, description: 'El texto de la alternativa.' },
        es_correcta: { type: Type.BOOLEAN, description: 'Indica si esta alternativa es la correcta.' },
    },
    required: ['texto', 'es_correcta'],
};

const rubricCriterionSchema = {
     type: Type.OBJECT,
     properties: {
         criterio: { type: Type.STRING, description: 'El criterio a evaluar en la respuesta.' },
         max_puntos: { type: Type.NUMBER, description: 'El puntaje máximo para este criterio.' },
         descriptor: { type: Type.STRING, description: 'Una breve descripción de lo que se espera para obtener el puntaje máximo.' },
     },
     required: ['criterio', 'max_puntos', 'descriptor'],
};


const getResponseSchema = (type: QuestionType) => {
    const baseProperties: any = {
        enunciado: { type: Type.STRING, description: 'El enunciado principal de la pregunta, revisado y mejorado.' },
        subtema: { type: Type.STRING, description: 'Un subtema específico relacionado con el tema principal.' },
        etiquetas: {
            type: Type.ARRAY,
            description: 'Una lista de 2 a 3 etiquetas o palabras clave.',
            items: { type: Type.STRING }
        },
        feedback_correcto: { type: Type.STRING, description: 'La explicación detallada y pedagógica para la respuesta correcta.' },
        feedback_incorrecto: { type: Type.STRING, description: 'La explicación constructiva para una respuesta incorrecta.' },
    };

    const requiredFields = ['enunciado', 'subtema', 'etiquetas', 'feedback_correcto', 'feedback_incorrecto'];

    if (type === QuestionType.MultipleChoice) {
        baseProperties.alternativas = {
            type: Type.ARRAY,
            description: 'La lista de alternativas, revisadas y mejoradas.',
            items: alternativeSchema,
        };
        requiredFields.push('alternativas');
    }

    if (type === QuestionType.TrueFalse) {
        baseProperties.respuesta_correcta_vf = {
            type: Type.STRING,
            description: 'La respuesta correcta, ya sea "Verdadero" o "Falso".',
            enum: ['Verdadero', 'Falso'],
        };
        requiredFields.push('respuesta_correcta_vf');
    }
    
    return {
        type: Type.OBJECT,
        properties: baseProperties,
        required: requiredFields,
    };
};


export const assistWithQuestionCreation = async (
    draftQuestion: Partial<Question>
): Promise<Partial<Question>> => {
    try {
        const prompt = createAIAssistPrompt(draftQuestion);
        const schema = getResponseSchema(draftQuestion.tipo_pregunta!);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
                temperature: 0.5, // Lower temperature for more focused, less creative output
            },
        });
        
        const jsonText = response.text.trim();
        const generatedData = JSON.parse(jsonText);

        if (generatedData.alternativas) {
             generatedData.alternativas = generatedData.alternativas.map((alt: Omit<Alternative, 'id'>, index: number) => ({
                ...alt,
                id: String.fromCharCode(65 + index), // A, B, C, D
            }));
        }

        return generatedData as Partial<Question>;

    } catch (error) {
        console.error("Error assisting with AI:", error);
        throw new Error("La asistencia de IA falló. Revisa la consola para más detalles.");
    }
};

// --- ACTA FEEDBACK GENERATION ---

interface ActaDataForAI {
    studentName: string;
    subjectName: string;
    finalGrade: number;
    writtenGrade: number;
    competencyGrade: number;
    presentationGrade: number;
    competencyDetails: Record<number, number>;
    presentationDetails: Record<number, number>;
}

export const generateActaFeedback = async (data: ActaDataForAI): Promise<string> => {
    try {
        // Map IDs to Text Labels for the AI context
        const competencySummary = Object.entries(data.competencyDetails).map(([id, score]) => {
            const criteria = COMPETENCIES_LIST.find(c => c.id === parseInt(id));
            return `${criteria?.title || 'Competencia'}: ${score}/7`;
        }).join('\n');

        const presentationSummary = Object.entries(data.presentationDetails).map(([id, score]) => {
            const criteria = PRESENTATION_CRITERIA_LIST.find(c => c.id === parseInt(id));
            return `${criteria?.title || 'Criterio Presentación'}: ${score}/7`;
        }).join('\n');

        const prompt = `
            Actúa como un Médico Docente Coordinador de una especialidad médica. Debes redactar un comentario de retroalimentación final para el "Acta de Calificación" de un residente.
            
            **Datos del Residente:**
            - Nombre: ${data.studentName}
            - Asignatura: ${data.subjectName}
            - Nota Final: ${data.finalGrade.toFixed(1)} (Escala 1.0 a 7.0, Aprobación >= 4.0)
            
            **Desglose:**
            - Evaluación Escrita (Teoría): ${data.writtenGrade?.toFixed(1) || 'N/A'}
            - Competencias Personales (Actitud/Clínica): ${data.competencyGrade?.toFixed(1) || 'N/A'}
            - Presentación (Seminario): ${data.presentationGrade?.toFixed(1) || 'N/A'}

            **Detalle de Competencias Evaluadas (1-7):**
            ${competencySummary}

            **Detalle de Presentación (1-7):**
            ${presentationSummary}

            **Instrucciones:**
            1. Escribe un párrafo de feedback formal, constructivo y personalizado.
            2. Inicia reconociendo el desempeño general (felicitar si es bueno, animar a mejorar si es bajo).
            3. Menciona explícitamente las fortalezas basándote en los puntajes altos.
            4. Menciona las áreas de mejora basándote en los puntajes más bajos (si los hay).
            5. Mantén un tono profesional y académico.
            6. No uses formato Markdown, solo texto plano.
            7. Máximo 150 palabras.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
            },
        });

        return response.text || "No se pudo generar el feedback.";

    } catch (error) {
        console.error("Error generating acta feedback:", error);
        throw new Error("Error al conectar con el asistente de IA.");
    }
};

// --- EVALUATION AUTOFILL (COMPETENCIES / PRESENTATION) ---

export const generateEvaluationScores = async (type: 'competency' | 'presentation', studentName: string): Promise<Record<number, number>> => {
    try {
        const isCompetency = type === 'competency';
        const itemList = isCompetency ? COMPETENCIES_LIST : PRESENTATION_CRITERIA_LIST;
        const criteriaText = itemList.map(i => `${i.id}: ${i.title} (${i.description})`).join('\n');
        
        const prompt = `
            Actúa como un docente evaluador simulado. Necesito generar puntajes de prueba para una evaluación de ${isCompetency ? 'Competencias Personales' : 'Presentación Clínica'} para el alumno "${studentName}".
            
            **Escala de Evaluación:** 1 (Malo/Nunca) a 7 (Excelente/Siempre).
            
            **Criterios a Evaluar (ID: Nombre):**
            ${criteriaText}

            **Instrucciones:**
            1. Elige ALEATORIAMENTE un perfil de desempeño para este alumno (ej: Sobresaliente, Promedio, o Con Dificultades). No me digas cuál elegiste, solo actúa en consecuencia.
            2. Genera un puntaje (número entero entre 1 y 7) para cada criterio listado arriba.
            3. Los puntajes deben ser coherentes con el perfil elegido (ej: si es sobresaliente, la mayoría serán 6 o 7; si tiene dificultades, habrá variabilidad).
            4. Introduce una pequeña variación natural (no pongas todo 7 o todo 4).
            
            Devuelve SOLAMENTE un objeto JSON donde las claves son los IDs (números) y los valores son los puntajes (números). Ejemplo: { "1": 6, "2": 7 ... }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Error generating evaluation scores:", error);
        throw new Error("Fallo en autocompletado IA.");
    }
};

// --- SPEECH TO TEXT CLEANUP ---

export const polishText = async (rawText: string): Promise<string> => {
    try {
        const prompt = `
            Actúa como un asistente de corrección médica.
            Reescribe el siguiente texto dictado por voz para que sea gramaticalmente correcto, profesional y claro.
            Mantén el significado original pero elimina muletillas o errores de transcripción fonética.
            Si detectas términos médicos mal escritos, corrígelos.
            
            Texto dictado: "${rawText}"
            
            Respuesta (solo texto corregido):
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.3 }
        });

        return response.text?.trim() || rawText;
    } catch (error) {
        console.error("Error polishing text:", error);
        return rawText; // Fallback to original if AI fails
    }
};

// --- NEW: ANNOTATION TAG SUGGESTION ---

export const suggestAnnotationTags = async (text: string): Promise<string[]> => {
    if (!text || text.length < 5) return [];
    
    try {
        const prompt = `
            Analiza el siguiente comentario de conducta sobre un médico residente.
            Sugiere de 1 a 3 etiquetas cortas (máximo 2 palabras) que categoricen el comportamiento o habilidad mencionada.
            Ejemplos de etiquetas: "Puntualidad", "Trabajo en Equipo", "Conocimiento Clínico", "Responsabilidad", "Trato al Paciente".
            
            Comentario: "${text}"
            
            Devuelve JSON: { "tags": ["Etiqueta1", "Etiqueta2"] }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                temperature: 0.3 
            }
        });

        const result = JSON.parse(response.text.trim());
        return result.tags || [];
    } catch (error) {
        console.error("Error suggesting tags:", error);
        return [];
    }
};

// --- NEW: CITATION RESOLVER (DOI/PMID) ---

export const resolveDOI = async (identifier: string): Promise<{ title: string, institution: string, date: string } | null> => {
    try {
        // Since we cannot call real external APIs easily without CORS/Keys here, we simulate parsing using LLM knowledge base
        const prompt = `
            Actúa como un sistema de resolución de metadatos bibliográficos.
            Intenta identificar el título, la revista (como institución) y el año de publicación basados en este identificador (DOI, PMID o título parcial).
            Si es un DOI/PMID falso o desconocido, inventa datos realistas para propósitos de demostración.
            
            Identificador: "${identifier}"
            
            Devuelve JSON: { "title": "Título del Paper", "institution": "Nombre Revista/Journal", "date": "YYYY-MM-DD" }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                temperature: 0.2
            }
        });

        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error resolving DOI:", error);
        return null;
    }
};

// --- NEW: WORD CLOUD DATA GENERATOR ---

export const generateWordCloudData = async (texts: string[]): Promise<{ text: string, value: number }[]> => {
    if (texts.length === 0) return [];
    
    try {
        const combinedText = texts.join(" ");
        const prompt = `
            Genera una nube de palabras a partir del siguiente texto recopilado de encuestas docentes.
            Identifica las 20 palabras o conceptos clave más frecuentes y significativos (ignora preposiciones y conectores comunes en español).
            Asigna un valor de frecuencia a cada uno.
            
            Texto: "${combinedText.substring(0, 5000)}"
            
            Devuelve JSON: [ { "text": "palabra", "value": 10 }, ... ]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                temperature: 0.5 
            }
        });

        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generating word cloud:", error);
        return [];
    }
};
