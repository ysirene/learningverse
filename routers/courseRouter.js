const express = require("express");
const router = express.Router();

router.get("/:courseId", (req, res) => {
  res.render("Course");
});

module.exports = router;
