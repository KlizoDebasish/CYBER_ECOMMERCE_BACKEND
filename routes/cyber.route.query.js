const express = require("express");
const { queryForProductColorAndStorage, queryForProductCatagories, queryForFilteringProduct, queryForProductBadge, searchProductsByTitleAndDescription, queryForProductBadgeAndCategory, queryForPaginnateAddress } = require("../controller/cyber.controller.query");
const { getProducts, getSpecificProductWithVariants } = require("../controller/cyber.controller.product");
const { isAuthenticated } = require("../middleware/isAuthenticated");
const isUser = require("../middleware/isUser");
const router = express.Router();



// query routes
router.get("/queryForProductColorAndStorage/:productId/variants",  queryForProductColorAndStorage);
router.get("/queryForFilteringProduct",  queryForFilteringProduct);
// router.get("/queryForProductCatagories",  queryForProductCatagories);
// router.get("/queryForProductBadge",  queryForProductBadge);
router.get("/queryForProductBadgeAndCategory",  queryForProductBadgeAndCategory);
router.get("/searchProductsByTitleAndDescription/search",  searchProductsByTitleAndDescription);
router.get("/queryForPaginnateAddress", isAuthenticated, isUser, queryForPaginnateAddress);

// get all products Api routes
router.get("/getProducts", getProducts);
router.get("/getSpecificProductWithVariants/:productId", getSpecificProductWithVariants); 


module.exports = router;

// query route
// http://localhost:4010/cyber/query/products/queryForProductColorAndStorage/:productId/variants?color=Desert%20Titanium&storage=256%20GB
// http://localhost:4010/cyber/query/products/queryForSearchingProduct?brand=Apple&color=red&batteryCapacity=5000mah&storage=256GB
// http://localhost:4010/cyber/query/products/queryForProductCatagories?category=smartphone
// http://localhost:4010/cyber/query/products/queryForProductBadge?badge=New%20Arrival
// http://localhost:4010/cyber/query/products/queryForProductBadgeAndCategory?badge=New%20Arrival&category=smartphone
// http://localhost:4010/cyber/query/products/searchProductsByTitleAndDescription/search?query=New%20Arrival

// pagination route
// http://localhost:4010/cyber/query/products/queryForPaginnateAddress?page=1&limit=3


// get prducts
// http://localhost:4010/cyber/query/products/getProducts
// http://localhost:4010/cyber/query/products/getSpecificProductWithVariants/:productId