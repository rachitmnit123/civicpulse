import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));

// Uses ADC automatically — no key file needed
const ai = new GoogleGenAI({
  vertexai: true,
  project: "civic-pulse-vibe",
  location: "us-central1",
});

app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    res.json({ text: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log("✅ Backend running on http://localhost:3001"));
