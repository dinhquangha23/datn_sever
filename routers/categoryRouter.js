const express = require("express");
const categoryRoute = express.Router();
const connec = require("../models/connectDB");
const { responseSuccess } = require("../util");
// Middleware để xử lý lỗi async
// const connection = connec()
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

categoryRoute.get(
  "/category",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const [results] = await connection.execute(
        "SELECT * FROM `categories` ORDER BY categories.id "
      );
      res.json(responseSuccess(200, "danh mục", results));
    } catch (error) {
      console.log("loi o get category");
      console.error(error, "loi trong get category");
      res
        .status(500)
        .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu category" });
    } finally {
      await connection.end();
    }
  })
);
categoryRoute.post(
  "/category",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const { name } = req.body;
    try {
      console.log(name);
      const [results] = await connection.execute(
        "INSERT INTO `categories`(`name`) VALUES (?)",
        [name]
      );
      res.json(responseSuccess(201, "thêm danh mục thành công", results));
    } catch (error) {
      console.log("loi o post category");
      console.error(error, "loi trong post category");
      res
        .status(500)
        .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu category" });
    } finally {
      await connection.end();
    }
  })
);
categoryRoute.put(
  "/category",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const { id, name } = req.body;
    try {
      console.log(id);
      const [results] = await connection.execute(
        "UPDATE `categories` SET `name`=? WHERE categories.id=?",
        [name, id]
      );
      res.json(responseSuccess(200, "sửa danh mục thành công", results));
    } catch (error) {
      console.log("loi o put category");
      console.error(error, "loi trong put category");
      res
        .status(500)
        .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu category" });
    } finally {
      await connection.end();
    }
  })
);
categoryRoute.delete(
  "/category/:id_category",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id_category = req.params.id_category;
    try {
      console.log(req.body);
      const [results] = await connection.execute(
        "DELETE FROM `categories` WHERE categories.id=?",
        [id_category]
      );
      res.json(responseSuccess(200, "xóa danh mục thành công", results));
    } catch (error) {
      console.log("loi o delete category");
      console.error(error, "loi trong delete category");
      res
        .status(500)
        .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu category" });
    } finally {
      await connection.end();
    }
  })
);

module.exports = categoryRoute;
