const express = require("express");
const jwt = require("jsonwebtoken");
const accontRouter = express.Router();
const bcrybt = require("bcrypt");
const connec = require("../models/connectDB");
const { success } = require("../util/response");
const { OAuth2Client } = require("google-auth-library");
const { responseSuccess } = require("../util");

const hashsalt = 10;
const id_client_google = process.env.GG_CLIENT_ID;

const client = new OAuth2Client(id_client_google);

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

accontRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const [results] = await connection.query(
        "SELECT * FROM `users` WHERE users.email=?",
        [req.body.email]
      );

      if (results.length > 0) {
        return res.json(success(402, "Email Tài khoản đã tồn tại"));
      }
      const password = await bcrybt.hash(req.body.password, hashsalt);
      const [resultAccount] = await connection.query(
        "INSERT INTO `users`(`email`, `password`) VALUES (?,?)",
        [req.body.email, password]
      );
      res.json(responseSuccess(200, "Đăng kí thành công", resultAccount));
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu account" });
    } finally {
      await connection.end();
    }
  })
);

accontRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const [results] = await connection.query(
        "SELECT * FROM `users` WHERE users.email=? AND users.googleId IS NULL",
        [req.body.email]
      );

      if (results.length > 0) {
        // nếu tài khoản tồn tại
        let veryfyPassword = bcrybt.compareSync(
          req.body.password,
          results[0].password
        );

        if (veryfyPassword) {
          // nếu đùng tk và mật khẩu
          const token = jwt.sign(
            {
              id: results[0].id,
              email: results[0].email,
            },
            process.env.JWT_SECRET,
            {
              expiresIn: process.env.JWT_EXPIRES_IN,
            }
          );
          // refreshTokent
          const refreshToken = jwt.sign(
            {
              id: results[0].id,
              email: results[0].email,
            },
            process.env.JWT_REFRESH_SECRET,
            {
              expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
            }
          );
          return res.json(
            success(res.statusCode, "Đăng nhập thành công", {
              token,
              refreshToken,
            })
          );
        }

        return res.json(
          res.json(success(401, "tài khoản và mật khẩu không chính xác"))
        );
      } else {
        return res.json(
          success(
            401,
            "Email này cần đăng nhập bằng GoogleAccount hoặc đăng ký tài khoản mới"
          )
        );
      }
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu account" });
    } finally {
      await connection.end();
    }
  })
);

accontRouter.post(
  "/refreshtoken",
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ message: "Thiếu refresh token" });

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Tạo lại access token
      const newAccessToken = jwt.sign(
        { id: decoded.id, email: decoded.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
      return res.status(403).json({ message: "Refresh token không hợp lệ" });
    }
  })
);

accontRouter.post(
  "/authGoogle",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const { idToken } = req.body;

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: id_client_google,
      });
      const payload = ticket.getPayload();
      const email = payload.email;
      const googleId = payload.sub;

      // Kiểm tra xem user này đã đăng nhập bằng google vào ứng dụng lần nào chưa
      let sql_check_user_google_exist =
        "SELECT * FROM `users` WHERE users.email=? AND users.googleId =?";

      const [result_google_exist] = await connection.execute(
        sql_check_user_google_exist,
        [email, googleId]
      );
      if (result_google_exist.length <= 0) {
        let sql_insert = "INSERT INTO `users`(`email`,`googleId`) VALUES (?,?)";
        const [result_insert] = await connection.execute(sql_insert, [
          email,
          googleId,
        ]);

        if (result_insert != null) {
          const token = jwt.sign(
            {
              id: result_insert.insertId,
              email: email,
            },
            process.env.JWT_SECRET,
            {
              expiresIn: process.env.JWT_EXPIRES_IN,
            }
          );
          const refreshToken = jwt.sign(
            {
              id: result_insert.insertId,
              email: email,
            },
            process.env.JWT_REFRESH_SECRET,
            {
              expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
            }
          );
          res.json(
            responseSuccess(200, "đăng nhập thành công với google", {
              token,
              refreshToken,
            })
          );
        }
      } else {
        // nếu có rồi thì tạo token

        const token = jwt.sign(
          {
            id: result_google_exist[0].id,
            email: result_google_exist[0].email,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: process.env.JWT_EXPIRES_IN,
          }
        );
        const refreshToken = jwt.sign(
          {
            id: result_google_exist[0].id,
            email: result_google_exist[0].email,
          },
          process.env.JWT_REFRESH_SECRET,
          {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
          }
        );
        res.json(
          responseSuccess(
            200,
            "đăng nhập thành công với google và đã đặng nhập 1 lần rồi",
            { token, refreshToken }
          )
        );
      }
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu authGoogle" });
    } finally {
      await connection.end();
    }
  })
);

module.exports = accontRouter;
