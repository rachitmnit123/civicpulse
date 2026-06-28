const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export async function callGemini(prompt) {
  const res = await fetch(`${BACKEND_URL}/api/gemini`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  const data = await res.json();
  return data.text;
}

export async function callGeminiVision(prompt, imageBase64, mimeType) {
  const res = await fetch(`${BACKEND_URL}/api/gemini-vision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, imageBase64, mimeType }),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  const data = await res.json();
  return data.text;
}
export async function callGeminiVideo(prompt, videoBase64, mimeType) {
  const res = await fetch(`${BACKEND_URL}/api/gemini-video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, videoBase64, mimeType }),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  const data = await res.json();
  return data.text;
}