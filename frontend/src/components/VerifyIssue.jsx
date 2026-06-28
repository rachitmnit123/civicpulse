import { useState } from "react";
import { db } from "../firebase.js";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { awardXp } from "../services/gamificationService.js";

export default function VerifyIssue({ report, user, onVerified }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const alreadyVerified = report.verifications?.includes(user.uid);
  const isResolved = report.status === "RESOLVED" || report.status === "CLOSED";

  async function handleVerify(type) {
    if (alreadyVerified || loading) return;
    setLoading(true);
    try {
      const newVerificationCount = (report.verificationCount || 0) + 1;
      const newUpvotes = type === "CONFIRM" ? (report.upvotes || 0) + 1 : (report.upvotes || 0);
      const newStatus = (newVerificationCount >= 3 || (report.verificationCount || 0) >= 3) &&
        report.status !== "IN_PROGRESS" &&
        report.status !== "RESOLVED" &&
        report.status !== "CLOSED"
        ? "VERIFIED"
        : report.status;

      await updateDoc(doc(db, "reports", report.id), {
        verifications: arrayUnion(user.uid),
        verificationCount: newVerificationCount,
        upvotes: newUpvotes,
        status: newStatus,
      });
      await awardXp(user.uid, "VERIFICATION_GIVEN");
      setDone(true);
      if (onVerified) onVerified();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Show upvote count always
  const upvoteCount = report.upvotes || 0;
  const verificationCount = report.verificationCount || 0;

  // If resolved, just show stats
  if (isResolved) {
    return (
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "4px" }}>
        <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: "600" }}>✅ Issue Resolved</span>
        <span style={{ fontSize: "12px", color: "var(--gray-400)" }}>·</span>
        <span style={{ fontSize: "12px", color: "var(--gray-500)" }}>👍 {upvoteCount} upvotes</span>
        <span style={{ fontSize: "12px", color: "var(--gray-500)" }}>· 👥 {verificationCount} verified</span>
      </div>
    );
  }

  // If already verified
  if (alreadyVerified || done) {
    return (
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ background: "var(--success-light)", borderRadius: "var(--radius-sm)", padding: "6px 12px" }}>
          <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: "600" }}>✅ You verified this · +10 XP</span>
        </div>
        <span style={{ fontSize: "12px", color: "var(--gray-500)" }}>👍 {upvoteCount}</span>
        <span style={{ fontSize: "12px", color: "var(--gray-500)" }}>👥 {verificationCount}</span>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--gray-50)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <p style={{ fontSize: "12px", color: "var(--gray-600)", fontWeight: "600" }}>
          👥 Can you confirm this issue exists?
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--gray-500)" }}>👍 {upvoteCount}</span>
          <span style={{ fontSize: "12px", color: "var(--gray-500)" }}>👥 {verificationCount}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => handleVerify("CONFIRM")} disabled={loading} style={{
          flex: 1, padding: "7px", border: "none", borderRadius: "var(--radius-sm)",
          background: "var(--success-light)", color: "var(--success)",
          cursor: "pointer", fontWeight: "600", fontSize: "12px"
        }}>
          ✅ Yes, I see it
        </button>
        <button onClick={() => handleVerify("DISPUTE")} disabled={loading} style={{
          flex: 1, padding: "7px", border: "none", borderRadius: "var(--radius-sm)",
          background: "var(--danger-light)", color: "var(--danger)",
          cursor: "pointer", fontWeight: "600", fontSize: "12px"
        }}>
          ❌ Not there
        </button>
      </div>
    </div>
  );
}
