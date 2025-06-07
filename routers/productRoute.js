const express = require("express");
const productRoute = express.Router();
const fs = require("fs");

const connec = require("../models/connectDB");
const { responseSuccess, responseError } = require("../util");
const upload = require("../util/upload");
// Middleware để xử lý lỗi async
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
// bắt đầu cái mới
// lấy tất cả sản phẩm
productRoute.get(
  "/getAllProduct",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      let sql =
        "SELECT products.*,categories.name As `category_name` FROM `products` JOIN categories ON products.category_id = categories.id";
      const [result] = await connection.execute(sql);
      res.json(responseSuccess(res.statusCode, "Tất cả sản phẩm", result));
    } catch (error) {
      console.error(error);
      res.json(responseError(res.statusCode, "Lỗi trong getdAllProduct", null));
    } finally {
      await connection.end();
    }
  })
);
// lấy ramdom sản phẩm
productRoute.get(
  "/getRamdomProduct",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      let sql = "SELECT * FROM products ORDER BY RAND() LIMIT 6";
      const [result] = await connection.execute(sql);
      res.json(responseSuccess(res.statusCode, "5 sản phẩm đầu", result));
    } catch (error) {
      console.error(error);
      res.json(responseError(res.statusCode, "Lỗi trong getdAllProduct", null));
    } finally {
      await connection.end();
    }
  })
);
// lấy sản phẩm theo id
productRoute.get(
  "/Product/:id",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id = req.params?.id;
    try {
      let sql = "SELECT * FROM products WHERE products.id=?";
      const [result] = await connection.execute(sql, [id]);
      res.json(responseSuccess(res.statusCode, "Tất cả sản phẩm", result));
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
// lấy sản phẩm theo id danh mục
productRoute.get(
  "/ProductByCategory/:category",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const category = req.params?.category;
    try {
      let sql = "SELECT * FROM products WHERE products.category_id=?";
      const [result] = await connection.execute(sql, [category]);
      res.json(
        responseSuccess(res.statusCode, "Tất cả sản phẩm theo category", result)
      );
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

// lấy ra sản phẩm chi tiết theo id
productRoute.get(
  "/getDetailProduct/:id",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id = req.params?.id;
    try {
      let sql =
        // "SELECT products.id,products.name,products.first_image,products.second_image,products.price,colors.color,sizes.size FROM `products` JOIN `product_detail`ON products.id = product_detail.id_product JOIN `colors` ON colors.id =product_detail.id_color JOIN `sizes` ON sizes.id = product_detail.id_size WHERE products.id=?"; // câu lệnh này lấy và có thể có lỗi nếu chưa có sản phẩm biến thể chi tiết
        "SELECT products.id,products.name,products.first_image,products.second_image,products.price,colors.color,sizes.size FROM `products` LEFT JOIN `product_detail`ON products.id = product_detail.id_product LEFT JOIN `colors` ON colors.id =product_detail.id_color LEFT JOIN `sizes` ON sizes.id = product_detail.id_size WHERE products.id=?";
      const [result] = await connection.execute(sql, [id]);

      const productMap = new Map();
      for (const data of result) {
        if (!productMap.has(data.id)) {
          productMap.set(data.id, {
            id: data.id,
            name: data.name,
            first_image: data.first_image,
            second_image: data.second_image,
            price: data.price,
            sizes: [],
            colors: [],
          });
        }
        const product = productMap.get(data.id);
        if (!product.sizes.includes(data.size)) {
          product.sizes.push(data.size);
        }
        if (!product.colors.includes(data.color)) {
          product.colors.push(data.color);
        }
      }

      res.json(
        responseSuccess(
          res.statusCode,
          "Tất cả sản phẩm",
          Array.from(productMap.values())
        )
      );
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

// thêm sản phẩm
productRoute.post(
  "/product",
  upload.fields([
    { name: "first_image", maxCount: 1 },
    { name: "second_image", maxCount: 1 },
  ]),
  asyncHandler(async (req, res) => {
    const connection = await connec();

    try {
      let sql =
        "INSERT INTO `products`(`name`, `first_image`, `second_image`, `price`, `category_id`) VALUES (?,?,?,?,?)";
      let first_image = `${req.files?.first_image[0].destination}/${req.files?.first_image[0].filename}`;
      let second_image = `${req.files?.second_image[0].destination}/${req.files.second_image[0].filename}`;
      let name = req.body.name;
      let price = parseInt(req.body.price);
      let category_id = parseInt(req.body.category_id);

      const [result] = await connection.execute(sql, [
        name,
        first_image,
        second_image,
        price,
        category_id,
      ]);

      res.json(responseSuccess(201, "Thêm mới thành công", result));
    } catch (error) {
      console.error(error);
      res.json(responseError(res.statusCode, "lỗi trong thêm sản phẩm", null));
    } finally {
      await connection.end();
    }
  })
);
// sửa sản phẩm

productRoute.put(
  "/product",
  upload.fields([
    { name: "first_image", maxCount: 1 },
    { name: "second_image", maxCount: 1 },
  ]),
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const objectQuery = {};
    let stringJoinSQL = "";
    try {
      console.log(req.files);
      let name, price, category_id;
      if (req?.files?.first_image?.[0]) {
        let first_image = `${req.files?.first_image[0].destination}/${req.files?.first_image[0].filename}`;
        objectQuery["first_image"] = first_image;
      }
      if (req?.files?.second_image?.[0]) {
        let second_image = `${req.files?.second_image[0].destination}/${req.files?.second_image[0].filename}`;
        objectQuery["second_image"] = second_image;
      }
      if (req.body.name != "") {
        name = req.body.name;
        objectQuery["name"] = name;
      }
      if (req.body.price != "") {
        price = parseInt(req.body.price);
        objectQuery["price"] = price;
      }
      if (req.body.category_id != null) {
        category_id = parseInt(req.body.category_id);
        objectQuery["category_id"] = category_id;
      }
      const arrayDependence = [];

      for (const [key, value] of Object.entries(objectQuery)) {
        stringJoinSQL = stringJoinSQL.concat(` \`${key}\`=?, `);
        arrayDependence.push(value);
      }

      let sql = "UPDATE `products` SET ";
      sql = sql.concat(stringJoinSQL);
      sql = sql.trim().replace(/,+$/, "");
      sql = sql.concat(" WHERE products.id=?");
      arrayDependence.push(req.body.id);
      const [result] = await connection.execute(sql, arrayDependence);
      res.json(responseSuccess(200, "cập nhật thành công", result));
    } catch (error) {
      console.error(error);
      res.json(responseError(res.statusCode, "lỗi trong thêm sản phẩm", null));
    } finally {
      await connection.end();
    }
  })
);
// xóa sản phẩm
productRoute.delete(
  "/product/:id",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id = parseInt(req.params.id);
    try {
      let sql_get_by_id = "SELECT * FROM `products` WHERE products.id=?";
      const [result_get_by_id] = await connection.execute(sql_get_by_id, [id]);
      if (result_get_by_id.length > 0) {
        let first_image = result_get_by_id[0].first_image;
        let second_image = result_get_by_id[0].second_image;

        let sql_delete = "DELETE FROM `products` WHERE products.id = ?";
        const [result_delete] = await connection.execute(sql_delete, [id]);
        if (result_delete.affectedRows > 0) {
          fs.unlinkSync(first_image);
          fs.unlinkSync(second_image);
          return res.json(
            responseSuccess(res.statusCode, "xóa sản phẩm thành công", null)
          );
        }
      }
      return res.json(responseError(400, "sản phẩm không tồn tại ", null));
    } catch (error) {
      console.error(error);
      res.json(responseError(res.statusCode, "Lỗi trong delete", null));
    } finally {
      await connection.end();
    }
  })
);

// check biến thể màu sắc và size có tốn tại với mặt hàng này không
productRoute.post(
  "/checkVariant",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const { color, size, id_product } = req.body;
    try {
      let sql_get_productDetailId =
        "SELECT product_detail.id AS `id_product_detail`,product_detail.id_product,sizes.size,colors.color FROM `product_detail` JOIN `sizes` ON sizes.id = product_detail.id_size JOIN `colors` ON product_detail.id_color = colors.id WHERE colors.color =? AND sizes.size=? AND product_detail.id_product=?";
      const [result_product_detail_id] = await connection.execute(
        sql_get_productDetailId,
        [color, size, id_product]
      );
      if (result_product_detail_id.length > 0) {
        return res.json(responseSuccess(200, "OK", result_product_detail_id));
      }
      return res.json(
        responseError(204, "Sản phẩm không sẵn màu và size này", null)
      );
    } catch (error) {
      console.error(error);
      res.json(responseError(res.statusCode, "Lỗi trong delete", null));
    } finally {
      await connection.end();
    }
  })
);

// tìm kiếm sản phẩm
productRoute.get(
  "/search",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const search = req.query?.search;
    try {
      const [results] = await connection.query(
        `SELECT * FROM \`products\` WHERE products.name LIKE "%${search}%" or products.price<= "${search}"`
      );
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

// productRoute.get(
//   "/product",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     const { start, end, categoryId } = req.query;
//     if (start && end) {
//       const sta = parseInt(start);
//       const en = parseInt(end);

//       try {
//         const [results] = await connection.query(
//           'SELECT products.id,Title,firstimage,secondimage,price,categoryname AS"category",products.category_id  FROM `products` INNER JOIN `category` WHERE products.category_id =category.id LIMIT ?, ?',
//           [sta, en]
//         );
//         return res.json(results);
//       } catch (error) {
//         console.error(error);
//         res
//           .status(500)
//           .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu" });
//       }
//     }
//     if (categoryId) {
//       try {
//         const [results] = await connection.query(
//           'SELECT products.id,Title,firstimage,secondimage,price,categoryname AS"category",products.category_id  FROM `products` INNER JOIN `category` WHERE products.category_id =category.id and products.category_id=?',
//           [categoryId]
//         );
//         return res.json(results);
//       } catch (error) {
//         console.error(error);
//         res
//           .status(500)
//           .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu" });
//       } finally {
//         await connection.end();
//       }
//     } else {
//       try {
//         const [results, fields] = await connection.query(
//           'SELECT products.id,Title,firstimage,secondimage,price,categoryname AS"category",products.category_id  FROM `products` INNER JOIN `category` WHERE products.category_id =category.id'
//         );
//         return res.json(results);
//       } catch (error) {
//         console.error(error);
//         res
//           .status(500)
//           .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu" });
//       } finally {
//         await connection.end();
//       }
//     }
//   })
// );
// productRoute.get(
//   "/product/:id",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     const id = req.params?.id;
//     try {
//       // const [[results]]= await connection.query('SELECT * FROM products WHERE id= ?',[id])
//       const [results] = await connection.query(
//         "SELECT * FROM products WHERE id= ?",
//         [id]
//       );

//       res.json(results);
//     } catch (error) {
//       console.error(error);
//       res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu" });
//     } finally {
//       await connection.end();
//     }
//     // res.json(req.params?.id)
//   })
// );
// productRoute.post(
//   "/product",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     const { Title, firstimage, secondimage, price, category_id } = req.body;
//     try {
//       // const [[results]]= await connection.query('SELECT * FROM products WHERE id= ?',[id])
//       const [results] = await connection.query(
//         "INSERT INTO `products`(`Title`, `firstimage`, `secondimage`, `price`, `category_id`) VALUES (?,?,?,?,?)",
//         [Title, firstimage, secondimage, parseInt(price), category_id]
//       );

//       res.json(results);
//       // console.log("data -post",Title,firstimage,secondimage,price,category_id)
//     } catch (error) {
//       console.error(error);
//       res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu" });
//     } finally {
//       await connection.end();
//     }
//     // res.json(req.params?.id)
//   })
// );

// productRoute.put(
//   "/product",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     const { id, Title, firstimage, secondimage, price, category_id } = req.body;
//     try {
//       // const [[results]]= await connection.query('SELECT * FROM products WHERE id= ?',[id])
//       const [results] = await connection.query(
//         "UPDATE `products` SET `Title`=?,`firstimage`=?,`secondimage`=?,`price`=?,`category_id`=? WHERE products.id=?",
//         [Title, firstimage, secondimage, parseInt(price), category_id, id]
//       );

//       res.json(results);
//       // console.log("data -post",Title,firstimage,secondimage,price,category_id)
//     } catch (error) {
//       console.error(error);
//       res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu" });
//     } finally {
//       await connection.end();
//     }
//     // res.json(req.params?.id)
//   })
// );
// productRoute.delete(
//   "/product/:id",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();

//     const id = req.params?.id;
//     try {
//       const [results, fill] = await connection.execute(
//         "DELETE FROM `products` WHERE products.id=?",
//         [id]
//       );
//       // console.log({results,data: fill})
//       const { changedRows, ...result } = results;
//       results.rowUpdate = results.affectedRows;
//       // delete results.affectedRows
//       // console.log(results)
//       res.json(results);
//     } catch (error) {
//       console.error(error);
//       res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu sửa user" });
//     } finally {
//       await connection.end();
//     }
//     // console.log(id)
//   })
// );

// productRoute.post(
//   "/getlistproduct",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     const list = req.body;
//     let sql = "Select * from products where ";
//     console.log(req.body[0]);
//     list.map((item, index) => {
//       console.log(item, index);
//       if (index == 0) {
//         sql = sql.concat(`products.id=${item.split("-")[0]}`);
//       } else {
//         sql = sql.concat(` OR products.id=${item.split("-")[0]}`);
//       }
//     });
//     try {
//       console.log(sql);
//       const [results] = await connection.query(sql);
//       results.map((item, index) => {
//         item.quantity = parseInt(list[index].split("-")[1]);
//         item.color = list[index].split("-")[2];
//       });
//       console.log(results);
//       res.json(results);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({
//         error:
//           "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu trong getlistproduct for manage product",
//       });
//     } finally {
//       await connection.end();
//     }
//   })
// );

//search feature
// productRoute.get(
//   "/search",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     const search = req.query?.search;
//     try {
//       const [results] = await connection.query(
//         `SELECT * FROM \`products\` WHERE products.Title LIKE "%${search}%"`
//       );
//       res.json(results);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({
//         error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu trong search product",
//       });
//     } finally {
//       await connection.end();
//     }
//   })
// );

module.exports = productRoute;
