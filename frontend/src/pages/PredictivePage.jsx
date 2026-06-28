import { useState, useEffect } from "react";
import { runPredictiveAgent } from "../agents/predictiveAgent.js";
import MapView from "../components/MapView.jsx";
import { db } from "../firebase.js";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { seedDemoData } from "../utils/seedData.js";

const THRESHOLD = 15;

export default function PredictivePage({ user, onNavigate }) {
  const [prediction, setPrediction] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { fetchReports(); }, []);

  async function fetchReports() {
    try {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(50));
      const snapshot = await getDocs(q);
      setReports(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) { console.error(err); }
  }

  async function handleRunPrediction() {
    setLoading(true);
    setError(null);
    try {
      const result = await runPredictiveAgent();
      setPrediction(result);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleSeedAndPredict() {
    setSeeding(true);
    try {
      await seedDemoData();
      await fetchReports();
      await handleRunPrediction();
    } catch (err) { console.error(err); }
    finally { setSeeding(false); }
  }

  const hasEnoughData = reports.length >= THRESHOLD;
  const progressPercent = Math.min((reports.length / THRESHOLD) * 100, 100);

  return (
    <div>
      <div className="header-band teal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>🔮 Predictive Analytics</h1>
            <p>AI-powered infrastructure risk prediction and prevention</p>
          </div>
          {hasEnoughData && (
            <button className="btn btn-lg" onClick={handleRunPrediction} disabled={loading}
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>
              {loading ? "⏳ Analyzing..." : "🔮 Run Prediction"}
            </button>
          )}
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: 0 }}>
        {prediction && (
          <div className="stats-grid mb-24">
            {[
              { label: "Reports Analyzed", value: prediction.total_reports_analyzed, icon: "📊", color: "blue" },
              { label: "Risk Hotspots", value: prediction.hotspot_count, icon: "⚠️", color: "red" },
              { label: "Monsoon Risk Areas", value: prediction.monsoon_risk_areas, icon: "🌧️", color: "amber" },
              { label: "Critical Clusters", value: prediction.critical_clusters, icon: "🚨", color: "purple" },
            ].map((stat, i) => (
              <div className="stat-card" key={i}>
                <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
                <div className="stat-info"><p>{stat.label}</p><h3>{stat.value}</h3></div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Left: Map */}
          <div>
            <div className="card mb-16">
              <div className="card-header"><h2>🗺️ Issue Map</h2></div>
              <div style={{ borderRadius: "0 0 var(--radius-lg) var(--radius-lg)", overflow: "hidden" }}>
                <MapView reports={reports} />
              </div>
            </div>

            {error && (
              <div style={{ background: "var(--danger-light)", border: "1px solid #fecaca", borderRadius: "var(--radius-lg)", padding: "16px" }}>
                <p style={{ color: "var(--danger)", fontSize: "13px" }}>❌ {error}</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: "8px" }} onClick={handleRunPrediction}>Retry</button>
              </div>
            )}

            {/* Insufficient data state */}
            {!hasEnoughData && !loading && (
              <div className="card">
                <div className="card-body" style={{ textAlign: "center", padding: "32px 24px" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>📊</div>
                  <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "8px" }}>Insufficient Data</h3>
                  <p className="text-muted mb-8" style={{ fontSize: "13px" }}>
                    Predictive analytics requires at least {THRESHOLD} reports to generate meaningful predictions.
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--teal)", fontWeight: "600", marginBottom: "16px" }}>
                    {reports.length} / {THRESHOLD} reports collected
                  </p>
                  <div style={{ background: "var(--gray-100)", borderRadius: "var(--radius-full)", height: "10px", overflow: "hidden", marginBottom: "24px" }}>
                    <div style={{ height: "100%", width: `${progressPercent}%`, background: "var(--teal)", borderRadius: "var(--radius-full)", transition: "width 0.5s" }} />
                  </div>
                  <button className="btn btn-primary btn-lg btn-full" disabled={seeding} onClick={handleSeedAndPredict}>
                    {seeding ? "⏳ Seeding data & running prediction..." : "🌱 Seed Demo Data & Run Prediction"}
                  </button>
                  <p className="text-xs text-muted" style={{ marginTop: "12px" }}>
                    This will add 15 realistic demo reports across Indian cities and immediately run the prediction.
                  </p>
                </div>
              </div>
            )}

            {/* Enough data but no prediction yet */}
            {hasEnoughData && !prediction && !loading && (
              <div className="card">
                <div className="card-body" style={{ textAlign: "center", padding: "32px 24px" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔮</div>
                  <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "8px" }}>Ready to Predict</h3>
                  <p className="text-muted mb-16" style={{ fontSize: "13px" }}>
                    {reports.length} reports available. Click to run AI prediction.
                  </p>
                  <button className="btn btn-primary btn-lg btn-full" onClick={handleRunPrediction} disabled={loading}>
                    🔮 Run AI Prediction
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="card">
                <div className="card-body" style={{ textAlign: "center", padding: "32px 24px" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>⏳</div>
                  <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "8px" }}>Analyzing {reports.length} reports...</h3>
                  <p className="text-muted" style={{ fontSize: "13px" }}>Gemini AI is identifying patterns and risk zones</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Predictions */}
          {prediction && (
            <div>
              <div className="card mb-16">
                <div className="card-header" style={{ background: "var(--teal-light)" }}>
                  <h2 style={{ color: "var(--teal)" }}>📊 AI Insights</h2>
                </div>
                <div className="card-body">
                  <p className="text-sm" style={{ lineHeight: "1.7", color: "var(--gray-600)" }}>{prediction.weekly_insights}</p>
                </div>
              </div>

              {prediction.risk_zones?.length > 0 && (
                <div className="card mb-16">
                  <div className="card-header"><h2>⚠️ Predicted Risk Zones</h2></div>
                  <div className="card-body" style={{ padding: "12px" }}>
                    {prediction.risk_zones.map((zone, i) => (
                      <div key={i} style={{
                        padding: "14px", borderRadius: "var(--radius-md)", marginBottom: "8px",
                        borderLeft: `4px solid ${zone.risk_score > 0.7 ? "#ef4444" : zone.risk_score > 0.4 ? "#f59e0b" : "#22c55e"}`,
                        background: "var(--gray-50)"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <p style={{ fontWeight: "600", fontSize: "14px" }}>{zone.predicted_category}</p>
                          <span className={`badge ${zone.risk_score > 0.7 ? "badge-critical" : "badge-medium"}`}>
                            {Math.round(zone.risk_score * 100)}% risk
                          </span>
                        </div>
                        <p className="text-sm text-muted mb-8">{zone.reasoning}</p>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          <span className="text-xs text-muted">⏱️ {zone.time_to_failure_days} days</span>
                          <span className="text-xs text-muted">🎯 {Math.round(zone.confidence * 100)}% confident</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {prediction.prevention_actions?.length > 0 && (
                <div className="card">
                  <div className="card-header"><h2>🛡️ Prevention Actions</h2></div>
                  <div className="card-body">
                    {prediction.prevention_actions.map((action, i) => (
                      <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "12px", alignItems: "flex-start" }}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--teal)", color: "#fff", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                        <p className="text-sm" style={{ color: "var(--gray-600)", lineHeight: "1.6" }}>{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right placeholder when no prediction */}
          {!prediction && (
            <div className="card">
              <div className="card-body" style={{ textAlign: "center", padding: "48px 24px" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.3 }}>🔮</div>
                <p className="text-muted" style={{ fontSize: "13px" }}>Prediction results will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
