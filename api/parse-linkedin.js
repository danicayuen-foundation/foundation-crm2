import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  try {
    const { image } = req.body;

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
              text: `
You are extracting CRM data from a LinkedIn profile screenshot.

Return ONLY valid JSON. No markdown.

Extract:
{
  "name": "",
  "title": "",
  "company": "",
  "location": "",
  "linkedinUrl": "",
  "notes": ""
}

Rules:
- If something is not visible, use an empty string.
- For notes, write one short sentence about why this person may matter for Foundation's automotive manufacturing outreach.
- Foundation is a humanoid robotics company targeting VP Operations, VP Engineering, automation, manufacturing, and industrial leadership.
`
            },
            {
              type: "input_image",
              image_url: image
            }
          ]
        }
      ]
    });

    const text = response.output_text || "{}";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleaned);

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "AI parsing failed",
      details: error.message
    });
  }
}
