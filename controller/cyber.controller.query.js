const productModel = require("../model/cyber.model.product");
const productVariantModel = require("../model/cyber.model.productVariant.js");
const userModel = require("../model/cyber.model.user.js");

// Query for product variants by color and storage
exports.queryForProductColorAndStorage = async (req, res) => {
  const { productId } = req.params;
  const { color, storage } = req.query;

  try {
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Construct the filter with optional criteria
    const filter = { productId };
    if (color) {
      filter.product_color = { $regex: color, $options: "i" };
    }
    if (storage) {
      filter.product_storage = { $regex: storage, $options: "i" };
    }

    const variants = await productVariantModel.find(filter);

    if (!variants.length) {
      return res.status(404).json({
        success: false,
        message: "No variants found matching the criteria.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Variants retrieved successfully.",
      data: variants,
    });
  } catch (error) {
    console.error("Error fetching product variants:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Query for search brand, color, batteryCapacity and storage
exports.queryForFilteringProduct = async (req, res) => {
  const { brand, color, battery_capacity, storage } = req.query;

  try {
    let filter = {};

    // Parse and build filter for each field
    if (brand) {
      filter.product_brand = { $in: brand.split(",").map((b) => new RegExp(b, "i")) };
    }

    if (color) {
      filter.product_color = { $in: color.split(",").map((c) => new RegExp(c, "i")) };
    }

    if (battery_capacity) {
      filter.product_battery_capacity = {
        $in: battery_capacity.split(",").map((bc) => new RegExp(bc, "i")),
      };
    }

    if (storage) {
      filter.product_storage = { $in: storage.split(",").map((s) => new RegExp(s, "i")) };
    }

    const variants = await productVariantModel
    .find(filter)
    .populate({
      path: "productId",
      select: "product_title product_description product_basePrice product_categories product_badge"
    })
    .sort({ product_title: 1 });

  if (!variants.length) {
    return res.status(200).json({
      success: false,
      message: "No variants found matching the criteria.",
    });
  }

  // Format the products
  const filterProducts = variants.map((variant) => {
    const firstImage = variant.product_images?.[0];
  
    return {
      _id: variant.productId._id,
      product_title: variant.productId.product_title,
      product_description: variant.productId.product_description,
      product_basePrice: variant.productId.product_basePrice,
      product_categories: variant.productId.product_categories,
      product_badge: variant.productId.product_badge,
      variants: [{
        product_brand: variant.product_brand,
        product_color: variant.product_color,
        product_storage: variant.product_storage,
        product_batteryCapacity: variant.product_battery_capacity,
        product_additionalPrice: variant.product_additional_price,
        product_stock: variant.product_stock,
        product_images: variant.product_images || [firstImage],
      }],
    };
  });  

  res.status(200).json({
    success: true,
    message: "Variants retrieved successfully.",
    filterProducts,
  });
  } catch (error) {
    console.error("Error fetching product variants:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Query for get Category details
// exports.queryForProductCatagories = async (req, res) => {
//   const category = req.query.category;
//   // console.log(category);

//   try {
//     if (!category) {
//       return res.status(400).json({
//         success: false,
//         message: "Category parameter is required.",
//       });
//     }

//     const products = await productModel
//       .find(
//         { product_categories: { $regex: category, $options: "i" } },
//         "product_title product_basePrice product_badge product_categories variants"
//       )
//       .populate({
//         path: "variants",
//         select: "product_images",
//       })
//       .sort({ product_title: 1 });

//     if (!products.length) {
//       return res.status(404).json({
//         success: false,
//         message: `No products found for category: ${category}`,
//       });
//     }

//     const formattedProducts = products.map((product) => {
//       const firstImage =
//         product.variants?.length > 0
//           ? product.variants[0]?.product_images[0] ||
//             product.variants[1]?.product_images[0]
//           : "https://newhorizonindia.edu/nhengineering/innovation/wp-content/uploads/2020/01/default-placeholder.png";

//       return {
//         _id: product._id,
//         product_title: product.product_title,
//         product_basePrice: product.product_basePrice,
//         product_badge: product.product_badge,
//         product_categories: product.product_categories,
//         first_image: firstImage,
//       };
//     });

//     res.status(200).json({
//       success: true,
//       message: "Products retrieved successfully.",
//       products: formattedProducts,
//     });
//   } catch (error) {
//     console.error("Error fetching products by category:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// Query for get Badge details
// exports.queryForProductBadge = async (req, res) => {
//   const { badge } = req.query;

//   try {
//     if (!badge || badge.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Badge parameter is required.",
//       });
//     }

//     const products = await productModel
//       .find(
//         { product_badge: { $regex: badge, $options: "i" } },
//         "product_title product_basePrice product_badge variants"
//       )
//       .populate({
//         path: "variants",
//         select: "product_images",
//       })
//       .sort({ product_title: 1 });

//     if (!products.length) {
//       return res.status(404).json({
//         success: false,
//         message: `No products found for Badge: ${badge}`,
//       });
//     }

//     const formattedProducts = products.map((product) => {
//       const firstImage =
//         product.variants?.length > 0
//           ? product.variants[0]?.product_images[0] ||
//             product.variants[1]?.product_images[0]
//           : "https://newhorizonindia.edu/nhengineering/innovation/wp-content/uploads/2020/01/default-placeholder.png";

//       return {
//         _id: product._id,
//         product_title: product.product_title,
//         product_basePrice: product.product_basePrice,
//         product_badge: product.product_badge,
//         first_image: firstImage,
//       };
//     });

//     res.status(200).json({
//       success: true,
//       message: "Products retrieved successfully.",
//       products: formattedProducts,
//     });
//   } catch (error) {
//     console.error("Error fetching products by badge:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

exports.queryForProductBadgeAndCategory = async (req, res) => {
  const { badge, category } = req.query;

  try {
    if (!badge && !category) {
      return res.status(400).json({
        success: false,
        message: "At least one of 'badge' or 'category' parameters is required.",
      });
    }

    const query = {};

    if (badge) {
      query.product_badge = { $regex: badge, $options: "i" };
    }
    if (category) {
      query.product_categories = { $regex: category, $options: "i" };
    }

    const products = await productModel
      .find(
        query,
        "product_title product_basePrice product_badge product_categories variants"
      )
      .populate({
        path: "variants",
        // select: "product_images product_additional_price",
      })
      .sort({ product_title: 1 });

    if (!products.length) {
      return res.status(200).json({
        success: true,
        message: `No products found.`,
      });
    }

    const formattedProducts = products.map((product) => {
      const firstImage =
        product.variants?.length > 0
          ? product.variants[0]?.product_images[0] ||
            product.variants[1]?.product_images[0]
          : "https://newhorizonindia.edu/nhengineering/innovation/wp-content/uploads/2020/01/default-placeholder.png";

      return {
        _id: product._id,
        product_title: product.product_title,
        product_basePrice: product.product_basePrice,
        product_badge: product.product_badge,
        product_categories: product.product_categories,
        first_image: firstImage,
      };
    });

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully.",
      // products: formattedProducts,
      products
    });
  } catch (error) {
    console.error("Error fetching products by badge and category:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Query for search results
exports.searchProductsByTitleAndDescription = async (req, res) => {
  const { query } = req.query;

  try {
    // Validation for query parameter
    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required and cannot be empty.",
      });
    }

    // Split query into individual words (tokens) for partial matching
    const tokens = query.trim().split(/\s+/);

    // Build regex-based query for matching all tokens in title or description
    const searchConditions = tokens.flatMap((token) => [
      { product_title: { $regex: token, $options: "i" } },
      { product_description: { $regex: token, $options: "i" } },
    ]);

    const products = await productModel.find(
      {
        $or: searchConditions,
      },
      "product_title product_description product_badge variants"
    ).populate({
      path: "variants",
      select: "product_images",
    });

    if (!products || products.length === 0) {
      return res.status(200).json({
        success: false,
        message: `No products found matching the query: "${query}"`,
      });
    }

    // Format the product response
    const formattedProducts = products.map((product) => {
      // Get the first variant if it exists
      const firstVariant = product.variants?.[0];
      return {
        productId: product._id,
        product_title: product.product_title,
        product_description: product.product_description,
        product_badge: product.product_badge,
        product_image: firstVariant ? firstVariant.product_images?.[0] : null,
      };
    });

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully.",
      products: formattedProducts,
    });
  } catch (error) {
    console.error("Error searching products by title and description:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Fetch specific product variants by color and storage
// exports.getProductVariants = async (req, res) => {
//   try {
//     const { productId } = req.params;
//     const { color, storage } = req.query; // Query parameters for color and storage

//     // Validate inputs
//     if (!productId || !color || !storage) {
//       return res.status(400).json({
//         success: false,
//         message: "Product ID, color, and storage are required",
//       });
//     }

//     // Fetch the product by ID
//     const product = await productModel.findOne(
//       { _id: productId },
//       { product_title: 1, variants: 1 } // Select only the relevant fields
//     );

//     // Check if the product exists
//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found",
//       });
//     }

//     // Filter variants by color and storage
//     const filteredVariants = product.variants.filter(
//       (variant) => variant.color === color && variant.storage === storage
//     );

//     if (filteredVariants.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No matching variants found",
//       });
//     }

//     // Return the product with the filtered variants
//     return res.status(200).json({
//       success: true,
//       message: "Variants fetched successfully",
//       product: {
//         product_title: product.product_title,
//         variants: filteredVariants,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching product variants:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };


// pagginate address data
exports.queryForPaginnateAddress = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const pageNumber = parseInt(page) || 1;
    const pageLimit = parseInt(limit) || 3;

    const userId = req.id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const totalAddresses = user.address.length;
    const totalPages = Math.ceil(totalAddresses / pageLimit);

    if (pageNumber > totalPages) {
      return res.status(404).json({
        success: false,
        message: "Page number exceeds total pages",
      });
    }

    const paginatedAddresses = user.address.slice(
      (pageNumber - 1) * pageLimit,
      pageNumber * pageLimit
    );

    res.status(200).json({
      success: true,
      message: "Addresses retrieved successfully",
      data: {
        totalAddresses,
        totalPages,
        currentPage: pageNumber,
        addresses: paginatedAddresses,
      },
    });
  } catch (error) {
    console.error("Error fetching paginated addresses:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
