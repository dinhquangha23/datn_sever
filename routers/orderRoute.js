const express = require("express");
const orderRoute = express.Router();
const connec = require("../models/connectDB");
const { responseSuccess, responseError } = require("../util");
const { default: axios } = require("axios");
// Middleware để xử lý lỗi async
// const connection = connec()
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// lấy các sản phẩm trong đơn đặt hàng

orderRoute.get(
  "/order",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      let sql_get_all_order =
        "SELECT O.*,UD.full_name,UD.phone,UD.address,Pay.payment_status FROM `orders` O JOIN `user_details` UD ON O.id_user = UD.id_user LEFT JOIN `payment` Pay ON Pay.id_order = O.id";
      const [result_get_all] = await connection.execute(sql_get_all_order);
      res.json(
        responseSuccess(200, "Tất cả tổng quan đơn hàng", result_get_all)
      );
    } catch (error) {
      console.log("có lỗi trong get order", error);
      res.json(responseError(500, "có lỗi trong order", error));
    } finally {
      await connection.end();
    }
  })
);
orderRoute.get(
  "/order/:id_user",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id_user = req.params?.id_user;
    try {
      let sql_get_all_order =
        "SELECT O.*,UD.full_name,UD.phone,UD.address,Pay.payment_status FROM `orders` O JOIN `user_details` UD ON O.id_user = UD.id_user LEFT JOIN `payment` Pay ON Pay.id_order = O.id WHERE O.id_user=?";
      const [result_get_all] = await connection.execute(sql_get_all_order, [
        id_user,
      ]);
      res.json(
        responseSuccess(
          200,
          `Lấy đơn hàng theo Id_user=${id_user}`,
          result_get_all
        )
      );
    } catch (error) {
      console.log("có lỗi trong get order", error);
      res.json(responseError(500, "có lỗi trong order", error));
    } finally {
      await connection.end();
    }
  })
);

orderRoute.put(
  "/orderUpdateStatus",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id_order = req.body.id_order;
    try {
      let sql_update_status =
        "UPDATE `orders` SET `status`=? WHERE orders.id=?";
      const [result_update] = await connection.execute(sql_update_status, [
        "Đã Thanh toán",
        id_order,
      ]);
      res.json(
        responseSuccess(200, `Cập nhập trạng thái thành công`, result_update)
      );
    } catch (error) {
      console.log("có lỗi trong update status order", error);
      res.json(responseError(500, "có lỗi trong order", error));
    } finally {
      await connection.end();
    }
  })
);

// cập  nhập trhangj thái đơn hàng của admin
orderRoute.put(
  "/AdminUpdateStatus",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id_order = req.body.id_order;
    const status = req.body.status;
    try {
      let sql_update_status =
        "UPDATE `orders` SET `status`=? WHERE orders.id=?";
      const [result_update] = await connection.execute(sql_update_status, [
        status,
        id_order,
      ]);
      res.json(
        responseSuccess(200, `Cập nhập trạng thái thành công`, result_update)
      );
    } catch (error) {
      console.log("có lỗi trong update status order", error);
      res.json(responseError(500, "có lỗi trong order", error));
    } finally {
      await connection.end();
    }
  })
);
orderRoute.delete(
  "/order/:id_order",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id_order = req.params.id_order;

    try {
      let sql_update_status = "DELETE FROM `orders` WHERE orders.id=?";
      const [result_delete] = await connection.execute(sql_update_status, [
        id_order,
      ]);
      res.json(responseSuccess(200, `xóa đơn hàng thành công`, result_delete));
    } catch (error) {
      console.log("có lỗi trong update status order", error);
      res.json(responseError(500, "có lỗi trong order", error));
    } finally {
      await connection.end();
    }
  })
);

let ghn_token = process.env.GHN_TOKEN;
let ghn_shop_id = process.env.GHN_SHOP_ID;
// thêm các sản phẩm ở giỏ hàng vào đơn đặt hàng
orderRoute.post(
  "/order",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const totalMoney = req.body.totalMoney;
    const listCarts = req.body.dataCarts;
    const note = req.body.note;
    const {
      name,
      province_id,
      district_id,
      ward_id,
      address_delivery,
      pay_method,
      phone,
      fee_ship,
    } = req.body;

    let items = listCarts.map((it) => ({
      name: `TEST_${it.name}`,
      quantity: it.quantity,
      length: 50,
      width: 5,
      height: 10,
      weight: 100,
    }));

    let id_order;
    try {
      // console.log(req.body);
      const payload = {
        payment_type_id: pay_method == "COD" ? 2 : 1, // nếu cod thì cho người nhận trả còn số 1 là mình trả
        service_type_id: 2, //hàng nhẹ là 2, hàng nặng là 5
        to_name: name,
        to_phone: phone,
        to_address: address_delivery,
        to_ward_name: ward_id,
        to_district_name: district_id,
        to_province_name: province_id,
        cod_amount: pay_method == "COD" ? totalMoney : 0,
        length: 12,
        width: 12,
        height: 12,
        weight: 1200,
        items: items,
        required_note: "CHOXEMHANGKHONGTHU",
      };
      // console.log(payload);
      const response = await axios.post(
        "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Token: ghn_token,
            ShopId: ghn_shop_id,
          },
        }
      );
      let fee, order_code;
      if (response.data.message == "Success") {
        console.log(response.data.data);
        fee = response.data.data.total_fee;
        order_code = response.data.data.order_code;
        let sql_update_user_in_user_detail =
          "UPDATE `user_details` SET `province`=?,`district`=?,`ward`=?,`address_detail`=? WHERE user_details.id_user=?";
        const [result] = await connection.execute(
          sql_update_user_in_user_detail,
          [province_id, district_id, ward_id, address_delivery, req.user.id]
        );
      }

      let sql_insert_user_in_order =
        "INSERT INTO `orders`(`id_user`, `total_money`, `status`, `note`, `order_code`, `fee`) VALUES (?,?,?,?,?,?)";
      const [result_insert_user_in_order] = await connection.execute(
        sql_insert_user_in_order,
        [
          req.user.id,
          totalMoney + fee_ship,
          "Chờ xác nhận đơn hàng",
          note,
          order_code,
          fee,
        ]
      );

      id_order = result_insert_user_in_order.insertId;

      //   thêm tất cả vào bảng đơn hàng chi tiết
      let value_insert = listCarts
        .map((data) => {
          return `(${id_order},${data.id_product_detail},${data.quantity},${data.price})`;
        })
        .join(",");

      let sql_insert_order_detail =
        "INSERT INTO `order_detail`(`id_order`, `id_product_detail`, `quantity`, `price`) VALUES";
      sql_insert_order_detail = sql_insert_order_detail.concat(value_insert);
      const [result_insert_order] = await connection.execute(
        sql_insert_order_detail
      );
      res.json(
        responseSuccess(200, "thêm thành công", {
          id_order,
          result_insert_order,
        })
      );
    } catch (error) {
      console.log("có lỗi trong order", error);
      res.json(responseError(500, "có lỗi trong order", error));
    } finally {
      await connection.end();
    }
  })
);

orderRoute.get(
  "/orderTracking",
  asyncHandler(async (req, res) => {
    const connection = await connec();

    const id_user = req.user.id;
    try {
      let sql_order_tracking =
        "SELECT orders.*,products.id AS'id_product' ,order_detail.quantity,order_detail.price,products.name,products.first_image, colors.color,sizes.size,user_details.full_name,user_details.phone, user_details.province, user_details.district, user_details.ward, user_details.address_detail, user_details.address FROM `orders` JOIN `order_detail` ON orders.id = order_detail.id_order JOIN `product_detail` ON product_detail.id = order_detail.id_product_detail JOIN `products` ON product_detail.id_product = products.id JOIN `colors` ON product_detail.id_color= colors.id JOIN `sizes` ON product_detail.id_size = sizes.id JOIN user_details ON user_details.id_user=orders.id_user WHERE orders.id_user=?";
      const [result] = await connection.execute(sql_order_tracking, [id_user]);

      const groupedById = {};

      result.forEach((item) => {
        if (!groupedById[item.id]) {
          groupedById[item.id] = [];
        }
        groupedById[item.id].push(item);
      });

      // Chuyển object thành mảng như bạn yêu cầu
      const response = Object.entries(groupedById).map(([id, items]) => ({
        id: Number(id),
        full_name: items[0].full_name,
        phone: items[0].phone,
        province: items[0].province,
        district: items[0].district,
        ward: items[0].ward,
        address: items[0].address,
        address_detail: items[0].address_detail,
        order_code: items[0].order_code,
        fee: items[0].fee,
        total_money: items[0].total_money,
        items,
      }));

      res.json(responseSuccess(200, `danh sách đơn hàng`, response));
    } catch (error) {
      console.log("có lỗi trong  order", error);
      res.json(responseError(500, "có lỗi trong order", error));
    } finally {
      await connection.end();
    }
  })
);

orderRoute.get(
  "/orderTrackingByIdOrder/:id_order",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id_order = req.params.id_order;
    try {
      let sql_order_tracking =
        "SELECT orders.*,products.id AS'id_product' ,order_detail.quantity,order_detail.price,products.name,products.first_image, colors.color,sizes.size FROM `orders` JOIN `order_detail` ON orders.id = order_detail.id_order JOIN `product_detail` ON product_detail.id = order_detail.id_product_detail JOIN `products` ON product_detail.id_product = products.id JOIN `colors` ON product_detail.id_color= colors.id JOIN `sizes` ON product_detail.id_size = sizes.id WHERE orders.id=?";
      const [result] = await connection.execute(sql_order_tracking, [id_order]);
      res.json(responseSuccess(200, `danh hàng của 1 đơn`, result));
    } catch (error) {
      console.log("có lỗi trong  order", error);
      res.json(responseError(500, "có lỗi trong order", error));
    } finally {
      await connection.end();
    }
  })
);

// Thêm vào phuong thức thanh toán
orderRoute.post(
  "/payment",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const { id_order, transaction_id, payment_status } = req.body;

    try {
      let sql_insert_payment =
        "INSERT INTO `payment`(`id_order`, `transaction_id`, `payment_status`) VALUES (?, ?, ?)";
      const [result] = await connection.execute(sql_insert_payment, [
        id_order,
        transaction_id,
        payment_status,
      ]);
      res.json(responseSuccess(200, `thêm thành công`, result));
    } catch (error) {
      console.log("có lỗi trong  order", error);
      res.json(responseError(500, "có lỗi trong order", error));
    } finally {
      await connection.end();
    }
  })
);

orderRoute.get(
  "/orderSearch",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const search = req.query?.search;

    try {
      let sql = `SELECT O.*,UD.full_name,UD.phone,UD.address,Pay.payment_status FROM \`orders\` O JOIN \`user_details\` UD ON O.id_user = UD.id_user LEFT JOIN \`payment\` Pay ON Pay.id_order = O.id WHERE UD.full_name LIKE "%${search}%" OR UD.phone LIKE "%${search}%" OR UD.address LIKE "%${search}%" OR O.total_money LIKE "%${search}%" OR O.status LIKE "%${search}%"`;
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

module.exports = orderRoute;
