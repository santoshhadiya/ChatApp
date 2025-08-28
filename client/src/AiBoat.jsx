import React, { useState } from "react";
import axios from "axios";

const AiBoat = () => {
  const [messageInput, setMessageInput] = useState("");
  const [reply, setReply] = useState(""); // store AI reply
  const [loadingAI, setLoadingAI] = useState(false);

  const askAI = async (e) => {
    e.preventDefault(); 
    if (!messageInput.trim()) return;

    try {
      setLoadingAI(true);
      const res = await axios.post("http://localhost:3000/chat/gemini", {
        message: messageInput,
      });
      setReply(res.data.reply); 
    } catch (err) {
      console.error(err);
      setReply(" Error: Could not reach AI server");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <>
      <h1>Ask To AI</h1>

      <form onSubmit={askAI}>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your question..."
        />
        <button type="submit">Ask</button>
      </form>

      {loadingAI && <p>⏳ AI is thinking...</p>}

      {reply && (
        <div style={{ marginTop: "20px" }}>
          <h3>AI Reply:</h3>
          <p>{reply}</p>
        </div>
      )}
    </>
  );
};

export default AiBoat;
