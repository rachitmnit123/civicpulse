import { useState, useRef } from "react";
import { runOrchestrator } from "../agents/orchestrator.js";
import { uploadImageToFirebase, uploadVideoToFirebase, fileToBase64, saveReportToFirestore } from "../services/reportService.js";
import { awardXp } from "../services/gamificationService.js";
import { getLocationDetails } from "../services/geocodingService.js";

export default function ReportPage({ user, onNavigate }) {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState("idle");
  const [xpEarned, setXpEarned] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [isVideo, setIsVideo] = useState(false);

  const videoRef = useRef();
  const fileRef = useRef();


  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImage(URL.createObjectURL(file));
    setIsVideo(false); // ADD THIS
    setStage("image_selected");
  }
  function handleVideoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImage(URL.createObjectURL(file));
    setIsVideo(true);
    setStage("image_selected");
  }

  async function getLocation() {
    return new Promise(async (resolve) => {
      if (!navigator.geolocation) {
        const details = await getLocationDetails(28.6139, 77.209);
        resolve({ lat: 28.6139, lng: 77.209, ...details });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const details = await getLocationDetails(latitude, longitude);
          resolve({ lat: latitude, lng: longitude, ...details });
        },
        async () => {
          const details = await getLocationDetails(28.6139, 77.209);
          resolve({ lat: 28.6139, lng: 77.209, ...details });
        }
      );
    });
  }

  async function handleSubmit() {
    if (!imageFile) return;
    setStage("processing");
    setError(null);
    setPipeline([]);
    try {
      const loc = await getLocation();
      setLocationInfo(loc); // NEW — save loc to state
      const base64 = await fileToBase64(imageFile);
      const orchestratorResult = await runOrchestrator(base64, imageFile.type, loc, (p) => setPipeline([...p]), isVideo);
      if (!orchestratorResult.success) { setError(orchestratorResult.message); setStage("error"); return; }
      setStage("uploading");
      const imageData = isVideo
        ? await uploadVideoToFirebase(imageFile)
        : await uploadImageToFirebase(imageFile);
      const reportId = await saveReportToFirestore(user?.uid, imageData, loc, orchestratorResult);
      const xpResult = await awardXp(user?.uid, "REPORT_SUBMITTED", {
        highSeverity: orchestratorResult.summary?.severity >= 7,
        category: orchestratorResult.summary?.category,
        safetyThreat: orchestratorResult.summary?.safetyThreat,
      });
      setXpEarned(xpResult);
      setResult({ ...orchestratorResult, reportId });
      setStage("success");
    } catch (err) {
      setError(err.message);
      setStage("error");
    }
  }

  const agentIcons = {
    "Vision Analysis Agent": "👁️",
    "Categorization Agent": "🏷️",
    "Severity Scoring Agent": "⚠️",
    "Duplicate Detection Agent": "🔍",
    "Routing Agent": "🗺️",
  };

  function reset() {
    setStage("idle"); setImage(null); setImageFile(null);
    setPipeline([]); setResult(null); setXpEarned(null);
    setError(null); setLocationInfo(null); setIsVideo(false);
  }

  return (
    <div>
      <div className="header-band blue">
        <h1>📷 Report Civic Issue</h1>
        <p>Upload a photo or video and let AI agents analyze, classify and route it instantly</p>
      </div>

      <div className="page-container" style={{ paddingTop: 0 }}>
        {/* <p style={{ color: "red", fontSize: "20px" }}>Stage: {stage}, Image: {image ? "yes" : "no"}</p> */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

          {/* Left: Upload */}
          <div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
            <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoSelect} style={{ display: "none" }} />

            {!image ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="upload-zone" onClick={() => fileRef.current.click()}>
                  <div className="upload-icon">📷</div>
                  <p className="upload-title">Upload Photo</p>
                  <p className="upload-sub">JPG, PNG supported</p>
                </div>
                <div className="upload-zone" onClick={() => videoRef.current.click()}>
                  <div className="upload-icon">🎥</div>
                  <p className="upload-title">Upload Video</p>
                  <p className="upload-sub">MP4, WebM supported</p>
                </div>
              </div>
            ) : (
              <div className="card">
                {isVideo ? (
                  <video src={image} style={{ width: "100%", height: "300px", objectFit: "cover" }} controls />
                ) : (
                  <img src={image} style={{ width: "100%", height: "300px", objectFit: "cover" }} alt="selected" />
                )}
                <div className="card-body" style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-ghost" onClick={reset} style={{ flex: 1 }}>Change {isVideo ? "Video" : "Photo"}</button>
                  {stage === "image_selected" && (
                    <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 2 }}>
                      🤖 Analyze with AI
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* How it works */}
            {stage === "idle" && (
              <div className="card mt-16">
                <div className="card-header"><h2>How it works</h2></div>
                <div className="card-body">
                  {[
                    { icon: "📷", title: "Upload Photo or Video", desc: "Take or upload a photo/video of the civic issue" },
                    { icon: "🤖", title: "AI Analysis", desc: "5 AI agents analyze and classify the issue" },
                    { icon: "🗺️", title: "Auto Routing", desc: "Routed to the right municipal department" },
                    { icon: "🏆", title: "Earn XP", desc: "Get rewarded for civic participation" },
                  ].map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "14px", alignItems: "flex-start" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{step.icon}</div>
                      <div>
                        <p style={{ fontWeight: "600", fontSize: "14px", marginBottom: "2px" }}>{step.title}</p>
                        <p className="text-sm text-muted">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Pipeline + Results */}
          <div>
            {(stage === "processing" || stage === "uploading" || stage === "success" || stage === "error") && pipeline.length > 0 && (
              <div className="card mb-16">
                <div className="card-header"><h2>🤖 AI Agent Pipeline</h2></div>
                <div className="card-body">
                  {pipeline.map((step, i) => (
                    <div key={i} className={`pipeline-step ${step.status.toLowerCase()}`}>
                      <span className="pipeline-icon">{agentIcons[step.agent] || "🔧"}</span>
                      <div className="pipeline-info">
                        <p className="pipeline-name">{step.agent}</p>
                        {step.status === "COMPLETE" && step.result && (
                          <p className="pipeline-detail">
                            {step.agent === "Vision Analysis Agent" && `Detected: ${step.result.issue_type} (${Math.round(step.result.confidence * 100)}% confidence)`}
                            {step.agent === "Categorization Agent" && `${step.result.category} → ${step.result.sub_category}`}
                            {step.agent === "Severity Scoring Agent" && `Severity ${step.result.severity_score}/10 · ${step.result.urgency} · ₹${step.result.estimated_cost_inr?.toLocaleString()}`}
                            {step.agent === "Duplicate Detection Agent" && `${step.result.is_duplicate ? "⚠️ Duplicate" : "✅ Unique"} · ${step.result.nearby_report_count} nearby`}
                            {step.agent === "Routing Agent" && `→ ${step.result.primary_department}`}
                          </p>
                        )}
                      </div>
                      <span className="pipeline-status" style={{ color: step.status === "COMPLETE" ? "#16a34a" : step.status === "RUNNING" ? "var(--primary)" : "var(--danger)" }}>
                        {step.status === "RUNNING" ? "⏳" : step.status === "COMPLETE" ? `✅ ${step.durationMs}ms` : "❌"}
                      </span>
                    </div>
                  ))}
                  {stage === "uploading" && <p style={{ textAlign: "center", color: "var(--primary)", marginTop: "12px", fontSize: "14px" }}>⏳ Saving to database...</p>}
                </div>
              </div>
            )}

            {stage === "success" && result && (
              <div>
                {xpEarned && (
                  <div style={{ background: "var(--amber-light)", border: "1px solid #fde68a", borderRadius: "var(--radius-lg)", padding: "16px", marginBottom: "16px", textAlign: "center" }}>
                    <p style={{ fontSize: "28px" }}>🎉</p>
                    <p style={{ fontWeight: "700", color: "#92400e", fontSize: "16px" }}>+{xpEarned.xpAwarded} XP Earned!</p>
                    <p style={{ fontSize: "13px", color: "#b45309" }}>Level {xpEarned.newLevel.level} — {xpEarned.newLevel.title}</p>
                  </div>
                )}

                <div className="card">
                  <div className="card-header" style={{ background: "var(--success-light)" }}>
                    <h2 style={{ color: "var(--success)" }}>✅ Report Submitted!</h2>
                    <span className="text-xs text-muted">ID: {result.reportId?.slice(0, 8)}...</span>
                  </div>
                  <div className="card-body">
                    <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>{result.summary?.title}</h3>
                    <p className="text-sm text-muted mb-16">{result.summary?.description}</p>

                    {/* LOCATION DISPLAY */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "16px", fontSize: "13px", color: "var(--text-muted)", background: "var(--gray-50)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
                      <span>📍</span>
                      <p>{locationInfo?.address || `${locationInfo?.district}, ${locationInfo?.state}`}</p>
                    </div>

                    <div className="grid-2 mb-16">
                      {[
                        { label: "Category", value: result.summary?.category },
                        { label: "Severity", value: `${result.summary?.severity}/10` },
                        { label: "Priority", value: result.summary?.priority },
                        { label: "SLA", value: `${result.summary?.slaHours}hrs` },
                        { label: "Est. Cost", value: `₹${result.summary?.estimatedCost?.toLocaleString()}` },
                        { label: "Department", value: result.summary?.department?.slice(0, 22) },
                      ].map((item, i) => (
                        <div key={i} style={{ background: "var(--gray-50)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
                          <p className="text-xs text-muted">{item.label}</p>
                          <p style={{ fontSize: "13px", fontWeight: "600", marginTop: "2px" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {result.summary?.safetyThreat && (
                      <div style={{ background: "var(--danger-light)", border: "1px solid #fecaca", borderRadius: "var(--radius-md)", padding: "12px", marginBottom: "16px" }}>
                        <p style={{ color: "var(--danger)", fontWeight: "600", fontSize: "13px" }}>⚠️ Safety Threat Detected</p>
                        <p style={{ color: "#991b1b", fontSize: "12px", marginTop: "4px" }}>{result.summary?.preventiveAction}</p>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn btn-ghost" onClick={reset} style={{ flex: 1 }}>Report Another</button>
                      <button className="btn btn-primary" onClick={() => onNavigate("myreports")} style={{ flex: 1 }}>View My Reports</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {stage === "error" && (
              <div style={{ background: "var(--danger-light)", border: "1px solid #fecaca", borderRadius: "var(--radius-lg)", padding: "20px" }}>
                <p style={{ color: "var(--danger)", fontWeight: "600", marginBottom: "8px" }}>❌ Error</p>
                <p className="text-sm" style={{ color: "#991b1b", marginBottom: "16px" }}>{error}</p>
                <button className="btn btn-primary" onClick={() => { setStage("image_selected"); setError(null); setPipeline([]); }}>Try Again</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}