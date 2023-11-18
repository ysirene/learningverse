const express = require("express");
const router = express.Router();

const io = require("socket.io")(global.server);

router.get("/:roomId", (req, res) => {
  res.render("room");
});

const userInRooms = {}; //用於追蹤使用者所在的room

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    console.log("有新朋友！", roomId, userId);

    // 離開之前的房間
    const previousRoomId = userInRooms[userId];
    if (previousRoomId) {
      socket.leave(previousRoomId); //不再接收舊房間的通知
      socket.broadcast.to(previousRoomId).emit("user-disconnected", userId);
    }

    // 通知有新的使用者進房間
    socket.join(roomId); //讓socket進入房間，可以接收到該房間的通知
    userInRooms[userId] = roomId;
    socket.broadcast.to(roomId).emit("user-connected", userId, userName); //socket廣播通知

    socket.on("disconnect", () => {
      console.log(userId + "離開" + roomId);
      socket.broadcast.to(roomId).emit("user-disconnected", userId); //socket廣播通知
      delete userInRooms[userId];
    });
  });
});

module.exports = router;
