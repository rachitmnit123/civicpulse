import { callGeminiVision, callGeminiVideo } from "../utils/geminiClient.js";

export async function runVisionAgent(imageBase64, mimeType, location) {
  const prompt = `You are an expert municipal infrastructure inspector with 20 years of field experience across Indian cities. You have deep knowledge of PWD (Public Works Department) standards, BIS codes for road construction, and municipal bylaws.

Carefully analyze this image submitted by a citizen reporting a civic issue.

Your job is to provide a precise, actionable assessment that will be used by:
1. Municipal authorities to prioritize repairs
2. AI routing agents to assign the right department
3. Citizens to understand the severity of the problem

Evaluate the following aspects:
- Type and nature of the infrastructure damage or issue
- Visual extent and spread of the damage
- Immediate safety risk to pedestrians, vehicles, or residents
- Estimated affected area
- Urgency based on Indian urban context (monsoon risk, traffic density, public health)

Return ONLY a valid JSON object with this exact structure, no markdown, no explanation:
{
  "issue_detected": boolean,
  "confidence": number,
  "issue_type": string,
  "visual_description": string,
  "damage_extent": "MINOR" | "MODERATE" | "SEVERE" | "CRITICAL",
  "safety_risk": boolean,
  "affected_area_sqm": number or null,
  "recommended_department": string,
  "monsoon_risk": boolean,
  "estimated_repair_days": number
}

Location context: lat=${location.lat}, lng=${location.lng}`;

  const text = await callGeminiVision(prompt, imageBase64, mimeType);
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function runVisionAgentVideo(videoBase64, mimeType, location) {
  const prompt = `You are an expert municipal infrastructure inspector with 20 years of field experience across Indian cities. You have deep knowledge of PWD (Public Works Department) standards, BIS codes for road construction, and municipal bylaws.

Carefully analyze this VIDEO submitted by a citizen reporting a civic issue. Watch all frames carefully and identify the most significant issue shown.

Your job is to provide a precise, actionable assessment that will be used by:
1. Municipal authorities to prioritize repairs
2. AI routing agents to assign the right department
3. Citizens to understand the severity of the problem

Evaluate the following aspects:
- Type and nature of the infrastructure damage or issue
- Visual extent and spread of the damage
- Immediate safety risk to pedestrians, vehicles, or residents
- Estimated affected area
- Urgency based on Indian urban context (monsoon risk, traffic density, public health)

Return ONLY a valid JSON object with this exact structure, no markdown, no explanation:
{
  "issue_detected": boolean,
  "confidence": number,
  "issue_type": string,
  "visual_description": string,
  "damage_extent": "MINOR" | "MODERATE" | "SEVERE" | "CRITICAL",
  "safety_risk": boolean,
  "affected_area_sqm": number or null,
  "recommended_department": string,
  "monsoon_risk": boolean,
  "estimated_repair_days": number
}

Location context: lat=${location.lat}, lng=${location.lng}`;

  const text = await callGeminiVideo(prompt, videoBase64, mimeType);
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}