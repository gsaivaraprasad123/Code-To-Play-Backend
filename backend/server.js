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

if (!apiKey) {
  console.error("🚨 ERROR: GEMINI_API_KEY is missing in .env file");
  process.exit(1);
}
app.use(
  cors({
    origin: "*", // Allows all origins (use caution in production)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Route to generate Phaser.js game code
app.post("/generate-game", async (req, res) => {
  const SYSTEM_PROMPT = `You are an expert game developer specializing in Phaser.js. Generate a **fully functional Phaser.js game** based on the given game description.

### **Game Code Rules:**
1. Provide a **working Phaser.js game** with \`preload()\`, \`create()\`, and \`update()\` functions.
2. Use **publicly available asset URLs** for images, sprites, and sounds.
3. Implement **physics, collision detection, and scoring** mechanics.
4. Controls:  
   - **Arrow keys** → Movement  
   - **Spacebar** → Jump/Shoot  
   - **R** → Restart game  
5. The code must be **error-free, structured, and ready to run**.
6. Output **only JavaScript code**, no explanations.
7.Should also contain the proper physics and mechanics

\`\`\`js
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: { default: 'arcade', arcade: { gravity: { y: 300 }, debug: false } },
  scene: gameScene
};
const game = new Phaser.Game(config);
\`\`\`

Now generate a Phaser.js game as a **complete JavaScript file**.`;

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
  console.log(`✅ Server is running on port ${PORT}`);
});
