const mainElem = document.getElementsByTagName("main")[0];
const roomId = window.location.pathname.split("/")[2];
const socket = io("/");
const peers = [];
let showMsgPanel = false;
let showParticipantPanel = false;
let showCourseInfoPanel = false;
// let handsUp = false;
let peer;

// 從prepareRoom切換到meetingRoom
const enterMeetingRoomBtn = document.querySelector(".confirm__btn");
enterMeetingRoomBtn.addEventListener("click", (event) => {
  if (classRole == 2 || classRole == 4) {
    const confirmBtn = document.querySelector(".confirm__btn");
    const loadingBtn = document.querySelector(".confirm__btn--loading");
    confirmBtn.setAttribute("style", "display: none");
    loadingBtn.setAttribute("style", "display: block");
    socket.emit(
      "join-room",
      roomId,
      userInfo.id,
      userInfo.name,
      userInfo.img,
      myCameraStatus
    );
    socket.on("get-enter-accept", (auditId) => {
      if (auditId == userInfo.id) {
        enterMeetingRoom();
      }
    });
    socket.on("get-enter-reject", (auditId) => {
      if (auditId == userInfo.id) {
        socket.disconnect();
        const loadingBtn = document.querySelector(".confirm__btn--loading");
        const rejectMsg = document.querySelector(".reject_msg");
        loadingBtn.setAttribute("style", "display: none");
        rejectMsg.classList.remove("elem--hide");
      }
    });
  } else if (classRole == 1 || classRole == 3) {
    console.log("classRole == 1 || classRole == 3");
    enterMeetingRoom();
    if (classRole == 3) {
      socket.on("enter-request", (userId, userName) => {
        console.log(userName + "請求旁聽");
        const promptDiv = document.createElement("div");
        promptDiv.setAttribute("class", "prompt");
        const promptTitleDiv = document.createElement("div");
        promptTitleDiv.textContent = userName + " 請求旁聽";
        const btnContainer = document.createElement("div");
        btnContainer.setAttribute("class", "prompt__btn_container");
        const acceptBtn = document.createElement("button");
        acceptBtn.textContent = "接受";
        acceptBtn.addEventListener("click", () => {
          socket.emit("accept-enter", userId);
          promptDiv.remove();
        });
        const rejectBtn = document.createElement("button");
        rejectBtn.textContent = "拒絕";
        rejectBtn.addEventListener("click", () => {
          socket.emit("reject-enter", userId);
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
  // 清除prepareRoom的HTML
  while (mainElem.firstChild) {
    mainElem.removeChild(mainElem.lastChild);
  }
  // 將prepareRoom.css改成meetingRoom.css
  const prepareRoomCssLink = document.getElementsByTagName("link")[3];
  prepareRoomCssLink.setAttribute("href", "/css/meetingRoom.css");
  const body = document.getElementsByTagName("body")[0];
  body.classList.remove("body--normal");
  // 渲染meetingRoom前端切版
  renderRoomPage();
  addMyVideoStream(myStream, userInfo.name, userInfo.id, myCameraStatus);
  addToParticipantLst(userInfo.name, userInfo.id, userInfo.img);
  renderRoomId();
  startTime();
  registerPeer(userInfo.id, userInfo.name, userInfo.img);
}

// 將課程資料中的日期格式化
function formatDate(date) {
  let year = date.getFullYear();
  let month = (date.getMonth() + 1).toString().padStart(2, "0");
  let day = date.getDate().toString().padStart(2, "0");
  let formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

// 渲染meetingRoom畫面
function renderRoomPage() {
  // 上方區塊
  const upperSpaceSection = document.createElement("section");
  upperSpaceSection.setAttribute("class", "upper_space");
  // 上方區塊--視訊
  const videoContainerDiv = document.createElement("div");
  videoContainerDiv.setAttribute("class", "video_container");
  // 請求旁聽的訊息框
  const promptContainerDiv = document.createElement("div");
  promptContainerDiv.setAttribute("class", "prompt_container");
  videoContainerDiv.append(promptContainerDiv);
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
    "right_panel__participantContent scrollbar"
  );
  rightPanelParticipantDiv.append(
    rightPanelParticipantTitle,
    rightPanelParticipantContent
  );
  // 上方區塊--課程資訊
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
  const courseNameDiv = document.createElement("div"); // 課程名稱
  courseNameDiv.textContent = "課程名稱：" + courseInfo.name;
  const courseRoomIdDiv = document.createElement("div"); // 課程代碼
  courseRoomIdDiv.textContent = "課程代碼：" + courseInfo.room_id;
  const courseTeacherNameDiv = document.createElement("div"); // 教師姓名
  courseTeacherNameDiv.textContent = "授課教師：" + courseInfo.teacher_name;
  const startDate = new Date(courseInfo.start_date);
  const formattedStartDate = formatDate(startDate);
  const endDate = new Date(courseInfo.end_date);
  const formattedEndDate = formatDate(endDate);
  const courseDateDiv = document.createElement("div"); // 授課期間
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
  const courseTimeDiv = document.createElement("div"); // 上課時間
  courseTimeDiv.textContent = "上課時間：" + timeTextContent;
  const courseIntroductionDiv = document.createElement("div"); // 課程簡介
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
    // taskbarMainFunctionRaiseHandBtn,
    taskbarMainFunctionShareScreenBtn,
    taskbarMainFunctionLeaveBtn
  );
  // 下方的工具列--右
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
  // const taskbarMinorFunctionLotteryBtn = document.createElement("button");
  // taskbarMinorFunctionLotteryBtn.setAttribute("class", "btn__lottery");
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
  console.log(peer);
  peer.on("open", (userId) => {
    // 傳送join-room訊息server
    if (classRole == 1 || classRole == 3) {
      socket.emit("join-room", roomId, userId, myName, myImg, myCameraStatus);
    } else {
      socket.emit("ready", userId);
    }

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
  console.log(peer);
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
  if (userId != userInfo.id) {
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
  }
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
