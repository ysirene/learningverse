const mainElem = document.getElementsByTagName("main")[0];
const roomId = window.location.pathname.split("/")[2];
const socket = io("/");
const peers = [];
let showMsgPanel = false;
let showParticipantPanel = false;
// let handsUp = false;
let peer;

// 從prepareRoom切換到meetingRoom
const enterMeetingRoomBtn = document.querySelector(".confirm__btn");
enterMeetingRoomBtn.addEventListener("click", (event) => {
  event.preventDefault();
  // 清除prepareRoom的HTML
  while (mainElem.firstChild) {
    mainElem.removeChild(mainElem.lastChild);
  }
  // 將prepareRoom.css改成meetingRoom.css
  const prepareRoomCssLink = document.getElementsByTagName("link")[3];
  prepareRoomCssLink.setAttribute("href", "/css/meetingRoom.css");
  // 渲染meetingRoom前端切版
  renderRoomPage();
  addMyVideoStream(myStream, userInfo.name, userInfo.id, myCameraStatus);
  addToParticipantLst(userInfo.name, userInfo.id, userInfo.img);
  renderRoomId();
  startTime();
  registerPeer(userInfo.id, userInfo.name, userInfo.img);
});

// 渲染meetingRoom畫面
function renderRoomPage() {
  // 上方區塊
  const upperSpaceSection = document.createElement("section");
  upperSpaceSection.setAttribute("class", "upper_space");
  // 上方區塊--視訊
  const videoContainerDiv = document.createElement("div");
  videoContainerDiv.setAttribute("class", "video_container");
  // 上方區塊--文字訊息
  const rightPanelMsgDiv = document.createElement("div");
  rightPanelMsgDiv.setAttribute("class", "right_panel elem--hide");
  rightPanelMsgDiv.setAttribute("id", "right_panel__msg");
  const rightPanelMsgTitle = document.createElement("div");
  rightPanelMsgTitle.setAttribute("class", "right_panel__title");
  rightPanelMsgTitle.textContent = "教室內的訊息";
  const rightPanelMsgContent = document.createElement("div");
  rightPanelMsgContent.setAttribute(
    "class",
    "right_panel__msg_content right_panel__scrollbar"
  );
  const rightPanelMsgForm = document.createElement("form");
  rightPanelMsgForm.setAttribute("class", "send_msg__form");
  const rightPanelMsgInput = document.createElement("input");
  rightPanelMsgInput.setAttribute("class", "send_msg__input");
  rightPanelMsgInput.setAttribute("type", "text");
  rightPanelMsgInput.setAttribute("name", "msg");
  rightPanelMsgInput.setAttribute("placeholder", "傳送訊息");
  rightPanelMsgInput.required = true;
  const rightPanelMsgSubmitBtn = document.createElement("button");
  rightPanelMsgSubmitBtn.setAttribute("class", "send_msg__btn");
  rightPanelMsgSubmitBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const sendMsgInput = document
      .querySelector(".send_msg__input")
      .value.trim();
    if (sendMsgInput) {
      const now = new Date();
      const hour = now.getHours();
      let minute = now.getMinutes();
      minute = checkTime(minute);
      const time = hour + ":" + minute;
      socket.emit("send-msg", roomId, userInfo.name, time, sendMsgInput);
    }
    document.querySelector(".send_msg__input").value = "";
  });
  const rightPanelMsgSubmitIcon = document.createElement("img");
  rightPanelMsgSubmitIcon.setAttribute("class", "send_msg__icon");
  rightPanelMsgSubmitIcon.setAttribute("src", "/image/send.png");
  rightPanelMsgSubmitBtn.append(rightPanelMsgSubmitIcon);
  rightPanelMsgForm.append(rightPanelMsgInput, rightPanelMsgSubmitBtn);
  rightPanelMsgDiv.append(
    rightPanelMsgTitle,
    rightPanelMsgContent,
    rightPanelMsgForm
  );
  // 上方區塊--參與者名單
  const rightPanelParticipantDiv = document.createElement("div");
  rightPanelParticipantDiv.setAttribute("class", "right_panel elem--hide");
  rightPanelParticipantDiv.setAttribute("id", "right_panel_participant");
  const rightPanelParticipantTitle = document.createElement("div");
  rightPanelParticipantTitle.setAttribute("class", "right_panel__title");
  rightPanelParticipantTitle.textContent = "參與者";
  const rightPanelParticipantContent = document.createElement("div");
  rightPanelParticipantContent.setAttribute(
    "class",
    "right_panel__participantContent right_panel__scrollbar"
  );
  rightPanelParticipantDiv.append(
    rightPanelParticipantTitle,
    rightPanelParticipantContent
  );
  upperSpaceSection.append(
    videoContainerDiv,
    rightPanelMsgDiv,
    rightPanelParticipantDiv
  );
  // 下方的工具列
  const taskbarSection = document.createElement("section");
  taskbarSection.setAttribute("class", "taskbar");
  // 下方的工具列--左
  const taskbarInfoDiv = document.createElement("div");
  taskbarInfoDiv.setAttribute("class", "taskbar__info");
  const taskbarTimeDiv = document.createElement("div");
  taskbarTimeDiv.setAttribute("class", "info__item");
  taskbarTimeDiv.setAttribute("id", "taskbar__time");
  const taskbarInfoSeparator = document.createElement("div");
  taskbarInfoSeparator.setAttribute("class", "info__item");
  taskbarInfoSeparator.textContent = "|";
  const taskbarRoomIdDiv = document.createElement("div");
  taskbarRoomIdDiv.setAttribute("class", "info__item");
  taskbarRoomIdDiv.setAttribute("id", "taskbar__room_id");
  taskbarInfoDiv.append(taskbarTimeDiv, taskbarInfoSeparator, taskbarRoomIdDiv);
  // 下方的工具列--中
  const taskbarMainFunctionDiv = document.createElement("div");
  taskbarMainFunctionDiv.setAttribute("class", "taskbar__main_function");
  // 關閉麥克風(紫色按鈕)
  const taskbarMainFunctionMicOffBtn = document.createElement("button");
  taskbarMainFunctionMicOffBtn.setAttribute("class", "btn__microphone--on");
  taskbarMainFunctionMicOffBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const turnOffMicBtn = document.querySelector(".btn__microphone--on");
    const turnOnMicaBtn = document.querySelector(".btn__microphone--off");
    turnOffMicBtn.classList.toggle("elem--hide");
    turnOnMicaBtn.classList.toggle("elem--hide");
    myStream.getAudioTracks()[0].enabled = false;
    myMicrophoneStatus = false;
  });

  // 開啟麥克風(紅色按鈕)
  const taskbarMainFunctionMicOnBtn = document.createElement("button");
  taskbarMainFunctionMicOnBtn.setAttribute("class", "btn__microphone--off");
  taskbarMainFunctionMicOnBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const turnOffMicBtn = document.querySelector(".btn__microphone--on");
    const turnOnMicaBtn = document.querySelector(".btn__microphone--off");
    turnOffMicBtn.classList.toggle("elem--hide");
    turnOnMicaBtn.classList.toggle("elem--hide");
    myStream.getAudioTracks()[0].enabled = true;
    myMicrophoneStatus = true;
  });

  if (myMicrophoneStatus == true) {
    taskbarMainFunctionMicOnBtn.classList.add("elem--hide");
  } else {
    taskbarMainFunctionMicOffBtn.classList.add("elem--hide");
  }
  // 關閉視訊(紫色按鈕)
  const taskbarMainFunctionCameraOffBtn = document.createElement("button");
  taskbarMainFunctionCameraOffBtn.setAttribute("class", "btn__camera--on");
  taskbarMainFunctionCameraOffBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const turnOffCameraBtn = document.querySelector(".btn__camera--on");
    const turnOnCameraBtn = document.querySelector(".btn__camera--off");
    turnOffCameraBtn.classList.toggle("elem--hide");
    turnOnCameraBtn.classList.toggle("elem--hide");
    myStream.getVideoTracks()[0].enabled = false;
    myCameraStatus = false;
    socket.emit("camera-status-change", userInfo.id);
  });

  // 開啟視訊(紅色按鈕)
  const taskbarMainFunctionCameraOnBtn = document.createElement("button");
  taskbarMainFunctionCameraOnBtn.setAttribute("class", "btn__camera--off");
  taskbarMainFunctionCameraOnBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const turnOffCameraBtn = document.querySelector(".btn__camera--on");
    const turnOnCameraBtn = document.querySelector(".btn__camera--off");
    turnOffCameraBtn.classList.toggle("elem--hide");
    turnOnCameraBtn.classList.toggle("elem--hide");
    myStream.getVideoTracks()[0].enabled = true;
    myCameraStatus = true;
    socket.emit("camera-status-change", userInfo.id);
  });

  if (myCameraStatus == true) {
    taskbarMainFunctionCameraOnBtn.classList.add("elem--hide");
  } else {
    taskbarMainFunctionCameraOffBtn.classList.add("elem--hide");
  }
  const taskbarMainFunctionRaiseHandBtn = document.createElement("button");
  taskbarMainFunctionRaiseHandBtn.setAttribute("class", "btn__raise_hand");
  const taskbarMainFunctionShareScreenBtn = document.createElement("button");
  taskbarMainFunctionShareScreenBtn.setAttribute("class", "btn__shear_screen");
  const taskbarMainFunctionLeaveBtn = document.createElement("button");
  taskbarMainFunctionLeaveBtn.setAttribute("class", "btn__leave_room");
  taskbarMainFunctionLeaveBtn.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = "/";
  });
  taskbarMainFunctionDiv.append(
    taskbarMainFunctionMicOnBtn,
    taskbarMainFunctionMicOffBtn,
    taskbarMainFunctionCameraOnBtn,
    taskbarMainFunctionCameraOffBtn,
    taskbarMainFunctionRaiseHandBtn,
    taskbarMainFunctionShareScreenBtn,
    taskbarMainFunctionLeaveBtn
  );
  // 下方的工具列--右
  const taskbarMinorFunctionDiv = document.createElement("div");
  taskbarMinorFunctionDiv.setAttribute("class", "taskbar__minor_function");
  const taskbarMinorFunctionMsgBtn = document.createElement("button");
  taskbarMinorFunctionMsgBtn.setAttribute("class", "btn__msg");
  taskbarMinorFunctionMsgBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const participantPanelElem = document.querySelector(
      "#right_panel_participant"
    );
    const msgPanelElem = document.querySelector("#right_panel__msg");
    if (showParticipantPanel) {
      participantPanelElem.classList.toggle("elem--hide");
      showParticipantPanel = false;
    }
    msgPanelElem.classList.toggle("elem--hide");
    showMsgPanel = !showMsgPanel;
  });
  const taskbarMinorFunctionParticipantBtn = document.createElement("button");
  taskbarMinorFunctionParticipantBtn.setAttribute("class", "btn__participant");
  taskbarMinorFunctionParticipantBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const participantPanelElem = document.querySelector(
      "#right_panel_participant"
    );
    const msgPanelElem = document.querySelector("#right_panel__msg");
    if (showMsgPanel) {
      msgPanelElem.classList.toggle("elem--hide");
      showMsgPanel = false;
    }
    participantPanelElem.classList.toggle("elem--hide");
    showParticipantPanel = !showParticipantPanel;
  });
  const taskbarMinorFunctionLotteryBtn = document.createElement("button");
  taskbarMinorFunctionLotteryBtn.setAttribute("class", "btn__lottery");
  taskbarMinorFunctionDiv.append(
    taskbarMinorFunctionMsgBtn,
    taskbarMinorFunctionParticipantBtn,
    taskbarMinorFunctionLotteryBtn
  );

  taskbarSection.append(
    taskbarInfoDiv,
    taskbarMainFunctionDiv,
    taskbarMinorFunctionDiv
  );

  mainElem.append(upperSpaceSection, taskbarSection);
}

// 在畫面左下顯示roomId
function renderRoomId() {
  const roomIdElem = document.querySelector("#taskbar__room_id");
  roomIdElem.textContent = roomId;
}

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

function registerPeer(userId, myName, myImg) {
  peer = new Peer(userId, {
    host: "/",
    port: "9000",
    // secure: true,
  });
  peer.on("open", (userId) => {
    // 傳送join-room訊息server
    socket.emit("join-room", roomId, userId, myName, myImg, myCameraStatus);

    // 如果有人call我，就傳送我的視訊和音訊
    peer.on("call", (call) => {
      console.log("欸有人call我");
      console.log("傳送我的畫面給其他使用者");
      call.answer(myStream);
      // 把已經在會議室的其他人的視訊畫面加到我的HTML中
      call.on("stream", (userVideoStream) => {
        if (!peers[call.peer]) {
          console.log("把已經在會議室的其他人的視訊畫面加到我的HTML中");
          addVideoStream(
            userVideoStream,
            call.metadata.name,
            call.metadata.id,
            call.metadata.camera
          );
          addToParticipantLst(
            call.metadata.name,
            call.metadata.id,
            call.metadata.img
          );
          peers[call.peer] = call;
          console.log(call.peer);
          // 當對方離開時，我要將他從視訊畫面和參與者名單中刪掉
          call.on("close", () => {
            const userContainerId = "userContainer" + call.peer;
            const userContainerElem = document.getElementById(userContainerId);
            userContainerElem.remove();
            const participantInfoId = "participantInfo" + call.peer;
            const participantInfoElem =
              document.getElementById(participantInfoId);
            participantInfoElem.remove();
            peers[call.peer] = false;
          });
        }
      });
    });
  });
}

// 開啟或關閉視訊畫面的灰色遮罩
function toggleVideoMask(userId) {
  const videoMaskId = "videoMask" + userId;
  const targetElem = document.getElementById(videoMaskId);
  targetElem.classList.toggle("elem--hide");
}

// 將視訊和音訊加入HTML中
function addVideoStream(stream, userName, userId, cameraStatus) {
  console.log("addVideoStream");
  const video = document.createElement("video");
  const videoId = "userVideo" + userId;
  video.className = "user_container__video";
  video.setAttribute("id", videoId);
  const userContainerId = "userContainer" + userId;
  const userContainerDiv = document.createElement("div");
  const userNameDiv = document.createElement("div");
  const videoMaskDiv = document.createElement("div");
  const videoMaskId = "videoMask" + userId;
  userContainerDiv.className = "user_container";
  userContainerDiv.setAttribute("id", userContainerId);
  userNameDiv.className = "user_container__name";
  userNameDiv.textContent = userName;
  videoMaskDiv.setAttribute("class", "user_container__mask elem--hide");
  videoMaskDiv.setAttribute("id", videoMaskId);
  video.className = "user_container__video";
  video.srcObject = stream;
  userContainerDiv.append(video, userNameDiv, videoMaskDiv);
  video.addEventListener("loadedmetadata", () => {
    console.log("videoEventListener");
    video.play();
    const videoContainerElem = document.querySelector(".video_container");
    videoContainerElem.append(userContainerDiv);
    if (!cameraStatus) {
      console.log(cameraStatus);
      console.log("他沒開鏡頭！" + userId);
      toggleVideoMask(userId);
    }
  });
}

// 加上我的視訊畫面
function addMyVideoStream(myStream, myName, myId, cameraStatus) {
  const myVideo = document.createElement("video");
  const myVideoId = "userVideo" + myId;
  myVideo.className = "user_container__video";
  myVideo.muted = true; //不要聽到自己的回音
  myVideo.setAttribute("id", myVideoId);
  const myContainerDiv = document.createElement("div");
  const myNameDiv = document.createElement("div");
  const myVideoMaskDiv = document.createElement("div");
  const myContainerId = "userContainer" + myId;
  const myVideoMaskId = "videoMask" + myId;
  myContainerDiv.className = "user_container";
  myContainerDiv.setAttribute("id", myContainerId);
  myNameDiv.className = "user_container__name";
  myNameDiv.textContent = myName;
  myVideoMaskDiv.setAttribute("class", "user_container__mask elem--hide");
  myVideoMaskDiv.setAttribute("id", myVideoMaskId);
  myVideo.className = "user_container__video";
  myVideo.srcObject = myStream;
  myContainerDiv.append(myVideo, myNameDiv, myVideoMaskDiv);
  myVideo.addEventListener("loadedmetadata", () => {
    console.log("videoEventListener");
    myVideo.play();
    const videoContainerElem = document.querySelector(".video_container");
    videoContainerElem.append(myContainerDiv);
    if (!cameraStatus) {
      console.log("我沒開鏡頭！" + myId);
      toggleVideoMask(myId);
    }
  });
}

// 加入參與者清單
function addToParticipantLst(name, id, img) {
  const participantInfoDiv = document.createElement("div");
  participantInfoDiv.setAttribute("class", "participant__info");
  const participantInfoDivId = "participantInfo" + id;
  participantInfoDiv.setAttribute("id", participantInfoDivId);
  const userImg = document.createElement("img");
  userImg.setAttribute("class", "right_panel__user_img");
  const userImgSrc = "https://d277hbzet0a7g8.cloudfront.net/userImage/" + img;
  userImg.setAttribute("src", userImgSrc);
  const usernameSpan = document.createElement("span");
  usernameSpan.textContent = name;
  participantInfoDiv.append(userImg, usernameSpan);
  const rightPanelParticipantContentElem = document.querySelector(
    ".right_panel__participantContent"
  );
  rightPanelParticipantContentElem.append(participantInfoDiv);
}

function connectedToNewUser(
  userId,
  userName,
  userImg,
  mystream,
  myId,
  myName,
  myImg,
  cameraStatus
) {
  // userId是對方的，這句的意思是我打給對方並將我的視訊和音訊傳遞過去
  console.log("我要打給", userId);
  const options = {
    metadata: { name: myName, id: myId, img: myImg, camera: myCameraStatus },
  };
  const call = peer.call(userId, mystream, options);
  // 當對方回覆他的視訊和音訊給我時，我要將他的畫面加到我的HTML中
  call.on("stream", (userVideoStream) => {
    if (!peers[call.peer]) {
      console.log("對方傳送他的視訊給我了，我要把它放上畫面");
      addVideoStream(userVideoStream, userName, userId, cameraStatus);
      addToParticipantLst(userName, userId, userImg);
      peers[call.peer] = call;
    }
  });
  // 當對方離開時，我要將他從視訊畫面和參與者名單中刪掉
  call.on("close", () => {
    const userContainerId = "userContainer" + call.peer;
    const userContainerElem = document.getElementById(userContainerId);
    userContainerElem.remove();
    const participantInfoId = "participantInfo" + call.peer;
    const participantInfoElem = document.getElementById(participantInfoId);
    participantInfoElem.remove();
    peers[call.peer] = false;
  });
}

// 有人加入會議室時要取得peer連線
socket.on("user-connected", (userId, userName, userImg, cameraStatus) => {
  connectedToNewUser(
    userId,
    userName,
    userImg,
    myStream,
    userInfo.id,
    userInfo.name,
    userInfo.img,
    cameraStatus
  );
});
// 有人關鏡頭
socket.on("toggle-video-mask", (userId) => {
  toggleVideoMask(userId);
});

// 舉手或放下
// const raiseHandBtn = document.querySelector(".btn__raise_hand");
// raiseHandBtn.addEventListener("click", (event) => {
//   event.preventDefault();
//   if (handsUp == false) {
//     // 舉手
//     raiseHandBtn.setAttribute("style", "background-color: #7a89c2");
//     socket.emit("hands-up", userInfo.id);
//   }
// });
// socket.on("hands-up_broadcast", (userId) => {});

// 收到文字訊息
socket.on("receive-msg", (userName, time, msgText) => {
  const msgContentElem = document.querySelector(".right_panel__msg_content");
  const userNameSpan = document.createElement("span");
  const timeSpan = document.createElement("span");
  const msgTextDiv = document.createElement("div");
  userNameSpan.textContent = userName;
  timeSpan.setAttribute("class", "msg_content__time");
  timeSpan.textContent = time;
  msgTextDiv.textContent = msgText;
  msgContentElem.append(userNameSpan, timeSpan, msgTextDiv);
});
