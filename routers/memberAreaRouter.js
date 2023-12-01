const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("memberArea");
});

module.exports = router;
