import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../infrastructure/database/mysql/repositories/user.repository';
import { TwoFactorAuthService } from '../../../infrastructure/services/auth/twofa.service';
import { EntityNotFoundException, BusinessRuleValidationException } from '../../../core/exceptions/domain.exception';

interface EnableTwoFactorAuthDto {
  userId: string;
}

interface TwoFactorAuthQrResponse {
  otpAuthUrl: string;
  qrCodeDataUrl: string;
  secret: string;
}

@Injectable()
export class EnableTwoFactorAuthUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  async execute(dto: EnableTwoFactorAuthDto): Promise<TwoFactorAuthQrResponse> {
    try {
      // Obtener el usuario
      const user = await this.userRepository.findById(dto.userId);
      
      // Verificar si ya tiene 2FA habilitado
      if (user.isTwoFactorEnabled()) {
        throw new BusinessRuleValidationException(
          'La autenticación de dos factores ya está habilitada para este usuario',
        );
      }
      
      // Generar un nuevo secreto para 2FA
      const secret = this.twoFactorAuthService.generateSecret();
      
      // Generar la URL para QR
      const otpAuthUrl = this.twoFactorAuthService.getOtpAuthUrl(
        user.getEmail(),
        secret,
      );
      
      // Generar QR como data URL
      const qrCodeDataUrl = await this.twoFactorAuthService.generateQrCode(otpAuthUrl);
      
      // Guardar el secreto en el usuario (aún no está activado)
      await this.userRepository.updateTwoFactorSecret(user.getId(), secret);
      
      // Retornar datos para mostrar QR al usuario
      return {
        otpAuthUrl,
        qrCodeDataUrl,
        secret,
      };
    } catch (error) {
      if (
        error instanceof EntityNotFoundException ||
        error instanceof BusinessRuleValidationException
      ) {
        throw error;
      }
      throw new Error(`Error al habilitar autenticación de dos factores: ${error.message}`);
    }
  }
}