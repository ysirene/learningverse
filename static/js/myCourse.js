let userInfo;

function authenticateUser() {
  return new Promise((resolve, reject) => {
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
          } else {
            window.location.href = "/";
          }
          resolve();
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    } else {
      window.location.href = "/";
      resolve();
    }
  });
}
function renderLeftPanelForTeacher() {
  const leftPanelElem = document.querySelector(".left_panel");
  const leftPanelAddCourseBtn = document.createElement("button");
  leftPanelAddCourseBtn.setAttribute("class", "left_panel__btn");
  leftPanelAddCourseBtn.setAttribute("id", "left_panel_add_course_btn");
  leftPanelAddCourseBtn.textContent = "§ 建立新課程";
  const leftPanelEditCourseBtn = document.createElement("button");
  leftPanelEditCourseBtn.setAttribute("class", "left_panel__btn");
  leftPanelEditCourseBtn.setAttribute("id", "left_panel_edit_course_btn");
  leftPanelEditCourseBtn.textContent = "§ 編輯我的課程";
  const leftPanelAttendanceRecordBtn = document.createElement("button");
  leftPanelAttendanceRecordBtn.setAttribute("class", "left_panel__btn");
  leftPanelAttendanceRecordBtn.setAttribute(
    "id",
    "left_panel_attendance_record"
  );
  leftPanelAttendanceRecordBtn.textContent = "§ 查看出缺席名單";
  leftPanelElem.append(
    leftPanelAddCourseBtn,
    leftPanelEditCourseBtn,
    leftPanelAttendanceRecordBtn
  );
}

function addClickListenerToLeftPanelButton() {
  const addCourseBtn = document.querySelector("#left_panel_add_course_btn");
  addCourseBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const mainPanelElem = document.querySelector(".main_panel");
    const mainPanelTitleElem = document.querySelector(".main_panel__title");
    mainPanelTitleElem.textContent = "建立新課程";
    const addCourseForm = document.querySelector("#add_course");
    addCourseForm.classList.remove("elem--hide");
  });
}

(async function run() {
  try {
    await authenticateUser();
    if (userInfo.role == "teacher") {
      renderLeftPanelForTeacher();
      addClickListenerToLeftPanelButton();
    }
  } catch (err) {
    console.log(err);
  }
})();

// 新增上課時間
const addTimeBtn = document.querySelector(".time__submit");
let timeNum = 1;
addTimeBtn.addEventListener("click", (event) => {
  event.preventDefault();
  const timeSelectedElem = document.querySelector(".time_selected");
  const addTimeData = {
    weekday: document.querySelector("#add_course_time__weekday").value,
    time: document.querySelector("#add_course_time__time").value,
  };
  const timeDiv = document.createElement("div");
  const timeDivId = "selectedTime" + timeNum;
  timeDiv.setAttribute("id", timeDivId);
  timeDiv.textContent = "每周" + addTimeData.weekday + " " + addTimeData.time;
  const delBtn = document.createElement("button");
  delBtn.textContent = "X";
  delBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const targetElem = document.getElementById(timeDivId);
    targetElem.remove();
  });
  timeDiv.append(delBtn);
  timeSelectedElem.append(timeDiv);
  timeNum += 1;
});

// 新增課程
const addCourseForm = document.querySelector("#add_course");
addCourseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  // 隱藏錯誤訊息
  const errorMsgElem = document.querySelector(".error_msg");
  errorMsgElem.classList.add("elem--hide");
  // 檢查是否有輸入上課時間
  const timeSelectedElem = document.querySelector(".time_selected").children;
  if (timeSelectedElem.length == 0) {
    alert("請新增上課時間");
    return;
  }
  const timeSelectedArray = [];
  const timeTranslate = {
    "10:00~12:00": "morning",
    "14:00~16:00": "afternoon",
    "19:00~21:00": "night",
  };
  for (let i = 0; i < timeSelectedElem.length; i++) {
    const tempArray = [
      timeSelectedElem[i].textContent.charAt(2),
      timeTranslate[timeSelectedElem[i].textContent.slice(4, -1)],
    ];
    timeSelectedArray.push(tempArray);
  }
  const addCourseFormData = new FormData(addCourseForm);
  const addCourseData = {
    userId: userInfo.id,
    name: addCourseFormData.get("name"),
    introduction: addCourseFormData.get("introduction"),
    outline: addCourseFormData.get("outline"),
    time: timeSelectedArray,
  };
  let token = sessionStorage.getItem("token");
  let src = "/api/myCourse";
  let options = {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(addCourseData),
  };
  ajax(src, options)
    .then((data) => {
      if (data.ok) {
        window.location.reload();
      } else {
        const errorMsgElem = document.querySelector(".error_msg");
        errorMsgElem.classList.remove("elem--hide");
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
