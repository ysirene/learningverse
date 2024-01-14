const express = require("express");

const courseDataFetcher = require("../models/courseDataFetcher");
const tokenDataProcessor = require("../dataHandling/tokenDataProcessor");

const router = express.Router();

// middleware
router.use(express.json());
function isAuthorized(req, res, next) {
  const token = req.headers["authorization"];
  const decodeTokenResult = tokenDataProcessor.decodeToken(token);
  if (decodeTokenResult == null) {
    return res.status(400).json({ error: true, message: "invalid token" });
  } else {
    req.userInfo = decodeTokenResult;
    next();
  }
}

// 新增課程
router.post("/teacher", isAuthorized, async (req, res) => {
  if (req.userInfo.role === "teacher") {
    const userId = req.userInfo.id;
    const { name, introduction, outline, startDate, endDate, time } = req.body;
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
  } else {
    return res
      .status(403)
      .json({ error: true, message: "user has no access rights" });
  }
});

// 取得授課清單
router.get("/teacher", isAuthorized, async (req, res) => {
  if (req.userInfo.role === "teacher") {
    try {
      const result = await courseDataFetcher.getTeachingList(req.userInfo.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .json({ error: true, message: "cannot connect to database" });
    }
  } else {
    return res
      .status(403)
      .json({ error: true, message: "user has no access rights" });
  }
});

// 取得當下正在進行的課程
router.get("/now", isAuthorized, async (req, res) => {
  try {
    const { weekday, date, time } = req.query;
    const userInfo = req.userInfo;
    let result;
    if (userInfo.role == "teacher") {
      result = await courseDataFetcher.getOngoingTeachingCourse(
        userInfo.id,
        weekday,
        time,
        date
      );
    } else if (userInfo.role == "student") {
      result = await courseDataFetcher.getOngoingCourse(
        userInfo.id,
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
router.post("/student", isAuthorized, async (req, res) => {
  if (req.userInfo.role === "student") {
    const userInfo = req.userInfo;
    const { studentRoleId, courseId } = req.body;
    try {
      await courseDataFetcher.insertCourseSelection(
        userInfo.id,
        studentRoleId,
        courseId
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
  } else {
    return res
      .status(403)
      .json({ error: true, message: "user has no access rights" });
  }
});

// 取得選課清單
router.get("/student", isAuthorized, async (req, res) => {
  if (req.userInfo.role === "student") {
    try {
      const userInfo = req.userInfo;
      const result = await courseDataFetcher.getCourseSelectionList(
        userInfo.id
      );
      return res.status(200).json({ data: result });
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .json({ error: true, message: "cannot connect to database" });
    }
  } else {
    return res
      .status(403)
      .json({ error: true, message: "user has no access rights" });
  }
});

// 取得使用者在課程中的身分
router.get("/classRole", isAuthorized, async (req, res) => {
  try {
    const userInfo = req.userInfo;
    const { roomId } = req.query;
    const result = await courseDataFetcher.getClassRole(userInfo.id, roomId);
    return res.status(200).json({ data: { classRole: result } });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: true, message: "cannot connect to database" });
  }
});

module.exports = router;
