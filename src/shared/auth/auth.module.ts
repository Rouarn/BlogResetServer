import { Module } from '@nestjs/common';
import { UnifiedAuthGuard } from './guards/unified-auth.guard';

@Module({
  providers: [UnifiedAuthGuard],
  exports: [UnifiedAuthGuard],
})
export class SharedAuthModule {}
