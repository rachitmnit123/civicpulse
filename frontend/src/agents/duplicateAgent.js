import { callGemini } from "../utils/geminiClient.js";
import { db } from "../firebase.js";
import { collection, query, where, getDocs } from "firebase/firestore";

const ACTIVE_STATUSES = ["ASSIGNED", "VERIFIED", "IN_PROGRESS"];

export async function runDuplicateAgent(visionOutput, categorizationOutput, location) {
  const lat = location.lat;
  const lng = location.lng;
  const latDelta = 0.01;   // ≈ 1.1km
  const lngDelta = 0.01;   // ≈ 900m

  const reportsRef = collection(db, "reports");
  const q = query(
    reportsRef,
    where("location.lat", ">=", lat - latDelta),
    where("location.lat", "<=", lat + latDelta)
  );

  const snapshot = await getDocs(q);
  const nearbyReports = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (
      data.location?.lng >= lng - lngDelta &&
      data.location?.lng <= lng + lngDelta &&
      ACTIVE_STATUSES.includes(data.status)
    ) {
      nearbyReports.push({ id: doc.id, ...data });
    }
  });

  if (nearbyReports.length === 0) {
    return {
      is_duplicate: false,
      matched_report_id: null,
      similarity_score: 0,
      nearby_report_count: 0,
      action: "CREATE_NEW",
    };
  }

  const prompt = `You are a civic issue deduplication expert. Determine if a newly reported issue is a duplicate of an existing open report nearby.

NEW REPORT:
Issue Type: ${visionOutput.issue_type}
Description: ${visionOutput.visual_description}
Category: ${categorizationOutput.category}
Location: lat=${location.lat}, lng=${location.lng}

EXISTING NEARBY REPORTS (within 1km):
${nearbyReports.slice(0, 5).map((r, i) => `
Report ${i + 1}:
- ID: ${r.id}
- Category: ${r.aiAnalysis?.category || "unknown"}
- Description: ${r.aiAnalysis?.visualDescription || "no description"}
- Status: ${r.status}
- Location: lat=${r.location?.lat}, lng=${r.location?.lng}
`).join("")}

STRICT DEDUPLICATION RULES:
1. Only mark as duplicate if BOTH category AND location are very similar
2. similarity_score must be >= 0.75 to set is_duplicate = true
3. Two different issue types (e.g. pothole vs waterlogging) are NEVER duplicates even if nearby
4. "MERGE_WITH_EXISTING" only if similarity_score >= 0.75
5. "LINK_AS_RELATED" if same category, different specific issue, similarity 0.4–0.74
6. "CREATE_NEW" if similarity < 0.4 or different category

Return ONLY this JSON, no markdown, no explanation:
{
  "is_duplicate": boolean,
  "matched_report_id": string or null,
  "similarity_score": number between 0 and 1,
  "nearby_report_count": number,
  "action": "CREATE_NEW" | "MERGE_WITH_EXISTING" | "LINK_AS_RELATED",
  "duplicate_reasoning": string
}`;

  const text = await callGemini(prompt);
  const cleaned = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  parsed.nearby_report_count = nearbyReports.length;
  return parsed;
}