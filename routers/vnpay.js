const express = require("express");
const crypto = require("crypto");
const moment = require("moment");
const qs = require("querystring");
const vnpayRoute = express.Router();
const { responseSuccess, responseError } = require("../util");
const connec = require("../models/connectDB");
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const vnp_TmnCode = process.env.VNP_TMNCODE;
const vnp_HashSecret = process.env.VNP_HASHSECRET;
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl = "http://localhost:5173/paysuccess";
// const vnp_ReturnUrl = "http://localhost:3000/api/vnpay_return";

vnpayRoute.post(
  "/createUrlPayment",
  asyncHandler((req, res) => {
    const tmnCode = vnp_TmnCode;
    const secretKey = vnp_HashSecret;
    const vnpUrl = vnp_Url;
    const returnUrl = vnp_ReturnUrl;
    const amount = req.body.amount;

    let ipAddr = req.ip;
    let orderId = moment().format("YYYYMMDDHHmmss");
    // let bankCode = req.query.bankCode || "NCB";

    let createDate = moment().format("YYYYMMDDHHmmss");
    let orderInfo = "Thanh_toan_don_hang";
    let locale = req.query.language || "vn";
    let currCode = "VND";

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: currCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: "billpayment",
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    function sortObject(obj) {
      const sorted = {};
      const keys = Object.keys(obj).sort();
      for (const key of keys) {
        sorted[key] = obj[key];
      }
      return sorted;
    }
    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params);
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac
      .update(new Buffer.from(signData, "utf-8"))
      .digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    // const paymentUrl = vnp_Url + "?" + qs.stringify(vnp_Params);
    const paymentUrl = `${vnpUrl}?${qs.stringify(vnp_Params)}`;

    res.json({ paymentUrl });
  })
);

vnpayRoute.get(
  "/checkPayment",
  asyncHandler((req, res) => {
    const vnp_Params = req.query;

    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    function sortObject(obj) {
      const sorted = {};
      const keys = Object.keys(obj).sort();
      for (const key of keys) {
        sorted[key] = obj[key];
      }
      return sorted;
    }

    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams);
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      // Thành công
      res.json(responseSuccess(200, "xác nhận thành công"));
      //   console.log("secureHash", secureHash);
      //   console.log("signed", signed);
      // res.redirect(
      //   `http://localhost:5173/paysuccess?vnp_Amount=${vnp_Params["vnp_Amount"]}`
      // );
    } else {
      res.json(responseError(203, "xảy ra lỗi thanh toán"));
      // Không hợp lệ
      // res.redirect("http://localhost:5173/payfail");
    }
  })
);

module.exports = vnpayRoute;
