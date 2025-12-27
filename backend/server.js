require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 8080;
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("🚨 ERROR: GEMINI_API_KEY is missing in .env file");
  process.exit(1);
}

/* -------------------- Middleware -------------------- */
app.use(cors());
app.use(express.json());

/* -------------------- Gemini Client -------------------- */
const ai = new GoogleGenAI({
  apiKey,
});

/* -------------------- Route -------------------- */
app.post("/generate-game", async (req, res) => {
  const SYSTEM_PROMPT = `
You are an expert game developer specializing in Phaser.js.

Generate a FULLY FUNCTIONAL Phaser.js game.

Rules:
1. Must include preload(), create(), update()
2. Use public asset URLs
3. Include physics, collisions, scoring
4. Controls:
   - Arrow Keys → Move
   - Space → Jump / Shoot
   - R → Restart
5. Output ONLY JavaScript code
6. Code must be runnable and error-free
7. Proper arcade physics required

Example config (must be compatible):

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 300 }, debug: false }
  },
  scene: gameScene
};

Now generate a COMPLETE JavaScript game file.
`;

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}\n\nGame Idea: ${prompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
      },
    });

    const gameCode = response.text?.trim();

    if (!gameCode || !gameCode.includes("Phaser")) {
      return res
        .status(500)
        .json({ error: "Invalid Phaser.js code generated." });
    }

    res.json({ gameCode });
  } catch (error) {
    console.error("❌ Error generating game code:", error);
    res.status(500).json({ error: "Failed to generate game code." });
  }
});

/* -------------------- Server -------------------- */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
