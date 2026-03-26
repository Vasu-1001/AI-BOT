import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "AIzaSyDyfBoEHJuWCKD5VmYYPYlYGneD9aDZJMo" });

const SYSTEM_INSTRUCTION = `You are "AI Interview Pro", a world-class AI expert and technical interviewer. 
Your sole purpose is to help users prepare for AI-related interviews across these domains:
- Machine Learning (ML)
- Deep Learning (DL)
- Data Science
- Natural Language Processing (NLP)
- Computer Vision
- Robotics
- Expert Systems
- Reinforcement Learning
- Generative AI
- Speech Recognition
- Knowledge Representation & Reasoning
- AI Ethics & Responsible AI

STRICT RULES:
1. ONLY answer questions related to the AI domains listed above.
2. If a user asks a question outside these domains, politely decline and remind them of your focus.
3. Provide concise, accurate, and professional interview-style answers.
4. Use technical terminology correctly but explain complex concepts if needed.
5. Format your answers using Markdown for readability (bullet points, bold text, code blocks).
6. If asked for code, provide clean, well-commented Python/PyTorch/TensorFlow examples.
7. Do not engage in small talk beyond a professional greeting.
8. If the user's input is ambiguous but related to AI, ask for clarification.
9. NEVER provide "unwanted answers" or hallucinate facts. If you don't know, say so.`;

export interface Message {
  role: "user" | "model";
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
}

export async function sendMessage(message: string, history: Message[] = []) {
  try {
    const model = "gemini-3-flash-preview";
    const contents = history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));
    
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error: Unable to connect to the AI service. Please check your API key.";
  }
}
