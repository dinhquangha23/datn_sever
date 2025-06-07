const express = require("express");
const variantRoute = express.Router();
const connec = require("../models/connectDB");
const { responseSuccess } = require("../util");
// Middleware để xử lý lỗi async
// const connection = connec()
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// lấy danh sách màu sắc đã có
variantRoute.post(
  "/listColorBySize",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const { id_size, id_product } = req.body;
      const get_color_exist =
        "SELECT colors.color FROM `product_detail` JOIN `colors` ON colors.id = product_detail.id_color JOIN `sizes` ON sizes.id = product_detail.id_size WHERE sizes.id=? AND product_detail.id_product=?";
      const [results] = await connection.execute(get_color_exist, [
        id_size,
        id_product,
      ]);

      const array = [];
      results.map((data) => {
        array.push(data.color);
      });
      res.json(responseSuccess(200, "tất cả color", array));
    } catch (error) {
      console.log("loi o get varianrt");
      console.error(error, "loi trong get vảianrt");
      res
        .status(500)
        .json(
          responseError(res.statusCode, "có lỗi trong truy vấn get variant")
        );
    } finally {
      await connection.end();
    }
  })
);

variantRoute.post(
  "/addVariant",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const { id_color, id_size, id_product } = req.body;
      const insert_product_detail =
        "INSERT INTO `product_detail`(`id_product`, `id_size`, `id_color`) VALUES (?, ?, ?)";
      const [results] = await connection.execute(insert_product_detail, [
        id_product,
        id_size,
        id_color,
      ]);

      res.json(
        responseSuccess(201, "Thêm biến cho sản phẩm thành công", results)
      );
    } catch (error) {
      console.log("loi o get varianrt");
      console.error(error, "loi trong insert vảianrt");
      res
        .status(500)
        .json(
          responseError(res.statusCode, "có lỗi trong truy vấn get variant")
        );
    } finally {
      await connection.end();
    }
  })
);
module.exports = variantRoute;
