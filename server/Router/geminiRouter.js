const express = require("express");
const { askGemini } = require("../gemini");
const router = express.Router();

// Route to handle chat requests with the AI
router.post("/", async (req, res) => {
  const { prompt, history } = req.body;

  // Basic validation
  if (!prompt) {
    return res.status(400).json({ success: false, message: "Prompt is required." });
  }

  const response = await askGemini(prompt, history || []);

  res.json({ success: true, response });
});

module.exports = router;