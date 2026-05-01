const express = require('express');
const router = express.Router();
const { registerUser, authUser, authGoogleUser } = require('../controllers/authController');
const { validateRegisterRequest, validateLoginRequest } = require('../middleware/requestValidation');

router.post('/register', validateRegisterRequest, registerUser);
router.post('/login', validateLoginRequest, authUser);
router.post('/google', authGoogleUser);

module.exports = router;
