import { GoogleGenAI, Type } from "@google/genai";
import { Match } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function fetchIPLMatches(): Promise<Match[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Find the complete regular season schedule of the IPL 2026, which consists of 70 matches. Return all 70 matches as a JSON array of objects with id, date, team1, team2, and venue. Ensure the list is comprehensive and includes every single match of the regular season.",
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            date: { type: Type.STRING, description: "Date of the match" },
            team1: { type: Type.STRING, description: "First team" },
            team2: { type: Type.STRING, description: "Second team" },
            venue: { type: Type.STRING, description: "Venue of the match" },
          },
          required: ["id", "date", "team1", "team2", "venue"],
        },
      },
    },
  });

  try {
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error parsing IPL matches:", error);
    return [];
  }
}
