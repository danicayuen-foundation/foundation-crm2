import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST requests allowed" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY in Vercel" });
    }

    const { image } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Extract CRM info from this LinkedIn screenshot.

Return ONLY valid JSON:
{
  "name": "",
  "title": "",
  "company": "",
  "location": "",
  "linkedinUrl": "",
  "notes": ""
}`
            },
            {
              type: "input_image",
              image_url: image
            }
          ]
        }
      ]
    });

    const cleaned = response.output_text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return res.status(200).json(JSON.parse(cleaned));
  } catch (error) {
    console.error("PARSE LINKEDIN ERROR:", error);

    return res.status(500).json({
      error: "AI parsing failed",
      details: error.message
    });
  }
}
