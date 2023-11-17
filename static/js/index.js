// 驗證登入狀態
(function authenticateUser() {
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
          const sloganBtnElem = document.querySelector(".slogan__signin_btn");
          const enterRoomElem = document.querySelector(".enter_room");
          const roleTranslate = {
            teacher: "老師",
            student: "同學",
          };
          usernameElem.textContent =
            data.data.name + " " + roleTranslate[data.data.role];
          usernameElem.classList.remove("elem--hide");
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
