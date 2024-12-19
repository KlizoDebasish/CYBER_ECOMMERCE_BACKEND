const wishlistModel = require("../model/cyber.model.wishlist");
const productModel = require("../model/cyber.model.product");


// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.id;
    const { productId } = req.body;

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
        success: false,
      });
    }

    let wishlist = await wishlistModel.findOne({ userId });

    // If no wishlist exists, create a new one
    if (!wishlist) {
      wishlist = new wishlistModel({
        userId,
        products: [{ productId, isWishlist: true }],
      });
    } else {
      const productExists = wishlist.products.some(
        (item) => item.productId.toString() === productId
      );
      if (productExists) {
        return res.status(400).json({
          // message: 'Product already in wishlist',
          success: false,
        });
      }

      // Add the product to the wishlist
      wishlist.products.unshift({ productId, isWishlist: true });
    }

    await wishlist.save();

    res.status(200).json({
      // message: 'Product added to wishlist',
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      message: 'Internal server error',
      success: false,
      error: error.message,
    });
  }
};

// Get all products in the wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.id;
    const { productId } = req.params;

    const wishlist = await wishlistModel.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({
        message: 'Wishlist not found',
        success: false,
      });
    }

    // Find the product in the wishlist
    const productIndex = wishlist.products.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({
        // message: 'Product not found in wishlist',
        success: false,
      });
    }


    wishlist.products.splice(productIndex, 1);
    await wishlist.save();

    res.status(200).json({
      // message: 'Product removed from wishlist',
      success: true,
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      message: 'Internal server error',
      success: false,
      error: error.message,
    });
  }
};

// Remove product from wishlist
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.id;

    const wishlist = await wishlistModel.findOne({ userId }).populate({
      path: 'products.productId',
      select: 'product_title product_basePrice variants',
      populate: {
        path: 'variants',
        select: 'product_images',
      },
    });

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        message: 'Wishlist not found',
      });
    }

    // Filter out invalid or null productId entries
    const formattedWishlist = wishlist.products
      .filter((item) => {
        if (!item.productId) {
          console.warn(`Wishlist item with ID ${item._id} has a null productId.`);
          return false;
        }
        return true;
      })
      .map((item) => {
        const product = item.productId;

        const firstVariantImage =
          product.variants && product.variants.length > 0
            ? product.variants[0].product_images[0]
            : 'https://newhorizonindia.edu/nhengineering/innovation/wp-content/uploads/2020/01/default-placeholder.png';

        return {
          id: product._id,
          title: product.product_title,
          basePrice: product.product_basePrice,
          images: firstVariantImage,
          isWishlist: item.isWishlist,
        };
      });

    if (formattedWishlist.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Wishlist is empty',
      });
    }

    res.status(200).json({
      success: true,
      // message: 'Wishlist fetched successfully',
      wishlist: formattedWishlist,
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
