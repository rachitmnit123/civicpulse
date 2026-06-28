import { useState, useEffect } from "react";
import { onAuthChange, signOutUser } from "./services/authService.js";
import { db } from "./firebase.js";
import { doc, getDoc } from "firebase/firestore";
import LandingPage from "./pages/LandingPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ReportPage from "./pages/ReportPage.jsx";
import MyReportsPage from "./pages/MyReportsPage.jsx";
import AuthorityDashboard from "./pages/AuthorityDashboard.jsx";
import RewardsPage from "./pages/RewardsPage.jsx";
import PredictivePage from "./pages/PredictivePage.jsx";
import RoleSelectionPage from "./pages/RoleSelectionPage.jsx";
import { CITIZEN_NAV, AUTHORITY_NAV } from "./config/authorityConfig.js";

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userDepartment, setUserDepartment] = useState(null);
  const [userState, setUserState] = useState(null);
  const [userDistrict, setUserDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(null);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (u) => {
      if (u) {
        setUser(u);
        const userSnap = await getDoc(doc(db, "users", u.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserRole(data.role);
          setUserDepartment(data.department);
          setUserState(data.state || null);
          setUserDistrict(data.district || null);
          setCurrentPage(data.role === "CITIZEN" ? "home" : "authority");
          setNeedsRoleSelection(false);
        } else {
          setNeedsRoleSelection(true);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setCurrentPage(null);
        setNeedsRoleSelection(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: "16px", background: "var(--gray-100)" }}>
        <div style={{ fontSize: "48px" }}>🏙️</div>
        <p style={{ color: "var(--gray-500)", fontSize: "15px" }}>Loading CivicPulse...</p>
      </div>
    );
  }

  if (!user) return <LandingPage />;

  if (needsRoleSelection) return (
    <RoleSelectionPage
      user={user}
      onRoleSelected={(role, department, state, district) => {
        setUserRole(role);
        setUserDepartment(department);
        setUserState(state);
        setUserDistrict(district);
        setCurrentPage(role === "CITIZEN" ? "home" : "authority");
        setNeedsRoleSelection(false);
      }}
    />
  );

  const isAuthority = userRole === "AUTHORITY" || userRole === "SUPER_ADMIN";
  const NAV_ITEMS = isAuthority ? AUTHORITY_NAV : CITIZEN_NAV;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span style={{ fontSize: "28px" }}>🏙️</span>
          <div>
            <h1>CivicPulse</h1>
            <span>{isAuthority ? "Authority Portal" : "AI Hyperlocal Solver"}</span>
          </div>
        </div>

        <div style={{ padding: "8px 16px" }}>
          <div style={{
            background: isAuthority ? "var(--purple-light)" : "var(--primary-light)",
            borderRadius: "var(--radius-md)", padding: "8px 12px",
            display: "flex", alignItems: "center", gap: "8px"
          }}>
            <span style={{ fontSize: "16px" }}>{isAuthority ? "🏛️" : "👤"}</span>
            <div>
              <p style={{ fontSize: "12px", fontWeight: "600", color: isAuthority ? "var(--purple)" : "var(--primary)" }}>
                {userRole === "SUPER_ADMIN" ? "Super Admin" : isAuthority ? `Authority · ${userDistrict}` : "Citizen"}
              </p>
              {userDepartment && userDepartment !== "ALL" && (
                <p style={{ fontSize: "11px", color: "var(--gray-500)" }}>{userDepartment.replace(/_/g, " ")}</p>
              )}
              {userState && (
                <p style={{ fontSize: "11px", color: "var(--gray-500)" }}>{userState}</p>
              )}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? "active" : ""}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <img src={user.photoURL || "https://via.placeholder.com/36"} alt="avatar" />
          <div className="sidebar-user-info">
            <p>{user.displayName}</p>
            <span>{user.email}</span>
          </div>
        </div>

        {/* Logout button — separate, below user info */}
        <button
          onClick={signOutUser}
          style={{
            margin: "8px 16px 16px",
            width: "calc(100% - 32px)",
            padding: "10px",
            borderRadius: "var(--radius-md)",
            border: "1px solid #fecaca",
            background: "var(--danger-light)",
            color: "var(--danger)",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#fecaca"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--danger-light)"}
        >
          🚪 Logout
        </button>
      </aside>

      <main className="main-content">
        {!isAuthority && currentPage === "home" && <HomePage user={user} userRole={userRole} userDepartment={userDepartment} userState={userState} userDistrict={userDistrict} onNavigate={setCurrentPage} />}
        {!isAuthority && currentPage === "report" && <ReportPage user={user} onNavigate={setCurrentPage} />}
        {!isAuthority && currentPage === "myreports" && <MyReportsPage user={user} onNavigate={setCurrentPage} />}
        {!isAuthority && currentPage === "rewards" && <RewardsPage user={user} onNavigate={setCurrentPage} />}
        {!isAuthority && currentPage === "predictive" && <PredictivePage user={user} onNavigate={setCurrentPage} />}

        {isAuthority && currentPage === "authority" && <AuthorityDashboard user={user} userRole={userRole} userDepartment={userDepartment} userState={userState} userDistrict={userDistrict} onNavigate={setCurrentPage} />}
        {isAuthority && currentPage === "home" && <HomePage user={user} userRole={userRole} userDepartment={userDepartment} userState={userState} userDistrict={userDistrict} onNavigate={setCurrentPage} />}
        {isAuthority && currentPage === "predictive" && <PredictivePage user={user} onNavigate={setCurrentPage} />}
      </main>

      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`bottom-nav-item ${currentPage === item.id ? "active" : ""}`}
            onClick={() => setCurrentPage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
