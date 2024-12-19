const express = require('express');
const router = express.Router();
const isUser = require('../middleware/isUser');
const isAdmin = require('../middleware/isAdmin');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const { placeOrderStripe, placeOrderCod, userOrders, verifyStripeOrder, orderLists, updateOrderDetails, filterOrderStatus } = require('../controller/cyber.controller.order')


router.post("/placeOrderStripe", isAuthenticated, isUser, placeOrderStripe);
router.post("/verifyStripeOrder", isAuthenticated, isUser, verifyStripeOrder);
router.post("/placeOrderCod", isAuthenticated, isUser, placeOrderCod);
router.get("/userOrders", isAuthenticated, isUser, userOrders);

router.get("/orderLists", isAuthenticated,  isAdmin, orderLists);
router.put("/updateOrderDetails", isAuthenticated,  isAdmin, updateOrderDetails);

router.get("/filterOrderStatus",isAuthenticated, isAdmin, filterOrderStatus);

module.exports = router;

// http://localhost:4010/cyber/payment/orders/placeOrderStripe
// http://localhost:4010/cyber/payment/orders/verifyStripeOrder
// http://localhost:4010/cyber/payment/orders/placeOrderCod
// http://localhost:4010/cyber/payment/orders/userOrders

// http://localhost:4010/cyber/payment/orders/orderLists
// http://localhost:4010/cyber/payment/orders/updateOrderDetails

// http://localhost:4010/cyber/payment/orders/filterOrderStatus?orderStatus=delivered&paymentStatus=paid