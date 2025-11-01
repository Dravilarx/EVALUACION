import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType, Alternative } from '../types';

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
