const express = require("express");
const userRoute = express.Router();
const { responseSuccess, responseError } = require("../util");
const connec = require("../models/connectDB");
const bcrybt = require("bcrypt");
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
// bắt đầu cái mới
const hashsalt = 10;
userRoute.get(
  "/user",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const get_user =
        "SELECT users.*,user_details.id AS `id_user_detail`, user_details.full_name,user_details.phone, user_details.address FROM `users`  LEFT JOIN user_details ON users.id = user_details.id_user";
      const [results] = await connection.execute(get_user);

      res.json(responseSuccess(200, "tất cả user", results));
    } catch (error) {
      console.log("loi o get user");
      console.error(error, "loi trong get user");
      res
        .status(500)
        .json(responseError(res.statusCode, "có lỗi trong truy vấn get user"));
    } finally {
      await connection.end();
    }
  })
);
// lấy theo id của user
userRoute.get(
  "/user/:id",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id = req.params.id;
    try {
      const get_user_by_Id =
        "SELECT users.*,user_details.id AS `id_user_detail`, user_details.full_name,user_details.phone, user_details.address FROM `users`  LEFT JOIN user_details ON users.id = user_details.id_user WHERE users.id =?";
      const [results] = await connection.execute(get_user_by_Id, [id]);

      res.json(responseSuccess(200, "user theo id", results));
    } catch (error) {
      console.log("loi o get user");
      console.error(error, "loi trong get user");
      res
        .status(500)
        .json(responseError(res.statusCode, "có lỗi trong truy vấn get user"));
    } finally {
      await connection.end();
    }
  })
);

// thêm mới
userRoute.post(
  "/user",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const { idUser, fullName, phoneNumber, address } = req.body;
    try {
      const sql_create =
        "INSERT INTO `user_details`(`id_user`, `full_name`, `phone`, `address`) VALUES (?, ?, ?, ?)";
      const [results_create] = await connection.execute(sql_create, [
        idUser,
        fullName,
        phoneNumber,
        address,
      ]);

      res.json(
        responseSuccess(res.statusCode, "Tạo mới thành công", results_create)
      );
    } catch (error) {
      console.log("loi o get user");
      console.error(error, "loi trong create user");
      res
        .status(500)
        .json(responseError(res.statusCode, "có lỗi trong truy vấn get user"));
    } finally {
      await connection.end();
    }
  })
);

// update thông tin
userRoute.put(
  "/user",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const { idUser, fullName, phoneNumber, address, role, password } = req.body;
    console.log(password);
    try {
      const sql_check_user_detail =
        "SELECT * FROM `user_details` WHERE user_details.id_user=?";
      const [check] = await connection.execute(sql_check_user_detail, [idUser]);
      if (check.length <= 0) {
        const sql_insert_to_user_detail =
          "INSERT INTO `user_details`(`id_user`, `full_name`, `phone`, `address`) VALUES (?, ?, ?, ?)";
        const [result_insert_to_user_detail] = await connection.execute(
          sql_insert_to_user_detail,
          [idUser, fullName, phoneNumber, address]
        );
      } else {
        const sql_update =
          "UPDATE `user_details` SET `full_name`=?,`phone`=?,`address`=? WHERE user_details.id_user=?";
        const [results_update] = await connection.execute(sql_update, [
          fullName,
          phoneNumber,
          address,
          idUser,
        ]);
      }
      if (password == null) {
        const sql_update_role_and_password =
          "UPDATE `users` SET `role`=? WHERE users.id=?";
        const [results] = await connection.execute(
          sql_update_role_and_password,
          [role, idUser]
        );
        res.json(
          responseSuccess(res.statusCode, "cập nhập thành công", results)
        );
      } else {
        const pass = await bcrybt.hash(password, hashsalt);
        const sql_update_role =
          "UPDATE `users` SET `role`=? ,`password`=? WHERE users.id=?";
        const [results] = await connection.execute(sql_update_role, [
          role,
          pass,
          idUser,
        ]);
        res.json(
          responseSuccess(res.statusCode, "cập nhập thành công", results)
        );
      }
    } catch (error) {
      console.log("user");
      console.error(error, "loi trong update user");
      res
        .status(500)
        .json(responseError(res.statusCode, "có lỗi trong truy vấn get user"));
    } finally {
      await connection.end();
    }
  })
);

// lấy tất cả role
userRoute.get(
  "/role",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    try {
      const get_role = "SELECT * FROM `roles`";
      const [results] = await connection.execute(get_role);

      res.json(responseSuccess(200, "tất cả role", results));
    } catch (error) {
      console.log("loi o get role");
      console.error(error, "loi trong get role route user");
      res
        .status(500)
        .json(responseError(res.statusCode, "có lỗi trong truy vấn get role"));
    } finally {
      await connection.end();
    }
  })
);

// add new account
userRoute.post(
  "/addAccount",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    console.log(req.body);
    try {
      const [results] = await connection.query(
        "SELECT * FROM `users` WHERE users.email=?",
        [req.body.email]
      );

      if (results.length > 0) {
        return res.json(success(402, "Email Tài khoản đã tồn tại"));
      }
      const password = await bcrybt.hash(req.body.password, hashsalt);
      const [resultAccount] = await connection.query(
        "INSERT INTO `users`(`email`, `password`, `role`) VALUES (?,?,?)",
        [req.body.email, password, req.body.role]
      );
      res.json(
        responseSuccess(201, "Thêm tài khoản thành công", resultAccount)
      );
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu account" });
    } finally {
      await connection.end();
    }
  })
);
// xóa user
userRoute.delete(
  "/deleteAccount/:id",
  asyncHandler(async (req, res) => {
    const connection = await connec();
    const id_account = req.params.id;
    try {
      console.log(id_account);
      const sql_delete = "DELETE FROM `users` WHERE users.id=?";
      const [result] = await connection.execute(sql_delete, [id_account]);
      res.json(responseSuccess(200, "Xóa tài khoản thành công", result));
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu account" });
    } finally {
      await connection.end();
    }
  })
);

// kết thúc cái mới

// userRoute.get(
//   "/user",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     try {
//       const [results] = await connection.execute("SELECT * FROM `users`");
//       console.log(res.status());
//       res.status(200).json(success(res.statusCode, "Thanh công", results));
//     } catch (error) {
//       console.log("loi o get user");
//       console.error(error, "loi trong get card");
//       res
//         .status(500)
//         .json(responseError(res.statusCode, "có lỗi trong truy vấn get user"));
//     } finally {
//       await connection.end();
//     }
//   })
// );

// userRoute.get(
//   "/user/:id",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     const id = req.params?.id;
//     try {
//       // const [[results]]= await connection.query('SELECT * FROM products WHERE id= ?',[id])
//       const [results] = await connection.query(
//         "SELECT * FROM users WHERE id= ?",
//         [id]
//       );
//       delete results[0].password;
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

// userRoute.post(
//   "/user",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();

//     const { id, username, fullname, address, password, phonenumber } =
//       req?.body;
//     console.log(fullname, address, phonenumber, id, username);
//     try {
//       const [results, fill] = await connection.query(
//         "INSERT INTO `users`(`username`, `fullname`, `password`, `address`, `phonenumber`) VALUES (?,?,?,?,?)",
//         [username, fullname, password, address, parseInt(phonenumber)]
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

// userRoute.put(
//   "/user/:id",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();

//     const id = req.params?.id;
//     console.log("id", req);

//     const { fullName, address, phoneNumber } = req?.body;
//     console.log(fullName, address, phoneNumber, id);
//     try {
//       const [results, fill] = await connection.execute(
//         "UPDATE `users` SET `fullname`=?,`address`=?,`phonenumber`=? WHERE users.id=?",
//         [fullName, address, parseInt(phoneNumber), id]
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
// userRoute.put(
//   "/user",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();

//     const { id, username, fullname, address, password, phonenumber } =
//       req?.body;
//     console.log(fullname, address, phonenumber, id, username);
//     try {
//       const [results, fill] = await connection.query(
//         "UPDATE `users` SET `fullname`=?,`address`=?,`phonenumber`=?,`password`=?, `username`=? WHERE users.id=?",
//         [fullname, address, parseInt(phonenumber), password, username, id]
//       );
//       // console.log({results,data: fill})
//       const { changedRows, ...result } = results;
//       results.rowUpdate = results.affectedRows;
//       // delete results.affectedRows
//       // console.log(results)
//       res.json(results);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: "username is exist" });
//     } finally {
//       await connection.end();
//     }
//     // console.log(id)
//   })
// );

// userRoute.delete(
//   "/user/:id",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();

//     const id = req.params?.id;
//     try {
//       const [results, fill] = await connection.execute(
//         "DELETE FROM `users` WHERE users.id=?",
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

// userRoute.post(
//   "/login",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     const { Email, Password } = req?.body;
//     try {
//       const [results] = await connection.execute(
//         "SELECT * FROM `users` WHERE users.username = ? AND users.password = ?",
//         [Email, Password]
//       );
//       let success = results.length != 0;
//       console.log(results);
//       success
//         ? res.json({
//             type: "success",
//             userID: results[0].id,
//             content: "Dang nhap thanh cong",
//           })
//         : res.json({
//             type: "error",
//             content: "Thong tin tai khoan khong chinh xac",
//           });
//     } catch (error) {
//       console.log("loi o post login");
//       console.error(error, "loi trong login");
//       res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu login" });
//     } finally {
//       await connection.end();
//     }
//   })
// );
// // check user
// const HandleChecKUser = async (Email, connection) => {
//   const [result] = await connection.execute(
//     "SELECT * FROM `users` WHERE users.username = ? ",
//     [Email]
//   );
//   if (result.length != 0) return { result: true, connection: connection };
//   return { result: false, connection: connection };
// };
// // create account
// const HandleCreatUser = async (Email, Name, Password, connection, res) => {
//   const [results] = await connection.query(
//     "INSERT INTO `users`(`username`, `fullname`, `password`) VALUES (?,?,?)",
//     [Email, Name, Password]
//   );
//   let success = results.length != 0;
//   success
//     ? res.json({ type: "success", content: "Tạo Tài Khoản Thành Công" })
//     : res.json({
//         type: "error",
//         content: "Tạo Tài Khoản Thất Bại",
//       });
// };
// userRoute.post(
//   "/register",
//   asyncHandler(async (req, res) => {
//     const connection = await connec();
//     const { Email, Password, Name } = req?.body;
//     try {
//       HandleChecKUser(Email, connection).then((rs) => {
//         let flag = rs.result;
//         if (flag) res.json("Email or UserName đã tồn tại");
//         else {
//           HandleCreatUser(Email, Name, Password, rs.connection, res);
//         }
//       });
//     } catch (error) {
//       console.log("loi regist");
//       console.error(error, "loi trong regist");
//       res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu regist" });
//     } finally {
//       // await connection.end();
//     }
//   })
// );

module.exports = userRoute;
