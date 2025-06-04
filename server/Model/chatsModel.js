const mongoose = require("mongoose");

const chatsSchema = new mongoose.Schema({
  room:{
    type:String,
  },
  message: {
    type: String,
  },
  user: {
    type: String,
  },
  auth: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CHATS = mongoose.model("chat", chatsSchema);

module.exports = CHATS;
