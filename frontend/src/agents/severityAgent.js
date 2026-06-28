import { callGemini } from "../utils/geminiClient.js";

export async function runSeverityAgent(visionOutput, categorizationOutput, location) {
  const prompt = `You are a senior civic risk assessment specialist with expertise in Indian urban infrastructure failure patterns, monsoon impact analysis, and municipal SLA frameworks used by Smart City Mission projects across India.

Vision Analysis:
${JSON.stringify(visionOutput, null, 2)}

Categorization Analysis:
${JSON.stringify(categorizationOutput, null, 2)}

Location: lat=${location.lat}, lng=${location.lng}

Severity Scoring Framework (1-10):
1-2: Cosmetic issue, no risk, can wait weeks
3-4: Minor inconvenience, low risk, resolve within 2 weeks
5-6: Moderate impact, some risk, resolve within 72 hours
7-8: High impact, significant risk, resolve within 24 hours
9-10: Critical danger, immediate threat to life/property, resolve within 4 hours

Return ONLY this JSON, no markdown, no explanation:
{
  "severity_score": number,
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "sla_hours": number,
  "risk_factors": string[],
  "public_safety_threat": boolean,
  "estimated_cost_inr": number,
  "priority_rank": "P1" | "P2" | "P3" | "P4",
  "escalation_required": boolean,
  "severity_reasoning": string,
  "preventive_action": string
}`;

  const text = await callGemini(prompt);
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
