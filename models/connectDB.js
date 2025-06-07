const mysql2 = require("mysql2/promise");
require("dotenv").config();
let connection = async () => {
  const connectDB = await mysql2.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE_NAME,
    port: process.env.PORT,
    connectionLimit: 20,
    namedPlaceholders: true,
  });
  return connectDB;
};
// sever deloy moi dung cai nay
// let connection = async ()=>{
//   const connectDB = await mysql2.createConnection({
//       host:'bakfrgqh7wldvmrbkxlo-mysql.services.clever-cloud.com',
//       user:'us7olytu9c3m3sv8',
//       password:'n3IuC04CZtkSyIflmONG',
//       database:'bakfrgqh7wldvmrbkxlo',
//       port:'3306',
//       connectionLimit:10,
//     });
//     return connectDB;
// }

module.exports = connection;
