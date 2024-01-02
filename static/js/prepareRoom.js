const token = sessionStorage.getItem("token");
let myStream;
let myCameraStatus = true;
let myMicrophoneStatus = true;
let userInfo;
let classRole;
let courseInfo;

// 驗證登入狀態
function authenticateUser() {
  return new Promise((resolve, reject) => {
    if (token) {
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
            const usernameElem = document.querySelector("#nav__username");
            const userImgElem = document.querySelector("#nav__user_img");
            const userImgBtn = document.querySelector(".nav__user_img");
            const userImgUrl =
              "https://d277hbzet0a7g8.cloudfront.net/userImage/" +
              data.data.img;
            const roleTranslate = {
              teacher: "老師",
              student: "同學",
            };
            usernameElem.textContent =
              data.data.name + " " + roleTranslate[data.data.role];
            usernameElem.classList.remove("elem--hide");
            userImgElem.setAttribute("src", userImgUrl);
            userImgBtn.classList.remove("elem--hide");
            resolve();
          } else {
            window.location.href = "/";
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      window.location.href = "/";
    }
  });
}

function checkClassRole() {
  return new Promise((resolve, reject) => {
    const roomId = window.location.pathname.split("/")[2];
    const src = "/api/myCourse/classRole?roomId=" + roomId;
    const options = {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    ajax(src, options).then((data) => {
      classRole = data.data.classRole;
      if (classRole == "audit" || classRole == "others") {
        const confirmBtn = document.querySelector("#confirm__btn_text");
        confirmBtn.textContent = "請求旁聽";
      }
    });
    resolve();
  });
}

function getMediaPermission() {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        myStream = stream;
        // 將自己的視訊預覽畫面加到HTML中
        const myVideo = document.querySelector("#previewMyVideo");
        myVideo.muted = true; //不要聽到自己的回音
        myVideo.srcObject = stream;
        myVideo.addEventListener("loadedmetadata", () => {
          myVideo.play();
        });
        resolve();
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}

function getCourseInfo() {
  return new Promise((resolve, reject) => {
    const src = "/api/course/roomId/" + roomId;
    const options = {
      method: "GET",
    };
    ajax(src, options).then((data) => {
      courseInfo = data.data;
      if (courseInfo == undefined) {
        alert("課程代碼不正確，請檢查後再輸入一次");
        window.location.href = "/";
      }
      resolve();
    });
  });
}

(async function runPrepareRoom() {
  try {
    await authenticateUser(); // 驗證會員
    await getCourseInfo();
    await checkClassRole(); // 確認在課堂中的身分
    await getMediaPermission(); // 顯示預覽視訊
  } catch (err) {
    console.log(err);
  }
})();

// 關閉或開啟麥克風
const prepareTurnOffMicBtn = document.querySelector("#prepare__microphone--on");
const prepareTurnOnMicBtn = document.querySelector("#prepare__microphone--off");
// 關閉
prepareTurnOffMicBtn.addEventListener("click", (event) => {
  event.preventDefault();
  prepareTurnOffMicBtn.classList.toggle("elem--hide");
  prepareTurnOnMicBtn.classList.toggle("elem--hide");
  myStream.getAudioTracks()[0].enabled = false;
  myMicrophoneStatus = false;
  console.log("關閉麥克風");
  console.log(myMicrophoneStatus);
});
// 開啟
prepareTurnOnMicBtn.addEventListener("click", (event) => {
  event.preventDefault();
  prepareTurnOffMicBtn.classList.toggle("elem--hide");
  prepareTurnOnMicBtn.classList.toggle("elem--hide");
  myStream.getAudioTracks()[0].enabled = true;
  myMicrophoneStatus = true;
  console.log("開啟麥克風");
  console.log(myMicrophoneStatus);
});

// 關閉或開啟視訊
const prepareTurnOffCameraBtn = document.querySelector("#prepare__camera--on");
const prepareTurnOnCameraBtn = document.querySelector("#prepare__camera--off");
// 關閉
prepareTurnOffCameraBtn.addEventListener("click", (event) => {
  event.preventDefault();
  prepareTurnOffCameraBtn.classList.toggle("elem--hide");
  prepareTurnOnCameraBtn.classList.toggle("elem--hide");
  myStream.getVideoTracks()[0].enabled = false;
  myCameraStatus = false;
  console.log("關閉鏡頭");
  console.log(myCameraStatus);
});
// 開啟
prepareTurnOnCameraBtn.addEventListener("click", (event) => {
  event.preventDefault();
  prepareTurnOffCameraBtn.classList.toggle("elem--hide");
  prepareTurnOnCameraBtn.classList.toggle("elem--hide");
  myStream.getVideoTracks()[0].enabled = true;
  myCameraStatus = true;
  console.log("開啟鏡頭");
  console.log(myCameraStatus);
});
