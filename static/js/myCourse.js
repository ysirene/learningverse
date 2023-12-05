let userInfo;
let courseData;
const token = sessionStorage.getItem("token");

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

function getTeachingList() {
  const src = "/api/myCourse/teacher";
  const options = {
    method: "GET",
    headers: {
      authorization: `Bearer ${token}`,
    },
  };
  ajax(src, options).then((data) => {
    console.log(data);
    courseData = data.data;
    const leftPanelAttendanceRecordBtn = document.querySelector(
      "#left_panel_attendance_record"
    );
    for (let i = 0; i < data.data.length; i++) {
      const viewCourseBtn = document.createElement("button");
      const viewCourseBtnId = "viewCourse" + i;
      viewCourseBtn.textContent = data.data[i].name;
      viewCourseBtn.setAttribute("class", "left_panel__sub_btn");
      viewCourseBtn.setAttribute("id", viewCourseBtnId);
      viewCourseBtn.addEventListener("click", (event) => {
        event.preventDefault();
        // 隱藏新增課程的表單
        const addCourseForm = document.querySelector("#add_course__form");
        addCourseForm.classList.add("elem--hide");
        // 顯示查看課程的頁面
        const viewMyCourseElem = document.querySelector("#view_my_course");
        viewMyCourseElem.classList.remove("elem--hide");
        // 改標題
        const mainPanelTitleElem = document.querySelector(".main_panel__title");
        mainPanelTitleElem.textContent = "查看我的課程 —— " + data.data[i].name;
        // 課程名稱
        const nameElem = document.querySelector("#view__name");
        nameElem.textContent = data.data[i].name;
        // 課程簡介
        const introductionElem = document.querySelector("#view__introduction");
        introductionElem.textContent = data.data[i].introduction;
        // 上課時間
        const courseTimeArr = data.data[i].time.split(", ");
        let timeTextContent = "";
        const timeTranslate = {
          morning: "10:00~12:00",
          afternoon: "14:00~16:00",
          night: "19:00~21:00",
        };
        for (let j = 0; j < courseTimeArr.length; j++) {
          const timeArr = courseTimeArr[j].split(" ");
          let tempText = "每周" + timeArr[0] + " " + timeTranslate[timeArr[1]];
          if (j != courseTimeArr.length - 1) {
            tempText += "、";
          }
          timeTextContent += tempText;
        }
        const timeElem = document.querySelector("#view__time");
        timeElem.textContent = timeTextContent;
        // 課程大綱
        const outlineElem = document.querySelector("#view__outline");
        outlineElem.textContent = data.data[i].outline;
      });
      leftPanelAttendanceRecordBtn.parentNode.insertBefore(
        viewCourseBtn,
        leftPanelAttendanceRecordBtn
      );
    }
  });
}

function renderLeftPanelForTeacher() {
  const leftPanelElem = document.querySelector(".left_panel");
  const leftPanelAddCourseBtn = document.createElement("button");
  leftPanelAddCourseBtn.setAttribute("class", "left_panel__btn");
  leftPanelAddCourseBtn.setAttribute("id", "left_panel_add_course_btn");
  leftPanelAddCourseBtn.textContent = "§ 建立新課程";
  const leftPanelViewCourseBtn = document.createElement("button");
  leftPanelViewCourseBtn.setAttribute("class", "left_panel__btn");
  leftPanelViewCourseBtn.setAttribute("id", "left_panel_view_course_btn");
  leftPanelViewCourseBtn.textContent = "§ 查看我的課程";
  const leftPanelAttendanceRecordBtn = document.createElement("button");
  leftPanelAttendanceRecordBtn.setAttribute("class", "left_panel__btn");
  leftPanelAttendanceRecordBtn.setAttribute(
    "id",
    "left_panel_attendance_record"
  );
  leftPanelAttendanceRecordBtn.textContent = "§ 查看出缺席名單";
  leftPanelElem.append(
    leftPanelAddCourseBtn,
    leftPanelViewCourseBtn,
    leftPanelAttendanceRecordBtn
  );
}

function addClickListenerToLeftPanelButton() {
  const addCourseBtn = document.querySelector("#left_panel_add_course_btn");
  addCourseBtn.addEventListener("click", (event) => {
    event.preventDefault();
    // 更改標題
    const mainPanelTitleElem = document.querySelector(".main_panel__title");
    mainPanelTitleElem.textContent = "建立新課程";
    // 顯示新增課程的表單
    const addCourseForm = document.querySelector("#add_course__form");
    addCourseForm.classList.remove("elem--hide");
    // 顯示查看課程的頁面
    const viewMyCourseElem = document.querySelector("#view_my_course");
    viewMyCourseElem.classList.add("elem--hide");
    // 清空已選擇的時間
    // const timeSelectedElem = document.querySelector(".time_selected");
    // while (timeSelectedElem.hasChildNodes()) {
    //   timeSelectedElem.removeChild(timeSelectedElem.lastChild);
    // }
  });
}

function showAddCoursePage() {
  const addCourseBtn = document.querySelector("#left_panel_add_course_btn");
  addCourseBtn.click();
}

(async function run() {
  try {
    await authenticateUser();
    if (userInfo.role == "teacher") {
      renderLeftPanelForTeacher();
      getTeachingList();
      addClickListenerToLeftPanelButton();
      showAddCoursePage();
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
    weekday: document.querySelector("#add_course__weekday").value,
    time: document.querySelector("#add_course__time").value,
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
const addCourseForm = document.querySelector("#add_course__form");
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
  const addCourseFormData = new FormData(
    document.querySelector("#add_course__form")
  );
  const addCourseData = {
    userId: userInfo.id,
    name: addCourseFormData.get("name"),
    introduction: addCourseFormData.get("introduction"),
    outline: addCourseFormData.get("outline"),
    time: timeSelectedArray,
  };
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
