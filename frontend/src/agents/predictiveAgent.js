import { callGemini } from "../utils/geminiClient.js";
import { db } from "../firebase.js";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export async function runPredictiveAgent() {
  // Fetch last 15 reports from Firestore
  const q = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(50));
  const snapshot = await getDocs(q);
  const reports = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  if (reports.length < 15) {
    return { risk_zones: [], insights: "Not enough data yet for predictions.", prevention_actions: [] };
  }

  const reportSummary = reports.map((r) => ({
    category: r.aiAnalysis?.category,
    severity: r.aiAnalysis?.severity,
    urgency: r.aiAnalysis?.urgency,
    lat: r.location?.lat,
    lng: r.location?.lng,
    status: r.status,
    createdAt: r.createdAt?.seconds,
  }));

  const prompt = `You are an expert urban infrastructure predictive analytics specialist with deep knowledge of Indian municipal systems, seasonal patterns, monsoon impacts, and infrastructure failure clusters in Indian cities.

Analyze this dataset of ${reports.length} real civic issue reports from a community:
${JSON.stringify(reportSummary, null, 2)}

Your job is to:
1. Identify geographic clusters of issues (hotspots)
2. Predict which areas are likely to develop NEW issues in the next 30 days
3. Identify seasonal patterns (especially monsoon risks)
4. Generate actionable prevention recommendations for municipal authorities

Consider:
- Repeated issues in same area = infrastructure failure cluster
- Road damage + drainage issues nearby = monsoon risk zone
- Unresolved critical issues = escalation risk
- Category patterns = systemic infrastructure weakness

Return ONLY this JSON, no markdown, no explanation:
{
  "risk_zones": [
    {
      "lat": number,
      "lng": number,
      "radius_meters": number,
      "risk_score": number between 0 and 1,
      "predicted_category": string,
      "confidence": number between 0 and 1,
      "reasoning": string,
      "time_to_failure_days": number
    }
  ],
  "weekly_insights": string,
  "total_reports_analyzed": number,
  "hotspot_count": number,
  "prevention_actions": string[],
  "monsoon_risk_areas": number,
  "critical_clusters": number
}

risk_zones: max 5 most critical predicted zones
weekly_insights: 3-4 sentence summary for authority dashboard
prevention_actions: 3-5 specific actionable steps authorities should take now`;

  const text = await callGemini(prompt);
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}