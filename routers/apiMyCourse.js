const express = require("express");

const courseDataFetcher = require("../models/courseDataFetcher");

const router = express.Router();

// middleware
router.use(express.json());

// 新增課程
router.post("/", async (req, res) => {
  const { userId, name, introduction, outline, time } = req.body;
  try {
    const courseId = await courseDataFetcher.insertCourse(
      userId,
      name,
      introduction,
      outline
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

module.exports = router;
