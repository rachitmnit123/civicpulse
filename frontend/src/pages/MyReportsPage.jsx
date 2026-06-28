import { useState, useEffect } from "react";
import { db } from "../firebase.js";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function MyReportsPage({ user, onNavigate }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyReports() {
      try {
        const q = query(
          collection(db, "reports"),
          where("reporterId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        setReports(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyReports();
  }, [user.uid]);

  const urgencyBadge = { LOW: "badge-low", MEDIUM: "badge-medium", HIGH: "badge-high", CRITICAL: "badge-critical" };
  const statusBadge = { VERIFIED: "badge-verified", RESOLVED: "badge-resolved", IN_PROGRESS: "badge-in-progress", ASSIGNED: "badge-assigned" };
  const cardBorder = { LOW: "low", MEDIUM: "medium", HIGH: "high", CRITICAL: "critical" };

  const stats = [
    { label: "Submitted", value: reports.length, icon: "📷", color: "blue" },
    { label: "Resolved", value: reports.filter(r => r.status === "RESOLVED").length, icon: "✅", color: "green" },
    { label: "In Progress", value: reports.filter(r => r.status === "IN_PROGRESS").length, icon: "⚙️", color: "amber" },
    { label: "Critical", value: reports.filter(r => r.aiAnalysis?.urgency === "CRITICAL").length, icon: "🚨", color: "red" },
  ];

  return (
    <div>
      <div className="header-band blue">
        <h1>📋 My Reports</h1>
        <p>Track all your submitted civic issues and their resolution status</p>
      </div>

      <div className="page-container" style={{ paddingTop: 0 }}>
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

        {loading && <p className="text-muted text-center" style={{ padding: "48px" }}>Loading...</p>}

        {!loading && reports.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 24px" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>📭</div>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>No reports yet</h3>
            <p className="text-muted mb-16">Start contributing to your community</p>
            <button className="btn btn-primary" onClick={() => onNavigate("report")}>📷 Submit First Report</button>
          </div>
        )}

        {reports.map((report) => (
          <div key={report.id} className={`report-card ${cardBorder[report.aiAnalysis?.urgency] || ""}`}>
            {report.mediaType === "video" ? (
              <video src={report.imageUrl} className="report-thumb" style={{ objectFit: "cover" }} muted playsInline controls />
            ) : (
              report.imageThumbUrl && <img src={report.imageThumbUrl} className="report-thumb" alt="issue" />
            )}
            <div className="report-info">
              <div className="flex justify-between items-center gap-8 mb-8">
                <p className="report-title">{report.aiAnalysis?.citizenTitle || "Civic Issue"}</p>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <span className={`badge ${urgencyBadge[report.aiAnalysis?.urgency] || "badge-pending"}`}>{report.aiAnalysis?.urgency}</span>
                  <span className={`badge ${statusBadge[report.status] || "badge-pending"}`}>{report.status}</span>
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
