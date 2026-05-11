const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminLogin, authenticateAdmin } = require('../controllers/authController');
const { adminLoginLimiter } = require('../middleware/rateLimiter');

router.post('/login', adminLoginLimiter, adminLogin);
router.post('/import-students', authenticateAdmin, adminController.importStudents);
router.post('/create-election', authenticateAdmin, adminController.createElection);
router.post('/add-candidate', authenticateAdmin, adminController.addCandidate);
router.post('/start-election', authenticateAdmin, adminController.startElection);
router.post('/end-election', authenticateAdmin, adminController.endElection);
router.post('/reset-election', authenticateAdmin, adminController.resetElection);
router.post('/clear-all-data', authenticateAdmin, adminController.clearAllData);
router.get('/stats', authenticateAdmin, adminController.stats);
router.get('/results', authenticateAdmin, adminController.results);
router.get('/students', authenticateAdmin, adminController.students);
router.get('/export-voters', authenticateAdmin, adminController.exportVoters);
router.get('/candidates', authenticateAdmin, adminController.candidates);

module.exports = router;
