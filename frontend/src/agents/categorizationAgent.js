import { callGemini } from "../utils/geminiClient.js";

export async function runCategorizationAgent(visionOutput) {
  const prompt = `You are a senior municipal classification expert trained on Indian civic infrastructure systems including CPWD, NDMC, MCD, BrihanMumbai Municipal Corporation, and BBMP classification frameworks.

You will receive a vision analysis report from an AI infrastructure inspector. Your job is to precisely classify this civic issue into EXACTLY ONE of the 12 predefined categories below.

Vision Analysis Report:
${JSON.stringify(visionOutput, null, 2)}

YOU MUST USE ONLY THESE 12 CATEGORIES (use exact string):
- ROAD_DAMAGE: Potholes, cracks, broken asphalt, road cave-ins, damaged dividers, broken footpaths
- WATER_INFRASTRUCTURE: Leaking pipes, overflowing drains, sewage overflow, broken water mains, waterlogging, burst pipes
- ELECTRICAL: Broken streetlights, exposed wires, fallen electric poles, transformer issues, power cuts
- SANITATION: Garbage overflow, illegal dumping, open defecation sites, broken dustbins, waste management
- DRAINAGE: Blocked drains, broken drain covers, flooding due to poor drainage, storm drain issues
- PUBLIC_SAFETY: Missing manhole covers, collapsed walls, unsafe construction, broken barriers, accident prone areas
- ENCROACHMENT: Illegal structures, footpath encroachment, unauthorized signboards, illegal parking
- GREEN_SPACES: Fallen trees, damaged parks, broken benches, uprooted plants, dead trees
- POLLUTION: Air pollution, water pollution, noise pollution, industrial waste dumping, chemical spills
- HEALTHCARE: Broken hospital infrastructure, unhygienic medical waste, damaged health center
- EDUCATION: Damaged school infrastructure, broken playground equipment, unsafe school building
- TRANSPORT: Broken bus stops, damaged road signs, missing traffic signals, broken railway infrastructure

Return ONLY this JSON, no markdown, no explanation:
{
  "category": string,
  "sub_category": string,
  "tags": string[],
  "responsible_department": string,
  "secondary_department": string or null,
  "classification_confidence": number,
  "requires_emergency_response": boolean,
  "citizen_friendly_title": string,
  "citizen_friendly_description": string
}`;

  const text = await callGemini(prompt);
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
