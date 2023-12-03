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
        if (data.data != null && data.data.role == "teacher") {
          const usernameElem = document.querySelector("#nav__username");
          const userImgElem = document.querySelector("#nav__user_img");
          const userImgBtn = document.querySelector(".nav__user_img");
          const userImgUrl =
            "https://d277hbzet0a7g8.cloudfront.net/userImage/" + data.data.img;
          usernameElem.textContent = data.data.name + " 老師";
          usernameElem.classList.remove("elem--hide");
          userImgElem.setAttribute("src", userImgUrl);
          userImgBtn.classList.remove("elem--hide");
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
}

(function run() {
  authenticateUser();
})();
