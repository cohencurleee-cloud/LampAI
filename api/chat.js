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
    .replace(/^\s*\*\s+/gm, "")
    .replace(/\*/g, "")
    .trim();
}

function visibleReply(text = "") {
  return cleanReply(text)
    .replace(/\[[^\]\n]{1,40}\]\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function base64ToBytes(base64 = "") {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function bytesToBase64(bytes) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  const chunk = 0x8000;

  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, i + chunk)
    );
  }

  return btoa(binary);
}

function parseDataUrl(
  dataUrl,
  fallbackType = "audio/mp4"
) {
  const match =
    /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(
      dataUrl || ""
    );

  if (!match) {
    throw new Error("Invalid audio data.");
  }

  const mimeType =
    match[1] || fallbackType;

  const base64 =
    match[3] || "";

  if (!match[2]) {
    const decoded =
      decodeURIComponent(base64);

    return {
      mimeType,
      bytes:
        new TextEncoder()
          .encode(decoded)
    };
  }

  return {
    mimeType,
    bytes:
      base64ToBytes(base64)
  };
}

async function readJson(response) {
  const raw =
    await response.text();

  try {
    return {
      raw,
      data:
        raw
          ? JSON.parse(raw)
          : {}
    };
  } catch {
    return {
      raw,
      data: {}
    };
  }
}

async function groqChat(
  apiKey,
  messages,
  options = {}
) {
  const response =
    await fetch(
      `${GROQ_BASE}/chat/completions`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${apiKey}`
        },

        body:
          JSON.stringify({
            model:
              CHAT_MODEL,

            messages,

            reasoning_effort:
              "none",

            reasoning_format:
              "hidden",

            temperature:
              options.temperature ??
              0.7,

            top_p:
              options.top_p ??
              0.8,

            max_completion_tokens:
              options.max_completion_tokens ??
              700
          })
      }
    );

  const parsed =
    await readJson(response);

  if (!response.ok) {
    throw new Error(
      parsed.data
        ?.error
        ?.message ||
      parsed.raw ||
      `Groq chat failed (${response.status}).`
    );
  }

  return cleanReply(
    parsed.data
      ?.choices?.[0]
      ?.message
      ?.content ||
    ""
  );
}

async function handleVoiceTranscribe(
  res,
  apiKey,
  body
) {
  const audio =
    String(
      body.audio ||
      ""
    );

  const mimeType =
    String(
      body.mime_type ||
      "audio/mp4"
    );

  const filename =
    String(
      body.filename ||
      "voice.m4a"
    );

  if (!audio) {
    return res
      .status(400)
      .json({
        error:
          "No microphone audio received.",

        stage:
          "transcribe"
      });
  }

  const parsedAudio =
    parseDataUrl(
      audio,
      mimeType
    );

  if (
    parsedAudio
      .bytes
      .byteLength >
    3_000_000
  ) {
    return res
      .status(413)
      .json({
        error:
          "That voice turn was too long. Try a shorter sentence.",

        stage:
          "transcribe"
      });
  }

  const blob =
    new Blob(
      [parsedAudio.bytes],
      {
        type:
          parsedAudio
            .mimeType
      }
   
