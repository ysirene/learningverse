const express = require("express");
const router = express.Router();

const socket = require("socket.io");
const io = new socket.Server(global.server);

router.get("/:roomId", (req, res) => {
  res.render("room");
});

const userInRooms = {}; //用於追蹤使用者所在的room

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName, cameraStatus) => {
    console.log("有新朋友！", roomId, userId);

    // 離開之前的房間
    const previousRoomId = userInRooms[userId];
    if (previousRoomId) {
      socket.leave(previousRoomId); //不再接收舊房間的通知
      socket.broadcast.to(previousRoomId).emit("user-disconnected", userId);
      console.log(userId + "離開" + previousRoomId);
    }

    //讓socket進入房間，可以接收到該房間的通知
    socket.join(roomId);
    userInRooms[userId] = roomId;

    // 通知有新的使用者進房間
    socket.to(roomId).emit("user-connected", userId, userName, cameraStatus);

    // 鏡頭開關→顯示或隱藏遮罩
    socket.on("camera-status-change", (userId) => {
      io.in(roomId).emit("toggle-video-mask", userId);
    });

    // 接收與傳送文字訊息
    socket.on("send-msg", (roomId, userName, time, msgText) => {
      io.in(roomId).emit("receive-msg", userName, time, msgText);
    });

    socket.on("disconnect", () => {
      console.log(userId + "離開" + roomId);
      delete userInRooms[userId];
    });
  });
});

module.exports = router;
