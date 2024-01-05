const mainElem = document.getElementsByTagName("main")[0];
const roomId = window.location.pathname.split("/")[2];
const socket = io("/");
const peers = [];
const shareScreenConnections = [];
let showMsgPanel = false;
let showParticipantPanel = false;
let showCourseInfoPanel = false;
let shareScreenStream = false;
let shareScreenStatus = false;
let peer;

// 從prepareRoom切換到meetingRoom
const enterMeetingRoomBtn = document.querySelector(".confirm__btn");
enterMeetingRoomBtn.addEventListener("click", () => {
  if (classRole == "audit" || classRole == "others") {
    const loadingBtn = document.querySelector(".confirm__btn--loading");
    enterMeetingRoomBtn.setAttribute("style", "display: none");
    loadingBtn.setAttribute("style", "display: block");
    socket.emit(
      "join-room",
      roomId,
      userInfo.id,
      `Bearer ${token}`,
      myCameraStatus
    );
    socket.on("get-enter-accept", () => {
      enterMeetingRoom();
    });
    socket.on("get-enter-reject", () => {
      socket.disconnect();
      const loadingBtn = document.querySelector(".confirm__btn--loading");
      const rejectMsg = document.querySelector(".reject_msg");
      loadingBtn.setAttribute("style", "display: none");
      rejectMsg.classList.remove("elem--hide");
    });
    socket.on("entry-failed", (msg) => {
      socket.disconnect();
      alert(msg);
      window.location.href = "/";
    });
  } else if (classRole == "assurance" || classRole == "instructor") {
    enterMeetingRoom();
    if (classRole == "instructor") {
      socket.on("enter-request", (userName, socketId) => {
        const promptDiv = document.createElement("div");
        promptDiv.setAttribute("class", "prompt");
        const promptTitleDiv = document.createElement("div");
        promptTitleDiv.textContent = userName + " 請求旁聽";
        const btnContainer = document.createElement("div");
        btnContainer.setAttribute("class", "prompt__btn_container");
        const acceptBtn = document.createElement("button");
        acceptBtn.textContent = "接受";
        acceptBtn.addEventListener("click", () => {
          socket.emit("accept-enter", socketId);
          promptDiv.remove();
        });
        const rejectBtn = document.createElement("button");
        rejectBtn.textContent = "拒絕";
        rejectBtn.addEventListener("click", () => {
          socket.emit("reject-enter", socketId);
          promptDiv.remove();
        });
        btnContainer.append(acceptBtn, rejectBtn);
        promptDiv.append(promptTitleDiv, btnContainer);
        const promptContainerElem = document.querySelector(".prompt_container");
        promptContainerElem.append(promptDiv);
      });
    }
  }
});

function enterMeetingRoom() {
  while (mainElem.firstChild) {
    mainElem.removeChild(mainElem.lastChild);
  }

  const prepareRoomCssLink = document.getElementsByTagName("link")[3];
  prepareRoomCssLink.setAttribute("href", "/css/meetingRoom.css");
  const body = document.getElementsByTagName("body")[0];
  body.classList.remove("body--normal");

  renderMeetingRoomPage();
  addMyVideoStream(myStream, userInfo.name, userInfo.id, myCameraStatus);
  addToParticipantLst(userInfo.name, userInfo.id, userInfo.img);
  renderRoomId();
  startTime();
  registerPeer(userInfo.id);
}

function formatDate(date) {
  let year = date.getFullYear();
  let month = (date.getMonth() + 1).toString().padStart(2, "0");
  let day = date.getDate().toString().padStart(2, "0");
  let formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

function renderSharedScreen(screenStream) {
  const upperSpaceSection = document.querySelector(".upper_space");
  const screenVideoContainer = document.createElement("div");
  screenVideoContainer.setAttribute("class", "screen_container");
  const video = document.createElement("video");
  video.srcObject = screenStream;
  video.autoplay = true;
  screenVideoContainer.append(video);
  upperSpaceSection.insertBefore(
    screenVideoContainer,
    upperSpaceSection.firstChild
  );
}

function removeSharedScreen() {
  const screenVideoContainer = document.querySelector(".screen_container");
  screenVideoContainer.remove();
}

function stopSharingScreen() {
  shareScreenStream = false;
  shareScreenStatus = false;
  removeSharedScreen();
  for (let i = 0; i < shareScreenConnections.length; i++) {
    if (shareScreenConnections[i]) {
      shareScreenConnections[i].close();
      shareScreenConnections[i] = false;
    }
  }
}

function renderMeetingRoomPage() {
  const upperSpaceSection = document.createElement("section");
  upperSpaceSection.setAttribute("class", "upper_space");

  const videoContainerDiv = document.createElement("div");
  videoContainerDiv.setAttribute("class", "video_container scrollbar");
  const promptContainerDiv = document.createElement("div");
  promptContainerDiv.setAttribute("class", "prompt_container");
  videoContainerDiv.append(promptContainerDiv);

  const rightPanelMsgDiv = document.createElement("div");
  rightPanelMsgDiv.setAttribute("class", "right_panel elem--hide");
  rightPanelMsgDiv.setAttribute("id", "right_panel__msg");
  const rightPanelMsgTitle = document.createElement("div");
  rightPanelMsgTitle.setAttribute("class", "right_panel__title");
  rightPanelMsgTitle.textContent = "教室內的訊息";
  const rightPanelMsgContent = document.createElement("div");
  rightPanelMsgContent.setAttribute(
    "class",
    "right_panel__msg_content scrollbar"
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
  rightPanelMsgSubmitIcon.setAttribute(
    "src",
    "https://d277hbzet0a7g8.cloudfront.net/icon/send.png"
  );
  rightPanelMsgSubmitBtn.append(rightPanelMsgSubmitIcon);
  rightPanelMsgForm.append(rightPanelMsgInput, rightPanelMsgSubmitBtn);
  rightPanelMsgDiv.append(
    rightPanelMsgTitle,
    rightPanelMsgContent,
    rightPanelMsgForm
  );
  const rightPanelParticipantDiv = document.createElement("div");
  rightPanelParticipantDiv.setAttribute("class", "right_panel elem--hide");
  rightPanelParticipantDiv.setAttribute("id", "right_panel_participant");
  const rightPanelParticipantTitle = document.createElement("div");
  rightPanelParticipantTitle.setAttribute("class", "right_panel__title");
  rightPanelParticipantTitle.textContent = "參與者";
  const rightPanelParticipantContent = document.createElement("div");
  rightPanelParticipantContent.setAttribute(
    "class",
    "right_panel__participantContent scrollbar"
  );
  rightPanelParticipantDiv.append(
    rightPanelParticipantTitle,
    rightPanelParticipantContent
  );
  const rightPanelCourseInfoDiv = document.createElement("div");
  rightPanelCourseInfoDiv.setAttribute("class", "right_panel elem--hide");
  rightPanelCourseInfoDiv.setAttribute("id", "right_panel_course_info");
  const rightPanelCourseInfoTitle = document.createElement("div");
  rightPanelCourseInfoTitle.setAttribute("class", "right_panel__title");
  rightPanelCourseInfoTitle.textContent = "課程資訊";
  const rightPanelCourseInfoContent = document.createElement("div");
  rightPanelCourseInfoContent.setAttribute(
    "class",
    "right_panel__course_content scrollbar"
  );
  const courseNameDiv = document.createElement("div");
  courseNameDiv.textContent = "課程名稱：" + courseInfo.name;
  const courseRoomIdDiv = document.createElement("div");
  courseRoomIdDiv.textContent = "課程代碼：" + courseInfo.room_id;
  const courseTeacherNameDiv = document.createElement("div");
  courseTeacherNameDiv.textContent = "授課教師：" + courseInfo.teacher_name;
  const startDate = new Date(courseInfo.start_date);
  const formattedStartDate = formatDate(startDate);
  const endDate = new Date(courseInfo.end_date);
  const formattedEndDate = formatDate(endDate);
  const courseDateDiv = document.createElement("div");
  courseDateDiv.textContent =
    "授課期間：" + formattedStartDate + " ~ " + formattedEndDate;
  const courseTimeArr = courseInfo.time.split(", ");
  let timeTextContent = "";
  const timeTranslate = {
    morning: "9:00~12:00",
    afternoon: "14:00~17:00",
    night: "19:00~22:00",
  };
  for (let i = 0; i < courseTimeArr.length; i++) {
    const timeArr = courseTimeArr[i].split(" ");
    let tempText = "每周" + timeArr[0] + " " + timeTranslate[timeArr[1]];
    if (i != courseTimeArr.length - 1) {
      tempText += "、";
    }
    timeTextContent += tempText;
  }
  const courseTimeDiv = document.createElement("div");
  courseTimeDiv.textContent = "上課時間：" + timeTextContent;
  const courseIntroductionDiv = document.createElement("div");
  courseIntroductionDiv.textContent = "課程簡介：" + courseInfo.introduction;
  rightPanelCourseInfoContent.append(
    courseNameDiv,
    courseRoomIdDiv,
    courseTeacherNameDiv,
    courseDateDiv,
    courseTimeDiv,
    courseIntroductionDiv
  );
  rightPanelCourseInfoDiv.append(
    rightPanelCourseInfoTitle,
    rightPanelCourseInfoContent
  );

  upperSpaceSection.append(
    videoContainerDiv,
    rightPanelMsgDiv,
    rightPanelParticipantDiv,
    rightPanelCourseInfoDiv
  );

  const taskbarSection = document.createElement("section");
  taskbarSection.setAttribute("class", "taskbar");
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
  const taskbarMainFunctionDiv = document.createElement("div");
  taskbarMainFunctionDiv.setAttribute("class", "taskbar__main_function");
  const taskbarMainFunctionMicOffBtn = document.createElement("button");
  taskbarMainFunctionMicOffBtn.setAttribute("class", "btn__microphone--on");
  taskbarMainFunctionMicOffBtn.addEventListener("click", () => {
    const turnOffMicBtn = document.querySelector(".btn__microphone--on");
    const turnOnMicaBtn = document.querySelector(".btn__microphone--off");
    turnOffMicBtn.classList.toggle("elem--hide");
    turnOnMicaBtn.classList.toggle("elem--hide");
    myStream.getAudioTracks()[0].enabled = false;
    myMicrophoneStatus = false;
  });
  const taskbarMainFunctionMicOnBtn = document.createElement("button");
  taskbarMainFunctionMicOnBtn.setAttribute("class", "btn__microphone--off");
  taskbarMainFunctionMicOnBtn.addEventListener("click", () => {
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
  const taskbarMainFunctionCameraOffBtn = document.createElement("button");
  taskbarMainFunctionCameraOffBtn.setAttribute("class", "btn__camera--on");
  taskbarMainFunctionCameraOffBtn.addEventListener("click", () => {
    const turnOffCameraBtn = document.querySelector(".btn__camera--on");
    const turnOnCameraBtn = document.querySelector(".btn__camera--off");
    turnOffCameraBtn.classList.toggle("elem--hide");
    turnOnCameraBtn.classList.toggle("elem--hide");
    myStream.getVideoTracks()[0].enabled = false;
    myCameraStatus = false;
    socket.emit("camera-status-change", userInfo.id);
  });
  const taskbarMainFunctionCameraOnBtn = document.createElement("button");
  taskbarMainFunctionCameraOnBtn.setAttribute("class", "btn__camera--off");
  taskbarMainFunctionCameraOnBtn.addEventListener("click", () => {
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
  const taskbarMainFunctionShareScreenBtn = document.createElement("button");
  taskbarMainFunctionShareScreenBtn.setAttribute("class", "btn__shear_screen");
  taskbarMainFunctionShareScreenBtn.addEventListener("click", () => {
    if (shareScreenStatus === "I shared the screen") {
      shareScreenStream.getVideoTracks()[0].stop();
      stopSharingScreen();
    } else if (shareScreenStatus === "remote user shared the screen") {
      alert("其他用戶正在分享螢幕");
    } else {
      navigator.mediaDevices
        .getDisplayMedia({
          video: { cursor: "always" },
          audio: { echoCancellation: true, noiseSuppression: true },
        })
        .then((screenStream) => {
          shareScreenStream = screenStream;
          shareScreenStatus = "I shared the screen";
          for (const existCall of peers) {
            if (existCall) {
              const options = {
                metadata: { type: "screen" },
              };
              const call = peer.call(existCall.peer, screenStream, options);
              shareScreenConnections[call.peer] = call;
            }
          }
          renderSharedScreen(screenStream);
          screenStream.getVideoTracks()[0].onended = function () {
            stopSharingScreen();
          };
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });
  const taskbarMainFunctionLeaveBtn = document.createElement("button");
  taskbarMainFunctionLeaveBtn.setAttribute("class", "btn__leave_room");
  taskbarMainFunctionLeaveBtn.addEventListener("click", () => {
    window.location.href = "/";
  });
  taskbarMainFunctionDiv.append(
    taskbarMainFunctionMicOnBtn,
    taskbarMainFunctionMicOffBtn,
    taskbarMainFunctionCameraOnBtn,
    taskbarMainFunctionCameraOffBtn,
    taskbarMainFunctionShareScreenBtn,
    taskbarMainFunctionLeaveBtn
  );

  const taskbarMinorFunctionDiv = document.createElement("div");
  taskbarMinorFunctionDiv.setAttribute("class", "taskbar__minor_function");
  const taskbarMinorFunctionCourseInfoBtn = document.createElement("button");
  taskbarMinorFunctionCourseInfoBtn.setAttribute("class", "btn__info");
  taskbarMinorFunctionCourseInfoBtn.addEventListener("click", () => {
    const courseInfoPanelElem = document.querySelector(
      "#right_panel_course_info"
    );
    const participantPanelElem = document.querySelector(
      "#right_panel_participant"
    );
    const msgPanelElem = document.querySelector("#right_panel__msg");
    if (showParticipantPanel) {
      participantPanelElem.classList.toggle("elem--hide");
      showParticipantPanel = false;
    }
    if (showMsgPanel) {
      msgPanelElem.classList.toggle("elem--hide");
      showMsgPanel = false;
    }
    courseInfoPanelElem.classList.toggle("elem--hide");
    showCourseInfoPanel = !showCourseInfoPanel;
  });
  const taskbarMinorFunctionMsgBtn = document.createElement("button");
  taskbarMinorFunctionMsgBtn.setAttribute("class", "btn__msg");
  taskbarMinorFunctionMsgBtn.addEventListener("click", () => {
    const courseInfoPanelElem = document.querySelector(
      "#right_panel_course_info"
    );
    const participantPanelElem = document.querySelector(
      "#right_panel_participant"
    );
    const msgPanelElem = document.querySelector("#right_panel__msg");
    if (showParticipantPanel) {
      participantPanelElem.classList.toggle("elem--hide");
      showParticipantPanel = false;
    }
    if (showCourseInfoPanel) {
      courseInfoPanelElem.classList.toggle("elem--hide");
      showCourseInfoPanel = false;
    }
    msgPanelElem.classList.toggle("elem--hide");
    showMsgPanel = !showMsgPanel;
  });
  const taskbarMinorFunctionParticipantBtn = document.createElement("button");
  taskbarMinorFunctionParticipantBtn.setAttribute("class", "btn__participant");
  taskbarMinorFunctionParticipantBtn.addEventListener("click", () => {
    const courseInfoPanelElem = document.querySelector(
      "#right_panel_course_info"
    );
    const participantPanelElem = document.querySelector(
      "#right_panel_participant"
    );
    const msgPanelElem = document.querySelector("#right_panel__msg");
    if (showCourseInfoPanel) {
      courseInfoPanelElem.classList.toggle("elem--hide");
      showCourseInfoPanel = false;
    }
    if (showMsgPanel) {
      msgPanelElem.classList.toggle("elem--hide");
      showMsgPanel = false;
    }
    participantPanelElem.classList.toggle("elem--hide");
    showParticipantPanel = !showParticipantPanel;
  });
  taskbarMinorFunctionDiv.append(
    taskbarMinorFunctionCourseInfoBtn,
    taskbarMinorFunctionMsgBtn,
    taskbarMinorFunctionParticipantBtn
  );

  taskbarSection.append(
    taskbarInfoDiv,
    taskbarMainFunctionDiv,
    taskbarMinorFunctionDiv
  );

  mainElem.append(upperSpaceSection, taskbarSection);
}

function renderRoomId() {
  const roomIdElem = document.querySelector("#taskbar__room_id");
  roomIdElem.textContent = roomId;
}

function checkTime(num) {
  if (num < 10) {
    num = "0" + num;
  }
  return num;
}

function startTime() {
  let today = new Date();
  let hour = today.getHours();
  let minute = today.getMinutes();
  const timeElem = document.querySelector("#taskbar__time");
  minute = checkTime(minute);
  timeElem.textContent = hour + ":" + minute;
  setTimeout(startTime, 1000);
}

function registerPeer(userId) {
  peer = new Peer(userId, {
    host: "/",
    port: "9000",
    // secure: true,
  });

  peer.on("open", (userId) => {
    peer.on("call", (call) => {
      if (call.metadata.type === "video") {
        // 其他用戶嘗試建立視訊連線時，將我的媒體流傳送給對方
        call.answer(myStream);
      } else if (call.metadata.type === "screen") {
        // 其他用戶分享螢幕畫面時
        call.answer();
      }

      // 把已經在會議室的其他人的視訊畫面加到我的HTML中
      call.on("stream", (stream) => {
        if (call.metadata.type === "video" && !peers[call.peer]) {
          addVideoStream(
            stream,
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

          // 當對方離開時，刪除他的媒體流並從參與者名單中移除
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
        } else if (
          call.metadata.type === "screen" &&
          shareScreenStatus === false
        ) {
          // 處理他人分享螢幕畫面的媒體流
          renderSharedScreen(stream);
          shareScreenStatus = "remote user shared the screen";
          shareScreenConnections[call.peer] = call;

          call.on("close", () => {
            removeSharedScreen();
            shareScreenStatus = false;
            shareScreenConnections[call.peer] = false;
          });
        }
      });
    });
    if (classRole == "assurance" || classRole == "instructor") {
      socket.emit(
        "join-room",
        roomId,
        userId,
        `Bearer ${token}`,
        myCameraStatus
      );
    } else {
      socket.emit("ready", userId);
    }
  });
}

function toggleVideoMask(userId) {
  const videoMaskId = "videoMask" + userId;
  const targetElem = document.getElementById(videoMaskId);
  targetElem.classList.toggle("elem--hide");
}

function addVideoStream(stream, userName, userId, cameraStatus) {
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
    video.play();
    const videoContainerElem = document.querySelector(".video_container");
    videoContainerElem.append(userContainerDiv);
    if (!cameraStatus) {
      toggleVideoMask(userId);
    }
  });
}

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
    myVideo.play();
    const videoContainerElem = document.querySelector(".video_container");
    videoContainerElem.append(myContainerDiv);
    if (!cameraStatus) {
      toggleVideoMask(myId);
    }
  });
}

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
  myMediaStream,
  myId,
  myName,
  myImg,
  cameraStatus
) {
  // 與對方建立peer連線，並將我的視訊和音訊傳遞過去
  const options = {
    metadata: {
      name: myName,
      id: myId,
      img: myImg,
      camera: myCameraStatus,
      type: "video",
    },
  };
  const call = peer.call(userId, myMediaStream, options);
  // 當對方回覆他的視訊和音訊給我時，我要將他的畫面加到我的HTML中
  call.on("stream", (userVideoStream) => {
    if (!peers[call.peer]) {
      addVideoStream(userVideoStream, userName, userId, cameraStatus);
      addToParticipantLst(userName, userId, userImg);
      peers[call.peer] = call;
    }
  });

  // 當對方離開時，將他從視訊畫面和參與者名單中刪掉
  call.on("close", () => {
    const userContainerId = "userContainer" + call.peer;
    const userContainerElem = document.getElementById(userContainerId);
    userContainerElem.remove();
    const participantInfoId = "participantInfo" + call.peer;
    const participantInfoElem = document.getElementById(participantInfoId);
    participantInfoElem.remove();
    peers[call.peer] = false;
    if (shareScreenConnections[call.peer]) {
      // 將對方從分享螢幕的連線中刪除
      shareScreenConnections[call.peer].close();
      shareScreenConnections[call.peer] = false;
    }
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
  if (shareScreenStream) {
    const options = {
      metadata: { type: "screen" },
    };
    const call = peer.call(userId, shareScreenStream, options);
    shareScreenConnections[userId] = call;
  }
});

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) {
    peers[userId].close();
  }
});

socket.on("toggle-video-mask", (userId) => {
  toggleVideoMask(userId);
});

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
