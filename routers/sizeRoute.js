const express = require("express");
const sizeRoute = express.Router();
const connec = require("../models/connectDB");
const { responseSuccess } = require("../util");
// Middleware để xử lý lỗi async
// const connection = connec()
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// lấy tất cả size
sizeRoute.get(
  "/size",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const get_size = "SELECT * FROM `sizes` ";
      const [results] = await connection.execute(get_size);
      res.json(responseSuccess(200, "tất cả size", results));
    } catch (error) {
      console.log("loi o get size");
      console.error(error, "loi trong get size");
      res
        .status(500)
        .json(responseError(res.statusCode, "có lỗi trong truy vấn get size"));
    } finally {
      await connection.end();
    }
  })
);

// lấy lsit size - danh sách size chỉ là mảng như [a,b,c,....]
sizeRoute.get(
  "/sizeList",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const get_size = "SELECT * FROM `sizes` ";
      const [results] = await connection.execute(get_size);
      const list_site = [];
      results.map((data) => {
        list_site.push(data.size);
      });
      res.json(responseSuccess(200, "list size", list_site));
    } catch (error) {
      console.log("loi o get list size");
      console.error(error, "loi trong get list size");
      res
        .status(500)
        .json(responseError(res.statusCode, "có lỗi trong truy vấn get size"));
    } finally {
      await connection.end();
    }
  })
);

sizeRoute.post(
  "/size",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const { size } = req.body;
    try {
      // console.log(size);
      const [results] = await connection.execute(
        "INSERT INTO `sizes`(`size`) VALUES (?)",
        [size]
      );
      res.json(responseSuccess(201, "thêm size thành công", results));
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
sizeRoute.put(
  "/size",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const { id, size } = req.body;
    try {
      console.log(id);
      const [results] = await connection.execute(
        "UPDATE `sizes` SET `size`=? WHERE sizes.id=?",
        [size, id]
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
sizeRoute.delete(
  "/size/:id_size",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id_size = req.params.id_size;
    try {
      console.log(req.body);
      const [results] = await connection.execute(
        "DELETE FROM `sizes` WHERE sizes.id=?",
        [id_size]
      );
      res.json(responseSuccess(200, "xóa Size thành công", results));
    } catch (error) {
      console.log("loi o delete size");
      console.error(error, "loi trong delete size");
      res
        .status(500)
        .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu category" });
    } finally {
      await connection.end();
    }
  })
);

sizeRoute.get(
  "/sizeSearch",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const search = req.query?.search;

    try {
      let sql = `SELECT * FROM \`sizes\` WHERE sizes.size LIKE "%${search}%"`;
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

module.exports = sizeRoute;
