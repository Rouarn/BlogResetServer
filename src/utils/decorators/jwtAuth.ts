import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.grard';

export function JwtAuth() {
  return applyDecorators(UseGuards(JwtAuthGuard));
}
