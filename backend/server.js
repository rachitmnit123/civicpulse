import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const ai = new GoogleGenAI({
  vertexai: true,
  project: "civic-pulse-vibe",
  location: "us-central1",
});

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateWithRetry(params, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent(params);
      return response.text;
    } catch (err) {
      if (err.status === 429 && i < retries - 1) {
        const wait = (i + 1) * 5000; // 5s, 10s, 15s
        console.log(`Rate limited, retrying in ${wait / 1000}s...`);
        await delay(wait);
      } else {
        throw err;
      }
    }
  }
}

// Text-only route
app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt } = req.body;
    const text = await generateWithRetry({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Vision route (image + text)
app.post("/api/gemini-vision", async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType } = req.body;
    const text = await generateWithRetry({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
    });
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Video route
app.post("/api/gemini-video", async (req, res) => {
  try {
    const { prompt, videoBase64, mimeType } = req.body;
    const text = await generateWithRetry({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: videoBase64 } },
          ],
        },
      ],
    });
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log("✅ Backend running on http://localhost:3001"));