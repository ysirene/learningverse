let userInfo;
const token = sessionStorage.getItem("token");

(async function run() {
  await authenticateUser();
  renderNav();
  renderMainElem();
})();

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

const roleTranslate = {
  teacher: "老師",
  student: "同學",
};

function renderNav() {
  const userNameElem = document.querySelector("#nav__username");
  const userImgElem = document.querySelector("#nav__user_img");
  const userImgBtn = document.querySelector(".nav__user_img");
  const userImgUrl =
    "https://d277hbzet0a7g8.cloudfront.net/userImage/" + userInfo.img;
  userNameElem.textContent = userInfo.name + " " + roleTranslate[userInfo.role];
  userNameElem.classList.remove("elem--hide");
  userImgElem.setAttribute("src", userImgUrl);
  userImgBtn.classList.remove("elem--hide");
}

function renderMainElem() {
  const userNameElem = document.querySelector("#user_name");
  const userRoleElem = document.querySelector("#user_role");
  const userEmailElem = document.querySelector("#user_email");
  const userImage = document.querySelector(".user_img");
  userNameElem.textContent = userInfo.name;
  userRoleElem.textContent = roleTranslate[userInfo.role];
  userEmailElem.textContent = userInfo.email;
  userImage.setAttribute(
    "src",
    "https://d277hbzet0a7g8.cloudfront.net/userImage/" + userInfo.img
  );
}

function uploadUserImg(event) {
  event.preventDefault();
  const submitBtn = document.querySelector(".input__submit");
  const disabledSubmitBtn = document.querySelector(".input__submit--disabled");
  submitBtn.classList.add("elem--hide");
  disabledSubmitBtn.classList.remove("elem--hide");
  const formData = new FormData(document.querySelector("#newUserImage"));
  let src = "/api/user/image";
  let options = {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${token}`,
    },
    body: formData,
  };
  ajax(src, options)
    .then((data) => {
      if (data.ok) {
        console.log(data);
        const userImgElem = document.querySelector(".user_img");
        userImgElem.setAttribute(
          "src",
          "https://d277hbzet0a7g8.cloudfront.net/userImage/" + data.imageName
        );
        alert("會員頭像更新成功，請重新登入帳戶～");
      }
    })
    .catch((err) => {
      console.log(err);
      alert("會員頭像上傳失敗QQ");
    });
  submitBtn.classList.remove("elem--hide");
  disabledSubmitBtn.classList.add("elem--hide");
}
