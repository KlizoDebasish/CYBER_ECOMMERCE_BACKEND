const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const { createOffer, getAllOffers, updateOffer, removeOffer } = require('../controller/cyber.controller.offer');
const { singleUpload } = require('../middleware/multer.config');


router.post("/createOffer", isAuthenticated, isAdmin, singleUpload, createOffer);
router.put("/updateOffer/:offerId", isAuthenticated, isAdmin, singleUpload, updateOffer);
router.get("/getOffer", getAllOffers);
router.delete("/removeOffer/:offerId", isAuthenticated, isAdmin, removeOffer);

module.exports = router;


// offers
// http://localhost:4010/admin/cyber/dashboard/offer/createOffer
// http://localhost:4010/admin/cyber/dashboard/offer/updateOffer/:offerId
// http://localhost:4010/admin/cyber/dashboard/offer/getOffer
// http://localhost:4010/admin/cyber/dashboard/offer/removeOffer/:offerId