const express = require("express");
const statisticalRoute = express.Router();
const connec = require("../models/connectDB");
const { responseSuccess } = require("../util");
// Middleware để xử lý lỗi async
// const connection = connec()
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

statisticalRoute.get(
  "/statistiaclTotalMoney",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const get_total_statistical =
        "SELECT SUM(orders.total_money) AS Total_statistical FROM `orders`";
      const [results] = await connection.execute(get_total_statistical);
      res.json(responseSuccess(200, "Tổng doanh thu", results));
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
statisticalRoute.get(
  "/statistiaclTotalOrder",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const get_total_order = "SELECT COUNT(*) AS Total_order FROM `orders`";
      const [results] = await connection.execute(get_total_order);
      res.json(responseSuccess(200, "Tổng đơn hàng", results));
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

statisticalRoute.get(
  "/statistiaclNotYetComfirm",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const get_not_yet_comfirm =
        "SELECT COUNT(*) AS NotYetComfirm FROM `orders` WHERE orders.status !='Đang Giao Hàng'";
      const [results] = await connection.execute(get_not_yet_comfirm);
      res.json(responseSuccess(200, "số đơn hàng chưa xác nhận", results));
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

module.exports = statisticalRoute;
