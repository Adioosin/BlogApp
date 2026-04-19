import rateLimit from 'express-rate-limit';

const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: { message: 'Too many comments, please try again later', code: 'RATE_LIMITED' } },
});

export { commentLimiter };
