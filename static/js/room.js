const roomId = window.location.pathname.split("/")[2];
const socket = io("/");
let peers = {};
// TODO:研究callList
let callList = [];
let peer;
let userInfo;
let myStream;
const videoContainerElem = document.querySelector(".video_container");

// 在畫面左下顯示roomId
(function renderRoomId() {
  const roomIdElem = document.querySelector("#taskbar__room_id");
  roomIdElem.textContent = roomId;
})();

// 在時間格式中埔0
function checkTime(num) {
  if (num < 10) {
    num = "0" + num;
  }
  return num;
}

// 讓時鐘運作
function startTime() {
  let today = new Date();
  let hour = today.getHours();
  let minute = today.getMinutes();
  const timeElem = document.querySelector("#taskbar__time");
  minute = checkTime(minute);
  timeElem.textContent = hour + ":" + minute;
  setTimeout(startTime, 1000);
}
document.addEventListener("DOMContentLoaded", startTime());

// 驗證登入狀態
function authenticateUser() {
  return new Promise((resolve, reject) => {
    if (sessionStorage.getItem("token")) {
      let token = sessionStorage.getItem("token");
      let src = "/api/user/auth";
      let options = {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      ajax(src, options)
        .then((data) => {
          if (data.data != null) {
            userInfo = data.data;
            resolve();
          } else {
            window.location.href = "/";
          }
        })
        .catch((error) => {
          console.log(error);
          reject(error);
        });
    } else {
      window.location.href = "/";
    }
  });
}

function registerPeer(userId, myName) {
  peer = new Peer(userId, {
    host: "/",
    port: "443",
    secure: true,
  });
  peer.on("open", (userId) => {
    // 傳送join-room訊息server
    socket.emit("join-room", roomId, userId, myName);

    // 如果有人call我，就傳送我的視訊和音訊
    peer.on("call", (call) => {
      console.log("欸有人call我");
      console.log("傳送我的畫面給其他使用者");
      call.answer(myStream);
      // 把已經在會議室的其他人的視訊畫面加到我的HTML中
      const video = document.createElement("video");
      video.className = "user_container__video";
      call.on("stream", (userVideoStream) => {
        if (!callList[call.peer]) {
          console.log(call.metadata.name);
          console.log(call.metadata.id);
          console.log("把已經在會議室的其他人的視訊畫面加到我的HTML中");
          addVideoStream(
            video,
            userVideoStream,
            call.metadata.name,
            call.metadata.id
          );
          callList[call.peer] = call;
        }
      });
    });
  });
}

// 將視訊和音訊加入HTML中
function addVideoStream(video, stream, userName, userId) {
  console.log("addVideoStream");
  const userContainerId = "user" + userId;
  const userContainerDiv = document.createElement("div");
  const userNameDiv = document.createElement("div");
  userContainerDiv.className = "user_container";
  userContainerDiv.setAttribute("id", userContainerId);
  userNameDiv.className = "user_container__name";
  userNameDiv.textContent = userName;
  video.className = "user_container__video";
  video.srcObject = stream;
  userContainerDiv.append(video, userNameDiv);
  video.addEventListener("loadedmetadata", () => {
    console.log("videoEventListener");
    video.play();
    videoContainerElem.append(userContainerDiv);
  });
}

function connectedToNewUser(userId, userName, stream, myId, myName) {
  // userId是對方的，這句的意思是我打給對方並將我的視訊和音訊傳遞過去
  console.log("我要打給", userId);
  const options = { metadata: { name: myName, id: myId } };
  const call = peer.call(userId, stream, options);
  const video = document.createElement("video");
  video.className = "user_container__video";
  // 當對方回覆他的視訊和音訊給我時，我要將他的畫面加到我的HTML中
  call.on("stream", (userVideoStream) => {
    if (!callList[call.peer]) {
      console.log("對方傳送他的視訊給我了，我要把它放上畫面");
      addVideoStream(video, userVideoStream, userName, userId);
      callList[call.peer] = call;
    }
  });
  // 當對方離開時，我要將video刪掉
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

// 取得視訊和音訊的許可
function getMediaPermission(myName, myId) {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        myStream = stream;
        // 將自己的視訊畫面加到HTML中
        const myVideo = document.createElement("video");
        myVideo.className = "user_container__video";
        myVideo.muted = true; //不要聽到自己的回音
        addVideoStream(myVideo, stream, myName, myId);
        console.log("3");

        // 當我從伺服器端收到user-connected訊息時，我會取得對方的id，並將我的視訊和音訊傳給對方
        socket.on("user-connected", (userId, userName) => {
          connectedToNewUser(userId, userName, stream, myId, myName);
        });
        resolve();
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}

(async function run() {
  try {
    await authenticateUser(); // 驗證會員
    await getMediaPermission(userInfo.name, userInfo.id); // 取得視訊和音訊並放到畫面上
    registerPeer(userInfo.id, userInfo.name); // 用會員id連線peer
  } catch (err) {
    console.log(err);
  }
})();

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) {
    peers[userId].close();
    const userContainerId = "user" + userId;
    const userContainer = document.getElementById(userContainerId);
    userContainer.remove();
  }
});

// 暫停或開啟音訊
const turnOffMicBtn = document.querySelector(".btn__microphone--on");
const turnOnMicaBtn = document.querySelector(".btn__microphone--off");
turnOffMicBtn.addEventListener("click", (event) => {
  event.preventDefault();
  turnOffMicBtn.classList.toggle("elem--hide");
  turnOnMicaBtn.classList.toggle("elem--hide");
  myStream.getAudioTracks()[0].enabled = false;
});
turnOnMicaBtn.addEventListener("click", (event) => {
  event.preventDefault();
  turnOffMicBtn.classList.toggle("elem--hide");
  turnOnMicaBtn.classList.toggle("elem--hide");
  myStream.getAudioTracks()[0].enabled = true;
});

// 暫停或開啟視訊畫面
const turnOffCameraBtn = document.querySelector(".btn__camera--on");
const turnOnCameraBtn = document.querySelector(".btn__camera--off");
turnOffCameraBtn.addEventListener("click", (event) => {
  event.preventDefault();
  turnOffCameraBtn.classList.toggle("elem--hide");
  turnOnCameraBtn.classList.toggle("elem--hide");
  myStream.getVideoTracks()[0].enabled = false;
});
turnOnCameraBtn.addEventListener("click", (event) => {
  event.preventDefault();
  turnOffCameraBtn.classList.toggle("elem--hide");
  turnOnCameraBtn.classList.toggle("elem--hide");
  myStream.getVideoTracks()[0].enabled = true;
});
