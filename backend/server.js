require("dotenv").config();
const express = require("express");
const cors = require("cors");
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;
const apiKey = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Route to generate Phaser.js game code
app.post("/generate-game", async (req, res) => {
  const SYSTEM_PROMPT = `You are an expert game developer specializing in creating 2D games using Phaser.js. 
When given a game description, generate complete, working Phaser.js game code.

Guidelines:
1. Always create a complete game scene class named 'gameScene'
2. Include preload(), create(), and update() methods
3. Add proper physics, collisions, and game mechanics
4. Include score tracking where appropriate
5. Add game over conditions and restart functionality
6. Use keyboard inputs (arrow keys, spacebar) for controls
7. Ensure the code is clean, well-commented, and bug-free

The code should work with this Phaser configuration:
{
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: gameScene
}`;
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const chatSession = model.startChat({ generationConfig, history: [] });
    const result = await chatSession.sendMessage(`${SYSTEM_PROMPT} ${prompt}`);

    const gameCode = result.response.text().trim();
    if (!gameCode.includes("Phaser")) {
      return res
        .status(500)
        .json({ error: "Invalid Phaser.js code generated." });
    }

    res.json({ gameCode });
  } catch (error) {
    console.error("Error generating game code:", error);
    res.status(500).json({ error: "Failed to generate game code." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
