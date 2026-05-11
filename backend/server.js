const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const voteRoutes = require('./routes/vote');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

const requiredEnv = ['JWT_SECRET', 'ADMIN_USER', 'ADMIN_PASS'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

initDatabase();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/', voteRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'UMSSN e-voting backend is running' });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://0.0.0.0:${PORT}`);
});
