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

  async validateUser(email: string, password: string): Promise<UserEntity> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user.isActive()) {
        throw new InvalidCredentialsException();
      }

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

  async enableTwoFactorAuth(userId: string): Promise<{
    otpAuthUrl: string;
    qrCodeDataUrl: string;
    secret: string;
  }> {
    const user = await this.userRepository.findById(userId);

    if (user.isTwoFactorEnabled()) {
      throw new UnauthorizedException('User already has 2FA enabled');
    }

    const secret = this.twoFactorAuthService.generateSecret();
    const otpAuthUrl = this.twoFactorAuthService.getOtpAuthUrl(
      user.getEmail(),
      secret,
    );

    const qrCodeDataUrl = await this.twoFactorAuthService.generateQrCode(otpAuthUrl);
    await this.userRepository.updateTwoFactorSecret(userId, secret);

    return {
      otpAuthUrl,
      qrCodeDataUrl,
      secret,
    };
  }

  async verifyTwoFactorAuthToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);

    const secret = user.getTwoFactorSecret();
    if (!secret) {
      throw new UnauthorizedException('User has not set up 2FA');
    }

    const isValid = this.twoFactorAuthService.verifyToken(token, secret);

    if (isValid && !user.isTwoFactorEnabled()) {
      user.enableTwoFactor();
      await this.userRepository.update(userId, user);
    }

    return isValid;
  }

  async disableTwoFactorAuth(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    user.disableTwoFactor();
    await this.userRepository.update(userId, user);
  }
}
