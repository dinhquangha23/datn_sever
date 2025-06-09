const express = require("express");
const colorRoute = express.Router();
const connec = require("../models/connectDB");
const { responseSuccess } = require("../util");
// Middleware để xử lý lỗi async
// const connection = connec()
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

colorRoute.get(
  "/color",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const get_color = "SELECT * FROM `colors` ";
      const [results] = await connection.execute(get_color);
      res.json(responseSuccess(200, "tất cả color", results));
    } catch (error) {
      console.log("loi o get color");
      console.error(error, "loi trong get color");
      res
        .status(500)
        .json(responseError(res.statusCode, "có lỗi trong truy vấn get color"));
    } finally {
      await connection.end();
    }
  })
);

// lấy lsit size - danh sách size chỉ là mảng như [a,b,c,....]
colorRoute.get(
  "/colorList",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const get_color = "SELECT * FROM `colors` ";
      const [results] = await connection.execute(get_color);
      const list_color = [];
      results.map((data) => {
        list_color.push(data.color);
      });
      res.json(responseSuccess(200, "list color", list_color));
    } catch (error) {
      console.log("loi o get list color");
      console.error(error, "loi trong get list color");
      res
        .status(500)
        .json(responseError(res.statusCode, "có lỗi trong truy vấn get color"));
    } finally {
      await connection.end();
    }
  })
);

colorRoute.post(
  "/color",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const { color } = req.body;
    try {
      // console.log(size);
      const [results] = await connection.execute(
        "INSERT INTO `colors`(`color`) VALUES (?)",
        [color]
      );
      res.json(responseSuccess(201, "thêm color thành công", results));
    } catch (error) {
      console.log("loi o post color");
      console.error(error, "loi trong post color");
      res
        .status(500)
        .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu color" });
    } finally {
      await connection.end();
    }
  })
);
colorRoute.put(
  "/color",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const { id, color } = req.body;
    try {
      console.log(id);
      const [results] = await connection.execute(
        "UPDATE `colors` SET `color`=? WHERE colors.id=?",
        [color, id]
      );
      res.json(responseSuccess(200, "sửa size thành công", results));
    } catch (error) {
      console.log("loi o put size");
      console.error(error, "loi trong put size");
      res
        .status(500)
        .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu size" });
    } finally {
      await connection.end();
    }
  })
);
colorRoute.delete(
  "/color/:id_color",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id_color = req.params.id_color;
    try {
      console.log(req.body);
      const [results] = await connection.execute(
        "DELETE FROM `colors` WHERE colors.id=?",
        [id_color]
      );
      res.json(responseSuccess(200, "xóa color thành công", results));
    } catch (error) {
      console.log("loi o delete color");
      console.error(error, "loi trong delete color");
      res
        .status(500)
        .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu color" });
    } finally {
      await connection.end();
    }
  })
);
colorRoute.get(
  "/colorSearch",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const search = req.query?.search;

    try {
      let sql = `SELECT * FROM \`colors\` WHERE colors.color LIKE "%${search}%"`;
      const [results] = await connection.query(sql);
      res.json(responseSuccess(200, "kết quả tìm kiếm", results));
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu trong search product",
      });
    } finally {
      await connection.end();
    }
  })
);

module.exports = colorRoute;
