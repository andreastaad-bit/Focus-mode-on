import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Lazy-initialize Gemini client to avoid crashes if API key is not yet configured in UI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || "";
    // If empty key, we can still instantiate, but calls will let user know to add key in UI Secrets
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. API: HEALTH ENDPOINT
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", keyAvailable: !!process.env.GEMINI_API_KEY });
});

// 2. API: CUSTOMIZE OR GENERATE SESSIONS WITH GEMINI AI
app.post("/api/ai/session", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "El prompt descriptivo es requerido." });
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key === "") {
    // Graceful fallback to guide user on how to add secrets in AI Studio
    res.status(403).json({
      error: "KEY_MISSING",
      message: "API Key de Gemini no configurada. Por favor, añade 'GEMINI_API_KEY' en el panel de Secrets de Google AI Studio para activar la generación por Inteligencia Artificial.",
    });
    return;
  }

  try {
    const ai = getGeminiClient();
    
    const systemInstruction = `Eres un diseñador experto en productividad de flujo de trabajo y creador senior de contenido audiovisual para YouTube.
Tu tarea es generar un cronograma estructurado de 4 bloques de enfoque cognitivo basándote en la solicitud del usuario (por ejemplo, estudiar matemáticas, inspiración artística, descanso, etc).
Debes responder ESTRICTAMENTE en formato JSON plano mapeando el esquema solicitado. No envíes marcas markdown, solo el JSON puro.
La respuesta JSON debe estructurarse con la raíz conteniendo exactamente la clave "video_prompt", de acuerdo a los siguientes tipos:

Raíz:
- "video_prompt": objeto que contiene:
  - "meta": objeto con:
    - "title": cadena (Ej: "Deep Focus + Creative Reset — 2h Session")
    - "total_duration_minutes": entero (Ej: 140)
    - "format": cadena ("16:9")
    - "resolution": cadena ("4K preferred")
    - "frame_rate": entero (30)
    - "target_audience": cadena (Ej: "estudiantes de diseño, redactores...")
    - "youtube_tags": lista de cadenas (mínimo 6)
    - "thumbnail_concept": cadena (Ej: "ilustración minimalista de un desierto al anochecer con tonos terracota...")
  - "segments": lista de exactamente 4 objetos correspondientes a los bloques:
    Cada objeto contiene:
    - "id": cadena ("block_1_alpha", "break_1_doodle", "block_2_gamma", "break_2_breathing")
    - "label": cadena (Ej: "Bloque 1 — Concentración Alfa")
    - "start_time": cadena ("00:00:00")
    - "end_time": cadena ("01:00:00")
    - "duration_minutes": entero
    - "audio": objeto opcional con:
      - "type": cadena (Ej: "binaural_beats + ambient")
      - "wave_type": cadena ("alpha" o "gamma" u otra según corresponda)
      - "carrier_frequency_hz": entero (200)
      - "beat_frequency_hz": entero (Ej: 10 o 40)
      - "ambient_layer": cadena (Ej: "sonido de desierto suave")
      - "volume_curve": cadena
      - "notes": cadena
    - "visual": objeto opcional con:
      - "type": cadena ("video_loop_ambient", "animated_dot_drawing", "interactive_breathing_guide")
      - "scene": cadena
      - "camera": cadena
      - "color_palette": objeto con:
        - "primary": de tipo color CSS hexadecimal (Ej: "#A8C8B8")
        - "secondary": color CSS hexadecimal (Ej: "#D4E8E0")
        - "accent": color CSS hexadecimal (Ej: "#8BB5C8")
  - "production_notes": objeto con notas de producción de video`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Por favor, genera una estructura de sesión personalizada basada en este requerimiento del usuario: "${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text returned from Gemini API");
    }

    const payload = JSON.parse(text);
    res.json(payload);
  } catch (error: any) {
    console.error("Gemini compilation error:", error);
    res.status(500).json({
      error: "API_GATEWAY_ERROR",
      message: error?.message || "Error procesando tu sesión con Gemini AI.",
    });
  }
});

// 3. INTEGRATE VITE DEVELOPMENT MIDDLEWARE OR SERVE PRODUCTION BUNDLE
async function startServer() {
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
    console.log(`[Full-Stack Node Server] Up and running dynamically on port ${PORT}`);
});
}

startServer();
