const getConnection = require("./dbConnector");
const courseDataProcessor = require("../dataHandling/courseDataProcessor");

async function isRoomIdExists(roomId) {
  let conn;
  try {
    conn = await getConnection();
    const sql = "SELECT * FROM course WHERE room_id = ?";
    const result = await conn.promise().query(sql, [roomId]);
    if (result[0].length == 1) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function insertCourseTime(courseId, times) {
  let conn;
  try {
    conn = await getConnection();
    for (const [dayOfWeek, time] of times) {
      const sql =
        "INSERT INTO course_time (course_id, day_of_week, time) VALUES (?, ?, ?)";
      const data = [courseId, dayOfWeek, time];
      await conn.promise().query(sql, data);
    }
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function insertCourse(
  userId,
  name,
  introduction,
  outline,
  startDate,
  endDate
) {
  let conn;
  try {
    let roomId;
    while (true) {
      roomId = courseDataProcessor.generateRoomId();
      const roomIdExists = await isRoomIdExists(roomId);
      if (!roomIdExists) {
        break;
      }
    }
    conn = await getConnection();
    const sql =
      "INSERT INTO course(name, introduction, outline, teacher_id, room_id, start_date, end_date) VALUES(?, ?, ?, ?, ?, ?, ?)";
    const courseData = [
      name,
      introduction,
      outline,
      userId,
      roomId,
      startDate,
      endDate,
    ];
    const [result, fields] = await conn.promise().query(sql, courseData);
    const courseId = result.insertId;
    return courseId;
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function getTeachingList(userId) {
  let conn;
  try {
    conn = await getConnection();
    const sql =
      "SELECT course.*, GROUP_CONCAT(CONCAT(course_time.day_of_week,' ',course_time.time) SEPARATOR ', ') AS time \
      FROM course INNER JOIN course_time ON course.id = course_time.course_id \
      AND course.teacher_id = ? GROUP BY course_time.course_id";
    const [result, fields] = await conn.promise().query(sql, [userId]);
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function getCourseInfoForIndexPage() {
  let conn;
  try {
    conn = await getConnection();
    const sql =
      "SELECT course.*, user.name AS teacher_name \
      FROM course INNER JOIN user ON course.teacher_id = user.id AND course.deleted = 0";
    const [result, fields] = await conn.promise().query(sql);
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function getSpecificCourseInfo(courseId) {
  let conn;
  try {
    conn = await getConnection();
    const sql =
      "SELECT course.*, user.name AS teacher_name, user.image_name AS teacher_image, GROUP_CONCAT(CONCAT(course_time.day_of_week,' ',course_time.time) SEPARATOR ', ') AS time \
      FROM course INNER JOIN user ON course.teacher_id = user.id  INNER JOIN course_time ON course.id = course_time.course_id AND course.id = ? GROUP BY course_time.course_id";
    const [result, fields] = await conn.promise().query(sql, [courseId]);
    return result[0];
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function getSpecificCourseInfoByRoomId(roomId) {
  let conn;
  try {
    conn = await getConnection();
    const sql =
      "SELECT course.*, user.name AS teacher_name, user.image_name AS teacher_image, GROUP_CONCAT(CONCAT(course_time.day_of_week,' ',course_time.time) SEPARATOR ', ') AS time \
      FROM course INNER JOIN user ON course.teacher_id = user.id  INNER JOIN course_time ON course.id = course_time.course_id AND course.room_id = ? GROUP BY course_time.course_id";
    const [result, fields] = await conn.promise().query(sql, [roomId]);
    return result[0];
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function insertCourseSelection(studentId, studentRoleId, courseId) {
  let conn;
  try {
    conn = await getConnection();
    const sql =
      "INSERT INTO course_selection(student_id, student_role_id, course_id) VALUES(?, ?, ?)";
    const data = [studentId, studentRoleId, courseId];
    await conn.promise().query(sql, data);
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

async function getCourseSelectionList(userId) {
  let conn;
  try {
    conn = await getConnection();
    const sql =
      "SELECT course_selection.*, \
      course.name, course.introduction, course.outline, course.room_id, course.deleted, course.image_name, course.start_date, course.end_date, \
      user.name AS teacher_name, GROUP_CONCAT(CONCAT(course_time.day_of_week,' ',course_time.time) SEPARATOR ', ') AS time \
      FROM course_selection INNER JOIN course ON course_selection.course_id = course.id INNER JOIN user ON course.teacher_id = user.id INNER JOIN course_time ON course_selection.course_id = course_time.course_id \
      AND course_selection.student_id = ? GROUP BY course_time.course_id;";
    const [result, fields] = await conn.promise().query(sql, [userId]);
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

// 老師取得現在正在進行的課程（for渲染通知在首頁）
async function getOngoingTeachingCourse(userId, weekday, time, date) {
  let conn;
  try {
    conn = await getConnection();
    const data = [userId, date, date, weekday, time];
    const sql =
      "SELECT course.name, course.room_id FROM course INNER JOIN course_time ON course.id = course_time.course_id \
      AND course.teacher_id = ? AND course.deleted = 0 AND ? > course.start_date AND ? < course.end_date \
      AND course_time.day_of_week = ? AND course_time.time = ?";
    const [result, fields] = await conn.promise().query(sql, data);
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

// 學生取得現在正在進行的課程（for渲染通知在首頁）
async function getOngoingCourse(userId, weekday, time, date) {
  let conn;
  try {
    conn = await getConnection();
    const data = [userId, date, date, weekday, time];
    const sql =
      "SELECT course.name, course.room_id from course \
      INNER JOIN course_selection ON course.id = course_selection.course_id \
      INNER JOIN course_time ON course.id = course_time.course_id \
      AND student_id = ? AND course.deleted = 0 \
      AND ? > course.start_date AND ? < course.end_date \
      AND course_time.day_of_week = ? AND course_time.time = ?";
    const [result, fields] = await conn.promise().query(sql, data);
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

// 取在課程中的身分別
async function getClassRole(userId, roomId) {
  let conn;
  try {
    conn = await getConnection();
    const data = [userId, roomId];
    // 判斷是否為老師
    let sql = "SELECT * FROM course WHERE teacher_id = ? AND room_id = ?";
    let [result, fields] = await conn.promise().query(sql, data);
    if (result.length == 1) {
      return "instructor";
    }
    // 若不是老師，則判斷學生的種類
    sql =
      "SELECT student_role.type FROM student_role \
      INNER JOIN course_selection ON student_role.id = course_selection.student_role_id \
      INNER JOIN course ON course_selection.course_id = course.id \
      AND course_selection.student_id = ? AND course.room_id = ?";
    [result, fields] = await conn.promise().query(sql, data);
    if (result.length == 1) {
      return result[0]["type"];
    } else {
      return "others";
    }
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

// 取得授課老師的userId
async function getTeacherId(roomId) {
  let conn;
  try {
    conn = await getConnection();
    const data = [roomId];
    const sql = "SELECT course.teacher_id FROM course WHERE room_id = ?";
    const [result, fields] = await conn.promise().query(sql, data);
    return result[0];
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

module.exports = {
  insertCourse,
  insertCourseTime,
  getTeachingList,
  getCourseInfoForIndexPage,
  getSpecificCourseInfo,
  getSpecificCourseInfoByRoomId,
  insertCourseSelection,
  getCourseSelectionList,
  getOngoingTeachingCourse,
  getOngoingCourse,
  getClassRole,
  getTeacherId,
};
