const cartModel = require("../model/cyber.model.cart");
const productModel = require("../model/cyber.model.product");

exports.addToCart = async (req, res) => {
  try {
    const userId = req.id;
    const { productId, quantity, product_price } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Invalid input data." });
    }


     const product = await productModel.findById(productId).populate("variants");

     if (!product) {
       return res.status(404).json({ success: false, message: "Product not found." });
     }

        // Check if the product is out of stock
        const variant = product.variants[0];

        if (!variant || variant.product_stock <= 0) {
          return res.status(200).json({ success: false, message: "Product is out of stock." });
        }
    
        // If stock is less than the requested quantity, prevent adding to cart
        if (variant.product_stock < quantity) {
          return res.status(400).json({ success: false, message: "Not enough stock available." });
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

    await cart.populate("products.productId");

    // Then populate the variants for each productId
    for (let item of cart.products) {
      await item.productId.populate("variants");
    }

    const formattedCart = cart.products.map((item) => ({
      cartItemId: item._id,
      productId: item.productId._id,
      product_title: item.productId.product_title,
      product_image:
        item.productId?.variants?.[0]?.product_images?.[0] || 
        "https://newhorizonindia.edu/nhengineering/innovation/wp-content/uploads/2020/01/default-placeholder.png",
      quantity: item.quantity,
      product_stock: item.productId?.variants?.[0]?.product_stock || 0,
      product_price: item.product_price,
    }));

    res.status(200).json({ success: true, cart: formattedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding to cart", error: error.message });
  }
};

exports.updateCartItemQuantity = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (!cartItemId) {
      return res.status(400).json({ success: false, message: "Cart item ID is required." });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1." });
    }

    // Find the cart and populate the products (with variants)
    const cart = await cartModel.findOne({ "products._id": cartItemId }).populate("products.productId");
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found." });
    }

    // Find the specific cart item
    const cartItem = cart.products.find((item) => item._id.toString() === cartItemId);
    if (!cartItem) {
      return res.status(404).json({ success: false, message: "Cart item not found." });
    }

    // Fetch the product and populate the variants field
    const product = await productModel.findById(cartItem.productId._id).populate("variants");

    // console.log("Product:", product);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // console.log("Product Variants:", product.variants);

    // Find the variant that corresponds to this cart item
    const variant = product.variants.find((v) => v.productId.toString() === cartItem.productId._id.toString());

    // console.log("Variant found:", variant);

    if (!variant) {
      return res.status(404).json({ success: false, message: "Product variant not found." });
    }

    // Check stock availability for the variant
    if (quantity > variant.product_stock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for the selected variant. Available stock: ${variant.product_stock}.`,
      });
    }

    // Update the cart item quantity
    cartItem.quantity = quantity;

    // Recalculate the total price
    cart.totalPrice = cart.products.reduce(
      (total, item) => total + item.quantity * item.product_price,
      0
    );

    await cart.save();

    res.status(200).json({ success: true, message: "Cart item updated successfully.", cart });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ success: false, message: "Error updating cart item.", error: error.message });
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
        select: "product_images product_additional_price product_stock",
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
      product_stock: item.productId?.variants?.[0]?.product_stock || 0,
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
