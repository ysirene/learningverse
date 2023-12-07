const express = require("express");

const courseDataFetcher = require("../models/courseDataFetcher");
const tokenDataProcessor = require("../dataHandling/tokenDataProcessor");

const router = express.Router();

// middleware
router.use(express.json());

// 新增課程
router.post("/", async (req, res) => {
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

module.exports = router;
