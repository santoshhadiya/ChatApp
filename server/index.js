const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const chatsRouter = require("./Router/chatsRouter");
const geminiRouter = require("./Router/geminiRouter"); // Make sure this path is correct
const CHATS = require("./Model/chatsModel");
const PORT = process.env.PORT || 3000;

let allRooms = []; // Using in-memory for simplicity, consider Redis for production
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.static("public"));
app.use(express.json());
app.use(cors());

// Helper function to get and emit users in a room
const updateRoomUsers = async (room) => {
  if (!room) return;
  const socketsInRoom = await io.in(room).fetchSockets();
  const users = socketsInRoom.map((s) => ({ id: s.id, name: s.userName }));
  io.to(room).emit("roomUsers", users);
};

io.on("connection", (socket) => {
  socket.emit("roomList", allRooms);

  socket.on("join", (data) => {
    socket.userName =
      data.userName || `User_${Math.random().toString(36).substr(2, 5)}`;
  });

  socket.on("joinRoom", async (data) => {
    const room = data.room;
    socket.join(room);
    socket.currentRoom = room;

    await updateRoomUsers(room);
    console.log(`${socket.userName} joined room ${room}`);
  });

  socket.on("leaveRoom", async (data) => {
    const room = socket.currentRoom;
    if (room) {
      socket.leave(room);
      socket.currentRoom = null;
      await updateRoomUsers(room);
    }
  });

  socket.on("disconnect", () => {
    updateRoomUsers(socket.currentRoom);
  });

  socket.on("sendMsg", async (data, callback) => {
    // First, create the user's message object
    const userMessage = {
      room: data.room,
      message: data.msg,
      user: socket.userName,
      auth: socket.id,
      timestamp: new Date(),
    };

    io.to(socket.currentRoom).emit("sendMsg", userMessage);

    try {
      await CHATS.create({
        message: data.msg,
        user: socket.userName,
        room: data.room,
      });
      if (callback) callback({ status: "ok" });
    } catch (err) {
      console.error("Error saving user chat message:", err);
      if (callback)
        callback({ status: "error", message: "Failed to save user message." });
    }
    if (data.room === "AiRoom") {
      try {
        // Get the AI's response
        const aiReply = await askGemini(data.msg); // Pass only the message text

        // Create the AI's message object
        const aiMessage = {
          room: data.room,
          message: aiReply,
          user: "AI Assistant", // Give the AI a name
          auth: "AI_ID", // Give the AI a unique identifier
          timestamp: new Date(),
        };

        // Emit the AI's message back to the same room
        io.to(socket.currentRoom).emit("sendMsg", aiMessage);

        // Optionally, save the AI's response to the database
        await CHATS.create({
          message: aiReply,
          user: "AI Assistant",
          room: data.room,
        });
      } catch (err) {
        console.error("Error getting response from AI:", err);
        // Optionally, emit an error message to the user
        io.to(socket.currentRoom).emit("sendMsg", {
          room: data.room,
          message: "Sorry, I couldn't connect to the AI. Please try again.",
          user: "AI Assistant",
          auth: "AI_ID",
          timestamp: new Date(),
        });
      }
    }
    
  });

  socket.on("addRoomList", (data) => {
    const roomName = data.room.trim();
    if (roomName && !allRooms.includes(roomName)) {
      allRooms.push(roomName);
      io.emit("addRoomList", { room: roomName });
    }
  });
});

app.use("/chats", chatsRouter);
app.use("/chat", geminiRouter);

mongoose
  .connect(
    "mongodb+srv://santoshhadiya033:Santosh123@chatapp.7cx7bcp.mongodb.net/?retryWrites=true&w=majority&appName=chatApp"
  )
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

server.listen(PORT, () => {
  console.log("Running at PORT: " + PORT);
});
