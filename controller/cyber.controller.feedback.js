const feedbackModel = require("../model/cyber.model.feedback");
const productModel = require("../model/cyber.model.product");
const cloudinary = require("../config/cloudinary.config");
const getDataUri = require("../utils/dataUriParser");

// will work it 

exports.createFeedback = async (req, res) => {
  try {
    const { product, feedback_description, rating } = req.body;
    const userId = req.id;

    const imageFiles = req.files;
    const uploadedImages = [];

    if(uploadedImages.length > 5) {
      return res.status(400).json({
        message: "Maximum 5 images allowed per feedback.",
        success: false,
      });
    }

    const productId = await productModel.findById(product);

    if (!productId) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
      });
    }

    if (!product) {
      return res.status(422).json({
        message: "Product ID is required",
        success: false,
      });
    }

    // Validate feedback description
    if (feedback_description && feedback_description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Feedback description must be at least 10 characters long.",
      });
    }

    if (feedback_description && feedback_description.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Feedback description must not exceed 500 characters.",
      });
    }

    let ratingConvertToInteger = parseFloat(rating);
    // Validate rating
    if (isNaN(ratingConvertToInteger) || ratingConvertToInteger < 1 || ratingConvertToInteger > 5 || !Number.isInteger(ratingConvertToInteger)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5.",
      });
    }

    if (imageFiles && imageFiles.length > 0) {
      try {
        for (const file of imageFiles) {
          // Convert each file to a data URI
          const fileUri = getDataUri(file);
          // console.log(fileUri);

          // Make sure the content exists before uploading
          if (!fileUri || !fileUri.content) {
            return res.status(400).json({
              success: false,
              message: "File data is missing or invalid",
            });
          }

          // Upload each file to Cloudinary
          const cloudResponse = await cloudinary.uploader.upload(
            fileUri.content,
            {
              folder: "products_Feedback",
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

    // Check if a Feedback already exists for this user and product
    const existingFeedback = await feedbackModel.findOne({
      user: userId,
      product,
    });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: "You have already Feedbacked this product.",
      });
    }

    // Create a new Feedback
    const feedback = new feedbackModel({
      user: userId,
      product,
      feedback_description,
      rating: ratingConvertToInteger,
      feedback_images: uploadedImages,
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: "Thanks for your feedback 🥰",
      feedback,
    });
  } catch (error) {
    console.error("Error creating Feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.modifyFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { feedback_description, rating } = req.body;
    const userId = req.id;

    const imageFiles = req.files;
    const uploadedImages = [];

    // Validate feedback description
    if (feedback_description && feedback_description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Feedback description must be at least 10 characters long.",
      });
    }

    if (feedback_description && feedback_description.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Feedback description must not exceed 500 characters.",
      });
    }

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
      });
    }

    // If no files are uploaded, keep the existing images
    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles) {
        // Convert each file to a data URI
        const fileUri = getDataUri(file);

        // Ensure the file content is valid
        if (!fileUri || !fileUri.content) {
          return res.status(400).json({
            success: false,
            message: "File data is missing or invalid",
          });
        }

        // Upload each file to Cloudinary
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
          folder: "products_Feedback",
          resource_type: "image",
        });

        if (cloudResponse && cloudResponse.secure_url) {
          uploadedImages.push(cloudResponse.secure_url);
        }
      }
    }

    // Find feedback by ID and ensure it belongs to the authenticated user
    const feedback = await feedbackModel.findOne({
      _id: feedbackId,
      user: userId,
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found or you are not authorized to modify it.",
      });
    }

    // Update feedback fields if provided
    if (feedback_description)
      feedback.feedback_description = feedback_description;
    if (rating) feedback.rating = rating;

    // Append new images to existing ones, if any
    if (uploadedImages.length > 0) {
      feedback.feedback_images = feedback.feedback_images
        ? [...feedback.feedback_images, ...uploadedImages]
        : uploadedImages;
    }

    // Save the updated feedback
    await feedback.save();

    res.status(200).json({
      success: true,
      message: "Feedback updated successfully.",
      feedback,
    });
  } catch (error) {
    console.error("Error modifying feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.myFeedbacks = async (req, res) => {
  try {
    const userId = req.id;

    // Find feedback entries by the authenticated user
    const feedbacks = await feedbackModel
      .find({ user: userId })
      .populate("product", "product_title product_images")
      .select("feedback_description rating feedback_images product");
    if (!feedbacks || feedbacks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No feedback found for this user.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Feedback retrieved successfully.",
      feedbacks,
    });
  } catch (error) {
    console.error("Error fetching feedback for user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// will test  it later for image remove in cloudinary
exports.removeFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const userId = req.id;

    // Find the feedback by ID
    const feedback = await feedbackModel.findById(feedbackId);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    // Check if the logged-in user is the one who created the feedback
    if (feedback.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this feedback 🤔",
      });
    }

    // Delete associated images if they exist
    if (feedback.feedback_images && feedback.feedback_images.length > 0) {
      for (const image of feedback.feedback_images) {
        try {
          // Assuming you're using Cloudinary; adjust if you're using a different service
          const publicId = image.split("/").pop().split(".")[0]; // Extract publicId from URL
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("Error deleting image from Cloudinary:", err);
        }
      }
    }

    // Delete the feedback
    await feedback.deleteOne();

    res.status(200).json({
      success: true,
      message: "Feedback and associated images deleted successfully 😒",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.removeFeedbackImage = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { imageUrl } = req.body;
    const userId = req.id;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required.",
      });
    }

    // Find feedback by ID and ensure it belongs to the authenticated user
    const feedback = await feedbackModel.findOne({
      _id: feedbackId,
      user: userId,
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found or you are not authorized to modify it.",
      });
    }

    // Check if the image URL exists in the feedback
    const imageIndex = feedback.feedback_images.indexOf(imageUrl);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Image not found in feedback.",
      });
    }

    // Extract the public_id from the Cloudinary URL
    const publicIdMatch = imageUrl.match(/\/([^/]+)\.[a-z]+$/i); // Extracts the file name
    if (!publicIdMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid image URL.",
      });
    }

    const publicId = `products_Feedback/${publicIdMatch[1]}`;

    // Remove the image from Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Cloudinary deletion error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete image from Cloudinary.",
      });
    }

    // Remove the image URL from the feedback's image array
    feedback.feedback_images.splice(imageIndex, 1);

    // Save the updated feedback
    await feedback.save();

    res.status(200).json({
      success: true,
      message: "Image removed successfully.",
      feedback,
    });
  } catch (error) {
    console.error("Error removing feedback image:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.getAllfeedbacks = async (req, res) => {
  try {
    // Fetch all feedbacks and populate user and product details
    const feedbacks = await feedbackModel
      .find({})
      .populate("user", "fullname profilePhoto")
      .populate("product", "product_title ")
      .select("feedback_description rating feedback_images user product"); // Select specific fields for response

    // If no feedbacks are found, return a message
    if (!feedbacks.length) {
      return res.status(404).json({
        success: false,
        message: "No feedbacks found",
        stats: {
          totalfeedbacks: 0,
          excellent: 0,
          good: 0,
          average: 0,
          belowAverage: 0,
          poor: 0,
        },
      });
    }

    // Aggregate statistics for the feedback ratings
    const feedbackStats = await feedbackModel.aggregate([
      {
        $group: {
          _id: null, // We are not grouping by any field, just getting total stats
          totalfeedbacks: { $sum: 1 },
          excellent: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } }, // Rating 5
          good: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } }, // Rating 4
          average: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } }, // Rating 3
          belowAverage: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } }, // Rating 2
          poor: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } }, // Rating 1
        },
      },
    ]);

    // If aggregation returns no result, set the stats to default
    const stats = feedbackStats.length
      ? feedbackStats[0]
      : {
          totalfeedbacks: 0,
          excellent: 0,
          good: 0,
          average: 0,
          belowAverage: 0,
          poor: 0,
        };

    // Return the feedbacks and aggregated stats
    res.status(200).json({
      success: true,
      message: "Feedbacks fetched successfully",
      feedbacks,
      stats,
    });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.topFeedback = async (req, res) => {
  try {
    // Fetch top 3 feedbacks with 5-star or Excellent
    const excellentFeedbacks = await feedbackModel
      .find({ rating: 5 }) // Assuming `rating` and `feedback` fields
      .sort({ createdAt: -1 }) // Sort by newest first (optional)
      .limit(3); // Limit to top 3

    // Fetch top 2 feedbacks with 4-star or Good
    const goodFeedbacks = await feedbackModel
      .find({ rating: 4 }) // Assuming `rating` and `feedback` fields
      .sort({ createdAt: -1 }) // Sort by newest first (optional)
      .limit(2); // Limit to top 2

    // Combine and send the results
    const combinedFeedbacks = [...excellentFeedbacks, ...goodFeedbacks];

    return res.status(200).json({
      success: true,
      message: "Top feedbacks fetched successfully",
      data: combinedFeedbacks,
    });
  } catch (error) {
    console.error("Error fetching top feedbacks:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching top feedbacks",
      error: error.message,
    });
  }
};
