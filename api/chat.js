const GROQ_BASE = "https://api.groq.com/openai/v1";
const CHAT_MODEL = "qwen/qwen3.6-27b";
const STT_MODEL = "whisper-large-v3-turbo";
const TTS_MODEL = "canopylabs/orpheus-v1-english";
const TTS_VOICE = "troy";

function cleanReply(text = "") {
  return String(text)
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim();
}

function dataUrlToBlob(dataUrl, fallbackType = "audio/mp4") {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl || "");

  if (!match) {
    throw new Error("Invalid microphone audio.");
  }

  const mimeType = match[1] || fallbackType;
  const isBase64 = Boolean(match[2]);
  const raw = match[3];

  const bytes = isBase64
    ? Buffer.from(raw, "base64")
    : Buffer.from(decodeURIComponent(raw), "
