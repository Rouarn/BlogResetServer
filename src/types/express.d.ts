import { CurrentUser } from '@/common/interfaces';

declare global {
  namespace Express {
    interface Request {
      user?: CurrentUser;
    }
  }
}
