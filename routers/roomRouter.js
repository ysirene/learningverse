const express = require("express");
const router = express.Router();

const courseDataFetcher = require("../models/courseDataFetcher");

const socket = require("socket.io");
const io = new socket.Server(global.server);

router.get("/:roomId", (req, res) => {
  res.render("room");
});

const userInRooms = {}; //用於追蹤使用者所在的room
const instructorOfClass = {}; // 用於儲存授課老師的資料

io.on("connection", (socket) => {
  socket.on(
    "join-room",
    async (roomId, userId, userName, userImg, cameraStatus) => {
      console.log("有新朋友！", roomId, userId);

      // 取得授課老師的userId
      let instructorId;
      if (roomId in instructorOfClass) {
        instructorId = instructorOfClass.roomId;
      } else {
        const result = await courseDataFetcher.getTeacherId(roomId);
        instructorId = result.teacher_id;
        instructorOfClass.roomId = instructorId;
      }

      // 用戶是授課老師→直接進入會議室；用戶不是授課老師→確認學生是否為正式選課的學生
      let studentRole = null;
      if (userId == instructorId) {
        // 通知有新的使用者進房間
        socket
          .to(roomId)
          .emit("user-connected", userId, userName, userImg, cameraStatus);
      } else {
        studentRole = await courseDataFetcher.getClassRole(userId, roomId);
        // 如果學生為正式選課，則直接進入房間
        if (studentRole == 1) {
          // 通知有新的使用者進房間
          socket
            .to(roomId)
            .emit("user-connected", userId, userName, userImg, cameraStatus);
        } else {
          io.in(roomId)
            .to(instructorId)
            .emit("enter-request", userId, userName);
          console.log("發送請求旁聽給" + instructorId);
        }
      }

      socket.on("accept-enter", (auditId) => {
        console.log(auditId + "收到允許了！");
        io.in(roomId).to(auditId).emit("get-enter-accept");
        socket
          .to(roomId)
          .emit("user-connected", userId, userName, userImg, cameraStatus);
      });

      socket.on("reject-enter", (auditId) => {
        console.log(auditId + "旁聽被拒");
        io.in(roomId).to(auditId).emit("get-enter-reject");
      });

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
    }
  );
});

module.exports = router;
