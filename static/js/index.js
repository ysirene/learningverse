// 驗證登入狀態
(function authenticateUser() {
  const signinBtnElem = document.querySelector("#nav__signinSignup");
  if (localStorage.getItem("token")) {
    let token = localStorage.getItem("token");
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
          console.log(data);
          const usernameElem = document.querySelector("#nav__username");
          const sloganBtnElem = document.querySelector(".slogan__signin_btn");
          const searchClassroom = document.querySelector("#search_classroom");
          const roleTranslate = {
            teacher: "老師",
            student: "同學",
          };
          usernameElem.textContent =
            data.data.name + " " + roleTranslate[data.data.role];
          usernameElem.classList.remove("elem--hide");
          searchClassroom.classList.remove("elem--hide");
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
const searchClassroomBtn = document.querySelector(".search_classroom__btn");
searchClassroomBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const classroomInputElem = document.querySelector(".search_classroom__input");
  const classroomCode = classroomInputElem.value;
  const url = "/room/" + classroomCode;
  window.location.href = url;
});
