const express=require('express');
const {getChats,setChats,sendRoomChats,userChats}=require("../Controllers/chatsController")


const router=express.Router();


router.get("/", getChats);
router.post("/", setChats);
router.post("/roomChats", sendRoomChats)
router.post("/userChats", userChats)

module.exports=router;