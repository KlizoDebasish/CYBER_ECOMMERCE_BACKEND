const express = require('express');
const router = express.Router();
const isUser = require('../middleware/isUser');
const isAdmin = require('../middleware/isAdmin');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const { placeOrderStripe, placeOrderCod, userOrders, verifyStripeOrder, orderLists, updateOrderDetails, filterOrderStatus } = require('../controller/cyber.controller.order')


router.post("/placeOrderStripe", isAuthenticated, placeOrderStripe);
router.post("/verifyStripeOrder", isAuthenticated, verifyStripeOrder);
router.post("/placeOrderCod", isAuthenticated, placeOrderCod);
router.get("/userOrders", isAuthenticated, userOrders);

router.get("/orderLists", isAuthenticated, orderLists); // isAdmin
router.put("/updateOrderDetails", isAuthenticated, updateOrderDetails); // isAdmin

router.get("/filterOrderStatus",isAuthenticated, filterOrderStatus); // isAdmin

module.exports = router;

// http://localhost:4010/cyber/payment/orders/placeOrderStripe
// http://localhost:4010/cyber/payment/orders/verifyStripeOrder
// http://localhost:4010/cyber/payment/orders/placeOrderCod
// http://localhost:4010/cyber/payment/orders/userOrders

// http://localhost:4010/cyber/payment/orders/orderLists
// http://localhost:4010/cyber/payment/orders/updateOrderDetails

// http://localhost:4010/cyber/payment/orders/filterOrderStatus?orderStatus=delivered&paymentStatus=paid