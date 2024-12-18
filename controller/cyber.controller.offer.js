const getDataUri = require("../utils/dataUriParser.js");
const cloudinary = require("../config/cloudinary.config.js");
require("dotenv").config();
const offerModel = require("../model/cyber.model.offer.js");


exports.createOffer = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No image provided.",
      });
    }

    let offerImage = "";

    if (file) {
      try {
        const fileUri = getDataUri(file);
        const cloudResponse = await cloudinary.uploader.upload(
          fileUri.content,
          {
            folder: "offers",
            resource_type: "image",
          }
        );

        if (cloudResponse && cloudResponse.secure_url) {
          offerImage = cloudResponse.secure_url;
        }
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image to Cloudinary",
        });
      }
    }

    const newOffer = new offerModel({
      offer_image: offerImage,
    });

    await newOffer.save();

    res.status(201).json({
      success: true,
      message: "Offer created successfully",
      data: newOffer,
    });
  } catch (error) {
    console.error("Error creating offer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No image provided.",
      });
    }

    const offer = await offerModel.findById(offerId);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found.",
      });
    }

    // Store the previous image URL for remove in cloud storage
    const previousOfferImage = offer.offer_image;

    let updatedOfferImage = previousOfferImage;

    // upload it to Cloudinary
    if (file) {
      try {
        const fileUri = getDataUri(file);

        const cloudResponse = await cloudinary.uploader.upload(
          fileUri.content,
          {
            folder: "offers",
            resource_type: "image",
          }
        );

        if (cloudResponse && cloudResponse.secure_url) {
          updatedOfferImage = cloudResponse.secure_url;
        }
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to upload new image to Cloudinary.",
        });
      }
    }

    // If there's an existing image, delete it from Cloudinary
    if (previousOfferImage) {
      try {
        const imageId = previousOfferImage.split("/").pop().split(".")[0];

        const cloudinaryResponse = await cloudinary.uploader.destroy(
          `offers/${imageId}`,
          {
            resource_type: "image",
          }
        );

        if (cloudinaryResponse.result !== "ok") {
          console.error(
            "Failed to delete the previous image from Cloudinary:",
            cloudinaryResponse
          );
        }
      } catch (error) {
        console.error("Cloudinary delete error:", error);
      }
    }

    offer.offer_image = updatedOfferImage;

    await offer.save();

    res.status(200).json({
      success: true,
      message: "Offer updated successfully.",
      data: offer,
    });
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

exports.getAllOffers = async (req, res) => {
  try {
    const offers = await offerModel.find();

    if (offers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No offers found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Offers fetched successfully",
      data: offers,
    });
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.removeOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    const offer = await offerModel.findById(offerId);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found or has been deleted",
      });
    }

    if (offer.offer_image) {
      const imageId = offer.offer_image.split("/").pop().split(".")[0];
      // console.log(imageId)
      const cloudinaryResponse = await cloudinary.uploader.destroy(
        `offers/${imageId}`,
        { resource_type: "image" }
      );
      // console.log(cloudinaryResponse)
      if (cloudinaryResponse.result !== "ok") {
        return res.status(500).json({
          success: false,
          message: "Failed to delete image from Cloudinary",
        });
      }
    }

    await offerModel.findByIdAndDelete(offerId);

    res.status(200).json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting offer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
