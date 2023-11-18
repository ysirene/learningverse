const express = require("express");
const router = express.Router();

const io = require("socket.io")(global.server);

router.get("/:roomId", (req, res) => {
  res.render("room");
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    console.log("有新朋友！", roomId, userId);

    // 通知有新的使用者進房間
    socket.join(roomId); //讓socket進入房間
    socket.broadcast.to(roomId).emit("user-connected", userId, userName); //socket廣播通知

    socket.on("disconnect", () => {
      console.log(userId + "離開" + roomId);
      socket.broadcast.to(roomId).emit("user-disconnected", userId); //socket廣播通知
    });
  });
});

module.exports = router;
