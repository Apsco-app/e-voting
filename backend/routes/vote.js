const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const { verifyVoterToken } = require('../controllers/authController');

router.get('/ballot', verifyVoterToken, voteController.getBallot);
router.post('/vote', verifyVoterToken, voteController.submitVote);

module.exports = router;
