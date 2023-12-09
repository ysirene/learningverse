const getConnection = require("./dbConnector");
const courseDataProcessor = require("../dataHandling/courseDataProcessor");

async function isRoomIdExists(roomId) {
  try {
    const conn = await getConnection();
    const sql = "SELECT * FROM course WHERE room_id = ?";
    const result = await conn.promise().query(sql, [roomId]);
    conn.release();
    if (result[0].length == 1) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
  }
}

async function insertCourseTime(courseId, times) {
  try {
    const conn = await getConnection();
    for (const [dayOfWeek, time] of times) {
      const sql =
        "INSERT INTO course_time (course_id, day_of_week, time) VALUES (?, ?, ?)";
      const data = [courseId, dayOfWeek, time];
      await conn.promise().query(sql, data);
      conn.release();
    }
  } catch (err) {
    console.log(err);
    throw err;
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
  try {
    let roomId;
    while (true) {
      roomId = courseDataProcessor.generateRoomId();
      const roomIdExists = await isRoomIdExists(roomId);
      if (!roomIdExists) {
        break;
      }
    }
    const conn = await getConnection();
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
    conn.release();
    return courseId;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getTeachingList(userId) {
  try {
    const conn = await getConnection();
    const sql =
      "SELECT course.*, GROUP_CONCAT(CONCAT(course_time.day_of_week,' ',course_time.time) SEPARATOR ', ') AS time \
      FROM course INNER JOIN course_time ON course.id = course_time.course_id \
      AND course.teacher_id = ? GROUP BY course_time.course_id";
    const [result, fields] = await conn.promise().query(sql, [userId]);
    conn.release();
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getCourseInfoForIndexPage() {
  try {
    const conn = await getConnection();
    const sql =
      "SELECT course.*, user.name AS teacher_name \
      FROM course INNER JOIN user ON course.teacher_id = user.id AND course.deleted = 0";
    const [result, fields] = await conn.promise().query(sql);
    conn.release();
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getSpecificCourseInfo(courseId) {
  try {
    const conn = await getConnection();
    const sql =
      "SELECT course.*, user.name AS teacher_name, user.image_name AS teacher_image, GROUP_CONCAT(CONCAT(course_time.day_of_week,' ',course_time.time) SEPARATOR ', ') AS time \
      FROM course INNER JOIN user ON course.teacher_id = user.id  INNER JOIN course_time ON course.id = course_time.course_id AND course.id = ? GROUP BY course_time.course_id";
    const [result, fields] = await conn.promise().query(sql, [courseId]);
    conn.release();
    return result[0];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function insertCourseSelection(student_id, student_role_id, course_id) {
  try {
    const conn = await getConnection();
    const sql =
      "INSERT INTO course_selection(student_id, student_role_id, course_id) VALUES(?, ?, ?)";
    const data = [student_id, student_role_id, course_id];
    await conn.promise().query(sql, data);
    conn.release();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getCourseSelectionList(userId) {
  try {
    const conn = await getConnection();
    const sql =
      "SELECT course_selection.*, \
      course.name, course.introduction, course.outline, course.room_id, course.deleted, course.image_name, course.start_date, course.end_date, \
      user.name AS teacher_name, GROUP_CONCAT(CONCAT(course_time.day_of_week,' ',course_time.time) SEPARATOR ', ') AS time \
      FROM course_selection INNER JOIN course ON course_selection.course_id = course.id INNER JOIN user ON course.teacher_id = user.id INNER JOIN course_time ON course_selection.course_id = course_time.course_id \
      AND course_selection.student_id = ? GROUP BY course_time.course_id;";
    const [result, fields] = await conn.promise().query(sql, [userId]);
    conn.release();
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

module.exports = {
  insertCourse,
  insertCourseTime,
  getTeachingList,
  getCourseInfoForIndexPage,
  getSpecificCourseInfo,
  insertCourseSelection,
  getCourseSelectionList,
};
