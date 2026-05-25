import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client safe guarding startup crashes
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is missing. Please set it in AI Studio Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API endpoint for interactive AI companion/advisor
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { prompt, history } = req.body;
    const client = getGeminiClient();

    // Map the incoming history to Gemini SDK format
    // gemini-3.5-flash is our default model for general Q&A
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }
    
    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: `You are AGNES (Advanced Geological Network and Exploration System), an elite AI seismologist and volcanologist for VolcanoX. 
Your goal is to educate users on volcanic eruptions, earthquakes, tectonic activity, tsunamis, and survival guides.
Keep your responses immersive, detailed, clear, highly scientific yet educational, and full of intense geological passion. 
Use markdown formatting beautifully. If asked to simulate a geological crisis, do so in high-drama scientific style, describing pre-shocks, sulfur levels, volcanic tremor, and pyroclastic warnings.`,
        temperature: 0.8,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error.message);
    res.status(500).json({ error: error.message || "Something went wrong query GenAI" });
  }
});

// API endpoint for custom geological scenario simulations
app.post("/api/gemini/scenario", async (req, res) => {
  try {
    const { volcanoType, magnitude, location } = req.body;
    const client = getGeminiClient();

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Simulate what happens if a ${volcanoType} erupted with an associated magnitude ${magnitude} earthquake at ${location || 'a subduction zone'}.`,
      config: {
        systemInstruction: `You are an elite vulcanology supercomputer. Provide a highly detailed, multi-step chronological forecast of the disaster. Include:
1. Seismic pre-shocks & gas emission changes.
2. The eruption blast, eruption column height (in km) and pyroclastic density currents (PDCs).
3. Associated local tsunami generation potential.
4. Hazard zones, ashfall dispersion vectors, and core survival instructions.
Make the output scientific, dramatic, and structured in transparent, scannable JSON with fields: 'title', 'timeline' (array of { time, title, description }), 'warnings' (array of strings), 'mitigation' (array of strings), and 'survivalTip' (string).`,
        responseMimeType: "application/json"
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Scenario Generator Error:", error.message);
    res.status(500).json({ error: error.message || "Error generating simulation timeline" });
  }
});

// Serve Frontend using Vite or static directory
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
});
