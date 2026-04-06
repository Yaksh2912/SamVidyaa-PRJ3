const express = require('express');
const router = express.Router();
const { registerUser, authUser } = require('../controllers/authController');
const { validateRegisterRequest, validateLoginRequest } = require('../middleware/requestValidation');

router.post('/register', validateRegisterRequest, registerUser);
router.post('/login', validateLoginRequest, authUser);

module.exports = router;
