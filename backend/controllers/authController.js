const jwt = require('jsonwebtoken');
const { getAsync } = require('../database');
const { hashVoterId } = require('../models/utils');
const { recordFailedAttempt, recordSuccessfulAttempt } = require('../middleware/rateLimiter');

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

function adminLogin(req, res) {
  const { username, password } = req.body;
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    recordFailedAttempt(req);
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  recordSuccessfulAttempt(req);
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
}

async function voterLogin(req, res) {
  const { voter_id } = req.body;
  if (!voter_id) {
    return res.status(400).json({ message: 'Voter ID is required' });
  }
  const election = await getAsync('SELECT is_active FROM election ORDER BY created_at DESC LIMIT 1');
  if (!election || !election.is_active) {
    return res.status(403).json({ message: 'No active election at this time' });
  }

  const hash = hashVoterId(voter_id);
  const student = await getAsync('SELECT id, has_voted FROM students WHERE voter_id_hash = ?', [hash]);
  if (!student) {
    return res.status(401).json({ message: 'Invalid voter credentials' });
  }
  if (student.has_voted) {
    return res.status(403).json({ message: 'Voting is already completed for this voter' });
  }
  const token = jwt.sign({ role: 'voter', studentId: student.id }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
}

function authenticateAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing admin token' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.admin = payload;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Relogin into your admin account' });
  }
}

async function verifyVoterToken(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing voter token' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'voter' || !payload.studentId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const student = await getAsync('SELECT id, has_voted FROM students WHERE id = ?', [payload.studentId]);
    if (!student) {
      return res.status(401).json({ message: 'Voter not found' });
    }
    if (student.has_voted) {
      return res.status(403).json({ message: 'Student has already voted' });
    }
    req.voter = student;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired voter token' });
  }
}

module.exports = {
  adminLogin,
  voterLogin,
  authenticateAdmin,
  verifyVoterToken,
};
