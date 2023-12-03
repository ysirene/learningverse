const express = require("express");
const router = express.Router();

router.get("/teacher", (req, res) => {
  res.render("course_teacher");
});

router.get("/student", (req, res) => {
  res.render("course_student");
});

module.exports = router;
