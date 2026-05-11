// Simple in-memory rate limiter for admin login attempts
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

function adminLoginLimiter(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();

  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, { attempts: 0, lockedUntil: 0 });
  }

  const record = loginAttempts.get(ip);

  // Check if IP is currently locked
  if (record.lockedUntil > now) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 1000 / 60);
    console.warn(`[SECURITY] Rate limit exceeded for IP ${ip}. Remaining lockout time: ${remainingMinutes} minute(s)`);
    return res.status(429).json({
      message: `Too many login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`
    });
  }

  // Reset attempts if lock time has expired
  if (record.lockedUntil <= now) {
    record.attempts = 0;
    record.lockedUntil = 0;
  }

  next();
}

function recordFailedAttempt(req) {
  const ip = getClientIp(req);

  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, { attempts: 0, lockedUntil: 0 });
  }

  const record = loginAttempts.get(ip);
  record.attempts += 1;

  console.log(`[SECURITY] Failed admin login attempt from IP ${ip} (attempt ${record.attempts}/${MAX_ATTEMPTS})`);

  // Lock account after MAX_ATTEMPTS failed attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCK_TIME;
    console.warn(`[SECURITY] Admin login locked for IP ${ip} after ${MAX_ATTEMPTS} failed attempts. Locked until ${new Date(record.lockedUntil).toISOString()}`);
  }
}

function recordSuccessfulAttempt(req) {
  const ip = getClientIp(req);
  if (loginAttempts.has(ip)) {
    console.log(`[SECURITY] Successful admin login from IP ${ip}. Clearing rate limit record.`);
    loginAttempts.delete(ip);
  }
}

// Cleanup old entries periodically (every hour)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    if (record.lockedUntil <= now && record.attempts === 0) {
      loginAttempts.delete(ip);
    }
  }
}, 60 * 60 * 1000);

module.exports = {
  adminLoginLimiter,
  recordFailedAttempt,
  recordSuccessfulAttempt
};
