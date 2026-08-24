const GROQ_BASE = "https://api.groq.com/openai/v1";
const CHAT_URL = `${GROQ_BASE}/chat/completions`;

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

function dataUrlToBlob(
  dataUrl,
  fallbackType = "application/octet-stream"
) {
  const match =
    /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl || "");

  if (!match) {
    throw new Error("Invalid attachment data.");
  }

  const mimeType = match[1] || fallbackType;
  const isBase64 = Boolean(match[2]);
  const raw = match[3];

  const bytes = isBase64
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

async function parseResponse(response) {
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

function makeSpeechText(
  rawReply,
  displayReply
) {
  const direction =
    String(rawReply)
      .match(/\[([^\]\n]{1,40})\]/)?.[0] || "";

  let spoken = displayReply;

  if (spoken.length > 180) {
    spoken =
      spoken
        .slice(0, 180)
        .replace(/\s+\S*$/, "")
        .trim() + "...";
  }

  return `${
    direction
      ? direction + " "
      : ""
  }${spoken}`
    .trim()
    .slice(0, 220);
}

async function handleVoiceTurn(
  req,
  res,
  apiKey,
  body
) {
  const audio =
    String(body.audio || "");

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
    await parseResponse(
      transcriptResponse
    );

  if (!transcriptResponse.ok) {
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
        ?.text ||
      ""
    ).trim();

  if (!transcript) {
    return res
      .status(400)
      .json({
        error:
          "I couldn't hear any words."
      });
  }

  const history =
    Array.isArray(body.history)
      ? body.history
          .slice(-10)
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
          .map(item => ({
            role:
              item.role,

            content:
              item.content.slice(
                0,
                900
              )
          }))
      : [];

  const systemPrompt = `
You are LampAI in live voice mode.

Talk like a real person on a voice call.

Keep replies short and conversational.
Usually one or two sentences.

Never use markdown.
Never use bullet points.
Never use headings.
Never use asterisks.
Never output <think> tags.
Never reveal hidden reasoning.

Sound natural.

You can occasionally use small fillers like:
"uh"
"um"
"hmm"
"yeah"
"well"

A slight stutter is okay occasionally if it sounds natural.

Do not overdo fillers or stutters.

You may optionally begin with ONE expressive voice direction:

[casual]
[warm]
[breathy]
[whisper]
[deadpan]
[sarcastic]
[exasperated sigh]

Most replies should not need a direction.

${
  instructions
    ? `User customization:\n${instructions}`
    : ""
}
`;

  // GENERATE AI RESPONSE

  const chatResponse =
    await fetch(
      CHAT_URL,
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
              140
          })
      }
    );

  const chatParsed =
    await parseResponse(
      chatResponse
    );

  if (!chatResponse.ok) {
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
        ?.content ||
      ""
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

  try {
    const speechResponse =
      await fetch(
        `${GROQ_BASE}/audio/speech`,
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
                TTS_MODEL,

              voice:
                TTS_VOICE,

              input:
                makeSpeechText(
                  rawReply,
                  reply
                ),

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

    const speechError =
      await speechResponse.text();

    console.error(
      "Groq TTS failed:",
      speechResponse.status,
      speechError
    );

  } catch (error) {
    console.error(
      "Groq TTS error:",
      error
    );
  }

  return res
    .status(200)
    .json({
      transcript,
      reply,
      audio: ""
    });
}

async function handleNormalChat(
  req,
  res,
  apiKey,
  body
) {
  const message =
    String(
      body.message ||
      ""
    ).trim();

  const instructions =
    String(
      body.instructions ||
      ""
    ).trim();

  const attachments =
    Array.isArray(
      body.attachments
    )
      ? body.attachments.slice(
          0,
          5
        )
      : [];

  if (
    !message &&
    attachments.length === 0
  ) {
    return res
      .status(400)
      .json({
        error:
          "Send a message, image, or file."
      });
  }

  const userContent = [];

  if (message) {
    userContent.push({
      type: "text",
      text: message
    });
  }

  for (
    const file of attachments
  ) {
    const name =
      String(
        file?.name ||
        "attachment"
      );

    const type =
      String(
        file?.type ||
        ""
      );

    const content =
      typeof file?.content ===
        "string"
        ? file.content
        : "";

    if (!content) {
      continue;
    }

    if (
      type.startsWith(
        "image/"
      )
    ) {
      if (
        !content.startsWith(
          "data:image/"
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              `${name} could not be read as an image.`
          });
      }

      userContent.push({
        type:
          "image_url",

        image_url: {
          url:
            content
        }
      });

      continue;
    }

    if (
      file.encoding ===
        "text" ||
      type.startsWith(
        "text/"
      ) ||
      /\.(txt|md|csv|json)$/i.test(
        name
      )
    ) {
      userContent.push({
        type: "text",

        text:
          `Attached file: ${name}\n\n` +
          content
      });

      continue;
    }

    userContent.push({
      type: "text",

      text:
        `The user attached "${name}", but this file type cannot currently be read. Mention that briefly only if it matters.`
    });
  }

  if (
    userContent.length === 0
  ) {
    userContent.push({
      type: "text",
      text: "Hello"
    });
  }

  const systemPrompt = `
You are LampAI.

Answer naturally like a normal person.

Be concise and direct.

For normal questions, usually answer in 1 to 4 short sentences.

Never reveal chain-of-thought, private reasoning, or internal analysis.

Never output <think> tags.

Use plain text by default.

Do not use markdown asterisks.
Do not use bold formatting.

Do not use markdown bullet lists unless the user asks for a list.

Do not repeat the user's question.

Do not add unnecessary headings, summaries, or explanations.

For image questions, answer what the user asked first.

Do not produce a giant visual-analysis report unless requested.

${
  instructions
    ? `User customization:\n${instructions}`
    : ""
}
`;

  const response =
    await fetch(
      CHAT_URL,
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

              {
                role:
                  "user",

                content:
                  userContent
              }
            ],

            reasoning_effort:
              "none",

            reasoning_format:
              "hidden",

            temperature:
              0.7,

            top_p:
              0.8,

            max_completion_tokens:
              700
          })
      }
    );

  const parsed =
    await parseResponse(
      response
    );

  if (!response.ok) {
    console.error(
      "Groq error:",
      response.status,
      parsed.raw
    );

    return res
      .status(
        response.status
      )
      .json({
        error:
          parsed.data
            ?.error
            ?.message ||
          parsed.raw ||
          `Groq failed (${response.status}).`
      });
  }

 
