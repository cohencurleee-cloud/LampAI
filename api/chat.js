const GROQ = "https://api.groq.com/openai/v1";

const CHAT_MODEL = "qwen/qwen3.6-27b";
const STT_MODEL = "whisper-large-v3-turbo";
const TTS_MODEL = "canopylabs/orpheus-v1-english";
const TTS_VOICE = "troy";

function clean(text = "") {
  return String(text)
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim();
}

function stripVoiceTags(text = "") {
  return clean(text)
    .replace(/\[[^\]\n]{1,40}\]\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function jsonFrom(response) {
  const raw = await response.text();

  try {
    return {
      raw,
      data: raw ? JSON.parse(raw) : {}
    };
  } catch {
    return {
      raw,
      data: {}
    };
  }
}

async function callChat(
  apiKey,
  messages,
  maxTokens = 700,
  temperature = 0.7
) {
  const response = await fetch(
    `${GROQ}/chat/completions`,
    {
      method
