// 將星期幾轉換為中文
function translateDay(num) {
  let dayDic = {
    1: "一",
    2: "二",
    3: "三",
    4: "四",
    5: "五",
    6: "六",
    0: "日",
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
    hour + ":" + minute + " | " + month + "月" + date + "日 週" + weekday;
  setTimeout(startTime, 1000);
}

document.addEventListener("DOMContentLoaded", startTime());

function toggleUserOption() {
  const userOptionElem = document.querySelector(".nav__user_options");
  userOptionElem.classList.toggle("elem--hide");
}

// 跳轉至會員中心
// const memberAreaBtn = document.querySelector("#member_area_btn");
// memberAreaBtn.addEventListener("click", (event) => {
//   event.preventDefault();
//   window.location.href = "/memberArea";
// });

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
