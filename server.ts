import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const getAI = (clientApiKey?: string) => {
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY_MISSING");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  const analysisSchema = {
    type: Type.OBJECT,
    properties: {
      isCompliant: { type: Type.BOOLEAN },
      status: { type: Type.STRING, enum: ["VALID", "ADJUSTING", "INVALID"] },
      feedback: { type: Type.STRING },
      instruction: { type: Type.STRING },
      faceDetected: { type: Type.BOOLEAN }
    },
    required: ["isCompliant", "status", "feedback", "instruction", "faceDetected"]
  };

  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const { base64Frame, apiKey } = req.body;
      if (!base64Frame) return res.status(400).json({ error: "Missing image" });

      const ai = getAI(apiKey);
      const mimeType = base64Frame.match(/^data:(image\/\w+);base64,/)?.[1] || "image/png";
      const cleanBase64 = base64Frame.replace(/^data:image\/\w+;base64,/, "");

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType, data: cleanBase64 } },
            { text: `Phân tích ảnh thẻ sinh trắc học để HƯỚNG DẪN người dùng (không chỉnh sửa ảnh).
Tiêu chí: mặt nhìn thẳng, mắt mở, miệng đóng, đủ sáng, không bóng đổ mạnh, một khuôn mặt duy nhất.
"instruction": câu ngắn tiếng Việt ra lệnh chỉnh tư thế (VD: "Nâng cằm lên", "Nhìn thẳng camera").` }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response text");
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Analysis Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/process", async (req, res) => {
    try {
      const { imageBase64, systemPrompt, model, apiKey } = req.body;
      if (!imageBase64 || !systemPrompt) return res.status(400).json({ error: "Missing data" });

      const targetModel = model || "gemini-3.1-flash-image";
      console.log(`[Gemini Process] Running image generation with model: ${targetModel}`);

      const ai = getAI(apiKey);
      const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/png";
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType, data: cleanBase64 } },
            { text: systemPrompt }
          ]
        }],
        config: {
          // Mặc định model chỉ xuất 1K nếu không set — 2K sắc nét hơn hẳn cho
          // ảnh in 300dpi mà chưa quá nặng/chậm như 4K.
          imageConfig: { imageSize: "2K" }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) throw new Error("NO_IMAGE_RETURNED");

      let finalImage = null;
      for (const part of parts) {
        if (part.inlineData?.data) {
          finalImage = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!finalImage) throw new Error("IMAGE_DATA_MISSING");
      res.json({ image: finalImage, usedModel: targetModel });
    } catch (error: any) {
      console.error("Processing Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
