const productModel = require("../model/cyber.model.product");
const productVariantModel = require("../model/cyber.model.productVariant.js");
const getDataUri = require("../utils/dataUriParser.js");
const cloudinary = require("../config/cloudinary.config.js");

// create product
exports.createProduct = async (req, res) => {
  const {
    product_title,
    product_description,
    product_basePrice,
    product_categories,
    product_badge,
  } = req.body;

  if (
    !product_title ||
    !product_description ||
    !product_basePrice ||
    !product_categories ||
    !product_badge
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: please check once",
    });
  }

  // Validate required fields
  const requiredFields = [
    { key: "product title", value: product_title },
    { key: "product description", value: product_description },
    { key: "product categories", value: product_categories },
    { key: "product badge", value: product_badge },
  ];

  for (const field of requiredFields) {
    if (
      typeof field.value !== "string" ||
      field.value.trim() === "" ||
      !field.value
    ) {
      return res.status(400).json({
        success: false,
        message: `${field.key} is required and cannot be empty or just whitespace.`,
      });
    }
  }

  // validate product_title
  const existingProduct = await productModel.findOne({ product_title });
  if (existingProduct) {
    return res.status(400).json({
      success: false,
      message: "Product title already exists, create another one.",
    });
  }

  // it should be a positive number
  if (isNaN(product_basePrice) || product_basePrice <= 0) {
    return res.status(400).json({
      success: false,
      message: "Base price must be a positive number.",
    });
  }

  // it should contain at least 2 words
  if (product_badge && product_badge.split(" ").length < 2) {
    return res.status(400).json({
      success: false,
      message: "Product badge must contain at least 2 words.",
    });
  }

  // it should contain at least 1 words
  if (product_categories && product_categories.split(" ").length < 1) {
    return res.status(400).json({
      success: false,
      message: "Product categories must contain at least 1 words.",
    });
  }

  // it should not exceed 50 characters
  if (product_title && product_title.length > 50) {
    return res.status(400).json({
      success: false,
      message: "Product title should not exceed 50 characters.",
    });
  }

  // it should not bellow 500 characters
  if (product_description && product_description.length < 100) {
    return res.status(400).json({
      success: false,
      message: "Product description should not bellow 100 characters.",
    });
  }

  // it should not exceed 500 characters
  if (product_description && product_description.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Product description should not exceed 500 characters.",
    });
  }

  try {
    const newProduct = new productModel({
      product_title,
      product_description,
      product_basePrice,
      product_categories,
      product_badge,
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product: savedProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating product.",
      error: error.message,
    });
  }
};

// update product
exports.updateProduct = async (req, res) => {
  const { productId } = req.params;

  const {
    product_title,
    product_description,
    product_basePrice,
    product_categories,
    product_badge,
    discount_percentage,
  } = req.body;

  // Validation checks
  if (
    product_basePrice &&
    (isNaN(product_basePrice) || product_basePrice <= 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Base price must be a positive number.",
    });
  }

  if (product_badge && product_badge.split(" ").length < 2) {
    return res.status(400).json({
      success: false,
      message: "Product badge must contain at least 2 words.",
    });
  }

  if (product_categories && product_categories.split(" ").length < 1) {
    return res.status(400).json({
      success: false,
      message: "Product categories must contain at least 1 word.",
    });
  }

  if (product_description && product_description.length < 100) {
    return res.status(400).json({
      success: false,
      message: "Product description should be above 100 characters.",
    });
  }

  if (product_description && product_description.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Product description should not exceed 500 characters.",
    });
  }

  if (
    discount_percentage !== undefined &&
    (isNaN(discount_percentage) ||
      discount_percentage < 0 ||
      discount_percentage >= 100)
  ) {
    return res.status(400).json({
      success: false,
      message: "Discount percentage must be a number between 0 and 99.",
    });
  }

  try {
    // Check if a product with the same title already exists (excluding the current product)
    if (product_title) {
      const existingProduct = await productModel.findOne({
        product_title: product_title.trim(),
        _id: { $ne: productId },
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message:
            "The product title already exists. Please use a different title.",
        });
      }
    }

    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    product.product_title = product_title?.trim() || product.product_title;
    product.product_description =
      product_description?.trim() || product.product_description;
    product.product_basePrice = product_basePrice || product.product_basePrice;
    product.product_categories =
      product_categories?.trim() || product.product_categories;
    product.product_badge = product_badge?.trim() || product.product_badge;

    if (discount_percentage !== undefined) {
      const basePrice = product_basePrice || product.product_basePrice; // Use the provided base price or the existing one
      const discountedPrice =
        basePrice - (basePrice * discount_percentage) / 100;

      product.discount = {
        percentage: discount_percentage,
        discountedPrice: discountedPrice.toFixed(2), // Round to two decimal places
      };
    }

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating product.",
      error: error.message,
    });
  }
};

// delete product
exports.deleteProduct = async (req, res) => {
  const { productId } = req.params;

  if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      message: "Invalid product ID format",
      success: false,
    });
  }

  try {
    // Find the product and its variants
    const product = await productModel.findById(productId).populate("variants");
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
      });
    }

    // Delete images from Cloudinary for the product and its variants
    for (const variant of product.variants) {
      if (Array.isArray(variant.product_images)) {
        for (const imageUrl of variant.product_images) {
          const productImagesId = imageUrl.split("/").pop().split(".")[0];
          // console.log(productImagesId)

          const deleteResponse = await cloudinary.uploader.destroy(
            `products/${productImagesId}`,
            {
              resource_type: "image",
            }
          );

          if (deleteResponse.result !== "ok") {
            console.error(
              "Failed to delete previous product photos from Cloudinary:",
              deleteResponse
            );
          }
        }
      }
    }

    // Delete variants first
    await productVariantModel.deleteMany({ _id: { $in: product.variants } });

    // Then delete the product
    const deletedProduct = await productModel.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).json({
        message: "Product not found or it has already been deleted",
        success: false,
      });
    }

    return res.status(200).json({
      message: `${deletedProduct.product_title} and its variants were deleted successfully`,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete product",
      error: error.message,
      success: false,
    });
  }
};

// CRUD for product variants
// create product variants
exports.createProductVariant = async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: "Missing product ID.",
    });
  }

  // console.log("Req.body", req.body);
  // console.log("Req.files", req.files);

  const {
    product_brand,
    product_storage,
    product_color,
    product_additional_price,
    product_stock,
    product_screentype,
    product_cpu,
    product_cores,
    product_main_camera,
    product_front_camera,
    product_battery_capacity,
    product_delivery_time,
    product_guarantee,
  } = req.body;

  const files = req.files;
  // console.log(
  // product_brand,
  // product_storage,
  // product_color,
  // product_additional_price,
  // product_stock,
  // product_screentype,
  // product_cpu,
  // product_cores,
  // product_main_camera,
  // product_front_camera,
  // product_battery_capacity,
  // product_delivery_time,
  // product_guarantee,
  // files
  // );

  // Validate required fields
  const requiredFields = [
    { key: "product brand", value: product_brand },
    { key: "product storage", value: product_storage },
    { key: "product color", value: product_color },
    { key: "product screentype", value: product_screentype },
    { key: "product cpu", value: product_cpu },
    { key: "product main_camera", value: product_main_camera },
    { key: "product front_camera", value: product_front_camera },
    { key: "product delivery_time", value: product_delivery_time },
  ];

  for (const field of requiredFields) {
    if (
      typeof field.value !== "string" ||
      field.value.trim() === "" ||
      !field.value
    ) {
      return res.status(400).json({
        success: false,
        message: `${field.key} is required and cannot be empty or just whitespace.`,
      });
    }
  }

  // it should be a positive number
  if (isNaN(product_additional_price) || product_additional_price <= 0) {
    return res.status(400).json({
      success: false,
      message: "product additional price should be a valid positive number.",
    });
  }

  // it should be a number
  if (product_stock && (isNaN(product_stock) || product_stock < 0)) {
    return res.status(400).json({
      success: false,
      message: "product stock should be a valid non-negative number.",
    });
  }

  if (product_storage && product_storage.trim().split(/\s+/).length > 2) {
    return res.status(400).json({
      success: false,
      message: "Product storage should consist of no more than 2 words.",
    });
  }

  // for product guarantee validation
  if (product_guarantee) {
    if (isNaN(product_guarantee) || product_guarantee <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product guarantee should be a valid positive number.",
      });
    }
  }

  // for battery capacity validation
  if (product_battery_capacity) {
    if (isNaN(product_battery_capacity) || product_battery_capacity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product battery capacity should be a valid positive number.",
      });
    }

    if (product_battery_capacity < 1500 || product_battery_capacity > 6000) {
      return res.status(400).json({
        success: false,
        message: "Product battery capacity should be between 1500 and 6000.",
      });
    }
  }

  // for cores validation
  if (product_cores) {
    if (isNaN(product_cores) || product_cores <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product cores should be a valid positive number.",
      });
    }

    if (product_cores < 1 || product_cores > 8) {
      return res.status(400).json({
        success: false,
        message: "Product cores should be between 1 and 8.",
      });
    }
  }

  // check if files are provided
  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one image file is required for the product variant.",
    });
  }

  try {
    const product = await productModel.findById(productId).populate("variants");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Check if a variant with the same color and storage already exists
    const variantExists = product.variants.some(
      (variant) =>
        variant.product_color.toLowerCase() === product_color.toLowerCase() &&
        variant.product_storage.toLowerCase() === product_storage.toLowerCase()
    );

    if (variantExists) {
      return res.status(400).json({
        success: false,
        message:
          "Product variant with the same color and storage already exists.",
      });
    }

    // Upload images to Cloudinary
    const uploadedImages = [];

    if (files && files.length > 0) {
      try {
        for (const file of files) {
          const fileUri = getDataUri(file);

          if (!fileUri || !fileUri.content) {
            return res.status(400).json({
              success: false,
              message: "File data is missing or invalid",
            });
          }

          const cloudResponse = await cloudinary.uploader.upload(
            fileUri.content,
            {
              folder: "products",
              resource_type: "image",
            }
          );

          if (cloudResponse && cloudResponse.secure_url) {
            uploadedImages.push(cloudResponse.secure_url);
          }
        }
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to upload images to Cloudinary",
        });
      }
    }

    const newVariant = new productVariantModel({
      productId,
      product_brand: product_brand.trim(),
      product_storage: product_storage.trim(),
      product_color: product_color,
      product_additional_price,
      product_stock,
      product_images: uploadedImages,
      product_screentype: product_screentype.trim(),
      product_cpu: product_cpu.trim(),
      product_cores,
      product_main_camera: product_main_camera.trim(),
      product_front_camera: product_front_camera.trim(),
      product_battery_capacity,
      product_delivery_time: product_delivery_time.trim(),
      product_guarantee,
    });

    const savedVariant = await newVariant.save();

    // Update the product with the new variant
    product.variants.unshift(savedVariant._id);
    await product.save();

    res.status(201).json({
      success: true,
      message: "Variant created successfully and added to product.",
      variant: savedVariant,
    });
  } catch (error) {
    console.error("Error creating variant:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating variant.",
      error: error.message,
    });
  }
};

// update product variant
exports.updateProductVariant = async (req, res) => {
  const { variantId } = req.params;

  if (!variantId) {
    return res.status(400).json({
      success: false,
      message: "Missing variant ID.",
    });
  }

  const {
    product_brand,
    product_storage,
    product_color,
    product_additional_price,
    product_stock,
    product_screentype,
    product_cpu,
    product_cores,
    product_main_camera,
    product_front_camera,
    product_battery_capacity,
    product_delivery_time,
    product_guarantee,
  } = req.body;

  const files = req.files;
  // console.log("files", files);

  // Validate each field and ensure no whitespace-only values
  const updateData = {};

  if (product_brand && product_brand.trim() !== "") {
    updateData.product_brand = product_brand.trim();
  } else if (product_brand === "") {
    return res.status(400).json({
      success: false,
      message: "Product brand cannot be empty or just whitespace.",
    });
  }

  if (product_storage && product_storage.trim() !== "") {
    updateData.product_storage = product_storage.trim();
  } else if (product_storage === "") {
    return res.status(400).json({
      success: false,
      message: "Product storage cannot be empty or just whitespace.",
    });
  }

  if (product_color && product_color.trim() !== "") {
    updateData.product_color = product_color.trim();
  } else if (product_color === "") {
    return res.status(400).json({
      success: false,
      message: "Product storage cannot be empty or just whitespace.",
    });
  }

  if (
    product_additional_price &&
    (isNaN(product_additional_price) || product_additional_price <= 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "product additional Price should be a valid positive number.",
    });
  } else if (product_additional_price) {
    updateData.product_additional_price = product_additional_price;
  }

  if (product_stock && (isNaN(product_stock) || product_stock < 0)) {
    return res.status(400).json({
      success: false,
      message: "product_stock should be a valid non-negative number.",
    });
  } else if (product_stock) {
    updateData.product_stock = product_stock;
  }

  if (product_screentype && product_screentype.trim() !== "") {
    updateData.product_screentype = product_screentype.trim();
  } else if (product_screentype === "") {
    return res.status(400).json({
      success: false,
      message: "Product screentype cannot be empty or just whitespace.",
    });
  }

  if (product_cpu && product_cpu.trim() !== "") {
    updateData.product_cpu = product_cpu.trim();
  } else if (product_cpu === "") {
    return res.status(400).json({
      success: false,
      message: "Product CPU cannot be empty or just whitespace.",
    });
  }

  if (product_cores) {
    if (isNaN(product_cores) || product_cores <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product cores should be a valid positive number.",
      });
    }

    if (product_cores < 1 || product_cores > 8) {
      return res.status(400).json({
        success: false,
        message: "Product cores should be between 1 and 8.",
      });
    }

    updateData.product_cores = product_cores;
  }

  if (product_main_camera && product_main_camera.trim() !== "") {
    updateData.product_main_camera = product_main_camera.trim();
  } else if (product_main_camera === "") {
    return res.status(400).json({
      success: false,
      message: "Product main camera cannot be empty or just whitespace.",
    });
  }

  if (product_front_camera && product_front_camera.trim() !== "") {
    updateData.product_front_camera = product_front_camera.trim();
  } else if (product_front_camera === "") {
    return res.status(400).json({
      success: false,
      message: "Product front camera cannot be empty or just whitespace.",
    });
  }

  if (product_battery_capacity) {
    if (isNaN(product_battery_capacity) || product_battery_capacity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product battery capacity should be a valid positive number.",
      });
    }

    if (product_battery_capacity < 1500 || product_battery_capacity > 6000) {
      return res.status(400).json({
        success: false,
        message: "Product battery capacity should be between 1500 and 6000.",
      });
    }

    updateData.product_battery_capacity = product_battery_capacity;
  }

  if (product_delivery_time && product_delivery_time.trim() !== "") {
    updateData.product_delivery_time = product_delivery_time.trim();
  } else if (product_delivery_time === "") {
    return res.status(400).json({
      success: false,
      message: "Product delivery time cannot be empty or just whitespace.",
    });
  }

  if (product_guarantee) {
    if (isNaN(product_guarantee) || product_guarantee <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product guarantee should be a valid positive number.",
      });
    }

    updateData.product_guarantee = product_guarantee;
  }

  let uploadedImages = [];

  // If no files are uploaded, keep the existing images
  if (files && files.length > 0) {
    for (const file of files) {
      const fileUri = getDataUri(file);

      if (!fileUri || !fileUri.content) {
        return res.status(400).json({
          success: false,
          message: "File data is missing or invalid",
        });
      }

      const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
        folder: "products",
        resource_type: "image",
      });

      if (cloudResponse && cloudResponse.secure_url) {
        uploadedImages.push(cloudResponse.secure_url);
      }
    }
  }

  // Update images only if new images are uploaded, else retain existing images
  if (uploadedImages.length > 0) {
    updateData.product_images = uploadedImages;
  } else {
    // If no new images provided, keep the existing images
    const variant = await productVariantModel.findById(variantId);
    if (variant) {
      updateData.product_images = variant.product_images;
    }
  }

  const variant = await productVariantModel.findById(variantId);

  if (!variant) {
    return res.status(404).json({
      success: false,
      message: "Variant not found.",
    });
  }

  // // Proceed with deleting old images from Cloudinary only if new images are provided
  // if (files) {
  //   if (variant.product_images && variant.product_images.length > 0) {
  //     for (const imageUrl of variant.product_images) {
  //       try {
  //         const previousImageId = imageUrl.split("/").pop().split(".")[0];

  //         // Only delete from Cloudinary if new files are provided
  //         const deleteResponse = await cloudinary.uploader.destroy(
  //           `products/${previousImageId}`,
  //           {
  //             resource_type: "image",
  //           }
  //         );

  //         if (deleteResponse.result !== "ok") {
  //           console.error(
  //             "Failed to delete variant photos from Cloudinary:",
  //             deleteResponse
  //           );
  //         }
  //       } catch (error) {
  //         console.error(
  //           "Error deleting variant photos from Cloudinary:",
  //           error
  //         );
  //       }
  //     }
  //   }
  // }

  // Check if another variant with the same color and storage exists (other than the one being updated)
  const variantExists = await productVariantModel.findOne({
    productId: variant.productId,
    product_color: { $regex: `^${product_color}$`, $options: "i" },
    product_storage: { $regex: `^${product_storage}$`, $options: "i" },
  });
  
  // console.log("Variant Exists:", variantExists);
  
  if (variantExists && variantExists._id.toString() !== variantId) {
    return res.status(400).json({
      success: false,
      message: "Product variant with the same color and storage already exists.",
    });
  }


  try {
    // Find and update the product variant
    const updatedVariant = await productVariantModel.findByIdAndUpdate(
      variantId,
      updateData,
      { new: true }
    );

    if (!updatedVariant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product variant updated successfully.",
      variant: updatedVariant,
    });
  } catch (error) {
    console.error("Error updating variant:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating variant.",
      error: error.message,
    });
  }
};

// get variant
exports.getVariantDetails = async (req, res) => {
  const { variantId } = req.params;

  if (!variantId) {
    return res.status(400).json({
      success: false,
      message: "Missing variant ID.",
    });
  }

  try {
    const variant = await productVariantModel.findById(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product variant found successfully.",
      variant,
    });
  } catch (error) {
    console.error("Error fetching variant:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching variant.",
      error: error.message,
    });
  }
};

// delete product variant
exports.deleteProductVariant = async (req, res) => {
  const { variantId } = req.params;
  // console.log(variantId);

  if (!variantId) {
    return res.status(400).json({
      success: false,
      message: "Missing variant ID.",
    });
  }

  try {
    // Check if the variant exists
    const variant = await productVariantModel.findById(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found.",
      });
    }

    // Delete images from Cloudinary if any exist
    if (variant.product_images && variant.product_images.length > 0) {
      for (const imageUrl of variant.product_images) {
        try {
          const previousImageId = imageUrl.split("/").pop().split(".")[0]; // Extract image name without file extension
          // console.log(previousImageId)
          const deleteResponse = await cloudinary.uploader.destroy(
            `products/${previousImageId}`,
            {
              resource_type: "image",
            }
          );

          if (deleteResponse.result !== "ok") {
            console.error(
              "Failed to delete previous variant photos from Cloudinary:",
              deleteResponse
            );
          }
        } catch (error) {
          console.error("Error deleting image from Cloudinary:", error);
        }
      }
    }

    // Remove the variant from the product
    await productModel.findOneAndUpdate(
      { variants: variantId },
      { $pull: { variants: variantId } },
      { new: true }
    );

    // Delete the variant from the database
    await productVariantModel.findByIdAndDelete(variantId);

    res.status(200).json({
      success: true,
      message: "Product variant deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting variant:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting variant.",
      error: error.message,
    });
  }
};

// specific product data by ID with variants populated
exports.getSpecificProductWithVariants = async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: "Missing product ID.",
    });
  }

  try {
    const product = await productModel.findById(productId).populate("variants");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Calculate total stock and variant total price
    const totalStock = Array.isArray(product.variants)
      ? product.variants.reduce(
          (sum, variant) => sum + (variant.product_stock || 0),
          0
        )
      : 0;

    // Add totalPrice to each variant
    const updatedVariants = product.variants.map((variant) => {
      const totalVariantPrice =
        product.product_basePrice + (variant.product_additional_price || 0);
      return {
        ...variant.toObject(),
        totalVariantPrice,
      };
    });

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully with variants.",
      totalStock: totalStock,
      product: {
        ...product.toObject(),
        variants: updatedVariants,
      },
    });
  } catch (error) {
    console.error("Error fetching product with variants:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving product with variants.",
      error: error.message,
    });
  }
};

// for all products
exports.getProducts = async (req, res) => {
  try {
    const products = await productModel
      .find({}, "product_title product_description product_basePrice product_badge variants")
      .populate({
        path: "variants",
        // select: "product_images",
      })
      .sort({ createdAt: -1 });

    if (!products || products.length === 0) {
      return res.status(200).json({
        scuucess: false,
        message: "Hmmm... No products found?",
      });
    }

    // for find products length
    const totalProducts = await productModel.countDocuments();

    const formattedProducts = products.map((product) => {
      const firstImage =
        product.variants && product.variants.length > 0
          ? product.variants[0].product_images[0] ||
            product.variants[1].product_images[0]
          : "https://res.cloudinary.com/dad2aebqt/image/upload/v1733924211/default-placeholder_etxdlc.png";

      return {
        _id: product._id,
        product_title: product.product_title,
        product_description: product.product_description,
        product_basePrice: product.product_basePrice,
        product_badge: product.product_badge,
        first_image: firstImage,
      };
    });

    res.status(200).json({
      message: "Here is your all Products Details",
      totalProducts,
      // products: formattedProducts,
      products
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Failed to retrieve products",
      error: error.message,
    });
  }
};
