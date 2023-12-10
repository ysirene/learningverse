const express = require("express");
const router = express.Router();
const courseDataFetcher = require("../models/courseDataFetcher");

// 首頁取得所有課程資訊
router.get("/", async (req, res) => {
  try {
    const result = await courseDataFetcher.getCourseInfoForIndexPage();
    return res.status(200).json({ data: result });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: true, message: "cannot connect to database" });
  }
});

// 取得特定id的課程資訊
router.get("/courseId/:courseId", async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const result = await courseDataFetcher.getSpecificCourseInfo(courseId);
    return res.status(200).json({ data: result });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: true, message: "cannot connect to database" });
  }
});

// 取得特定roomId的課程資訊
router.get("/roomId/:roomId", async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const result = await courseDataFetcher.getSpecificCourseInfoByRoomId(
      roomId
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
