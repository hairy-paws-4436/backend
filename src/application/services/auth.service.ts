import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../infrastructure/database/mysql/repositories/user.repository';
import { TwoFactorAuthService } from '../../infrastructure/services/auth/twofa.service';
import { UserEntity } from '../../core/domain/user/user.entity';
import { InvalidCredentialsException } from '../../core/exceptions/domain.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  /**
   * Valida credenciales de usuario
   * @param email Correo electrónico
   * @param password Contraseña
   * @returns Entidad de usuario si las credenciales son válidas
   */
  async validateUser(email: string, password: string): Promise<UserEntity> {
    try {
      // Buscar usuario por email
      const user = await this.userRepository.findByEmail(email);
      
      // Verificar si el usuario está activo
      if (!user.isActive()) {
        throw new InvalidCredentialsException();
      }
      
      // Comparar contraseña (entidad ORM tiene el método)
      const ormUser = await this.userRepository.findOne({ email });
      const isPasswordValid = await bcrypt.compare(password, user.getPassword());
      
      if (!isPasswordValid) {
        throw new InvalidCredentialsException();
      }
      
      return user;
    } catch (error) {
      throw new InvalidCredentialsException();
    }
  }

  /**
   * Genera un token JWT para un usuario
   * @param user Usuario autenticado
   * @returns Token JWT
   */
  generateToken(user: UserEntity): { access_token: string } {
    const payload = {
      sub: user.getId(),
      email: user.getEmail(),
      role: user.getRole(),
    };
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Habilita la autenticación de dos factores para un usuario
   * @param userId ID del usuario
   * @returns URL para QR y secreto
   */
  async enableTwoFactorAuth(userId: string): Promise<{
    otpAuthUrl: string;
    qrCodeDataUrl: string;
    secret: string;
  }> {
    // Buscar usuario
    const user = await this.userRepository.findById(userId);
    
    // Verificar si ya tiene 2FA habilitado
    if (user.isTwoFactorEnabled()) {
      throw new UnauthorizedException('El usuario ya tiene 2FA habilitado');
    }
    
    // Generar secreto
    const secret = this.twoFactorAuthService.generateSecret();
    
    // Generar URL para QR
    const otpAuthUrl = this.twoFactorAuthService.getOtpAuthUrl(
      user.getEmail(),
      secret,
    );
    
    // Generar QR como data URL
    const qrCodeDataUrl = await this.twoFactorAuthService.generateQrCode(otpAuthUrl);
    
    // Guardar secreto en el usuario (aún no activado)
    await this.userRepository.updateTwoFactorSecret(userId, secret);
    
    return {
      otpAuthUrl,
      qrCodeDataUrl,
      secret,
    };
  }

  /**
   * Verifica un token de autenticación de dos factores
   * @param userId ID del usuario
   * @param token Token a verificar
   * @returns true si el token es válido
   */
  async verifyTwoFactorAuthToken(userId: string, token: string): Promise<boolean> {
    // Buscar usuario
    const user = await this.userRepository.findById(userId);
    
    // Verificar que tenga secreto 2FA
    const secret = user.getTwoFactorSecret();
    if (!secret) {
      throw new UnauthorizedException('Usuario no tiene configurado 2FA');
    }
    
    // Verificar token
    const isValid = this.twoFactorAuthService.verifyToken(token, secret);
    
    // Si es válido y 2FA no está aún activado, activarlo
    if (isValid && !user.isTwoFactorEnabled()) {
      user.enableTwoFactor();
      await this.userRepository.update(userId, user);
    }
    
    return isValid;
  }

  /**
   * Desactiva la autenticación de dos factores para un usuario
   * @param userId ID del usuario
   */
  async disableTwoFactorAuth(userId: string): Promise<void> {
    // Buscar usuario
    const user = await this.userRepository.findById(userId);
    
    // Desactivar 2FA
    user.disableTwoFactor();
    await this.userRepository.update(userId, user);
  }
}