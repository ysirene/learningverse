const express = require("express");
const router = express.Router();

router.get("/:roomId", (req, res) => {
  res.render("room");
});

global.io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    console.log(roomId, userId);

    // 通知有新的使用者進房間
    socket.join(roomId); //讓socket進入房間
    socket.broadcast.to(roomId).emit("user-connected", userId); //socket廣播通知

    socket.on("disconnect", () => {
      console.log(userId + "離開");
      socket.broadcast.to(roomId).emit("user-disconnected", userId); //socket廣播通知
    });
  });
});

module.exports = router;
