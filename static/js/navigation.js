// 將星期幾轉換為中文
function translateDay(num) {
  let dayDic = {
    1: "週一",
    2: "週二",
    3: "週三",
    4: "週四",
    5: "週五",
    6: "週六",
    0: "週日",
  };
  return dayDic[num];
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
  let month = today.getMonth() + 1;
  let weekday = today.getDay();
  let date = today.getDate();
  let hour = today.getHours();
  let minute = today.getMinutes();
  weekday = translateDay(weekday);
  minute = checkTime(minute);
  document.querySelector(".nav__time").textContent =
    hour + ":" + minute + " | " + month + "月" + date + "日 " + weekday;
  setTimeout(startTime, 1000);
}

document.addEventListener("DOMContentLoaded", startTime());

function toggleUserOption() {
  const userOptionElem = document.querySelector(".nav__user_options");
  userOptionElem.classList.toggle("elem--hide");
}

// 跳轉至會員中心
const memberAreaBtn = document.querySelector("#member_area_btn");
memberAreaBtn.addEventListener("click", (event) => {
  event.preventDefault();
  window.location.href = "/memberArea";
});

// 跳轉至我的課程
const myCourseBtn = document.querySelector("#my_course_btn");
myCourseBtn.addEventListener("click", (event) => {
  event.preventDefault();
  window.location.href = "/myCourse";
});

// 登出系統
const signOutBtn = document.querySelector("#sign_out");
signOutBtn.addEventListener("click", (event) => {
  event.preventDefault();
  sessionStorage.clear("token");
  location.reload();
});
