const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "qwen/qwen3.6-27b";

function cleanReply(text = "") {
  return String(text)
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*\*\s+/gm, "")
    .replace(/\*/g, "")
    .trim();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing GROQ_API_KEY in Vercel."
      });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const message = String(body.message || "").trim();
    const instructions = String(body.instructions || "").trim();

    const attachments = Array.isArray(body.attachments)
      ? body.attachments.slice(0, 5)
      : [];

    if (!message && attachments.length === 0) {
      return res.status(400).json({
        error: "Send a message, image, or file."
      });
    }

    const userContent = [];

    if (message) {
      userContent.push({
        type: "text",
        text: message
      });
    }

    for (const file of attachments) {
      const name = String(file?.name || "attachment");
      const type = String(file?.type || "");

      const content =
        typeof file?.content === "string"
          ? file.content
          : "";

      if (!content) {
        continue;
      }

      if (type.startsWith("image/")) {
        if (!content.startsWith("data:image/")) {
          return res.status(400).json({
            error: `${name} could not be read as an image.`
          });
        }

        userContent.push({
          type: "image_url",

          image_url: {
            url: content
          }
        });

        continue;
      }

      if (
        file.encoding === "text" ||
        type.startsWith("text/") ||
        /\.(txt|md|csv|json)$/i.test(name)
      ) {
        userContent.push({
          type: "text",

          text: `Attached file: ${name}\n\n${content}`
        });

        continue;
      }

      userContent.push({
        type: "text",

        text:
          `The user attached "${name}", but this file type cannot currently be read. ` +
          `Tell them that briefly only if it matters to their question.`
      });
    }

    if (userContent.length === 0) {
      userContent.push({
        type: "text",
        text: "Hello"
      });
    }

    const baseInstructions = `
You are LampAI.

Answer naturally like a normal person.

Be concise and direct.

For normal questions, usually answer in 1 to 4 short sentences.

Do not reveal chain-of-thought, private reasoning, scratch work, or internal analysis.

Never output <think> tags.

Never describe hidden reasoning.

Use plain text by default.

Do not use markdown asterisks.

Do not use bold formatting.

Do not use markdown bullet lists unless the user clearly asks for a list.

Do not repeat the user's question.

Do not add unnecessary sections, headings, disclaimers, or summaries.

For image questions, identify or answer what the user asked first.

Do not write a long visual-analysis
