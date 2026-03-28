import type { TokenPayload } from '@blogapp/types';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
