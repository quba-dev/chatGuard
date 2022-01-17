import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AppConfig } from '../../configuration/configuration.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: AppConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.values.jwt.jwtSecret,
    });
  }

  async validate(payload: any) {
    return {
      email: payload.email,
      id: payload.id,
      roles: payload.roles,
      organizationId: payload.organizationId,
    };
  }
}
