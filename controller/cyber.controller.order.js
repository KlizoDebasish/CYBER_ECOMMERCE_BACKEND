const orderModel = require("../model/cyber.model.order");
const cartModel = require("../model/cyber.model.cart");
const productVariantModel = require("../model/cyber.model.productVariant");
const userModel = require("../model/cyber.model.user");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Placing User Order for Frontend using Stripe
exports.placeOrderStripe = async (req, res) => {
  try {
    const userId = req.id;
    const { items, amount, address, deliveryDate, shippingMethod } = req.body;

    // Validation for required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Items are required." });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount." });
    }
    if (!address) {
      return res.status(400).json({ success: false, message: "Address is required." });
    }

    // Fetch user details from database
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const { email, fullname } = user;

    // Verify stock for all items before proceeding
    for (const item of items) {
      const { productId, quantity, product_title } = item;

      const variant = await productVariantModel.findOne({ productId });
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Variant not found for product: ${product_title}`,
        });
      }

      if (variant.product_stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product_title}. Available stock: ${variant.product_stock}, requested quantity: ${quantity}.`,
        });
      }
    }

    // Create a new order with initial status
    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      deliveryDate,
      shippingMethod,
      paymentStatus: "Pending",
    });
    await newOrder.save();

    // Prepare line items for Stripe checkout
    const line_items = items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.product_title,
          images: [item.product_image],
        },
        unit_amount: item.product_price * 100, // Convert to smallest currency unit
      },
      quantity: item.quantity,
    }));

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      success_url: `${process.env.FRONTEND_ORIGIN_URI}/order/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${process.env.FRONTEND_ORIGIN_URI}/order/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: "payment",
      customer_email: email,
      metadata: {
        orderId: newOrder._id.toString(),
        userId: userId.toString(),
        customerName: fullname,
      },
    });

    res.status(200).json({ success: true, session_url: session.url });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: "Error placing order" });
  }
};

// Verifying Order Payment Status
exports.verifyStripeOrder = async (req, res) => {
  const { orderId, success } = req.body;

  try {
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (success === "true") {
      // Verify stock before finalizing order
      for (const item of order.items) {
        const { productId, quantity, product_title } = item;

        const variant = await productVariantModel.findOne({ productId });
        if (!variant || variant.product_stock < quantity) {
          throw new Error(
            `Insufficient stock for product: ${product_title}. Available stock: ${variant?.product_stock || 0}, requested quantity: ${quantity}.`
          );
        }
      }

      // Mark the order as paid
      order.paymentStatus = "Paid";
      order.payment = true;
      await order.save();

      // Update the order count for the user
      const user = await userModel.findById(order.userId);
      if (user) {
        user.orderCount += 1;
        await user.save();
      }

      // Update stock for each product in the order
      const updateStock = order.items.map(async (item) => {
        const { productId, quantity } = item;

        const variant = await productVariantModel.findOne({ productId });
        if (variant) {
          const newStock = variant.product_stock - quantity;
          await productVariantModel.findByIdAndUpdate(variant._id, { product_stock: newStock });
        }
      });

      // Wait for all stock updates to complete
      await Promise.all(updateStock);

      // Clear the user's cart
      await cartModel.findOneAndUpdate(
        { userId: order.userId },
        { products: [], totalPrice: 0 },
        { new: true }
      );

      res.status(200).json({ success: true, message: "Payment verified, order processed" });
    } else {
      // Handle failed payment
      order.paymentStatus = "Failed";
      await order.save();
      res.status(400).json({ success: false, message: "Payment Failed. Please try again." });
    }
  } catch (error) {
    console.error("Error verifying order:", error);
    res.status(500).json({ success: false, message: `Error verifying payment: ${error.message}` });
  }
};

// Placing User Order for Cash on Delivery
exports.placeOrderCod = async (req, res) => {
  try {
    const userId = req.id;
    const { items, amount, address, deliveryDate, shippingMethod } = req.body;

    // Validation for required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Items are required." });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount." });
    }
    if (!address) {
      return res.status(400).json({ success: false, message: "Address is required." });
    }

    // Verify stock for all items first
    for (const item of items) {
      const { productId, quantity, product_title } = item;

      const variant = await productVariantModel.findOne({ productId });

      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Variant not found for product: ${product_title}`,
        });
      }

      if (variant.product_stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product_title}. Available stock: ${variant.product_stock}, requested quantity: ${quantity}.`,
        });
      }
    }

    // If all items have sufficient stock, proceed to create the order
    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      deliveryDate,
      shippingMethod,
      payment: true,
    });

    await newOrder.save();

    // Update stock for each product in the order
    const updateStock = items.map(async (item) => {
      const { productId, quantity } = item;

      const variant = await productVariantModel.findOne({ productId });

      if (variant) {
        const newStock = variant.product_stock - quantity;

        // Update the stock in the database
        await productVariantModel.findByIdAndUpdate(variant._id, { product_stock: newStock });
      }
    });

    // Wait for all stock updates to complete
    await Promise.all(updateStock);

    // Update the user's order count
    const user = await userModel.findById(userId);
    if (user) {
      user.orderCount += 1;
      await user.save();
    }

    // Clear user cart
    await cartModel.findOneAndUpdate(
      { userId },
      { products: [], totalPrice: 0 },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Order Placed Successfully",
    });
  } catch (error) {
    console.error("Error placing COD order:", error);

    // Handling specific error cases
    if (error.message.includes("Insufficient stock")) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: `Error placing COD order: ${error.message}`,
      });
    }
  }
};

// Listing Orders for Admin Panel
exports.orderLists = async (req, res) => {
  try {
    const orders = await orderModel.find({}).populate({
      path: "userId",
      select: "fullname phone",
    }).sort({ date: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error listing orders:", error);
    res.status(500).json({ success: false, message: "Error listing orders" });
  }
};

// Fetching User Orders for Frontend
exports.userOrders = async (req, res) => {
  try {
    const userId = req.id;
    const orders = await orderModel.find({ userId }).sort({ date: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching user orders" });
  }
};

// update order status
exports.updateOrderDetails = async (req, res) => {
  try {
    const { orderId, orderStatus, paymentStatus } = req.body;

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const updateFields = {};
    if (orderStatus) updateFields.orderStatus = orderStatus; // "Processing", "Delivered"
    if (paymentStatus) updateFields.paymentStatus = paymentStatus; // "Pending", "Failed", "Paid"

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    await orderModel.findByIdAndUpdate(orderId, updateFields);

    res.status(200).json({
      success: true,
      message: "Order details updated successfully",
    });
  } catch (error) {
    console.error("Error updating order details:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order details",
    });
  }
};

// filtering order status
exports.filterOrderStatus = async (req, res) => {
  try {
    const { status } = req.query;
    console.log(status);

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const orders = await orderModel.find({ orderStatus: status }).sort({ date: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching filtered orders:", error.message);
    res.status(500).json({ success: false, message: "Error fetching filtered orders" });
  }
};
