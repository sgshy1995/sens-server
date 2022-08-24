import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import jwtConfig from "../config/jwt.config";
import { User } from "../db/entities/User";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig().secret,
    });
  }

  // JWT验证 - Step 4: 被守卫调用
  async validate(payload: User & {sub: string}) {
    console.log(`JWT验证 - Step 4: 被守卫调用, 当前 payload 将被当做 request 的 user 返回信息`);
    //{ username: user.username, sub: user.userId, nickname: user.nickname, primary_key: user.primary_key }
    return { id: payload.sub, username: payload.username, phone: payload.phone };
  }
}
