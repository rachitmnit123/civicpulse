import { useState, useEffect, useRef } from "react";
import { db } from "../firebase.js";
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { getLevelFromXp, LEVELS, BADGES, RARITY_COLORS, CIVIC_DNA_CATEGORIES, getCivicDnaScore } from "../services/gamificationService.js";

export default function RewardsPage({ user, onNavigate }) {
  const [userData, setUserData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassport, setShowPassport] = useState(false);
  const passportRef = useRef();

  useEffect(() => {
    async function fetchData() {
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) setUserData(userSnap.data());
        const q = query(collection(db, "users"), orderBy("gamification.xp", "desc"), limit(10));
        const snapshot = await getDocs(q);
        setLeaderboard(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [user.uid]);

  if (loading) return <div style={{ textAlign: "center", padding: "64px" }} className="text-muted">Loading...</div>;

  const xp = userData?.gamification?.xp || 0;
  const level = getLevelFromXp(xp);
  const nextLevel = LEVELS.find((l) => l.level === level.level + 1);
  const progress = nextLevel ? ((xp - level.minXp) / (nextLevel.minXp - level.minXp)) * 100 : 100;
  const earnedBadges = userData?.gamification?.badges || [];
  const civicDna = getCivicDnaScore(userData?.gamification?.categoryCount);
  const impactScore = userData?.gamification?.impactScore || 0;

  // Group badges by category
  const badgeGroups = {
    reporter: { label: "🦅 Reporter", badges: BADGES.filter(b => b.category === "reporter") },
    verifier: { label: "👁️ Verifier", badges: BADGES.filter(b => b.category === "verifier") },
    expert: { label: "🎯 Category Expert", badges: BADGES.filter(b => b.category === "expert") },
    impact: { label: "🔥 Impact", badges: BADGES.filter(b => b.category === "impact") },
    special: { label: "⭐ Special", badges: BADGES.filter(b => b.category === "special") },
  };

  // Civic DNA Radar Chart (SVG)
  function CivicDnaChart({ dna }) {
    const size = 200;
    const center = size / 2;
    const maxRadius = 80;
    const n = dna.length;

    const points = dna.map((d, i) => {
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
      const r = (d.score / 100) * maxRadius;
      return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
    });

    const gridPoints = (r) => dna.map((_, i) => {
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(" ");

    const polyPoints = points.map(p => `${p.x},${p.y}`).join(" ");

    const labelPoints = dna.map((d, i) => {
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
      const r = maxRadius + 20;
      return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle), label: d.label, icon: d.icon };
    });

    return (
      <svg width={size + 60} height={size + 60} viewBox={`-30 -30 ${size + 60} ${size + 60}`}>
        {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <polygon key={i} points={gridPoints(maxRadius * ratio)}
            fill="none" stroke="var(--gray-200)" strokeWidth="1" />
        ))}
        {dna.map((_, i) => {
          const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
          return <line key={i} x1={center} y1={center}
            x2={center + maxRadius * Math.cos(angle)}
            y2={center + maxRadius * Math.sin(angle)}
            stroke="var(--gray-200)" strokeWidth="1" />;
        })}
        <polygon points={polyPoints} fill="rgba(37,99,235,0.15)" stroke="var(--primary)" strokeWidth="2" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={dna[i].color} />
        ))}
        {labelPoints.map((p, i) => (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fill="var(--gray-600)">{p.icon}</text>
        ))}
      </svg>
    );
  }

  return (
    <div>
      <div className="header-band amber">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>🏆 Rewards & Leaderboard</h1>
            <p>Your civic contribution score and community ranking</p>
          </div>
          <button className="btn btn-lg"
            style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
            onClick={() => setShowPassport(true)}>
            📜 My Civic Passport
          </button>
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: 0 }}>
        {/* Stats */}
        <div className="stats-grid mb-24">
          {[
            { label: "Total XP", value: xp, icon: "⭐", color: "amber" },
            { label: "Level", value: `${level.level} · ${level.icon}`, icon: "🎯", color: "purple" },
            { label: "Impact Score", value: impactScore, icon: "🌍", color: "green" },
            { label: "Badges Earned", value: earnedBadges.length, icon: "🏅", color: "blue" },
          ].map((stat, i) => (
            <div className="stat-card" key={i}>
              <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
              <div className="stat-info"><p>{stat.label}</p><h3>{stat.value}</h3></div>
            </div>
          ))}
        </div>

        <div className="tabs">
          <button className={`tab-btn ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>👤 Profile</button>
          <button className={`tab-btn ${activeTab === "badges" ? "active" : ""}`} onClick={() => setActiveTab("badges")}>🏅 Badges</button>
          <button className={`tab-btn ${activeTab === "dna" ? "active" : ""}`} onClick={() => setActiveTab("dna")}>🧬 Civic DNA</button>
          <button className={`tab-btn ${activeTab === "leaderboard" ? "active" : ""}`} onClick={() => setActiveTab("leaderboard")}>🏆 Leaderboard</button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div className="card">
              <div className="card-body" style={{ textAlign: "center", padding: "32px 24px" }}>
                <div style={{ fontSize: "64px", marginBottom: "12px" }}>{level.icon}</div>
                <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "4px" }}>{level.title}</h2>
                <p className="text-sm text-muted mb-16">Level {level.level}</p>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span className="text-xs text-muted">{xp} XP</span>
                    <span className="text-xs text-muted">{nextLevel ? `${nextLevel.minXp} XP` : "Max Level"}</span>
                  </div>
                  <div style={{ height: "10px", background: "var(--gray-100)", borderRadius: "5px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "var(--amber)", borderRadius: "5px", transition: "width 0.5s" }} />
                  </div>
                </div>
                {nextLevel && <p className="text-xs text-muted mb-16">{nextLevel.minXp - xp} XP to {nextLevel.title}</p>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "16px" }}>
                  {[
                    { label: "Reports", value: userData?.gamification?.reportsSubmitted || 0 },
                    { label: "Verified", value: userData?.gamification?.verificationsGiven || 0 },
                    { label: "Resolved", value: userData?.gamification?.resolvedCount || 0 },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "var(--gray-50)", borderRadius: "var(--radius-md)", padding: "10px" }}>
                      <p style={{ fontSize: "18px", fontWeight: "700" }}>{s.value}</p>
                      <p className="text-xs text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent badges */}
            <div className="card">
              <div className="card-header"><h2>🏅 Recent Badges</h2></div>
              <div className="card-body">
                {earnedBadges.length === 0 && <p className="text-sm text-muted">No badges yet. Start reporting!</p>}
                {earnedBadges.slice(-6).map(badgeId => {
                  const badge = BADGES.find(b => b.id === badgeId);
                  if (!badge) return null;
                  const rarity = RARITY_COLORS[badge.rarity];
                  return (
                    <div key={badgeId} style={{
                      display: "flex", alignItems: "center", gap: "12px", padding: "10px",
                      borderRadius: "var(--radius-md)", marginBottom: "8px",
                      background: rarity.bg, border: `1px solid ${rarity.border}`
                    }}>
                      <span style={{ fontSize: "24px" }}>{badge.icon}</span>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: "600", color: rarity.text }}>{badge.title}</p>
                        <p className="text-xs text-muted">{badge.description}</p>
                      </div>
                      <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: "600", color: rarity.text, textTransform: "capitalize" }}>{badge.rarity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === "badges" && (
          <div>
            {Object.entries(badgeGroups).map(([key, group]) => (
              <div className="card mb-16" key={key}>
                <div className="card-header"><h2>{group.label}</h2></div>
                <div className="card-body">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
                    {group.badges.map(badge => {
                      const earned = earnedBadges.includes(badge.id);
                      const rarity = RARITY_COLORS[badge.rarity];
                      return (
                        <div key={badge.id} style={{
                          padding: "14px", borderRadius: "var(--radius-md)", textAlign: "center",
                          background: earned ? rarity.bg : "var(--gray-50)",
                          border: `1px solid ${earned ? rarity.border : "var(--gray-200)"}`,
                          opacity: earned ? 1 : 0.45, transition: "all 0.2s",
                          position: "relative"
                        }}>
                          {earned && <div style={{ position: "absolute", top: "6px", right: "6px", fontSize: "10px", fontWeight: "700", color: rarity.text, textTransform: "uppercase" }}>{badge.rarity}</div>}
                          <div style={{ fontSize: "28px", marginBottom: "6px" }}>{badge.icon}</div>
                          <p style={{ fontSize: "13px", fontWeight: "600", color: earned ? rarity.text : "var(--gray-500)" }}>{badge.title}</p>
                          <p className="text-xs text-muted" style={{ marginTop: "4px" }}>{badge.description}</p>
                          {!earned && <p style={{ fontSize: "11px", color: "var(--gray-400)", marginTop: "6px" }}>🔒 Locked</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Civic DNA Tab */}
        {activeTab === "dna" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div className="card">
              <div className="card-header"><h2>🧬 Your Civic DNA</h2></div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <CivicDnaChart dna={civicDna} />
                <p className="text-sm text-muted" style={{ textAlign: "center", marginTop: "8px" }}>
                  Your unique civic contribution fingerprint
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h2>📊 Category Breakdown</h2></div>
              <div className="card-body">
                {civicDna.map((cat, i) => (
                  <div key={i} style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "500" }}>{cat.icon} {cat.label}</span>
                      <span className="text-xs text-muted">{cat.count} reports</span>
                    </div>
                    <div style={{ height: "8px", background: "var(--gray-100)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${cat.score}%`, background: cat.color, borderRadius: "4px", transition: "width 0.5s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <div className="card">
            <div className="card-header"><h2>🏅 Top Citizens</h2></div>
            <div className="card-body" style={{ padding: "8px" }}>
              {leaderboard.map((u, i) => (
                <div key={u.id} style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "12px 16px", borderRadius: "var(--radius-md)",
                  background: u.id === user.uid ? "var(--primary-light)" : "transparent",
                  border: u.id === user.uid ? "1px solid #bfdbfe" : "1px solid transparent",
                  marginBottom: "4px"
                }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px", flexShrink: 0, background: i === 0 ? "#fde68a" : i === 1 ? "var(--gray-200)" : i === 2 ? "#fed7aa" : "var(--gray-100)" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </div>
                  <img src={u.photoURL || "https://via.placeholder.com/36"} width="36" height="36" style={{ borderRadius: "50%", objectFit: "cover" }} alt="avatar" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "600", fontSize: "14px" }}>{u.displayName} {u.id === user.uid ? "(You)" : ""}</p>
                    <p className="text-xs text-muted">{getLevelFromXp(u.gamification?.xp || 0).title} · {u.gamification?.badges?.length || 0} badges</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "18px", fontWeight: "700", color: "var(--amber)" }}>{u.gamification?.xp || 0}</p>
                    <p className="text-xs text-muted">XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Civic Passport Modal */}
      {showPassport && (
        <div className="modal-overlay" onClick={() => setShowPassport(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} ref={passportRef}>
            <div className="modal-header">
              <h3>📜 Civic Passport</h3>
              <button className="modal-close" onClick={() => setShowPassport(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)", borderRadius: "var(--radius-lg)", padding: "24px", color: "#fff", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                  <img src={user.photoURL} width="60" height="60" style={{ borderRadius: "50%", border: "3px solid rgba(255,255,255,0.3)" }} alt="avatar" />
                  <div>
                    <h2 style={{ fontSize: "20px", fontWeight: "700" }}>{user.displayName}</h2>
                    <p style={{ opacity: 0.8, fontSize: "13px" }}>{level.icon} {level.title} · Level {level.level}</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                  {[
                    { label: "Total XP", value: xp },
                    { label: "Reports", value: userData?.gamification?.reportsSubmitted || 0 },
                    { label: "Impact", value: impactScore },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.15)", borderRadius: "var(--radius-md)", padding: "12px", textAlign: "center" }}>
                      <p style={{ fontSize: "22px", fontWeight: "700" }}>{s.value}</p>
                      <p style={{ fontSize: "11px", opacity: 0.8 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: "12px", opacity: 0.7, marginBottom: "8px" }}>Top Badges</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {earnedBadges.slice(0, 6).map(badgeId => {
                      const badge = BADGES.find(b => b.id === badgeId);
                      return badge ? (
                        <div key={badgeId} style={{ background: "rgba(255,255,255,0.2)", borderRadius: "var(--radius-sm)", padding: "4px 10px", fontSize: "13px" }}>
                          {badge.icon} {badge.title}
                        </div>
                      ) : null;
                    })}
                    {earnedBadges.length === 0 && <p style={{ fontSize: "13px", opacity: 0.6 }}>No badges yet</p>}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted text-center">Share your civic contribution with your community!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
