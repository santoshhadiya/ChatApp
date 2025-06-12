const express=require('express');
const {getChats,setChats,sendRoomChats,userChats,deleteAllChats}=require("../Controllers/chatsController")


const router=express.Router();


router.get("/", getChats);
router.post("/", setChats);
router.post("/roomChats", sendRoomChats);
router.post("/userChats", userChats);
router.delete("/deleteAll", deleteAllChats);


module.exports=router;