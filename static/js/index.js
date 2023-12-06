// 驗證登入狀態
function authenticateUser() {
  const signinBtnElem = document.querySelector("#nav__signinSignup");
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
          const usernameElem = document.querySelector("#nav__username");
          const userImgElem = document.querySelector("#nav__user_img");
          const userImgBtn = document.querySelector(".nav__user_img");
          const userImgUrl =
            "https://d277hbzet0a7g8.cloudfront.net/userImage/" + data.data.img;
          const sloganBtnElem = document.querySelector(".slogan__signin_btn");
          const enterRoomElem = document.querySelector(".enter_room");
          const roleTranslate = {
            teacher: "老師",
            student: "同學",
          };
          usernameElem.textContent =
            data.data.name + " " + roleTranslate[data.data.role];
          usernameElem.classList.remove("elem--hide");
          userImgElem.setAttribute("src", userImgUrl);
          userImgBtn.classList.remove("elem--hide");
          if (data.data.role == "student") {
            const createRoomBtn = document.querySelector(
              ".enter_room__create_btn"
            );
            const orText = document.querySelector(".enter_room__text");
            createRoomBtn.classList.add("elem--hide");
            orText.classList.add("elem--hide");
          }
          enterRoomElem.style.display = "flex";
          sloganBtnElem.classList.add("elem--hide");
        } else {
          signinBtnElem.classList.remove("elem--hide");
        }
      })
      .catch((error) => {
        console.log(error);
      });
  } else {
    signinBtnElem.classList.remove("elem--hide");
  }
}

function getCourseInfo() {
  const src = "/api/course";
  const options = {
    method: "GET",
  };
  ajax(src, options)
    .then((data) => {
      console.log(data);
      for (let i = 0; i < data.data.length; i++) {
        // 課程容器
        const containerDiv = document.createElement("div");
        containerDiv.setAttribute("class", "course__container");
        // 課程圖片
        const imgContainerDiv = document.createElement("div");
        imgContainerDiv.setAttribute("class", "img_container");
        const img = document.createElement("img");
        img.setAttribute(
          "src",
          "https://d277hbzet0a7g8.cloudfront.net/courseImage/" +
            data.data[i].image_name
        );
        imgContainerDiv.append(img);
        // 課程名稱
        const titleDiv = document.createElement("div");
        titleDiv.setAttribute("class", "course__title");
        titleDiv.textContent = data.data[i].name;
        // 授課老師姓名
        const teacherDiv = document.createElement("div");
        teacherDiv.setAttribute("class", "course__teacher");
        teacherDiv.textContent = "by " + data.data[i].teacher_name;
        // 課程簡介
        const introductionDiv = document.createElement("div");
        introductionDiv.setAttribute("class", "course__introduction");
        introductionDiv.textContent = data.data[i].introduction;

        // 監聽事件
        containerDiv.addEventListener("click", (event) => {
          window.location.href = "/course/" + data.data[i].id;
        });
        containerDiv.addEventListener("mouseenter", (event) => {
          img.style.animation = "course_img_mouseenter 0.7s ease-in-out";
          img.style.animationFillMode = "forwards";
          console.log("mouseenter" + data.data[i].id);
        });
        containerDiv.addEventListener("mouseleave", (event) => {
          console.log("mouseleave" + data.data[i].id);
          img.style.animation = "course_img_mouseleave 0.7s ease-in-out";
        });

        containerDiv.append(
          imgContainerDiv,
          titleDiv,
          teacherDiv,
          introductionDiv
        );
        const mainContainerElem = document.querySelector(".main_container");
        mainContainerElem.append(containerDiv);
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

(function run() {
  authenticateUser();
  getCourseInfo();
})();

// 根據代碼或連結進入教室
const searchRoomBtn = document.querySelector(".enter_room__search_btn");
searchRoomBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const formInput = document.querySelector(".enter_room__search_input");
  const roomId = formInput.value;
  const url = "/room/" + roomId;
  window.location.href = url;
});

// 隨機產生roomId
function generateRoomId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let roomId = "";
  for (let i = 0; i < 9; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    roomId += characters.charAt(randomIndex);
    if ((i + 1) % 3 === 0 && i !== 8) {
      roomId += "-";
    }
  }
  return roomId;
}

// 創建新教室
const createRoomBtn = document.querySelector(".enter_room__create_btn");
createRoomBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const roomId = generateRoomId();
  window.location.href = "/room/" + roomId;
});
