import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  try {
    const { name, title, company, status, notes } = req.body;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are helping Foundation, a humanoid robotics company, with automotive manufacturing outreach.

Contact:
Name: ${name}
Title: ${title}
Company: ${company}
Status: ${status}
Notes: ${notes}

Recommend the next follow-up step.

Return ONLY valid JSON:
{
  "recommendedAction": "",
  "followUpMessage": "",
  "priority": ""
}

Make the message concise, professional, and focused on manufacturing labor, automation, and operations efficiency.
`
    });

    const text = response.output_text || "{}";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return res.status(200).json(JSON.parse(cleaned));
  } catch (error) {
    return res.status(500).json({
      error: "Follow-up recommendation failed",
      details: error.message
    });
  }
}
