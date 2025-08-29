import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards';

export function JwtAuth() {
  return applyDecorators(UseGuards(JwtAuthGuard));
}
