const express = require("express");
const crypto = require("crypto");
const moment = require("moment");
const qs = require("querystring");
const ghnRoute = express.Router();
const { responseSuccess, responseError } = require("../util");
const connec = require("../models/connectDB");
const { default: axios } = require("axios");

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
let ghn_token = process.env.GHN_TOKEN;
let ghn_shop_id = process.env.GHN_SHOP_ID;

ghnRoute.get(
  "/GHN/provinces",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const response = await axios.get(
        "https://online-gateway.ghn.vn/shiip/public-api/master-data/province",
        {
          headers: {
            Token: ghn_token,
            "Content-Type": "application/json",
          },
        }
      );
      res.json(responseSuccess(200, "Danh sách tỉnh", response.data.data));
    } catch (error) {
      console.error(error);
      res.json(
        responseError(res.statusCode, "Lỗi trong get GHN provinces", null)
      );
    } finally {
      await connection.end();
    }
  })
);
ghnRoute.post(
  "/GHN/district",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const province_id = parseInt(req.body.province_id);
    try {
      const response = await axios.post(
        "https://online-gateway.ghn.vn/shiip/public-api/master-data/district",
        { province_id: parseInt(province_id) },
        {
          headers: {
            "Content-Type": "application/json",
            Token: ghn_token,
          },
        }
      );
      res.json(
        responseSuccess(
          200,
          `Danh sách Huyện theo ${province_id}`,
          response.data.data
        )
      );
    } catch (error) {
      console.error(error);
      res.json(
        responseError(res.statusCode, "Lỗi trong get GHN district", null)
      );
    } finally {
      await connection.end();
    }
  })
);
ghnRoute.post(
  "/GHN/ward",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const district_id = parseInt(req.body.district_id);
    try {
      const response = await axios.post(
        "https://online-gateway.ghn.vn/shiip/public-api/master-data/ward",
        { district_id: parseInt(district_id) },
        {
          headers: {
            "Content-Type": "application/json",
            Token: ghn_token,
          },
        }
      );
      res.json(
        responseSuccess(
          200,
          `Danh sách xã theo ${district_id}`,
          response.data.data
        )
      );
    } catch (error) {
      console.error(error);
      res.json(responseError(res.statusCode, "Lỗi trong get GHN ward", null));
    } finally {
      await connection.end();
    }
  })
);

ghnRoute.post(
  "/GHN/caculateFee",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const { district_id, ward_code, list_item } = req.body;
    let items = list_item.map((it) => ({
      name: `TEST_${it.name}`,
      quantity: it.quantity,
      length: 50,
      width: 5,
      height: 10,
      weight: 100,
    }));
    let payload = {
      service_type_id: 2,
      to_district_id: district_id,
      to_ward_code: ward_code,
      cod_value: 2000000,
      length: 12,
      width: 12,
      height: 12,
      weight: 1200,
      items: items,
    };
    try {
      const response = await axios.post(
        "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Token: ghn_token,
            ShopId: ghn_shop_id,
          },
        }
      );
      res.json(responseSuccess(200, `cước`, response.data.data));
    } catch (error) {
      console.error(error);
      res.json(responseError(res.statusCode, "Lỗi trong post GHN ward", null));
    } finally {
      await connection.end();
    }
  })
);

ghnRoute.post(
  "/GHN/checkState",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const order_code = req.body.order_code;
    try {
      const response = await axios.post(
        "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail",
        { order_code },
        {
          headers: {
            "Content-Type": "application/json",
            Token: ghn_token,
            ShopId: ghn_shop_id,
          },
        }
      );
      // console.log();
      res.json(response.data.data.status);
    } catch (error) {
      console.error(error);
      res.json(
        responseError(res.statusCode, "Lỗi trong get GHN district", null)
      );
    } finally {
      await connection.end();
    }
  })
);

module.exports = ghnRoute;
