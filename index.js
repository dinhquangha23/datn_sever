const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const router = require("./routers");
const { success } = require("./util/response");
const jwtMiddleware = require("./middleware/jwtMiddleware.js");
const PORT = process.env.PORT_SEVER || 3000;
require("dotenv").config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use("/public", express.static("public"));

app.use("/api", router);
app.get("/home", jwtMiddleware, (req, res) => {
  console.log(req.user);
  res.json(success(res.statusCode, "vào home thành công"));
});

app.listen(PORT, () => {
  console.log("xin chao ngai dinh quang ha");
});
