const MODEL = process.env.GROK_MODEL || "grok-4.6";

function getApiKey() {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || "";
}

function getReply(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts = [];

  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (
        content?.type === "output_text" &&
        typeof content.text === "string"
      ) {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n\n").trim();
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
    const apiKey = getApiKey();

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing XAI_API_KEY in Vercel."
      });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const message = String(body.message || "").trim();
    const instructions = String(body.instructions || "").trim();

    const attachments =
      Array.isArray(body.attachments)
        ? body.attachments.slice(0, 5)
        : [];

    if (!message && attachments.length === 0) {
      return res.status(400).json({
        error: "Send a message or attachment."
      });
    }

    const content = [];

    if (message) {
      content.push({
        type: "input_text",
        text: message
      });
    }

    for (const file of attachments) {
      const type = String(file?.type || "");
      const name = String(file?.name || "attachment");

      const data =
        typeof file?.content === "string"
          ? file.content
          : "";

      if (!data) continue;

      // IMAGES
      if (type.startsWith("image/")) {
        if (
          !/^data:image\/(jpeg|jpg|png);base64,/i.test(data)
        ) {
          return res.status(400).json({
            error: `${name} must be a JPEG or PNG image.`
          });
        }

        content.push({
          type: "input_image",
          image_url: data,
          detail: "high"
        });

        continue;
      }

      // TEXT FILES
      if (file?.encoding === "text") {
        content.push({
          type: "input_text",
          text:
            `\n\nAttached file: ${name}\n` +
            `---\n${data}\n---`
        });

        continue;
      }

      return res.status(400).json({
        error:
          `${name} is a binary document. ` +
          `Text and images work right now; PDF/DOCX support comes next.`
      });
    }

    if (content.length === 0) {
      content.push({
        type: "input_text",
        text: "Hello"
      });
    }

    const input = [];

    if (instructions) {
      input.push({
        role: "system",
        content: instructions
      });
    }

    input.push({
      role: "user",
      content
    });

    const xaiResponse = await fetch(
      "https://api.x.ai/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: MODEL,
          store: false,
          input
        })
      }
    );

    const raw = await xaiResponse.text();

    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { raw };
    }

    if (!xaiResponse.ok) {
      console.error(
        "xAI error:",
        xaiResponse.status,
        raw
      );

      return res.status(xaiResponse.status).json({
        error:
          data?.error?.message ||
          data?.message ||
          raw ||
          `xAI request failed (${xaiResponse.status}).`
      });
    }

    const reply = getReply(data);

    if (!reply) {
      console.error(
        "No reply text from xAI:",
        raw
      );

      return res.status(502).json({
        error: "xAI returned no readable reply."
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error(
      "LampAI function error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Server error."
    });
  }
}
