import { useState, useEffect } from "react";
import { db } from "../firebase.js";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import MapView from "../components/MapView.jsx";
import VerifyIssue from "../components/VerifyIssue.jsx";

export default function HomePage({ user, userRole, userDepartment, userState, userDistrict, onNavigate }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("map");

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(50));
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      if (userRole === "AUTHORITY" && userState && userDistrict) {
        data = data.filter(r =>
          r.location?.state === userState &&
          r.location?.district === userDistrict
        );
      }
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    { label: "Total Reports", value: reports.length, icon: "📊", color: "blue" },
    { label: "Critical Issues", value: reports.filter(r => r.aiAnalysis?.urgency === "CRITICAL").length, icon: "🚨", color: "red" },
    { label: "Resolved", value: reports.filter(r => r.status === "RESOLVED").length, icon: "✅", color: "green" },
    { label: "In Progress", value: reports.filter(r => r.status === "IN_PROGRESS").length, icon: "⚙️", color: "amber" },
  ];

  const urgencyBadge = { LOW: "badge-low", MEDIUM: "badge-medium", HIGH: "badge-high", CRITICAL: "badge-critical" };
  const statusBadge = { VERIFIED: "badge-verified", RESOLVED: "badge-resolved", IN_PROGRESS: "badge-in-progress", ASSIGNED: "badge-assigned" };
  const cardBorder = { LOW: "low", MEDIUM: "medium", HIGH: "high", CRITICAL: "critical" };

  return (
    <div>
      {/* Header Band */}
      <div className="header-band blue">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>Community Dashboard</h1>
            <p>Welcome back, {user.displayName?.split(" ")[0]} — here's what's happening in your city</p>
          </div>
          <button
            onClick={() => onNavigate("report")}
            className="btn btn-lg"
            style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", backdropFilter: "blur(4px)" }}
          >
            📷 Report Issue
          </button>
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: 0 }}>
        {/* Stats */}
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div className="stat-card" key={i}>
              <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
              <div className="stat-info">
                <p>{stat.label}</p>
                <h3>{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${activeTab === "map" ? "active" : ""}`} onClick={() => setActiveTab("map")}>🗺️ Map View</button>
          <button className={`tab-btn ${activeTab === "list" ? "active" : ""}`} onClick={() => setActiveTab("list")}>📋 List View</button>
        </div>

        {/* Map View */}
        {activeTab === "map" && (
          <div>
            <div className="map-container" style={{ marginBottom: "16px" }}>
              <MapView reports={reports} />
            </div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {[
                { color: "#ef4444", label: "Critical" },
                { color: "#f97316", label: "High" },
                { color: "#f59e0b", label: "Medium" },
                { color: "#22c55e", label: "Low" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: item.color }} />
                  <span className="text-sm text-muted">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {activeTab === "list" && (
          <div>
            {loading && <p className="text-muted text-center" style={{ padding: "48px" }}>Loading reports...</p>}
            {!loading && reports.length === 0 && (
              <div style={{ textAlign: "center", padding: "64px 24px" }}>
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>🗺️</div>
                <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>No reports yet</h3>
                <p className="text-muted">Be the first to report a civic issue in your area</p>
                <button className="btn btn-primary mt-16" onClick={() => onNavigate("report")}>📷 Report First Issue</button>
              </div>
            )}
            {reports.map((report) => (
              <div key={report.id} className={`report-card ${cardBorder[report.aiAnalysis?.urgency] || ""}`}>
                {report.imageThumbUrl && (
                  report.mediaType === "video" ? (
                    <video
                      src={report.imageThumbUrl}
                      className="report-thumb"
                      style={{ objectFit: "cover" }}
                      muted
                      playsInline
                      controls
                      onMouseEnter={e => e.target.play()}
                      onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                    />
                  ) : (
                    <img src={report.imageThumbUrl} className="report-thumb" alt="issue" />
                  )
                )}
                <div className="report-info">
                  <div className="flex justify-between items-center gap-8 mb-8">
                    <p className="report-title">{report.aiAnalysis?.citizenTitle || "Civic Issue"}</p>
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <span className={`badge ${urgencyBadge[report.aiAnalysis?.urgency] || "badge-pending"}`}>
                        {report.aiAnalysis?.urgency}
                      </span>
                      <span className={`badge ${statusBadge[report.status] || "badge-pending"}`}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                  <p className="report-desc">{report.aiAnalysis?.citizenDescription?.slice(0, 100)}...</p>
                  <div className="report-meta">
                    <span className="text-xs text-muted">📍 {report.location?.address || `${report.location?.district}, ${report.location?.state}`}</span>
                    <span className="text-xs text-muted">·</span>
                    <span className="text-xs text-muted">🏢 {report.aiAnalysis?.department?.slice(0, 30)}</span>
                    <span className="text-xs text-muted">·</span>
                    <span className="text-xs text-muted">Severity: {report.aiAnalysis?.severity}/10</span>
                    <span className="text-xs text-muted">·</span>
                    <span className="text-xs text-muted">₹{report.aiAnalysis?.estimatedCostInr?.toLocaleString()}</span>
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <VerifyIssue report={report} user={user} onVerified={fetchReports} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
