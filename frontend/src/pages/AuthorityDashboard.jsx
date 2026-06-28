import { useState, useEffect } from "react";
import { db } from "../firebase.js";
import { collection, query, orderBy, getDocs, updateDoc, doc } from "firebase/firestore";
import { seedDemoData } from "../utils/seedData.js";

export default function AuthorityDashboard({ user, userRole, userDepartment, userState, userDistrict, onNavigate }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [comment, setComment] = useState("");
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => { fetchReports(); }, []);
  useEffect(() => {
    async function autoVerifyThreshold() {
      const toVerify = reports.filter(r =>
        r.status === "ASSIGNED" && (r.verificationCount || 0) >= 3
      );
      for (const report of toVerify) {
        await updateDoc(doc(db, "reports", report.id), { status: "VERIFIED" });
      }
      if (toVerify.length > 0) fetchReports();
    }
    if (reports.length > 0) autoVerifyThreshold();
  }, [reports]);

  async function fetchReports() {
    try {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setReports(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function updateStatus(reportId, status) {
    setUpdating(true);
    try {
      await updateDoc(doc(db, "reports", reportId), { status, authorityComment: comment, updatedAt: new Date() });
      await fetchReports();
      setSelectedReport(null);
      setComment("");
    } catch (err) { console.error(err); }
    finally { setUpdating(false); }
  }

  const urgencyBadge = { LOW: "badge-low", MEDIUM: "badge-medium", HIGH: "badge-high", CRITICAL: "badge-critical" };
  const statusBadge = { VERIFIED: "badge-verified", RESOLVED: "badge-resolved", IN_PROGRESS: "badge-in-progress", ASSIGNED: "badge-assigned" };
  const cardBorder = { LOW: "low", MEDIUM: "medium", HIGH: "high", CRITICAL: "critical" };
  const departmentFiltered = userDepartment === "ALL" || !userDepartment
    ? reports
    : reports.filter(r => r.aiAnalysis?.category === userDepartment);

  const stateFiltered = userRole === "SUPER_ADMIN" || !userState
    ? departmentFiltered
    : userDistrict
      ? departmentFiltered.filter(r => r.location?.state === userState && r.location?.district === userDistrict)
      : departmentFiltered.filter(r => r.location?.state === userState);

  const filtered = filterStatus === "ALL"
    ? stateFiltered
    : stateFiltered.filter(r => r.status === filterStatus);

  const stats = [
    { label: "Total Issues", value: stateFiltered.length, icon: "📊", color: "blue" },
    { label: "Critical", value: stateFiltered.filter(r => r.aiAnalysis?.urgency === "CRITICAL").length, icon: "🚨", color: "red" },
    { label: "In Progress", value: stateFiltered.filter(r => r.status === "IN_PROGRESS").length, icon: "⚙️", color: "amber" },
    { label: "Resolved", value: stateFiltered.filter(r => r.status === "RESOLVED").length, icon: "✅", color: "green" },
  ];

  return (
    <div>
      <div className="header-band purple">
        <h1>🏛️ Authority Dashboard</h1>
        <p>Municipal issue management and resolution tracking</p>
        <button
          className="btn btn-lg"
          style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", marginTop: "12px" }}
          onClick={async () => {
            const count = await seedDemoData();
            alert(`✅ Seeded ${count} demo reports!`);
            fetchReports();
          }}
        >
          🌱 Seed Demo Data
        </button>
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

        {/* Filter Tabs */}
        <div className="tabs">
          {["ALL", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"].map((status) => (
            <button key={status} className={`tab-btn ${filterStatus === status ? "active" : ""}`} onClick={() => setFilterStatus(status)}>
              {status}
            </button>
          ))}
        </div>

        {/* Reports */}
        {loading && <p className="text-muted text-center" style={{ padding: "48px" }}>Loading...</p>}

        {filtered.map((report) => (
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
                />
              ) : (
                <img src={report.imageThumbUrl} className="report-thumb" alt="issue" />
              )
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
              <div className="report-meta mb-8">
                <span className="text-xs text-muted">📍 {report.location?.address || "Location not found"}</span>
                <span className="text-xs text-muted">·</span>
                <span className="text-xs text-muted">🏢 {report.aiAnalysis?.department?.slice(0, 30)}</span>
                <span className="text-xs text-muted">·</span>
                <span className="text-xs text-muted">{report.aiAnalysis?.priority}</span>
                <span className="text-xs text-muted">·</span>
                <span className="text-xs text-muted">₹{report.aiAnalysis?.estimatedCostInr?.toLocaleString()}</span>
                <span className="text-xs text-muted">·</span>
                <span className="text-xs text-muted">👍 {report.upvotes || 0} upvotes</span>
                <span className="text-xs text-muted">·</span>
                <span className="text-xs text-muted">👥 {report.verificationCount || 0} verified</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedReport(report)}>📋 Details</button>
                {report.status !== "RESOLVED" && report.status !== "CLOSED" && (
                  <>
                    <button className="btn btn-warning btn-sm" onClick={() => updateStatus(report.id, "IN_PROGRESS")}>⚙️ Start</button>
                    <button className="btn btn-success btn-sm" onClick={() => updateStatus(report.id, "RESOLVED")}>✅ Resolve</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedReport.aiAnalysis?.citizenTitle}</h3>
              <button className="modal-close" onClick={() => setSelectedReport(null)}>×</button>
            </div>
            <div className="modal-body">
              {selectedReport.mediaType === "video" ? (
                <video
                  src={selectedReport.imageUrl}
                  style={{ width: "100%", borderRadius: "var(--radius-md)", maxHeight: "220px", objectFit: "cover", marginBottom: "16px" }}
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={selectedReport.imageUrl}
                  style={{ width: "100%", borderRadius: "var(--radius-md)", maxHeight: "220px", objectFit: "cover", marginBottom: "16px" }}
                  alt="issue"
                />
              )}
              <p className="text-sm text-muted mb-16">{selectedReport.aiAnalysis?.citizenDescription}</p>

              <div className="grid-2 mb-16">
                {[
                  { label: "Severity", value: `${selectedReport.aiAnalysis?.severity}/10` },
                  { label: "Priority", value: selectedReport.aiAnalysis?.priority },
                  { label: "SLA", value: `${selectedReport.aiAnalysis?.slaHours}hrs` },
                  { label: "Est. Cost", value: `₹${selectedReport.aiAnalysis?.estimatedCostInr?.toLocaleString()}` },
                ].map((item, i) => (
                  <div key={i} style={{ background: "var(--gray-50)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
                    <p className="text-xs text-muted">{item.label}</p>
                    <p style={{ fontWeight: "600", fontSize: "14px", marginTop: "2px" }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {selectedReport.routing?.actionLetter && (
                <div style={{ background: "var(--primary-light)", borderRadius: "var(--radius-md)", padding: "14px", marginBottom: "16px" }}>
                  <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--primary)", marginBottom: "6px" }}>📄 Action Letter</p>
                  <p className="text-sm" style={{ color: "#1e40af", lineHeight: "1.6" }}>{selectedReport.routing.actionLetter.slice(0, 400)}...</p>
                </div>
              )}

              <textarea
                placeholder="Add resolution comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="form-input"
                style={{ minHeight: "80px", marginBottom: "12px" }}
              />

              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-warning" style={{ flex: 1 }} onClick={() => updateStatus(selectedReport.id, "IN_PROGRESS")} disabled={updating}>⚙️ In Progress</button>
                <button className="btn btn-success" style={{ flex: 1 }} onClick={() => updateStatus(selectedReport.id, "RESOLVED")} disabled={updating}>✅ Resolved</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
