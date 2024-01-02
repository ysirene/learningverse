const express = require("express");
const router = express.Router();

const tokenDataProcessor = require("../dataHandling/tokenDataProcessor");
const courseDataFetcher = require("../models/courseDataFetcher");

const socket = require("socket.io");
const io = new socket.Server(global.server);

router.get("/:roomId", (req, res) => {
  res.render("room");
});

const instructorOfClass = {}; // 用於儲存與追蹤授課老師

io.on("connection", (socket) => {
  socket.on("join-room", async (roomId, userId, token, cameraStatus) => {
    const userInfo = await tokenDataProcessor.decodeToken(token);
    const tokenUserId = userInfo.id;
    const userName = userInfo.name;
    const userImg = userInfo.img;
    const socketId = socket.id;
    console.log(userInfo.id, userInfo.name, "進入", roomId, "會議室");

    if (tokenUserId != userId) {
      const msg = "會員驗證有誤，請重新登入後再試一次";
      socket.emit("entry-failed", msg);
    }

    // 用戶是授課老師或正式選課的學生→直接進入會議室；否則請求進入
    const classRole = await courseDataFetcher.getClassRole(userId, roomId);
    if (classRole == "instructor") {
      instructorOfClass[roomId] = socketId; //儲存授課老師的id
    }
    if (classRole == "assurance" || classRole == "instructor") {
      socket
        .to(roomId)
        .emit("user-connected", userId, userName, userImg, cameraStatus);
    } else {
      if (roomId in instructorOfClass) {
        io.to(instructorOfClass[roomId]).emit(
          "enter-request",
          userName,
          socketId
        );
      } else {
        const msg = "授課老師不在線上，請稍後再發送旁聽請求";
        socket.emit("entry-failed", msg);
      }
    }

    socket.on("accept-enter", (userSocketId) => {
      io.to(userSocketId).emit("get-enter-accept");
    });

    socket.on("ready", (userId) => {
      socket
        .to(roomId)
        .emit("user-connected", userId, userName, userImg, cameraStatus);
    });

    socket.on("reject-enter", (userSocketId) => {
      io.to(userSocketId).emit("get-enter-reject");
    });

    socket.join(roomId);

    socket.on("camera-status-change", (userId) => {
      io.in(roomId).emit("toggle-video-mask", userId);
    });

    socket.on("send-msg", (roomId, userName, time, msgText) => {
      io.in(roomId).emit("receive-msg", userName, time, msgText);
    });

    socket.on("disconnect", () => {
      console.log(userInfo.id, userInfo.name, "離開", roomId, "會議室");
      if (classRole == "instructor") {
        delete instructorOfClass[roomId];
      }
      socket.to(roomId).emit("user-disconnected", userInfo.id);
    });
  });
});

module.exports = router;
