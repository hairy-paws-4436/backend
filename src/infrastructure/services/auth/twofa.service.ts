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
    // Configurar el periodo de expiración de OTP a 30 segundos (valor por defecto)
    authenticator.options = { 
      window: 1, // Número de periodos de tiempo antes y después del actual para permitir
      step: 30   // Periodo de tiempo en segundos
    };
  }

  /**
   * Genera un secreto para 2FA
   * @returns Secreto generado
   */
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * Genera la URL para el QR de 2FA
   * @param email Email del usuario
   * @param secret Secreto de 2FA
   * @returns URL para generar el QR
   */
  getOtpAuthUrl(email: string, secret: string): string {
    return authenticator.keyuri(email, this.appName, secret);
  }

  /**
   * Genera un QR en formato Data URL
   * @param otpAuthUrl URL de autenticación OTP
   * @returns Data URL del QR
   */
  async generateQrCode(otpAuthUrl: string): Promise<string> {
    try {
      return await toDataURL(otpAuthUrl);
    } catch (error) {
      this.logger.error(`Error al generar código QR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Valida un token 2FA
   * @param token Token a validar
   * @param secret Secreto del usuario
   * @returns true si el token es válido, false en caso contrario
   */
  verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      this.logger.error(`Error al verificar token 2FA: ${error.message}`);
      return false;
    }
  }

  /**
   * Genera un token 2FA (para pruebas)
   * @param secret Secreto del usuario
   * @returns Token generado
   */
  generateToken(secret: string): string {
    return authenticator.generate(secret);
  }
}