const express = require('express');
const router = express.Router();
const { addToWishlist, removeFromWishlist, getWishlist } = require('../controller/cyber.controller.wishlist');
const { isAuthenticated } = require('../middleware/isAuthenticated');
// const isUser = require('../middleware/isUser.js')

// Add product to wishlist
router.post('/addToWishlist', isAuthenticated, isUser, addToWishlist);
router.get('/getWishlist', isAuthenticated, isUser, getWishlist);
router.delete('/removeFromWishlist/:productId', isAuthenticated, isUser, removeFromWishlist);

module.exports = router;


// All Api Routes are here
// http://localhost:4010/cyber/user/wishlist/addToWishlist/:productId
// http://localhost:4010/cyber/user/wishlist/removeFromWishlist/:productId
// http://localhost:4010/cyber/user/wishlist/getWishlist
