const GROQ_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const MODEL = "qwen/qwen3.6-27b";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

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
        error:
          "Missing GROQ_API_KEY in Vercel."
      });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const message =
      String(body.message || "").trim();

    const instructions =
      String(body.instructions || "").trim();

    const attachments =
      Array.isArray(body.attachments)
        ? body.attachments.slice(0, 5)
        : [];

    if (!message && attachments.length === 0) {
      return res.status(400).json({
        error:
          "Send a message, image, or file."
      });
    }

    const userContent = [];

    // User's typed message
    if (message) {
      userContent.push({
        type: "text",
        text: message
      });
    }

    // Attachments
    for (const file of attachments) {
      const name =
        String(file?.name || "attachment");

      const type =
        String(file?.type || "");

      const content =
        typeof file?.content === "string"
          ? file.content
          : "";

      if (!content) continue;

      // IMAGE
      if (type.startsWith("image/")) {
        if (
          !content.startsWith("data:image/")
        ) {
          return res.status(400).json({
            error:
              `${name} could not be read as an image.`
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

      // TEXT-BASED FILES
      if (
        file.encoding === "text" ||
        type.startsWith("text/") ||
        /\.(txt|md|csv|json)$/i.test(name)
      ) {
        userContent.push({
          type: "text",
          text:
            `\nAttached file: ${name}\n\n` +
            content
        });

        continue;
      }

      // PDF / DOCX etc.
      userContent.push({
        type: "text",
        text:
          `The user attached a file named "${name}", ` +
          `but this file type cannot currently be read.`
      });
    }

    if (userContent.length === 0) {
      userContent.push({
        type: "text",
        text: "Hello"
      });
    }

    const messages = [];

    if (instructions) {
      messages.push({
        role: "system",
        content: instructions
      });
    } else {
      messages.push({
        role: "system",
        content:
          "You are LampAI. Be helpful, intelligent, direct, and natural."
      });
    }

    messages.push({
      role: "user",
      content: userContent
    });

    const response = await fetch(
      GROQ_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature: 0.7,
          max_completion_tokens: 2048
        })
      }
    );

    const raw =
      await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }

    if (!response.ok) {
      console.error(
        "Groq error:",
        response.status,
        raw
      );

      return res
        .status(response.status)
        .json({
          error:
            data?.error?.message ||
            raw ||
            `Groq failed (${response.status}).`
        });
    }

    const reply =
      data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({
        error:
          "Groq returned no response."
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error(
      "LampAI error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Server error."
    });
  }
}
