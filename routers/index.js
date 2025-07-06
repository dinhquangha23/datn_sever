const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../middleware/jwtMiddleware");
const cartRoute = require("./cartRoute");
const productRote = require("./productRoute");
const userRoute = require("./userRoute");
const paymentRoute = require("./paymentRoute");
const categoryRoute = require("./categoryRouter");
const accountRouter = require("./accounts");
const orderRouter = require("./orderRoute");
const vnpayRoute = require("./vnpay");
const variantRoute = require("./variantRoute");
const sizeRoute = require("./sizeRoute");
const colorRoute = require("./colorRoute");
const ghnRoute = require("./ghnRouter");
const statisticalRoute = require("./statistical");
// router account
router.use(accountRouter);

// route vnpay
router.use(vnpayRoute);

//router cart
router.use(jwtMiddleware, cartRoute);
// router product
router.use(jwtMiddleware, productRote);
// router order
router.use(jwtMiddleware, orderRouter);
// router user
router.use(userRoute);

// router color
router.use(colorRoute);

// router size
router.use(sizeRoute);

// router variant
router.use(variantRoute);
// ===============================================================
// router payment
router.use(paymentRoute);
// router category
router.use(categoryRoute);
// router GHN
router.use(ghnRoute);
//router statistical
router.use(statisticalRoute);

module.exports = router;
