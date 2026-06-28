import { db, storage } from "../firebase.js";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getLocationDetails } from "./geocodingService.js";

export async function uploadImageToFirebase(file) {
  const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return {
    url,
    thumbUrl: url,
    type: "image",
  };
}

export async function uploadVideoToFirebase(file) {
  const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return {
    url,
    thumbUrl: url,
    type: "video",
  };
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function saveReportToFirestore(userId, imageData, location, analysisResult) {
  const report = {
    reporterId: userId || "anonymous",
    status: "ASSIGNED",
    location: {
      lat: location.lat,
      lng: location.lng,
      address: location.address || "Unknown location",
      state: location.state || "Unknown",
      district: location.district || "Unknown",
      landmark: location.landmark || null,
    },
    imageUrl: imageData.url,
    imageThumbUrl: imageData.thumbUrl,
    mediaType: imageData.type || "image",
    aiAnalysis: {
      category: analysisResult.summary.category,
      subCategory: analysisResult.analysis.categorization.sub_category,
      severity: analysisResult.summary.severity,
      urgency: analysisResult.summary.urgency,
      priority: analysisResult.summary.priority,
      visualDescription: analysisResult.analysis.vision.visual_description,
      citizenTitle: analysisResult.summary.title,
      citizenDescription: analysisResult.summary.description,
      riskFactors: analysisResult.analysis.severity.risk_factors,
      confidence: analysisResult.analysis.vision.confidence,
      slaHours: analysisResult.summary.slaHours,
      estimatedCostInr: analysisResult.summary.estimatedCost,
      publicSafetyThreat: analysisResult.summary.safetyThreat,
      preventiveAction: analysisResult.summary.preventiveAction,
      department: analysisResult.summary.department,
      processingLog: analysisResult.pipeline,
      totalProcessingMs: analysisResult.totalDurationMs,
    },
    routing: {
      primaryAuthority: analysisResult.analysis.routing.primary_authority,
      primaryDepartment: analysisResult.analysis.routing.primary_department,
      contactEmail: analysisResult.analysis.routing.contact_email,
      escalationChain: analysisResult.analysis.routing.escalation_chain,
      actionLetter: analysisResult.analysis.routing.action_letter,
      resolutionSteps: analysisResult.analysis.routing.resolution_steps,
    },
    verificationCount: 0,
    verifications: [],
    upvotes: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "reports"), report);
  return docRef.id;
}

export async function updateReportStatus(reportId, status, comment = "") {
  await updateDoc(doc(db, "reports", reportId), {
    status,
    authorityComment: comment,
    updatedAt: serverTimestamp(),
  });
}
