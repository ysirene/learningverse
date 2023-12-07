const express = require("express");
const app = express();
const server = require("http").Server(app);

global.server = server;

const apiUserRouter = require("./routers/apiUser");
const apiMyCourseRouter = require("./routers/apiMyCourse");
const apiCourseRouter = require("./routers/apiCourse");
const courseRouter = require("./routers/courseRouter");
const roomRouter = require("./routers/roomRouter");
const memberAreaRouter = require("./routers/memberAreaRouter");
const myCourseRouter = require("./routers/myCourseRouter");

const port = 5001;

app.use(express.static("static"));
app.set("view engine", "ejs");

app.use("/api/user", apiUserRouter);
app.use("/api/myCourse", apiMyCourseRouter);
app.use("/api/course", apiCourseRouter);
app.use("/course", courseRouter);
app.use("/room", roomRouter);
app.use("/memberArea", memberAreaRouter);
app.use("/myCourse", myCourseRouter);

app.get("/", (req, res) => {
  res.render("index");
});

server.listen(port, () => {
  console.log(`伺服器正在聆聽port ${port}`);
});
