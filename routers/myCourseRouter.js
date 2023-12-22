const express = require("express");
const router = express.Router();
const utils_getWeekday = require("../dataHandling/renderingUtilities");

router.get("/", (req, res) => {
  res.render("myCourse", { getWeekday: utils_getWeekday });
});

module.exports = router;
