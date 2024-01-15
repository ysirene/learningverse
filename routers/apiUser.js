const path = require("path");

const express = require("express");
const multer = require("multer");

const userDataFetcher = require("../models/userDataFetcher");
const tokenDataProcessor = require("../dataHandling/tokenDataProcessor");
const fileNameGenerator = require("../dataHandling/imageFileNameGenerator");
const s3FileUploader = require("../models/s3FileUploader");

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
let imageFileExt = "";
// 套用檔案上傳位置、檔案大小與類型的限制
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2048 * 2048, // 1MB
  },
  fileFilter: (req, file, cb) => {
    // path.extname() 取得副檔名(如 .jpg)
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".jpg" && ext !== ".png" && ext !== ".jpeg") {
      // 拒絕上傳的檔案
      cb("檔案格式錯誤，僅限上傳 jpg、jpeg 與 png 格式。");
    }
    // 接受檔案
    imageFileExt = ext;
    cb(null, true);
  },
});

// 註冊
router.post("/", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const result = await userDataFetcher.insert(name, email, password, role);
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

// 修改會員頭像
router.patch(
  "/image",
  isAuthorized,
  upload.single("image"),
  async (req, res) => {
    // 檢查request中是否包含檔案
    if (!req.file) {
      return res.status(400).json({ error: true, message: "Missing image." });
    }
    const imageFile = req.file.buffer;
    const imageFileName = fileNameGenerator.generateFileName(imageFileExt);

    // 上傳照片至S3
    try {
      const uploadResult = await s3FileUploader.uploadFileToS3(
        imageFileName,
        imageFile
      );
      imageFile.buffer = null; // 將圖檔從緩存中釋放
    } catch (err) {
      imageFile.buffer = null; // 將圖檔從緩存中釋放
      console.log(err);
      return res
        .status(500)
        .json({ error: true, message: "Fail to upload file to S3." });
    }
    // 更新資料庫的會員頭像資料
    try {
      const updateUserImageResult = userDataFetcher.updateUserImage(
        req.userInfo.id,
        imageFileName
      );
      if (updateUserImageResult) {
        return res.status(200).json({ ok: true, imageName: imageFileName });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ error: true, message: "Fail to update user image." });
    }
  }
);

module.exports = router;
