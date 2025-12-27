declare namespace Express {
  interface Request {
    user?: import('@/common/interfaces').CurrentUser;
  }
}
