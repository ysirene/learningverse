let signinStatus = false;

// 驗證登入狀態
function authenticateUser() {
  let memberBtnElem = document.querySelector("#member_btn");
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
          memberBtnElem.textContent = "登出系統";
          memberBtnElem.setAttribute("onclick", "signout()");
          signinStatus = true;
        }
        memberBtnElem.classList.remove("elem--invisible");
      })
      .catch((error) => {
        console.log(error);
      });
  } else {
    memberBtnElem.classList.remove("elem--invisible");
  }
}

// 清空登入/註冊頁面的回饋訊息
function clearReminder() {
  let successMessageElem = document.querySelector(".member__text--success");
  let errorMessageElem = document.querySelectorAll(".member__text--error");
  successMessageElem.textContent = "";
  errorMessageElem[0].textContent = "";
  errorMessageElem[1].textContent = "";
}
// 清空登入表單的值
function clearSigninValue() {
  let signinValue = document.querySelector("#signin_form");
  signinValue.reset();
}
// 清空註冊表單的值
function clearSignupValue() {
  let signupValue = document.querySelector("#signup_form");
  signupValue.reset();
}
// 開啟登入/註冊頁面
function toggleSigninSignup() {
  let memberBackgroundElem = document.querySelector(".member__background");
  let memberContainerElem = document.querySelector(".member__container");
  memberBackgroundElem.classList.replace("elem--hide", "elem--block");
  memberContainerElem.classList.replace("elem--hide", "elem--block");
  showSigninPage();
}
// 關閉登入/註冊頁面
function closeSigninSignup() {
  let memberBackgroundElem = document.querySelector(".member__background");
  let memberContainerElem = document.querySelector(".member__container");
  memberBackgroundElem.classList.replace("elem--block", "elem--hide");
  memberContainerElem.classList.replace("elem--block", "elem--hide");
  clearSigninValue();
  clearSignupValue();
}
// 切換到登入頁面
function showSigninPage() {
  let memberTitleElem = document.querySelector(".member__title");
  let signinItemElem = document.querySelector("#signin_item");
  let signupItemElem = document.querySelector("#signup_item");
  memberTitleElem.textContent = "登入會員帳號";
  signinItemElem.className = "elem--block";
  signupItemElem.className = "elem--hide";
  clearReminder();
  clearSignupValue();
}
// 切換到註冊頁面
function showSignupPage() {
  let memberTitleElem = document.querySelector(".member__title");
  let signinItemElem = document.querySelector("#signin_item");
  let signupItemElem = document.querySelector("#signup_item");
  memberTitleElem.textContent = "註冊會員帳號";
  signinItemElem.className = "elem--hide";
  signupItemElem.className = "elem--block";
  clearReminder();
  clearSigninValue();
}
// 檢查登入/註冊帳號的email格式
function checkEmailFormat(email) {
  let emailRule =
    /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;
  return emailRule.test(email);
}
// 在登入/註冊帳號的頁面顯示errorMsg
function renderSigninSignupErrorMsg(authAction, errorMsg) {
  let authActionsMap = {
    signin: 0,
    signup: 1,
  };
  let errorMessagesMap = {
    "invalidate email": "Email格式錯誤",
    "cannot connect to database": "系統忙碌中，請稍後再試",
    "email is already registered": "Email已經註冊帳戶",
    "incorrect email or password": "Email或密碼輸入錯誤",
  };
  let elemNum = authActionsMap[authAction];
  let errorMessageElem = document.querySelectorAll(".member__text--error")[
    elemNum
  ];
  errorMessageElem.textContent = errorMessagesMap[errorMsg];
}
// 在註冊帳號的頁面顯示successMsg
function renderSignupSuccessMsg() {
  let successMessageElem = document.querySelector(".member__text--success");
  successMessageElem.textContent = "註冊成功，請登入系統";
}
// 註冊帳號
function signup(event) {
  event.preventDefault();
  clearReminder();
  let signupFormData = new FormData(document.querySelector("#signup_form"));
  let email = signupFormData.get("email");
  if (!checkEmailFormat(email)) {
    renderSigninSignupErrorMsg("signup", "invalidate email");
  } else {
    let userData = {
      name: signupFormData.get("name"),
      email: signupFormData.get("email"),
      password: signupFormData.get("password"),
      role: signupFormData.get("role"),
    };
    let src = "/api/user";
    let options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    };
    ajax(src, options)
      .then((data) => {
        clearReminder();
        if (data.error) {
          renderSigninSignupErrorMsg("signup", data.message);
        } else if (data.ok) {
          renderSignupSuccessMsg();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
}
// 登入系統
function signin(event) {
  event.preventDefault();
  clearReminder();
  let signinFormData = new FormData(document.querySelector("#signin_form"));
  let email = signinFormData.get("email");
  if (!checkEmailFormat(email)) {
    renderSigninSignupErrorMsg("signin", "invalidate email");
  } else {
    let userData = {
      email: signinFormData.get("email"),
      password: signinFormData.get("password"),
    };
    let src = "/api/user/auth";
    let options = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    };
    ajax(src, options)
      .then((data) => {
        if (data.error) {
          renderSigninSignupErrorMsg("signin", data.message);
        } else {
          sessionStorage.setItem("token", data.token);
          location.reload();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
}
// 登出系統
function signout() {
  sessionStorage.clear("token");
  location.reload();
}
