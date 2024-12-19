const express = require('express');
const { allUsers, deleteUser  } = require('../controller/admin.cyber.controller');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const { getAllfeedbacks } = require('../controller/cyber.controller.feedback');


// users
router.get('/allusers', isAuthenticated, isAdmin, allUsers);
router.delete('/delete/user/:userId', isAuthenticated, isAdmin, deleteUser);

// feedbacks
router.get("/getAllfeedbacks", isAuthenticated, isAdmin, getAllfeedbacks);


module.exports = router;


// All Api Routes are here

// users
// http://localhost:4010/admin/cyber/dashboard/allusers
// http://localhost:4010/admin/cyber/dashboard/delete/user/:userId


// feedbacks
// http://localhost:4010/admin/cyber/dashboard/getAllfeedbacks
