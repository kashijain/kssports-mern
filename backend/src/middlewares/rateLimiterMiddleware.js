export const createRateLimiter = ({
  windowMs = 60 * 1000, // 1 minute default
  max = 60, // Limit each IP
  message = 'Too many requests from this IP, please try again later.',
} = {}) => {
  const ipRequests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!ipRequests.has(ip)) {
      ipRequests.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = ipRequests.get(ip);
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    record.count++;
    if (record.count > max) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    next();
  };
};

// Expose pre-configured rate limiters

// Stricter rate limiter for sensitive authentication & user routes (15 attempts max per 15 minutes)
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many login or authentication attempts from this IP, please try again after 15 minutes.',
});

// Original rate limiter preserved for chatbot routes to maintain backward compatibility
export const rateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many chatbot queries from this IP, please try again after a minute.',
});
