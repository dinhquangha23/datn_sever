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

      // const sql_check_variant_exist = "SELECT * FROM `product_detail` WHERE product_detail.id_product=? AND product_detail.id_size=? AND product_detail.id_color=?"
      // const [result_chek]=await connection.execute(sql_check_variant_exist,[id_product,id_size,id_color])
      // console.log(result_chek)
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

variantRoute.get(
  "/getVariant",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const get_product_variant =
        "SELECT product_detail.id, products.name,products.first_image,products.price,colors.color, sizes.size, categories.name as 'category' FROM `product_detail` JOIN products on product_detail.id_product= products.id JOIN colors ON colors.id = product_detail.id_color JOIN sizes on sizes.id= product_detail.id_size JOIN categories On categories.id = products.category_id";
      const [results] = await connection.execute(get_product_variant);

      res.json(responseSuccess(201, "Tất cả các biến thể", results));
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
// xóa biến thể
variantRoute.delete(
  "/deleteVariant/:id_product_detail",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id_product_detail = req.params?.id_product_detail;
    try {
      const delete_product_variant =
        "DELETE FROM `product_detail` WHERE product_detail.id=?";
      const [results] = await connection.execute(delete_product_variant, [
        id_product_detail,
      ]);

      res.json(responseSuccess(200, "Xóa thành công", results));
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

variantRoute.get(
  "/variantSearch",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const search = req.query?.search;

    try {
      // console.log("tìm kiếm");
      let sql = `SELECT product_detail.id, products.name,products.first_image,products.price,colors.color, sizes.size, categories.name as 'category' FROM \`product_detail\` JOIN products on product_detail.id_product= products.id JOIN colors ON colors.id = product_detail.id_color JOIN sizes on sizes.id= product_detail.id_size JOIN categories On categories.id = products.category_id WHERE products.name LIKE "%${search}%" OR sizes.size LIKE "${search}%"  OR colors.color LIKE "%${search}%"`;
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
module.exports = variantRoute;
