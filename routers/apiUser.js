const express = require("express");

const userDataFetcher = require("../models/userDataFetcher");
const tokenDataProcessor = require("../dataHandling/tokenDataProcessor");

const router = express.Router();

// middleware
router.use(express.json());

// 註冊
router.post("/", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const result = await userDataFetcher.insert(name, email, password);
    if (result) {
      return res.status(200).json({ ok: true });
    } else {
      return res
        .status(400)
        .json({ error: true, message: "email is already registered" });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: true, message: "cannot connect to database" });
  }
});

// 登入
router.put("/auth", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userInfo = await userDataFetcher.isValidCredential(email, password);
    if (userInfo) {
      const payload = tokenDataProcessor.encodeToken(userInfo);
      return res.status(200).json({ token: payload });
    } else {
      return res
        .status(400)
        .json({ error: true, message: "incorrect email or password" });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: true, message: "cannot connect to database" });
  }
});

// 驗證token
router.get("/auth", (req, res) => {
  const token = req.headers["authorization"];
  const decodeTokenResult = tokenDataProcessor.decodeToken(token);
  return res.status(200).json({ data: decodeTokenResult });
});

module.exports = router;
