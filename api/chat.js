const XAI_BASE_URL = "https://api.x.ai/v1";
const MODEL = process.env.GROK_MODEL || "grok-4.6";

function getApiKey() {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || "";
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

  let bytes;

  if (isBase64) {
    bytes = Buffer.from(raw, "base64");
  } else {
    bytes = Buffer.from(
      decodeURIComponent(raw),
      "utf8"
    );
  }

  return new Blob(
    [bytes],
    { type: mimeType }
  );
}

async function uploadFile(attachment, apiKey) {
  let blob;

  if (attachment.encoding === "data-url") {
    blob = dataUrlToBlob(
      attachment.content,
      attachment.type
    );
  } else {
    blob = new Blob(
      [attachment.content || ""],
      {
        type:
          attachment.type ||
          "text/plain"
      }
    );
  }

  const form = new FormData();

  form.append(
    "purpose",
    "assistants"
  );

  form.append(
    "file",
    blob,
    attachment.name || "attachment"
  );

  const response = await fetch(
    `${XAI_BASE_URL}/files`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${apiKey}`
      },

      body: form
    }
  );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok || !data.id) {
    throw new Error(
      data?.error?.message ||
      data?.message ||
      `File upload failed (${response.status}).`
    );
  }

  return data.id;
}

async function deleteFile(fileId, apiKey) {
  try {
    await fetch(
      `${XAI_BASE_URL}/files/${encodeURIComponent(fileId)}`,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${apiKey}`
        }
      }
    );
  } catch {
    // Ignore cleanup errors.
  }
}

function extractReply(data) {
  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text.trim();
  }

  const pieces = [];

  for (const item of data?.output || []) {
    for (const part of item?.content || []) {
      if (
        typeof part?.text === "string" &&
        part.text.trim()
      ) {
        pieces.push(
          part.text.trim()
        );
      }
    }
  }

  return pieces.join("\n\n").trim();
}

export default async function handler(req, res) {

  // Allows GitHub Pages to call
  // your Vercel backend.
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

  if (req.method === "OPTIONS") {
    return res
      .status(204)
      .end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = getApiKey();

  if (!apiKey) {
    return res.status(500).json({
      error:
        "Missing XAI_API_KEY or GROK_API_KEY environment variable."
    });
  }

  const {
    message = "",
    instructions = "",
    attachments = []
  } = req.body || {};

  const cleanMessage =
    String(message || "").trim();

  const files =
    Array.isArray(attachments)
      ? attachments.slice(0, 5)
      : [];

  if (
    !cleanMessage &&
    files.length === 0
  ) {
    return res.status(400).json({
      error:
        "Missing message or attachment."
    });
  }

  const customInstructions =
    String(instructions || "").trim() ||
    "Be helpful, intelligent, clear, and direct.";

  const uploadedFileIds = [];

  try {

    const userContent = [];

    userContent.push({
      type: "input_text",

      text:
        cleanMessage ||
        "Analyze the attached content and tell me what you see."
    });

    for (const attachment of files) {

      const type =
        String(
          attachment?.type || ""
        );

      const content =
        attachment?.content;

      if (!content) continue;

      // IMAGE
      if (
        type.startsWith("image/") ||
        attachment?.kind === "image"
      ) {

        if (
          !/^data:image\/(jpeg|jpg|png);base64,/i
            .test(content)
        ) {
          throw new Error(
            `${attachment?.name || "Image"} must be JPEG or PNG.`
          );
        }

        userContent.push({
          type: "input_image",
          image_url: content,
          detail: "high"
        });

        continue;
      }

      // FILE
      const fileId =
        await uploadFile(
          attachment,
          apiKey
        );

      uploadedFileIds.push(fileId);

      userContent.push({
        type: "input_file",
        file_id: fileId
      });
    }

    // SEND EVERYTHING TO GROK
    const response = await fetch(
      `${XAI_BASE_URL}/responses`,
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

          store: false,

          input: [
            {
              role: "system",
              content:
                customInstructions
            },

            {
              role: "user",
              content:
                userContent
            }
          ]
        })
      }
    );

    const data =
      await response
        .json()
        .catch(() => ({}));

    if (!response.ok) {
      return res
        .status(response.status)
        .json({
          error:
            data?.error?.message ||
            data?.message ||
            `Grok request failed (${response.status}).`
        });
    }

    const reply =
      extractReply(data);

    if (!reply) {
      return res.status(502).json({
        error:
          "Grok returned a response, but no readable text was found."
      });
    }

    return res
      .status(200)
      .json({
        reply
      });

  } catch (error) {

    return res
      .status(500)
      .json({
        error:
          error?.message ||
          "Something went wrong."
      });

  } finally {

    await Promise.all(
      uploadedFileIds.map(
        fileId =>
          deleteFile(
            fileId,
            apiKey
          )
      )
    );
  }
}
