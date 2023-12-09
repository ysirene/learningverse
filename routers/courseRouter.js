const express = require("express");
const router = express.Router();

router.get("/:courseId", (req, res) => {
  res.render("course");
});

module.exports = router;
