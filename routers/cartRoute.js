const express = require("express");
const cartRoute = express.Router();
const connec = require("../models/connectDB");
const { responseSuccess, responseError } = require("../util");
// Middleware để xử lý lỗi async
// const connection = connec()
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// BẮT ĐẦU CÁI MỚI
// lấy ra giỏ hàng của người dùng với id
cartRoute.get(
  "/cart/:id",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id = req.params?.id; // id User
    try {
      let sql =
        "SELECT cart_items.id AS id_cart_item , cart_items.id_product_detail As id_product_detail,products.name, products.first_image, products.second_image,products.price,colors.color,sizes.size, cart_items.quantity FROM `carts` JOIN `cart_items` ON carts.id= cart_items.id_cart JOIN `product_detail`ON product_detail.id = cart_items.id_product_detail JOIN `products` ON products.id = product_detail.id_product JOIN `colors` ON colors.id = product_detail.id_color JOIN `sizes` ON sizes.id = product_detail.id_size WHERE carts.id_user = ?";
      const [result] = await connection.execute(sql, [id]);
      res.json(responseSuccess(res.statusCode, "Giỏ hàng", result));
    } catch (error) {
      console.error(error);
      res.json(
        responseError(res.statusCode, "Lỗi trong getProduct by id", null)
      );
    } finally {
      await connection.end();
    }
  })
);

// sửa số lượng trong giỏ hàng
cartRoute.put(
  "/cart",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const { id_cart_item, quantity } = req.body;
    try {
      let sql = "UPDATE `cart_items` SET `quantity`=? WHERE cart_items.id=?";
      const [result] = await connection.execute(sql, [quantity, id_cart_item]);
      res.json(responseSuccess(res.statusCode, "Cập nhập thành công", result));
    } catch (error) {
      console.error(error);
      res.json(
        responseError(res.statusCode, "Lỗi trong update quantity cart", null)
      );
    } finally {
      await connection.end();
    }
  })
);

// THÊM SẢN PHẨM VÀO GIỎ HÀNG
cartRoute.post(
  "/addCart",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id_product = parseInt(req.body.id_product);
    const color = req.body.color;
    const size = req.body.size;
    const price = parseInt(req.body.price);
    const quantity = parseInt(req.body.quantity);
    // console.log({ id_product, color, size, price });

    let sql_check_cart_user = "SELECT * FROM `carts` WHERE carts.id_user=?";
    let id_cart;
    const [result] = await connection.execute(sql_check_cart_user, [
      req.user.id,
    ]);
    if (result.length <= 0) {
      let sql_insert_user_in_cart = "INSERT INTO `carts`(`id_user`) VALUES (?)";
      var [result_insert] = await connection.execute(sql_insert_user_in_cart, [
        req.user.id,
      ]);
      id_cart = result_insert.insertId;
    } else {
      id_cart = result[0]?.id;
    }

    // console.log(id_cart);

    let sql_get_productDetailId =
      "SELECT product_detail.id,product_detail.id_product,sizes.size,colors.color FROM `product_detail` JOIN `sizes` ON sizes.id = product_detail.id_size JOIN `colors` ON product_detail.id_color = colors.id WHERE colors.color =? AND sizes.size=? AND product_detail.id_product=?";
    const [result_product_detail_id] = await connection.execute(
      sql_get_productDetailId,
      [color, size, id_product]
    );
    if (result_product_detail_id.length <= 0) {
      return res.json(
        responseSuccess(203, "Biến thể màu sắc hoặc size hiện hết hàng")
      );
    }
    let id_product_detail = result_product_detail_id[0].id;

    //
    //
    //
    //
    //

    // đây là kiểm tra xem giỏ hàng có tồn taij sản phẩm này chưa
    let sql_check_cart_exist =
      "SELECT cart_items.quantity, cart_items.id FROM `cart_items` WHERE cart_items.id_cart=? AND cart_items.id_product_detail=?";
    const [result_check_exist] = await connection.execute(
      sql_check_cart_exist,
      [id_cart, id_product_detail]
    );

    // res.json(result_check_exist);
    // nếu đã tồn tại
    if (result_check_exist.length != 0) {
      let oldQuantity = result_check_exist[0].quantity;
      let newQuantity = parseInt(oldQuantity) + quantity;
      console.log(newQuantity);
      let sql_update_quantity_if_exist =
        "UPDATE `cart_items` SET `quantity`= ? WHERE cart_items.id=?";
      const [result_update_quantity_if_exist] = await connection.execute(
        sql_update_quantity_if_exist,
        [newQuantity, result_check_exist[0].id]
      );
      if (result_update_quantity_if_exist !== null) {
        res.json(
          responseSuccess(
            201,
            "thên giỏ hàng mà sản phẩm đã tồn tại thành công",
            result_update_quantity_if_exist
          )
        );
      } else {
        res.json(
          responseError(
            500,
            "Thêm giỏ hàng mà sản phẩm tồn tại thất bại",
            result_update_quantity_if_exist
          )
        );
      }
    } else {
      // đây là thêm vào giỏ hàng
      let sql_insert_cart =
        "INSERT INTO `cart_items`(`id_cart`, `id_product_detail`, `quantity`) VALUES (?,?,?)";
      console.log("id_product_detaiul:", id_product_detail);
      const [result_cart] = await connection.execute(sql_insert_cart, [
        id_cart,
        id_product_detail,
        quantity,
      ]);

      if (result_cart != null) {
        res.json(responseSuccess(200, "Thêm giỏ hàng thành công", result_cart));
      } else {
        res.json(responseError(500, "Thêm giỏ hàng thất bại", result_cart));
      }
    }
  })
);

cartRoute.delete(
  "/cart/:id_cart_item",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id = req.params?.id_cart_item;

    try {
      let sql = "DELETE FROM `cart_items` WHERE cart_items.id=?";
      const [result] = await connection.execute(sql, [id]);
      res.json(responseSuccess(res.statusCode, "Cập nhập thành công", result));
    } catch (error) {
      console.error(error);
      res.json(
        responseError(res.statusCode, "Lỗi trong update quantity cart", null)
      );
    } finally {
      await connection.end();
    }
  })
);

// KẾT THÚC CÁI MỚI

// cartRoute.get(
//   "/carts",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     try {
//       const [results] = await connection.query(
//         'SELECT cart.id,cart.id_product,products.Title,cart.color,cart.size,cart.quantity,products.price,products.firstimage AS "thumbnail" FROM `cart` JOIN `products` ON cart.id_product=products.id'
//       );
//       res.json(results);
//     } catch (error) {
//       console.log("loi o get cart");
//       console.error(error, "loi trong get card");
//       res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu cart" });
//     } finally {
//       await connection.end();
//     }
//   })
// );

// cartRoute.post(
//   "/carts",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     connection.config.namedPlaceholders = true; // sử dụng biến dữ chỗ
//     const { id_product, color, size, quantity, id_user } = req.body;
//     console.log("body gui len", req.body);
//     try {
//       const [result] = await connection.execute(
//         "SELECT * FROM `cart` WHERE cart.id_product=? AND cart.color=? AND cart.size=?",
//         [id_product, color, size]
//       );
//       if (result.length != 0) {
//         console.log("da ton tai san pham trong gio hang");
//         // console.log("ket qua tim kiem cart trung",result)
//         let new_quantity = result[0].quantity + quantity;
//         console.log("data nay truyen vào excute", new_quantity, result[0].id);
//         const [result_duplicate] = await connection.execute(
//           "UPDATE cart SET cart.quantity=? WHERE cart.id=?",
//           [new_quantity, result[0].id]
//         );
//         res.json(result_duplicate);
//       } else {
//         // const [results,fill]= await connection.execute("INSERT INTO `cart`(`id_product`,`color`,`size`,`quantity`) VALUES (:id_product, :color, :size, :quantity)",{id_product:Id_product, color: Color, size: Size, quantity: Quantity})
//         const [results, fill] = await connection.execute(
//           "INSERT INTO `cart`(`id_product`,`color`,`size`,`quantity`,`id_user`) VALUES (?, ?, ?, ?, ?)",
//           [id_product, color, size, quantity, id_user]
//         );
//         // console.log({results,data: fill})
//         res.json(results);
//       }
//     } catch (error) {
//       console.log("loi trong post cart");
//       console.error(error);
//       res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu thêm" });
//     } finally {
//       await connection.end();
//     }
//     // console.log(req.body)
//   })
// );
// cartRoute.post(
//   "/get_carts",
//   asyncHandler(async (req, res) => {
//     const id_user = req.body.id_user;
//     const connection = await connec();
//     try {
//       const [results] = await connection.query(
//         'SELECT cart.id,cart.id_product,products.Title,cart.color,cart.size,cart.quantity,products.price,products.firstimage AS "thumbnail" FROM `cart` JOIN `products` ON cart.id_product=products.id WHERE cart.id_user =?',
//         [id_user]
//       );
//       res.json(results);
//     } catch (error) {
//       console.log("loi o get cart");
//       console.error(error, "loi trong get card");
//       res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu cart" });
//     } finally {
//       await connection.end();
//     }
//   })
// );
// cartRoute.put(
//   "/carts/:id",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();

//     const id = req.params?.id;
//     const quantity = req.body?.quantity;
//     try {
//       const [results, fill] = await connection.execute(
//         "UPDATE cart SET cart.quantity=? WHERE cart.id_product=?",
//         [quantity, id]
//       );
//       // console.log({results,data: fill})
//       // const { changedRows, ...result } = results;
//       results.rowUpdate = results.affectedRows;
//       delete results.affectedRows;
//       // console.log(results)
//       res.json(results);
//     } catch (error) {
//       console.error(error);
//       res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu thêm" });
//     } finally {
//       await connection.end();
//     }
//     console.log(id);
//     // console.log("quantity in put method",req.body)
//   })
// );

// cartRoute.delete(
//   "/carts",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     let id = req.body?.id;
//     let color = req.body?.color;
//     let size = req.body?.size;
//     try {
//       const [results, fill] = await connection.execute(
//         "DELETE FROM `cart` WHERE cart.id =? AND cart.color =? AND cart.size =?",
//         [id, color, size]
//       );
//       console.log(results);
//       results.rowUpdate = results.affectedRows;
//       delete results.affectedRows;
//       res.json(results);
//     } catch (error) {
//       console.error(error);
//       res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu xóa" });
//     } finally {
//       await connection.end();
//     }
//     // console.log("quantity in put method",req.body)
//   })
// );

module.exports = cartRoute;
