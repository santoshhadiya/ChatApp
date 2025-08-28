const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Asks the Gemini model a question with conversation history.
 * @param {string} prompt The user's latest message.
 * @param {Array} history The past conversation history.
 * @returns {Promise<string>} The AI's response or an error message.
 */
async function askGemini(prompt, history) {
  // Use a try-catch block to handle potential API errors
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Start a chat session with the provided history
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 250,
      },
    });

    const result = await chat.sendMessage(prompt);
    return result.response.text();
  } catch (error) {
    // Log the error and return a user-friendly message
    console.error("Error calling Gemini API:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
}

module.exports = { askGemini };