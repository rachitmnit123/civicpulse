import { runVisionAgent, runVisionAgentVideo } from "./visionAgent.js";
import { runCategorizationAgent } from "./categorizationAgent.js";
import { runSeverityAgent } from "./severityAgent.js";
import { runDuplicateAgent } from "./duplicateAgent.js";
import { runRoutingAgent } from "./routingAgent.js";

async function withRetry(fn, retries = 3, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const is503 = err.message?.includes("503") || err.message?.includes("overloaded");
      const is429 = err.message?.includes("429");
      if ((is503 || is429) && i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

export async function runOrchestrator(imageBase64, mimeType, location, onProgress, isVideo = false) {
  const pipeline = [];
  const startTime = Date.now();

  const updateProgress = (agent, status, result = null, error = null) => {
    const existing = pipeline.findIndex((s) => s.agent === agent && s.status === "RUNNING");
    const step = {
      agent, status, result, error,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
    if (existing >= 0) pipeline[existing] = step;
    else pipeline.push(step);
    if (onProgress) onProgress([...pipeline]);
  };

  try {
    updateProgress("Vision Analysis Agent", "RUNNING");
    const visionResult = await withRetry(() =>
      isVideo
        ? runVisionAgentVideo(imageBase64, mimeType, location)
        : runVisionAgent(imageBase64, mimeType, location)
    );
    updateProgress("Vision Analysis Agent", "COMPLETE", visionResult);

    if (!visionResult.issue_detected) {
      return {
        success: false,
        reason: "NO_ISSUE_DETECTED",
        pipeline,
        message: "No civic issue detected. Please upload a clear photo of the problem.",
      };
    }

    updateProgress("Categorization Agent", "RUNNING");
    const categorizationResult = await withRetry(() => runCategorizationAgent(visionResult));
    updateProgress("Categorization Agent", "COMPLETE", categorizationResult);

    updateProgress("Severity Scoring Agent", "RUNNING");
    const severityResult = await withRetry(() => runSeverityAgent(visionResult, categorizationResult, location));
    updateProgress("Severity Scoring Agent", "COMPLETE", severityResult);

    updateProgress("Duplicate Detection Agent", "RUNNING");
    const duplicateResult = await withRetry(() => runDuplicateAgent(visionResult, categorizationResult, location));
    updateProgress("Duplicate Detection Agent", "COMPLETE", duplicateResult);

    if (duplicateResult.is_duplicate && duplicateResult.action === "MERGE_WITH_EXISTING") {
      return {
        success: false,
        reason: "DUPLICATE_FOUND",
        pipeline,
        duplicateReportId: duplicateResult.matched_report_id,
        message: "This issue has already been reported nearby. Your upvote has been added.",
      };
    }

    updateProgress("Routing Agent", "RUNNING");
    const routingResult = await withRetry(() => runRoutingAgent(visionResult, categorizationResult, severityResult, location));
    updateProgress("Routing Agent", "COMPLETE", routingResult);

    return {
      success: true,
      pipeline,
      totalDurationMs: Date.now() - startTime,
      analysis: {
        vision: visionResult,
        categorization: categorizationResult,
        severity: severityResult,
        duplicate: duplicateResult,
        routing: routingResult,
      },
      summary: {
        title: categorizationResult.citizen_friendly_title,
        description: categorizationResult.citizen_friendly_description,
        category: categorizationResult.category,
        severity: severityResult.severity_score,
        urgency: severityResult.urgency,
        priority: severityResult.priority_rank,
        department: routingResult.primary_department,
        slaHours: severityResult.sla_hours,
        estimatedCost: severityResult.estimated_cost_inr,
        safetyThreat: severityResult.public_safety_threat,
        preventiveAction: severityResult.preventive_action,
      },
    };
  } catch (error) {
    updateProgress("Orchestrator", "FAILED", null, error.message);
    return {
      success: false,
      reason: "PIPELINE_ERROR",
      pipeline,
      message: error.message,
    };
  }
}
