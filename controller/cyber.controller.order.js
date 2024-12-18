const orderModel = require("../model/cyber.model.order");
const cartModel = require("../model/cyber.model.cart");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Placing User Order for Frontend using Stripe
exports.placeOrderStripe = async (req, res) => {
  try {
    const userId = req.id;
    // console.log("req.body", req.body)

    const { items, amount, address } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Items are required." });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount." });
    }
    if (!address) {
      return res.status(400).json({ success: false, message: "Address is required." });
    }

    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      paymentStatus: "Failed",
    });
    await newOrder.save();


    const line_items = items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.product_title,
          images: [item.product_image],
        },
        unit_amount: item.product_price * 100, // Convert to smallest currency unit (e.g., if the price is ₹1500, the unit_amount is 1500 × 100 = 150000 paise).
      },
      quantity: item.quantity,
    }));

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      success_url: `${process.env.FRONTEND_ORIGIN_URI}/order/verify?success=true&orderId=${newOrder._id}`, // http://192.168.1.44:5173/order/verify?success=true&orderId=67600db0926f1cb20bb0fbb4
      cancel_url: `${process.env.FRONTEND_ORIGIN_URI}/order/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: "payment",
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
    if (success === "true") {
      // Mark the order as paid
      const updatedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        { payment: true, paymentStatus: "Paid" },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(404).json({ success: false, message: "Order not found." });
      }

      // Clear the user's cart
      await cartModel.findOneAndUpdate(
        { userId: updatedOrder.userId },
        { products: [], totalPrice: 0 },
        { new: true }
      );

      res.status(200).json({ success: true, message: "Payment verified, order processed." });
    } else {
      // Handle failed payment
      await orderModel.findByIdAndUpdate(orderId, { paymentStatus: "Failed" });
      res.status(400).json({ success: false, message: "Payment Failed. Please try again." });
    }
  } catch (error) {
    console.error("Error verifying order:", error);
    res.status(500).json({ success: false, message: "Error verifying payment." });
  }
};

// Placing User Order for Cash on Delivery
exports.placeOrderCod = async (req, res) => {
  try {
    const userId = req.id;
    const { items, amount, address } = req.body;

    // Create a new COD order
    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      payment: true,
    });
    await newOrder.save();

    // Clear user cart
    await cartModel.findOneAndUpdate(
      { userId },
      { products: [], totalPrice: 0 },
      { new: true }
    );

    res
      .status(200)
      .json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.error("Error placing COD order:", error);
    res
      .status(500)
      .json({ success: false, message: "Error placing COD order" });
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
