// packages/api/src/routers/transcribe.ts
// Audio transcription using OpenAI Whisper

import { z } from "zod";
import { publicProcedure } from "../index";

export const transcribeRouter = {
	/**
	 * Transcribe audio to text using OpenAI Whisper API.
	 * Accepts base64 encoded audio data.
	 */
	transcribeAudio: publicProcedure
		.input(
			z.object({
				audioBase64: z.string().describe("Base64 encoded audio data"),
				mimeType: z
					.string()
					.default("audio/m4a")
					.describe("Audio MIME type (audio/m4a, audio/mp3, audio/wav)"),
				language: z.string().default("es").describe("Language code"),
			}),
		)
		.handler(async ({ input }) => {
			const { audioBase64, mimeType, language } = input;

			try {
				// Convert base64 to buffer
				const audioBuffer = Buffer.from(audioBase64, "base64");

				// Create a File object from the buffer
				const extension = mimeType.split("/")[1] || "m4a";
				const file = new File([audioBuffer], `audio.${extension}`, {
					type: mimeType,
				});

				// Call OpenAI Whisper API
				const response = await fetch(
					"https://api.openai.com/v1/audio/transcriptions",
					{
						method: "POST",
						headers: {
							Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
						},
						body: (() => {
							const formData = new FormData();
							formData.append("file", file);
							formData.append("model", "whisper-1");
							formData.append("language", language);
							formData.append("response_format", "json");
							return formData;
						})(),
					},
				);

				if (!response.ok) {
					const error = await response.text();
					console.error("[Transcribe] OpenAI API error:", error);
					throw new Error("Failed to transcribe audio");
				}

				const result = (await response.json()) as { text?: string };

				return {
					text: result.text || "",
					language,
				};
			} catch (error) {
				console.error("[Transcribe] Error:", error);
				throw new Error("Error transcribing audio");
			}
		}),
};
