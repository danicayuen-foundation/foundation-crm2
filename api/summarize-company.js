import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  try {
    const { companyName, website, description } = req.body;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are helping Foundation, a humanoid robotics company, research automotive manufacturing prospects.

Company: ${companyName}
Website: ${website || "Not provided"}
Existing description: ${description || "Not provided"}

Write a concise CRM-ready company summary.

Return ONLY valid JSON:
{
  "summary": "",
  "automationFit": "",
  "buyerPersonas": "",
  "outreachAngle": ""
}

Keep each field short and useful.
`
    });

    const text = response.output_text || "{}";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return res.status(200).json(JSON.parse(cleaned));
  } catch (error) {
    return res.status(500).json({
      error: "Company summary failed",
      details: error.message
    });
  }
}
