import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { buildPrompt } from "@/lib/motivationPrompt";
import { MotivationEventType } from "@/lib/types";

const GEMINI_MODEL = process.env.GEMINI_MODEL_ID || "gemini-pro";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2";
const elevenLabsClient =
  ELEVENLABS_API_KEY &&
  new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY,
  });

async function streamToBase64(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
    }
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return Buffer.from(merged.buffer).toString("base64");
}

async function synthesizeSpeech(text: string) {
  if (!elevenLabsClient) {
    throw new Error("ElevenLabs client is not initialized.");
  }
  const responseStream = await elevenLabsClient.textToSpeech.convert(ELEVENLABS_VOICE_ID, {
    text,
    model_id: ELEVENLABS_MODEL_ID,
    voice_settings: {
      stability: 0.45,
      similarity_boost: 0.7,
      style: 0.35,
      use_speaker_boost: true,
    },
    output_format: "mp3_22050_32",
  });

  return streamToBase64(responseStream);
}

export async function POST(request: Request) {
  if (!ELEVENLABS_API_KEY || !elevenLabsClient) {
    return NextResponse.json({ error: "ElevenLabs is not configured." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const eventType = body?.eventType as MotivationEventType | undefined;
    const context = body?.context ?? {};
    const presetMessage =
      typeof body?.presetMessage === "string" ? body.presetMessage.trim() : null;

    if (!eventType) {
      return NextResponse.json({ error: "eventType is required." }, { status: 400 });
    }

    let trimmedMessage: string;
    if (presetMessage && presetMessage.length > 0) {
      trimmedMessage = presetMessage;
    } else {
      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 });
      }
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      const prompt = buildPrompt(eventType, context);
      const geminiResult = await model.generateContent(prompt);
      const response = await geminiResult.response;
      const rawText = response.text();
      trimmedMessage =
        rawText?.replace(/\*/g, "").replace(/\s+/g, " ").trim() || "Keep pushing forward!";
    }

    const audioBase64 = await synthesizeSpeech(trimmedMessage);

    return NextResponse.json({ message: trimmedMessage, audioBase64 });
  } catch (error: any) {
    console.error("Motivation API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate motivation message." },
      { status: 500 }
    );
  }
}

