const express = require("express");
const router = express.Router();
const { addToCart, cartDetails, removeFromCart, clearCart, updateCartItemQuantity } = require("../controller/cyber.controller.cart.js");
const { isAuthenticated } = require("../middleware/isAuthenticated.js");
const isUser = require('../middleware/isUser.js')


router.post("/addToCart", isAuthenticated, isUser, addToCart);
router.get("/cartDetails", isAuthenticated, isUser, cartDetails);
router.delete("/removeFromCart/:productId", isAuthenticated, isUser, removeFromCart);
router.delete("/clearCart", isAuthenticated, isUser, clearCart);
router.put("/updateCartItemQuantity/:cartItemId", isAuthenticated, isUser, updateCartItemQuantity);

module.exports = router;


// All Api Routes are here
// http://localhost:4010/cyber/user/cart/addToCart
// http://localhost:4010/cyber/user/cart/cartDetails
// http://localhost:4010/cyber/user/cart/removeFromCart/:productId
// http://localhost:4010/cyber/user/cart/clearCart
// http://localhost:4010/cyber/user/cart/updateCartItemQuantity/:cartItemId