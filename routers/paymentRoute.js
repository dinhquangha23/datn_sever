const express = require("express");
const paymentRoute = express.Router();
const connec = require("../models/connectDB");
const { json } = require("body-parser");
const { responseSuccess } = require("../util");
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

paymentRoute.get(
  "/payment",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const get_payment =
        "SELECT payment.*,orders.id_user,user_details.full_name,user_details.phone, user_details.address FROM `payment` JOIN `orders` ON orders.id= payment.id_order JOIN `user_details` ON user_details.id_user= orders.id_user";
      const [results] = await connection.execute(get_payment);
      res.json(responseSuccess(200, "tất cả payment", results));
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

paymentRoute.get(
  "/paymentSearch",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const search = req.query?.search;

    try {
      let sql = `SELECT payment.*,orders.id_user,user_details.full_name,user_details.phone, user_details.address FROM \`payment\` JOIN \`orders\` ON orders.id= payment.id_order JOIN \`user_details\` ON user_details.id_user= orders.id_user WHERE payment.transaction_id LIKE "%${search}%" OR payment.payment_status LIKE "%${search}%" OR user_details.address LIKE "%${search}%" OR user_details.full_name LIKE "%${search}%" or user_details.phone LIKE "%${search}%"`;
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

// kết thúc cái mới

// paymentRoute.get(
//   "/payment:id_user",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     const id_user = req.params?.id_user;
//     try {
//       const [results] = await connection.execute(
//         "SELECT * FROM `payment` WHERE payment.id_user =?",
//         [id_user]
//       );
//       res.json(results);
//     } catch (error) {
//       console.log("loi o get cart");
//       console.error(error, "loi trong get payment");
//       res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu payment" });
//     } finally {
//       await connection.end();
//     }
//   })
// );

// paymentRoute.get(
//   "/payment",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     const id_user = req.params?.id_user;
//     try {
//       const [results] = await connection.execute(
//         "SELECT payment.id, payment.id_product, payment.id_user, payment.note, payment.infor_local, payment.total_money, payment.status, users.fullname,users.address,users.phonenumber FROM payment INNER JOIN users ON payment.id_user= users.id UNION SELECT payment.id, payment.id_product, payment.id_user, payment.note, payment.infor_local, payment.total_money, payment.status, NULL AS fullName,NULL AS address,NULL AS phonenumber FROM payment WHERE payment.id_user IS NULL"
//       );

//       results.map((data) => {
//         if (data.id_user == null) {
//           data.fullname = JSON.parse(data.infor_local).fullName;
//           data.address = JSON.parse(data.infor_local).address;
//           data.phonenumber = JSON.parse(data.infor_local).phoneNumber;
//         }
//       });

//       res.json(results);

//       // console.log(results)
//     } catch (error) {
//       console.log("loi o get cart");
//       console.error(error, "loi trong get payment");
//       res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu payment" });
//     } finally {
//       await connection.end();
//     }
//   })
// );

// paymentRoute.post(
//   "/payment",
//   asyncHandler(async (req, res) => {
//     const { id_user, id_product, note, status, infor_local, total_money } =
//       req.body;
//     const connection = await connec();
//     try {
//       console.log("paymentSend", req.body);
//       const [results] = await connection.query(
//         "INSERT INTO `payment`(`id_product`, `id_user`, `note`, `status`,`infor_local`,`total_money`) VALUES (?, ?, ?, ?, ?, ?)",
//         [
//           JSON.stringify(id_product),
//           id_user,
//           note,
//           status,
//           JSON.stringify(infor_local),
//           total_money,
//         ]
//       );
//       res.json(results);
//     } catch (error) {
//       console.log("loi o payment");
//       console.error(error, "loi trong post payment");
//       res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu payment" });
//     } finally {
//       await connection.end();
//     }
//   })
// );

// paymentRoute.put(
//   "/payment",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     const { id, status } = req.body;
//     try {
//       const [results] = await connection.query(
//         "UPDATE `payment` SET `status`=? WHERE payment.id=?",
//         [status, id]
//       );

//       res.json(results);
//       // console.log("data -post",Title,firstimage,secondimage,price,category_id)
//     } catch (error) {
//       console.error(error);
//       res
//         .status(500)
//         .json({
//           error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu payment update",
//         });
//     } finally {
//       await connection.end();
//     }
//     // res.json(req.params?.id)
//   })
// );

// paymentRoute.delete(
//   "/payment",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     const { id } = req.body;
//     try {
//       // console.log(id)
//       const [results] = await connection.execute(
//         "DELETE FROM `payment` WHERE payment.id=?",
//         [id]
//       );
//       res.json(results);
//     } catch (error) {
//       console.log("loi o delete payment");
//       console.error(error, "loi trong delete payment");
//       res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu category" });
//     } finally {
//       await connection.end();
//     }
//   })
// );

module.exports = paymentRoute;
