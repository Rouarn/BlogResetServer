import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CreateAuthDto as JwtPayload } from 'src/auth/dto/create-auth.dto';

@Injectable()
// 验证请求头中的token
export class JwtAuthStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('NEST_JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const { userName, id, roles } = payload;
    console.log('payload: ', payload);

    return {
      test: 'test',
      id,
      userName,
      roles,
    };
  }
}
