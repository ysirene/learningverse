// // 驗證登入狀態
// function authenticateUser() {
//   return new Promise((resolve, reject) => {
//     if (localStorage.getItem("token")) {
//       let token = localStorage.getItem("token");
//       let src = "/api/user/auth";
//       let options = {
//         method: "GET",
//         headers: {
//           authorization: `Bearer ${token}`,
//         },
//       };
//       ajax(src, options)
//         .then((data) => {
//           if (data.data != null) {
//             userInfo = data.data;
//             resolve(userInfo);
//           } else {
//             window.location.href = "/";
//           }
//         })
//         .catch((error) => {
//           console.log(error);
//           reject(error);
//         });
//     } else {
//       window.location.href = "/";
//     }
//   });
// }

const roomId = window.location.pathname.split("/")[2];
const socket = io("/");
let peers = {};
const videoContainerElem = document.querySelector(".video_container");

const peer = new Peer(undefined, {
  host: "/",
  port: "5002",
});

// 將視訊和音訊加入HTML中
function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoContainerElem.append(video);
  });
}

function connectedToNewUser(userId, stream) {
  // userId是對方的，這句的意思是我打給對方並將我的視訊和音訊傳遞過去
  console.log("我要打給新朋友");
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  video.className = "user_video";
  // 當對方回覆他的視訊和音訊給我時，我要將他的畫面加到我的HTML中
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  // 當對方離開時，我要將video刪掉
  call.on("close", () => {
    console.log("call on的remove video");
    video.remove();
  });

  peers[userId] = call;
}

// 取得視訊和音訊的許可
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    // 將自己的視訊畫面加到HTML中
    const myVideo = document.createElement("video");
    myVideo.className = "user_video";
    myVideo.muted = true; //不要聽到自己的回音
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      // 如果有人call我，就傳送我的視訊和音訊
      console.log("欸有人call我！");
      call.answer(stream);
      // 把已經在會議室的其他人的視訊畫面加到我的HTML中
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    // 當我從伺服器端收到user-connected訊息時，我會取得對方的id，並將我的視訊和音訊傳給對方
    socket.on("user-connected", (userId) => {
      console.log("有新朋友！" + userId);
      connectedToNewUser(userId, stream);
    });
  })
  .catch((err) => {
    console.log(err);
  });

// 當peer連線成功時(open)，啟動這些程式碼
peer.on("open", (id) => {
  // 傳送join-room訊息server
  console.log("我連線到peer了");
  socket.emit("join-room", roomId, id);

  // 如果有人call我，就傳送我的視訊和音訊
  peer.on("call", (call) => {
    console.log("欸有人call我！");
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        call.answer(stream);
        // 把已經在會議室的其他人的視訊畫面加到我的HTML中
        const video = document.createElement("video");
        video.className = "user_video";
        call.on("stream", (userVideoStream) => {
          addVideoStream(video, userVideoStream);
        });
      });
  });
});

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) {
    peers[userId].close();
  }
});
