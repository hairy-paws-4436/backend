import { Injectable, Logger } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwoFactorAuthService {
  private readonly logger = new Logger(TwoFactorAuthService.name);
  private readonly appName: string;

  constructor(private readonly configService: ConfigService) {
    this.appName = this.configService.get<string>('APP_NAME') || 'HairyPaws';
    authenticator.options = { 
      window: 1,
      step: 30
    };
  }

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  getOtpAuthUrl(email: string, secret: string): string {
    return authenticator.keyuri(email, this.appName, secret);
  }

  async generateQrCode(otpAuthUrl: string): Promise<string> {
    try {
      return await toDataURL(otpAuthUrl);
    } catch (error) {
      this.logger.error(`Error generating QR code: ${error.message}`);
      throw error;
    }
  }

  verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      this.logger.error(`Error verifying 2FA token: ${error.message}`);
      return false;
    }
  }

  generateToken(secret: string): string {
    return authenticator.generate(secret);
  }
}
