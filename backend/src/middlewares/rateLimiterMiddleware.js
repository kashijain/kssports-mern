const ipRequests = new Map();
const LIMIT = 60; // 60 requests max
const WINDOW = 60 * 1000; // 1 minute window

export const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  if (!ipRequests.has(ip)) {
    ipRequests.set(ip, { count: 1, resetTime: now + WINDOW });
    return next();
  }

  const record = ipRequests.get(ip);
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + WINDOW;
    return next();
  }

  record.count++;
  if (record.count > LIMIT) {
    return res.status(429).json({
      message: 'Too many chatbot queries from this IP, please try again after a minute.',
    });
  }

  next();
};
