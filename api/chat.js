export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, instructions } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const customInstructions =
      instructions?.trim() ||
      "Be helpful, intelligent, friendly, and clear.";

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",

          messages: [
            {
              role: "system",
              content: `
You are LampAI.

Follow these custom instructions from the user:

${customInstructions}

Always follow the user's custom instructions when responding, as long as they don't conflict with safety requirements.
`
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Groq API error"
      });
    }

    return res.status(200).json({
      reply:
        data.choices?.[0]?.message?.content ||
        "LampAI didn't return a response."
    });

  } catch (error) {
    return res.status(500).json({
      error: "Something went wrong connecting to LampAI."
    });
  }
}
