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
      // Verificar que el usuario existe y está activo
      const user = await this.userRepository.findById(payload.sub);
      
      if (!user.isActive()) {
        throw new UnauthorizedException('Usuario inactivo');
      }
      
      // Retorna los datos del usuario que estarán disponibles en request.user
      return {
        id: user.getId(),
        email: user.getEmail(),
        role: user.getRole(),
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}