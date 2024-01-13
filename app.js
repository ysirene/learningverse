const express = require("express");
const app = express();
const server = require("http").Server(app);
global.server = server;

const apiUserRouter = require("./routers/apiUser");
const apiMyCourseRouter = require("./routers/apiMyCourse");
const apiCourseRouter = require("./routers/apiCourse");
const roomRouter = require("./routers/roomRouter");
const utils_getWeekday = require("./dataHandling/renderingUtilities");

const port = 5001;

app.use(express.static("static"));
app.set("view engine", "ejs");

app.use("/api/user", apiUserRouter);
app.use("/api/myCourse", apiMyCourseRouter);
app.use("/api/course", apiCourseRouter);
app.use("/room", roomRouter);

app.get("/course/:courseId", (req, res) => {
  res.render("course");
});
app.get("/myCourse", (req, res) => {
  res.render("myCourse", { getWeekday: utils_getWeekday });
});
app.get("/memberArea", (req, res) => {
  res.render("memberArea");
});
app.get("/", (req, res) => {
  res.render("index");
});

server.listen(port, () => {
  console.log(`伺服器正在聆聽port ${port}`);
});
