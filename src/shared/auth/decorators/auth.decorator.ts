import { applyDecorators, UseGuards } from '@nestjs/common';
import { UnifiedAuthGuard } from '../guards/unified-auth.guard';

export function Auth(): MethodDecorator & ClassDecorator {
  return applyDecorators(UseGuards(UnifiedAuthGuard));
}
