import { signInWithGoogle } from "../services/authService.js";

export default function LandingPage() {
  async function handleLogin() {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", color: "#fff" }}>
      <div style={{ fontSize: "64px", marginBottom: "16px" }}>🏙️</div>
      <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "8px", textAlign: "center" }}>CivicPulse</h1>
      <p style={{ fontSize: "16px", opacity: 0.85, textAlign: "center", marginBottom: "8px" }}>AI-Powered Hyperlocal Problem Solver</p>
      <p style={{ fontSize: "13px", opacity: 0.65, textAlign: "center", marginBottom: "48px", maxWidth: "300px" }}>Report civic issues, track resolutions, and make your community better</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "320px", marginBottom: "48px" }}>
        {[
          { icon: "📷", text: "Snap a photo of any civic issue" },
          { icon: "🤖", text: "AI agents analyze & classify instantly" },
          { icon: "🗺️", text: "Auto-routed to right authority" },
          { icon: "🏆", text: "Earn XP for every contribution" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px" }}>
            <span style={{ fontSize: "24px" }}>{item.icon}</span>
            <span style={{ fontSize: "14px" }}>{item.text}</span>
          </div>
        ))}
      </div>

      <button onClick={handleLogin} style={{
        display: "flex", alignItems: "center", gap: "12px",
        background: "#fff", color: "#1e3a8a", border: "none",
        borderRadius: "12px", padding: "16px 32px", fontSize: "16px",
        fontWeight: "600", cursor: "pointer", width: "100%",
        maxWidth: "320px", justifyContent: "center"
      }}>
        <img src="https://www.google.com/favicon.ico" width="20" height="20" alt="Google" />
        Continue with Google
      </button>

      <p style={{ marginTop: "24px", fontSize: "12px", opacity: 0.5, textAlign: "center" }}>
        Built for Vibe2Ship Hackathon · Powered by Gemini AI
      </p>
    </div>
  );
}
