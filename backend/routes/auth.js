const express = require('express');
const router = express.Router();
const { voterLogin } = require('../controllers/authController');

router.post('/login', voterLogin);

module.exports = router;
