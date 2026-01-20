// packages/api/src/routers/chat.ts
import { z } from 'zod';
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { publicProcedure } from '../index';

const SYSTEM_PROMPT = `Eres Advia, un asistente de clima inteligente para conductores en Latinoamérica.
Tu objetivo es ayudar a los usuarios a planificar rutas seguras evitando tormentas y condiciones climáticas adversas.

Capacidades:
- Informar sobre alertas de clima actuales en una zona
- Sugerir rutas alternativas para evitar tormentas
- Responder preguntas sobre el pronóstico del tiempo
- Dar consejos de seguridad vial en condiciones climáticas adversas

Personalidad:
- Amigable y conciso
- Enfocado en la seguridad del usuario
- Usa español latinoamericano casual pero profesional
- Respuestas cortas y útiles (máximo 2-3 oraciones)

Si no tienes información actual del clima, indica amablemente que estás trabajando en obtener esos datos.`;

export const chatRouter = {
  sendMessage: publicProcedure
    .input(
      z.object({
        message: z.string().min(1),
        history: z.array(
          z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string(),
          })
        ).optional(),
        location: z.object({
          latitude: z.number(),
          longitude: z.number(),
        }).optional(),
      })
    )
    .handler(async function* ({ input }) {
      const messages = [
        ...(input.history?.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })) || []),
        { role: 'user' as const, content: input.message },
      ];

      const result = streamText({
        model: google('gemini-2.0-flash'),
        system: SYSTEM_PROMPT,
        messages,
      });

      for await (const textPart of result.textStream) {
        yield { type: 'text' as const, content: textPart };
      }

      yield { type: 'done' as const };
    }),
};
