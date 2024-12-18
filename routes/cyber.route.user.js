const express = require('express');
const router = express.Router();
const { verifyOtpforRegister, verifyOtpforlogin, signup, login, updateProfile, logout, createAddress, modifyAddress, removeAddress, getAddress, getSingleUserDetails } = require('../controller/cyber.controller.user.js');
const { isAuthenticated } = require('../middleware/isAuthenticated.js');
const { singleUpload } = require('../middleware/multer.config.js');
const isUser = require('../middleware/isUser.js');

router.post('/registration', signup);
router.post('/verify/otp/register', verifyOtpforRegister);
router.post('/login', login);
router.post('/verify/otp/login', verifyOtpforlogin);
router.post('/profile/update', isAuthenticated, singleUpload, updateProfile);
router.get('/logout', logout);
router.get('/singleUserDetails', isAuthenticated, getSingleUserDetails);

// address routes
// isUser
router.post('/createAddress', isAuthenticated, createAddress);
router.put('/modifyAddress/:addressId', isAuthenticated, modifyAddress);
router.get('/getAddress', isAuthenticated, getAddress);
router.delete('/removeAddress/:addressId', isAuthenticated, removeAddress);

module.exports = router;


// All Users Api Routes are here
// http://localhost:4010/cyber/user/registration
// http://localhost:4010/cyber/user/verify/otp/register
// http://localhost:4010/cyber/user/login
// http://localhost:4010/cyber/user/verify/otp/login
// http://localhost:4010/cyber/user/profile/update/:id
// http://localhost:4010/cyber/user/logout
// http://localhost:4010/cyber/user/singleUserDetails


// All Address Api Routes are here
// http://localhost:4010/cyber/user/createAddress
// http://localhost:4010/cyber/user/modifyAddress/:addressId
// http://localhost:4010/cyber/user/getAddress
// http://localhost:4010/cyber/user/removeAddress/:addressId