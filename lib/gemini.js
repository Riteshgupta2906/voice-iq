import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generate 6 quiz questions from a lecture transcription.
 * @param {string} transcription - Full lecture transcription text
 * @param {string} lectureTitle - Title of the lecture
 * @returns {Promise<Array<{ question: string, expected: string, follow_up: string }>>}
 */
export async function generateLectureQuestions(transcription, lectureTitle) {
  const prompt = `You are an educational assessment expert. Based on the following lecture transcription, generate exactly 6 quiz questions to test a student's understanding.

Lecture Title: ${lectureTitle}

Transcription:
${transcription}

Return a JSON array of exactly 6 objects. Each object must have these fields:
- "question": a clear, specific question testing comprehension of the lecture content
- "expected": the ideal answer a student who understood the lecture would give
- "follow_up": a follow-up probing question to deepen understanding

Return only the JSON array, no other text.`;

  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });
  const text = response.text;
  const questions = JSON.parse(text);

  if (!Array.isArray(questions) || questions.length !== 6) {
    throw new Error(
      `Expected 6 questions, got ${Array.isArray(questions) ? questions.length : "non-array"}`,
    );
  }

  return questions;
}
