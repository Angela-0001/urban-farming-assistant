const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch user to get role
    const user = await User.findById(payload.id).select('_id email role').lean();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = { id: String(user._id), email: user.email, role: user.role || 'user' };
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = auth;
