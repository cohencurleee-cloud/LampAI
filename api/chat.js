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

function dataUrlToBlob(
  dataUrl,
  fallbackType = "audio/mp4"
) {
  const match =
    /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(
      dataUrl || ""
    );

  if (!match) {
    throw new Error(
      "Invalid microphone audio."
    );
  }

  const mimeType =
    match[1] || fallbackType;

  const isBase64 =
    Boolean(match[2]);

  const raw =
    match[3];

  const bytes =
    isBase64
      ? Buffer.from(raw, "base64")
      : Buffer.from(
          decodeURIComponent(raw),
          "utf8"
        );

  return new Blob(
    [bytes],
    { type: mimeType }
  );
}

function visibleReply(text = "") {
  return cleanReply(text)
    .replace(
      /\[[^\]\n]{1,40}\]\s*/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

function makeSpeechText(
  rawReply,
  displayReply
) {
  const direction =
    String(rawReply)
      .match(
        /\[([^\]\n]{1,40})\]/
      )?.[0] || "";

  let spoken =
    displayReply;

  if (spoken.length > 165) {
    spoken =
      spoken
        .slice(0, 165)
        .replace(
          /\s+\S*$/,
          ""
        )
        .trim() + "...";
  }

  const result =
    `${
      direction
        ? direction + " "
        : ""
    }${spoken}`.trim();

  return result.slice(
    0,
    198
  );
}

async function parseJson(
  response
) {
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

export default async function handler(
  req,
  res
) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (
    req.method === "OPTIONS"
  ) {
    return res
      .status(204)
      .end();
  }

  if (
    req.method !== "POST"
  ) {
    return res
      .status(405)
      .json({
        error:
          "Method not allowed"
      });
  }

  try {
    const apiKey =
      process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res
        .status(500)
        .json({
          error:
            "Missing GROQ_API_KEY in Vercel."
        });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(
            req.body
          )
        : req.body || {};

    if (
      body.action !== "turn"
    ) {
      return res
        .status(400)
        .json({
          error:
            "Unknown voice action."
        });
    }

    const audio =
      String(
        body.audio || ""
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

    const instructions =
      String(
        body.instructions ||
          ""
      ).trim();

    if (!audio) {
      return res
        .status(400)
        .json({
          error:
            "No microphone audio received."
        });
    }

    // SPEECH TO TEXT

    const audioBlob =
      dataUrlToBlob(
        audio,
        mimeType
      );

    const form =
      new FormData();

    form.append(
      "file",
      audioBlob,
      filename
    );

    form.append(
      "model",
      STT_MODEL
    );

    form.append(
      "language",
      "en"
    );

    form.append(
      "response_format",
      "json"
    );

    form.append(
      "temperature",
      "0"
    );

    const transcriptResponse =
      await fetch(
        `${GROQ_BASE}/audio/transcriptions`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${apiKey}`
          },

          body: form
        }
      );

    const transcriptParsed =
      await parseJson(
        transcriptResponse
      );

    if (
      !transcriptResponse.ok
    ) {
      return res
        .status(
          transcriptResponse.status
        )
        .json({
          error:
            transcriptParsed
              .data
              ?.error
              ?.message ||
            transcriptParsed.raw ||
            "Speech transcription failed."
        });
    }

    const transcript =
      String(
        transcriptParsed
          .data
          ?.text || ""
      ).trim();

    if (!transcript) {
      return res
        .status(400)
        .json({
          error:
            "I couldn't hear any words."
        });
    }

    // CHAT HISTORY

    const history =
      Array.isArray(
        body.history
      )
        ? body.history
            .slice(-8)
            .filter(
              item =>
                item &&
                [
                  "user",
                  "assistant"
                ].includes(
                  item.role
                ) &&
                typeof item.content ===
                  "string"
            )
            .map(
              item => ({
                role:
                  item.role,

                content:
                  item.content.slice(
                    0,
                    800
                  )
              })
            )
        : [];

    // AI PERSONALITY

    const systemPrompt = `
You are LampAI in live voice mode.

Talk like a real person having a quick spoken conversation.

Keep every reply short.
Usually one or two sentences.
Keep responses under about 165 characters when possible.

Never use markdown.
Never use bullet points.
Never use headings.
Never use asterisks.

Never reveal hidden reasoning.
Never output <think> tags.

Sound natural instead of robotic.

You may occasionally use natural speech like:
"uh"
"um"
"hmm"
"yeah"
"well"

You may occasionally stutter slightly when it sounds natural.

Do not overuse fillers or stutters.

You can sometimes use one vocal direction:

[casual]
[warm]
[breathy]
[whisper]
[deadpan]
[sarcastic]
[exasperated sigh]

Only use one when it fits naturally.

Most replies should not include one.

The bracketed direction is only for the voice engine and will not be shown to the user.

${
  instructions
    ? `User customization:\n${instructions}`
    : ""
}
`;

    // GENERATE RESPONSE

    const chatResponse =
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

              messages: [
                {
                  role:
                    "system",

                  content:
                    systemPrompt
                },

                ...history,

                {
                  role:
                    "user",

                  content:
                    transcript
                }
              ],

              reasoning_effort:
                "none",

              reasoning_format:
                "hidden",

              temperature:
                0.8,

              top_p:
                0.9,

              max_completion_tokens:
                120
            })
        }
      );

    const chatParsed =
      await parseJson(
        chatResponse
      );

    if (
      !chatResponse.ok
    ) {
      return res
        .status(
          chatResponse.status
        )
        .json({
          error:
            chatParsed
              .data
              ?.error
              ?.message ||
            chatParsed.raw ||
            "LampAI voice reply failed."
        });
    }

    const rawReply =
      cleanReply(
        chatParsed
          .data
          ?.choices?.[0]
          ?.message
          ?.content || ""
      );

    const reply =
      visibleReply(
        rawReply
      );

    if (!reply) {
      return res
        .status(502)
        .json({
          error:
            "LampAI returned an empty voice reply."
        });
    }

    // TEXT TO SPEECH

    const speechText =
      makeSpeechText(
        rawReply,
        reply
      );

    try {
      const speechResponse =
        await fetch(
          `${GROQ_BASE}/audio/speech`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${apiKey}`
            },

            body:
              JSON.stringify({
                model:
                  TTS_MODEL,

                voice:
                  TTS_VOICE,

                input:
                  speechText,

                response_format:
                  "wav"
              })
          }
        );

      if (
        speechResponse.ok
      ) {
        const audioBuffer =
          Buffer.from(
            await speechResponse.arrayBuffer()
          );

        return res
          .status(200)
          .json({
            transcript,
            reply,

            audio:
              audioBuffer.toString(
                "base64"
              )
          });
      }

      const failedSpeech =
        await speechResponse.text();

      console.error(
        "Groq TTS failed:",
        speechResponse.status,
        failedSpeech
      );

      return res
        .status(200)
        .json({
          transcript,
          reply,

          audio: "",

          tts_warning:
            "Expressive voice was unavailable."
        });

    } catch (
      ttsError
    ) {
      console.error(
        "Groq TTS error:",
        ttsError
      );

      return res
        .status(200)
        .json({
          transcript,
          reply,

          audio: "",

          tts_warning:
            "Expressive voice was unavailable."
        });
    }

  } catch (error) {
    console.error(
      "LampAI voice error:",
      error
    );

    return res
      .status(500)
      .json({
        error:
          error?.message ||
          "Voice Mode server error."
      });
  }
}
