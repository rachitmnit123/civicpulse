import { callGemini } from "../utils/geminiClient.js";

const AUTHORITY_DATABASE = {
  ROAD_DAMAGE: { department: "Public Works Department (PWD)", contact: "pwd@municipalcorp.gov.in", sla_multiplier: 1.0, escalation: "Municipal Commissioner" },
  WATER_INFRASTRUCTURE: { department: "Jal Board / Water Supply Department", contact: "jalboard@municipalcorp.gov.in", sla_multiplier: 0.8, escalation: "Chief Engineer Water Supply" },
  ELECTRICAL: { department: "BSES / DVVNL / State Electricity Board", contact: "electricity@municipalcorp.gov.in", sla_multiplier: 0.5, escalation: "Executive Engineer Electrical" },
  SANITATION: { department: "Sanitation & Health Department", contact: "sanitation@municipalcorp.gov.in", sla_multiplier: 0.7, escalation: "Chief Sanitary Inspector" },
  PUBLIC_SAFETY: { department: "Public Safety & Engineering Department", contact: "safety@municipalcorp.gov.in", sla_multiplier: 0.6, escalation: "Municipal Commissioner" },
  ENCROACHMENT: { department: "Anti-Encroachment Cell", contact: "encroachment@municipalcorp.gov.in", sla_multiplier: 1.2, escalation: "Zonal Deputy Commissioner" },
  GREEN_SPACES: { department: "Horticulture Department", contact: "horticulture@municipalcorp.gov.in", sla_multiplier: 1.5, escalation: "Chief Horticulture Officer" },
  DRAINAGE: { department: "Drainage & Sewerage Department", contact: "drainage@municipalcorp.gov.in", sla_multiplier: 0.9, escalation: "Chief Engineer Drainage" },
};

export async function runRoutingAgent(visionOutput, categorizationOutput, severityOutput, location) {
  const authorityInfo = AUTHORITY_DATABASE[categorizationOutput.category] || AUTHORITY_DATABASE["PUBLIC_SAFETY"];

  const prompt = `You are a senior municipal routing and escalation expert with deep knowledge of Indian municipal corporation structures.

Issue Summary:
- Type: ${visionOutput.issue_type}
- Description: ${visionOutput.visual_description}
- Category: ${categorizationOutput.category}
- Department: ${authorityInfo.department}
- Severity Score: ${severityOutput.severity_score}/10
- Priority: ${severityOutput.priority_rank}
- Urgency: ${severityOutput.urgency}
- SLA Hours: ${severityOutput.sla_hours}
- Estimated Cost: ₹${severityOutput.estimated_cost_inr}
- Public Safety Threat: ${severityOutput.public_safety_threat}
- Location: lat=${location.lat}, lng=${location.lng}

Authority Info: ${JSON.stringify(authorityInfo, null, 2)}

Return ONLY this JSON, no markdown, no explanation:
{
  "primary_authority": string,
  "primary_department": string,
  "contact_email": string,
  "escalation_chain": string[],
  "estimated_resolution_days": number,
  "action_letter": string,
  "resolution_steps": string[],
  "requires_site_visit": boolean,
  "inter_department_coordination": boolean,
  "routing_confidence": number,
  "auto_escalate_after_hours": number
}`;

  const text = await callGemini(prompt);
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
