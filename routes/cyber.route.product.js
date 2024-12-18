const express = require("express");
const router = express.Router();
const {
  createProduct,
  updateProduct,
  deleteProduct,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  getVariantDetails
} = require("../controller/cyber.controller.product");
const isAdmin = require("../middleware/isAdmin");
const { isAuthenticated } = require("../middleware/isAuthenticated");
const multipleUpload = require("../middleware/multiUpload.multer.config");


// Admin Router
// Product Api routes // isAuthenticated, isAdmin, 
router.post("/createProduct", isAuthenticated, isAdmin, createProduct);
router.put("/updateProduct/:productId", isAuthenticated, isAdmin, updateProduct);
router.delete("/deleteProduct/:productId",isAuthenticated, isAdmin, deleteProduct);

// Product variants Api routes
router.post("/variants/createProductVariant/:productId", isAuthenticated, isAdmin, multipleUpload, createProductVariant);
router.put("/variants/updateProductVariant/:variantId", isAuthenticated, isAdmin, multipleUpload, updateProductVariant);
router.get("/variants/getVariantDetails/:variantId", isAuthenticated, isAdmin, getVariantDetails);
router.delete("/variants/deleteProductVariant/:variantId", isAuthenticated, isAdmin, deleteProductVariant);


module.exports = router;

// All products Api Routes are here
// http://localhost:4010/admin/cyber/dashboard/products/createProduct
// http://localhost:4010/admin/cyber/dashboard/products/updateProduct/:productId
// http://localhost:4010/admin/cyber/dashboard/products/deleteProduct/:productId


// All productVariants Api Routes are here
//  http://localhost:4010/admin/cyber/dashboard/products/variants/createProductVariant/:productId
//  http://localhost:4010/admin/cyber/dashboard/products/variants/updateProductVariant/:variantId
//  http://localhost:4010/admin/cyber/dashboard/products/variants/getVariantDetails/:variantId
//  http://localhost:4010/admin/cyber/dashboard/products/variants/deleteProductVariant/:variantId
