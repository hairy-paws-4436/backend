import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../database/mysql/repositories/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.userRepository.findById(payload.sub);
      
      if (!user.isActive()) {
        throw new UnauthorizedException('Inactive user');
      }
      return {
        id: user.getId(),
        email: user.getEmail(),
        role: user.getRole(),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}