import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MotivationEventType } from "@/lib/types";
import { buildPrompt } from "@/lib/motivationPrompt";

const GEMINI_MODEL = process.env.GEMINI_MODEL_ID || "gemini-pro";

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const eventType = body?.eventType as MotivationEventType | undefined;
    const context = body?.context ?? {};

    if (!eventType) {
      return NextResponse.json({ error: "eventType is required." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = buildPrompt(eventType, context);
    const geminiResult = await model.generateContent(prompt);
    const response = await geminiResult.response;
    const rawText = response.text();
    const trimmedMessage =
      rawText?.replace(/\*/g, "").replace(/\s+/g, " ").trim() || "Keep pushing forward!";

    return NextResponse.json({ message: trimmedMessage });
  } catch (error: any) {
    console.error("Motivation text API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate motivation text." },
      { status: 500 }
    );
  }
}

