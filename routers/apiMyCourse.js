const express = require("express");

const courseDataFetcher = require("../models/courseDataFetcher");
const tokenDataProcessor = require("../dataHandling/tokenDataProcessor");

const router = express.Router();

// middleware
router.use(express.json());

// 新增課程
router.post("/teacher", async (req, res) => {
  const { userId, name, introduction, outline, startDate, endDate, time } =
    req.body;
  try {
    const courseId = await courseDataFetcher.insertCourse(
      userId,
      name,
      introduction,
      outline,
      startDate,
      endDate
    );
    await courseDataFetcher.insertCourseTime(courseId, time);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: true, message: "cannot connect to database" });
  }
});

// 取得授課清單
router.get("/teacher", async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const decodeTokenResult = tokenDataProcessor.decodeToken(token);
    const result = await courseDataFetcher.getTeachingList(
      decodeTokenResult.id
    );
    return res.status(200).json({ data: result });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: true, message: "cannot connect to database" });
  }
});

// 取得當下正在進行的課程
// TODO:
router.get("/now", async (req, res) => {
  try {
    const { weekday, date, time } = req.query;
    const token = req.headers["authorization"];
    const decodeTokenResult = tokenDataProcessor.decodeToken(token);
    let result;
    if (decodeTokenResult.role == "teacher") {
      result = await courseDataFetcher.getOngoingTeachingCourse(
        decodeTokenResult.id,
        weekday,
        time,
        date
      );
    } else if (decodeTokenResult.role == "student") {
      result = await courseDataFetcher.getOngoingCourse(
        decodeTokenResult.id,
        weekday,
        time,
        date
      );
    }
    if (result.length == 0) {
      return res.status(200).json({ data: null });
    } else {
      return res.status(200).json({ data: result[0] });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: true, message: "cannot connect to database" });
  }
});

// 新增選課
router.post("/student", async (req, res) => {
  const { student_id, student_role_id, course_id } = req.body;
  try {
    await courseDataFetcher.insertCourseSelection(
      student_id,
      student_role_id,
      course_id
    );
    return res.status(200).json({ ok: true });
  } catch (err) {
    if (err.code === "ER_CON_COUNT_ERROR") {
      return res
        .status(500)
        .json({ error: true, message: "cannot connect to database" });
    } else if (err.code === "ER_DUP_ENTRY")
      return res
        .status(400)
        .json({ error: true, message: "data already exist" });
  }
});

// 取得選課清單
router.get("/student", async (req, res) => {
  try {
    const token = req.headers["authorization"];
    const decodeTokenResult = tokenDataProcessor.decodeToken(token);
    const result = await courseDataFetcher.getCourseSelectionList(
      decodeTokenResult.id
    );
    return res.status(200).json({ data: result });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: true, message: "cannot connect to database" });
  }
});

module.exports = router;
