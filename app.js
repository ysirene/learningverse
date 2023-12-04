const express = require("express");
const app = express();
const server = require("http").Server(app);

global.server = server;

const apiUserRouter = require("./routers/apiUser");
const roomRouter = require("./routers/roomRouter");
const memberAreaRouter = require("./routers/memberAreaRouter");
const apiCourseRouter = require("./routers/apiCourse");
const myCourseRouter = require("./routers/myCourseRouter");

const port = 5001;

app.use(express.static("static"));
app.set("view engine", "ejs");

app.use("/api/user", apiUserRouter);
app.use("/room", roomRouter);
app.use("/memberArea", memberAreaRouter);
app.use("/api/course", apiCourseRouter);
app.use("/myCourse", myCourseRouter);

app.get("/", (req, res) => {
  res.render("index");
});

server.listen(port, () => {
  console.log(`伺服器正在聆聽port ${port}`);
});
