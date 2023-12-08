const courseId = window.location.pathname.split("/")[2];
let userInfo = null;
const token = sessionStorage.getItem("token");

// 將預定課程資料中的日期格式化
function formatDate(date) {
  let year = date.getFullYear();
  let month = (date.getMonth() + 1).toString().padStart(2, "0");
  let day = date.getDate().toString().padStart(2, "0");
  let formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

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
          userInfo = data.data;
          const usernameElem = document.querySelector("#nav__username");
          const userImgElem = document.querySelector("#nav__user_img");
          const userImgBtn = document.querySelector(".nav__user_img");
          const userImgUrl =
            "https://d277hbzet0a7g8.cloudfront.net/userImage/" + data.data.img;
          const roleTranslate = {
            teacher: "老師",
            student: "同學",
          };
          usernameElem.textContent =
            data.data.name + " " + roleTranslate[data.data.role];
          usernameElem.classList.remove("elem--hide");
          userImgElem.setAttribute("src", userImgUrl);
          userImgBtn.classList.remove("elem--hide");
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

// 取得課程資訊
function getCourseInfo() {
  const src = "/api/course/" + courseId;
  const options = {
    method: "GET",
  };
  ajax(src, options).then((data) => {
    console.log(data);
    const courseImgElem = document.querySelector("#course_img");
    courseImgElem.setAttribute(
      "src",
      "https://d277hbzet0a7g8.cloudfront.net/courseImage/" +
        data.data.image_name
    );
    // 授課老師的資料
    const teacherImgElem = document.querySelector(".text__teacher_img");
    teacherImgElem.setAttribute(
      "src",
      "https://d277hbzet0a7g8.cloudfront.net/userImage/" +
        data.data.teacher_image
    );
    const teacherNameElem = document.querySelector(".text__teacher_name");
    teacherNameElem.textContent = data.data.teacher_name;
    // 課程資料
    const courseNameElem = document.querySelector(".text__course_name");
    courseNameElem.textContent = data.data.name;
    const courseIntroductionElem = document.querySelector(
      ".text__course_introduction"
    );
    courseIntroductionElem.textContent = data.data.introduction;
    const startDate = new Date(data.data.start_date);
    const formattedStartDate = formatDate(startDate);
    const endDate = new Date(data.data.end_date);
    const formattedEndDate = formatDate(endDate);
    const courseDateElem = document.querySelector("#course_date");
    courseDateElem.textContent = formattedStartDate + " ~ " + formattedEndDate;
    const courseTimeArr = data.data.time.split(", ");
    let timeTextContent = "";
    const timeTranslate = {
      morning: "10:00~12:00",
      afternoon: "14:00~16:00",
      night: "19:00~21:00",
    };
    for (let i = 0; i < courseTimeArr.length; i++) {
      const timeArr = courseTimeArr[i].split(" ");
      let tempText = "每周" + timeArr[0] + " " + timeTranslate[timeArr[1]];
      if (i != courseTimeArr.length - 1) {
        tempText += "、";
      }
      timeTextContent += tempText;
    }
    const courseTimeElem = document.querySelector("#course_time");
    courseTimeElem.textContent = timeTextContent;
    // 顯示按鈕
    const today = new Date();
    if (startDate > today) {
      const enrollBtn = document.querySelector("#enroll_btn");
      enrollBtn.classList.remove("elem--hide");
    } else {
      const auditBtn = document.querySelector("#audit_btn");
      auditBtn.classList.remove("elem--hide");
    }
    const courseOutlineElem = document.querySelector(".outline__context");
    courseOutlineElem.textContent = data.data.outline;
  });
}

(function run() {
  authenticateUser();
  getCourseInfo();
})();

// 按鈕監聽事件
const enrollBtn = document.querySelector("#enroll_btn");
const auditBtn = document.querySelector("#audit_btn");
const applyResultElem = document.querySelector("#apply_result");
// 正式選課
enrollBtn.addEventListener("click", (event) => {
  applyResultElem.className = "elem--hide";
  if (!userInfo) {
    toggleSigninSignup();
    return;
  } else if (userInfo.role == "teacher") {
    applyResultElem.textContent = "報名失敗！請使用身分別為學生的帳戶進行選課";
    applyResultElem.className = "reminder--error";
    return;
  }
  const enrollData = {
    student_id: userInfo.id,
    student_role_id: 1,
    course_id: courseId,
  };
  const src = "/api/myCourse/student";
  const options = {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(enrollData),
  };
  ajax(src, options)
    .then((data) => {
      if (data.ok) {
        enrollBtn.disabled = true;
        applyResultElem.textContent = "報名成功！可至「我的課程」查看";
        applyResultElem.className = "reminder--success";
      } else if (data.error && data.message === "cannot connect to database") {
        applyResultElem.textContent = "報名失敗，請稍後再試";
        applyResultElem.className = "reminder--error";
      } else if (data.error && data.message === "data already exist") {
        applyResultElem.textContent = "已報名過此課程，可至「我的課程」查看";
        applyResultElem.className = "reminder--error";
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

// 收藏旁聽
auditBtn.addEventListener("click", (event) => {
  applyResultElem.className = "elem--hide";
  if (!userInfo) {
    toggleSigninSignup();
    return;
  } else if (userInfo.role == "teacher") {
    applyResultElem.textContent = "收藏失敗！請使用身分別為學生的帳戶進行收藏";
    applyResultElem.className = "reminder--error";
    return;
  }
  const auditData = {
    student_id: userInfo.id,
    student_role_id: 2,
    course_id: courseId,
  };
  const src = "/api/myCourse/student";
  const options = {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(auditData),
  };
  ajax(src, options)
    .then((data) => {
      if (data.ok) {
        applyResultElem.textContent = "收藏成功！可至「我的課程」查看";
        applyResultElem.className = "reminder--success";
      } else if (data.error && data.message === "cannot connect to database") {
        applyResultElem.textContent = "收藏失敗，請稍後再試";
        applyResultElem.className = "reminder--error";
      } else if (data.error && data.message === "data already exist") {
        applyResultElem.textContent =
          "已報名或收藏過此課程，可至「我的課程」查看";
        applyResultElem.className = "reminder--error";
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
