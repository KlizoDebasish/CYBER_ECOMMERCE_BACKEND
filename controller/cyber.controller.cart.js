const cartModel = require("../model/cyber.model.cart");

exports.addToCart = async (req, res) => {
  try {
    const userId = req.id;
    const { productId, quantity, product_price } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Invalid input data." });
    }

    let cart = await cartModel.findOne({ userId });

    if (!cart) {
      cart = new cartModel({
        userId,
        products: [{ productId, quantity, product_price }],
        totalPrice: product_price * quantity,
      });
    } else {
      const existingProductIndex = cart.products.findIndex(
        (item) => item.productId.toString() === productId.toString()
      );

      if (existingProductIndex !== -1) {
        cart.products[existingProductIndex].quantity += quantity;
        cart.products[existingProductIndex].product_price = product_price;
      } else {
        cart.products.unshift({ productId, quantity, product_price });
      }

      cart.totalPrice = cart.products.reduce(
        (total, item) => total + item.quantity * item.product_price,
        0
      );
    }

    await cart.save();
    await cart.populate("products.productId")

    const formattedCart = cart.products.map((item) => ({
      cartItemId: item._id,
      productId: item.productId._id,
      product_title: item.productId.product_title,
      product_image:
        item.productId?.variants?.[0]?.product_images?.[0] ||
        "https://newhorizonindia.edu/nhengineering/innovation/wp-content/uploads/2020/01/default-placeholder.png",
      quantity: item.quantity,
      product_price: item.product_price,
    }));

    res.status(200).json({ success: true, cart: formattedCart }); // message: "Product added to cart"
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding to cart", error: error.message });
  }
};

exports.updateCartItemQuantity = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (!cartItemId) {
      return res.status(400).json({ success: false });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }
    
    const cart = await cartModel.findOneAndUpdate(
      { "products._id": cartItemId },
      { $set: { "products.$.quantity": quantity } },
      { new: true }
    ).populate("products.productId");

    if (!cart) return res.status(404).json({ success: false, message: "Cart item not found." });

    cart.totalPrice = cart.products.reduce(
      (total, item) => total + item.quantity * item.product_price,
      0
    );

    await cart.save();

    res.status(200).json({ success: true, message: "Cart item updated successfully", cart });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating cart", error: error.message });
  }
};

exports.cartDetails = async (req, res) => {
  try {
    const userId = req.id;
    const cart = await cartModel.findOne({ userId }).populate({
      path: "products.productId",
      select: "product_title product_basePrice variants",
      populate: {
        path: "variants",
        select: "product_images product_additional_price",
      },
    });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const formattedCart = cart.products.map((item) => ({
      cartItemId: item._id,
      productId: item.productId._id,
      product_title: item.productId.product_title,
      product_image:
        item.productId?.variants?.[0]?.product_images?.[0] ||
        "https://newhorizonindia.edu/nhengineering/innovation/wp-content/uploads/2020/01/default-placeholder.png",
      quantity: item.quantity,
      product_price: item.product_price,
    }));

    res.status(200).json({ success: true, cart: formattedCart }); // message: "Cart fetched successfully"
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching cart", error: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.id;
    const { productId } = req.params;

    // Find the user's cart
    const cart = await cartModel.findOne({ userId }).populate(
      "products.productId",
      "product_title"
    );

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    // Find the product in the cart
    const productIndex = cart.products.findIndex(
      (item) => item.productId && item.productId._id.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart or already removed",
      });
    }

    // Remove the product from the cart
    cart.products.splice(productIndex, 1)[0];

    // Recalculate the total price
    cart.totalPrice = cart.products.reduce(
      (total, item) => total + item.quantity * item.product_price,
      0
    );

    await cart.save();

    return res.status(200).json({
      success: true,
      // message: "Product removed from cart",
      cart,
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.id;

    // Find the user's cart
    const cart = await cartModel.findOne({ userId });

    if (!cart || cart.products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart is already empty 🗑",
      });
    }

    // Clear the cart
    cart.products = [];
    cart.totalPrice = 0;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully 🗑",
      cart,
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
