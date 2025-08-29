import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CreateAuthDto as JwtPayload } from 'src/modules/auth/dto/create-auth.dto';

@Injectable()
// 验证请求头中的token
export class JwtAuthStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('NEST_JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload & { iat?: number; exp?: number }) {
    try {
      delete payload.iat;
      delete payload.exp;
      return {
        ...payload,
      };
    } catch (e) {
      return { ...e };
    }
  }
}
