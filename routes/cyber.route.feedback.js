// Will work later
const express = require("express");
const router = express.Router();
const {
  createFeedback,
  modifyFeedback,
  removeFeedback,
  removeFeedbackImage,
  myFeedbacks,
  topFeedback
} = require("../controller/cyber.controller.feedback");
const { isAuthenticated } = require("../middleware/isAuthenticated");
const multipleUpload = require("../middleware/multiUpload.multer.config");
const isUser = require('../middleware/isUser.js')

// isAuthenticated, isUser, 
router.post("/createFeedback", isAuthenticated, isUser, multipleUpload, createFeedback);
router.put("/modifyFeedback/:feedbackId", isAuthenticated, multipleUpload, modifyFeedback);
router.delete("/removeFeedback/:feedbackId", isAuthenticated, removeFeedback);
router.delete("/removeFeedback/image/:feedbackId", removeFeedbackImage);
router.get("/myFeedbacks",isAuthenticated, myFeedbacks);
router.get("/topFeedback", topFeedback);
 
module.exports = router;


// All Feedback Api Routes are here
// http://localhost:4010/cyber/user/feedback/createFeedback
// http://localhost:4010/cyber/user/feedback/modifyFeedback/:feedbackId
// http://localhost:4010/cyber/user/feedback/removeFeedback/:feedbackId
// http://localhost:4010/cyber/user/feedback/removeFeedback/image/:feedbackId
// http://localhost:4010/cyber/user/feedback/myFeedbacks
// http://localhost:4010/cyber/user/feedback/topFeedback
