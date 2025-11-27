export { SharedAuthModule } from './auth.module';
export { UnifiedAuthGuard } from './guards/unified-auth.guard';
export { Auth as AuthDecorator } from './decorators/auth.decorator';
export { attachHandshakeAuth } from './utils/ws-handshake.util';
export { extractHttpToken, extractWsToken } from './utils/token.util';
