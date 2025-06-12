const CHATS = require("../Model/chatsModel");

const getChats = async (req, res) => {
  try {
    const chats = await CHATS.find();
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
};
const setChats = async (req, res) => {
  try {
    const { message, user, room } = req.body;

    if (!message || !user) {
      return res.status(400).send({ error: "Message and user are required" });
    }

    const result = await CHATS.create({ message, user, room });
    res.status(201).send(result);
  } catch (error) {
    console.error("Error saving chat:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};

const sendRoomChats = async (req, res) => {
  try {
    const { roomName } = req.body;
    const chats = await CHATS.find({ room: roomName });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
};

const userChats = async (req, res) => {
 
  try {
     const { fullName } = req.body;
    const chats = await CHATS.find({ user: fullName });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
};

const deleteAllChats = async (req, res) => {
  try {
    await CHATS.deleteMany({});
    res.send({ success: true, message: "All chats deleted!" });
  } catch (err) {
    res.status(500).send({ error: "Failed to delete chats" });
  }
};

module.exports = {
  getChats,
  setChats,
  sendRoomChats,
  userChats,
  deleteAllChats,
};
