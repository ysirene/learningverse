const express = require("express");
const app = express();

const apiUserRouter = require("./routers/apiUser");

const port = 5001;

app.use(express.static("static"));
app.set("view engine", "ejs");

app.use("/api/user", apiUserRouter);

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/room/:roomCode", (req, res) => {
  res.render("room");
});

app.listen(port, () => {
  console.log(`伺服器正在聆聽port ${port}`);
});
