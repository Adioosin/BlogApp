import { Router, type Router as RouterType } from 'express';

const healthRouter: RouterType = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok' } });
});

export { healthRouter };
