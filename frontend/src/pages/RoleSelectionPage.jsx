import { useState } from "react";
import { db } from "../firebase.js";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { INDIA_STATES_AND_DISTRICTS, ISSUE_CATEGORIES } from "../config/indiaGeo.js";

const AUTHORITY_SECRET = "AUTH@2026";
const SUPER_ADMIN_SECRET = "SUPER@2026";

export default function RoleSelectionPage({ user, onRoleSelected }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [secretCode, setSecretCode] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const states = Object.keys(INDIA_STATES_AND_DISTRICTS);
  const districts = selectedState ? INDIA_STATES_AND_DISTRICTS[selectedState] : [];

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      if (selectedRole === "CITIZEN") {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid, displayName: user.displayName, email: user.email,
          photoURL: user.photoURL, role: "CITIZEN", department: null,
          state: null, district: null,
          gamification: { xp: 0, level: 1, badges: [], reportsSubmitted: 0, verificationsGiven: 0, resolvedCount: 0 },
          createdAt: serverTimestamp(),
        });
        onRoleSelected("CITIZEN", null, null, null);

      } else if (selectedRole === "SUPER_ADMIN") {
        if (secretCode !== SUPER_ADMIN_SECRET) { setError("❌ Invalid Super Admin code."); setLoading(false); return; }
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid, displayName: user.displayName, email: user.email,
          photoURL: user.photoURL, role: "SUPER_ADMIN", department: "ALL",
          state: null, district: null,
          gamification: { xp: 0, level: 1, badges: [], reportsSubmitted: 0, verificationsGiven: 0, resolvedCount: 0 },
          createdAt: serverTimestamp(),
        });
        onRoleSelected("SUPER_ADMIN", "ALL", null, null);

      } else if (selectedRole === "AUTHORITY") {
        if (secretCode !== AUTHORITY_SECRET) { setError("❌ Invalid Authority code."); setLoading(false); return; }
        if (!selectedState || !selectedDistrict || !selectedDepartment) { setError("❌ Please select state, district and department."); setLoading(false); return; }
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid, displayName: user.displayName, email: user.email,
          photoURL: user.photoURL, role: "AUTHORITY", department: selectedDepartment,
          state: selectedState, district: selectedDistrict,
          jurisdiction: `${selectedDistrict}, ${selectedState}`,
          gamification: { xp: 0, level: 1, badges: [], reportsSubmitted: 0, verificationsGiven: 0, resolvedCount: 0 },
          createdAt: serverTimestamp(),
        });
        onRoleSelected("AUTHORITY", selectedDepartment, selectedState, selectedDistrict);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏙️</div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--gray-900)", marginBottom: "8px" }}>Welcome to CivicPulse</h1>
          <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>Hello {user.displayName}! Please select your role to continue.</p>
        </div>

        {!selectedRole && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { role: "CITIZEN", icon: "👤", title: "Citizen", desc: "Report civic issues, track resolutions, earn rewards", color: "var(--primary)", bg: "var(--primary-light)" },
              { role: "AUTHORITY", icon: "🏛️", title: "Authority / Department", desc: "Manage and resolve civic issues for your district", color: "var(--purple)", bg: "var(--purple-light)" },
              { role: "SUPER_ADMIN", icon: "⭐", title: "Super Admin", desc: "Full access to all reports across India", color: "var(--amber)", bg: "var(--amber-light)" },
            ].map((item) => (
              <button key={item.role}
                onClick={() => {
                  setSelectedRole(item.role);
                  if (item.role === "SUPER_ADMIN") setSecretCode("SUPER@2026");
                  if (item.role === "AUTHORITY") setSecretCode("AUTH@2026");
                  if (item.role === "CITIZEN") setSecretCode("");
                }}
                style={{ background: "#fff", border: "2px solid var(--gray-200)", borderRadius: "var(--radius-lg)", padding: "20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px", textAlign: "left", transition: "all 0.15s", boxShadow: "var(--shadow-sm)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = item.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--gray-200)"}
              >
                <div style={{ width: "52px", height: "52px", borderRadius: "var(--radius-md)", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ fontWeight: "700", fontSize: "16px", color: "var(--gray-900)", marginBottom: "4px" }}>{item.title}</p>
                  <p style={{ fontSize: "13px", color: "var(--gray-500)" }}>{item.desc}</p>
                </div>
                <span style={{ marginLeft: "auto", color: "var(--gray-400)", fontSize: "20px" }}>→</span>
              </button>
            ))}
          </div>
        )}

        {selectedRole === "CITIZEN" && (
          <div className="card">
            <div className="card-header"><h2>👤 Continue as Citizen</h2></div>
            <div className="card-body">
              <p className="text-sm text-muted" style={{ marginBottom: "20px" }}>
                You'll be able to report civic issues, track their resolution, verify other reports, and earn XP rewards.
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setSelectedRole(null)}>← Back</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={loading}>
                  {loading ? "Setting up..." : "✅ Continue as Citizen"}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedRole === "SUPER_ADMIN" && (
          <div className="card">
            <div className="card-header"><h2>⭐ Super Admin Access</h2></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Super Admin Secret Code</label>
                <input type="text" className="form-input" value={secretCode} onChange={e => setSecretCode(e.target.value)} />
              </div>
              {error && <p style={{ color: "var(--danger)", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setSelectedRole(null); setError(""); setSecretCode(""); }}>← Back</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={loading}>
                  {loading ? "Verifying..." : "⭐ Continue as Super Admin"}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedRole === "AUTHORITY" && (
          <div className="card">
            <div className="card-header"><h2>🏛️ Authority Access</h2></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Authority Secret Code</label>
                <input type="text" className="form-input" value={secretCode} onChange={e => setSecretCode(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <select className="form-input" value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedDistrict(""); }}>
                  <option value="">Select State</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">District</label>
                <select className="form-input" value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} disabled={!selectedState}>
                  <option value="">Select District</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-input" value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
                  <option value="">Select Department</option>
                  {ISSUE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label} — {c.department}</option>
                  ))}
                </select>
              </div>
              {error && <p style={{ color: "var(--danger)", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setSelectedRole(null); setError(""); setSecretCode(""); }}>← Back</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={loading}>
                  {loading ? "Setting up..." : "🏛️ Continue as Authority"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
