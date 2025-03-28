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
Your task is to generate **fully functional and complete Phaser.js game code** based on a given game description.

### **Guidelines for the generated code:**
1. **Complete Scene Class:** Define a Phaser scene named 'gameScene' with preload(), create(), and update() methods.
2. **Game Assets:**
   - Provide URLs for all required assets (images, sprites, sounds).
   - Use publicly available assets or placeholder assets if necessary.
3. **Physics and Mechanics:**
   - Implement proper **physics and collision handling**.
   - Ensure smooth movement and interactions.
4. **Game Logic:**
   - Implement **score tracking** and UI updates.
   - Define clear **win/lose conditions**.
   - Provide **restart functionality** for replayability.
5. **Controls:**  
   - Use **arrow keys** for movement.
   - Spacebar or Enter for additional actions (jump, attack, shoot, etc.).
6. **Code Quality:**  
   - The code should be **well-commented** and easy to understand.
   - Ensure the generated game runs **without errors**.
7. **Phaser Configuration:**  
   The generated code should work with this Phaser configuration:  
   
   \`\`\`js
   const config = {
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
   };

   const game = new Phaser.Game(config);
   \`\`\`

8. **Ensure Code is Ready to Run:**  
   - The output should be a **single JavaScript file** that can be included in an HTML page.  
   - Make sure **no missing dependencies** or assets are required beyond what is provided.

**Example Input Prompt:**  
*A simple space shooter game where the player controls a spaceship using arrow keys. The player can shoot bullets using the spacebar to destroy enemy ships. The game tracks the score, and when the player loses all lives, the game ends with a restart button.*  

**Expected Output:**  
- A **Phaser.js game** with working movement, shooting mechanics, enemy AI, collision detection, and scoring.
- Proper **asset URLs** for spaceship, bullets, and enemies.
- Fully formatted, ready-to-run JavaScript code.`;

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
