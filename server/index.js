const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const chatsRouter=require("./Router/chatsRouter")
const PORT=process.env.PORT || 3000;

let allRooms = [];
let roomUsers={};
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//Middel
app.use(express.static("public"));
app.use(express.json());
app.use(cors())

io.on("connection", (socket) => {

  socket.emit("roomList", allRooms)

  socket.on("join", (data) => {
    socket.userName = data.userName;
    
  });

 socket.on("joinRoom", (data) => {
  const room = data.room;

  socket.join(room);
  socket.currentRoom = room;

  if (!roomUsers[room]) roomUsers[room] = [];

  const alreadyExists = roomUsers[room].some(u => u.id === socket.id);
  if (!alreadyExists) {
    roomUsers[room].push({ id: socket.id, name: socket.userName });
  }

  // Send updated user list to room
 
  io.to(room).emit("roomUsers", roomUsers[room]);

  console.log(`${socket.userName} joined room ${room}`);
});

socket.on("disconnect", () => {
  const room = socket.currentRoom;
  if (room && roomUsers[room]) {
    roomUsers[room] = roomUsers[room].filter(u => u.id !== socket.id);

    // Send updated user list
    io.to(room).emit("roomUsers", roomUsers[room]);

    if (roomUsers[room].length === 0) delete roomUsers[room];
  }
});


  socket.on("sendMsg", (data) => {
    io.to(socket.currentRoom).emit("sendMsg", {
      room:data.room,
      message: data.msg,
      user: socket.userName,
      auth: socket.id,
    });
  });

  socket.on("addRoomList", (data) => {
    if (!allRooms.includes(data.room)) {
      allRooms.push(data.room);
      io.emit("addRoomList", { room: data.room });
    }
  });
});


app.use("/chats", chatsRouter);



//connection
mongoose.connect("mongodb+srv://santoshhadiya033:Santosh123@chatapp.7cx7bcp.mongodb.net/?retryWrites=true&w=majority&appName=chatApp")
.then(() => console.log("MongoDB connected successfully!"))
.catch((err) => console.error("MongoDB connection error:", err));

server.listen(PORT, () => {
  console.log("Running at PORT: "+ PORT);
});
