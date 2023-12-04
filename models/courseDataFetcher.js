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

async function insertCourse(userId, name, introduction, outline) {
  try {
    let roomId;
    while (true) {
      roomId = courseDataProcessor.generateRoomId();
      console.log(roomId);
      const roomIdExists = await isRoomIdExists(roomId);
      if (!roomIdExists) {
        break;
      }
    }
    const conn = await getConnection();
    let sql =
      "INSERT INTO course(name, introduction, outline, teacher_id, room_id) VALUES(?, ?, ?, ?, ?)";
    const courseData = [name, introduction, outline, userId, roomId];
    const [result, fields] = await conn.promise().query(sql, courseData);
    const courseId = result.insertId;
    conn.release();
    return courseId;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

module.exports = { insertCourse, insertCourseTime };
