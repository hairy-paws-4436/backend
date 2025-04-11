import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../infrastructure/database/mysql/repositories/user.repository';
import { TwoFactorAuthService } from '../../../infrastructure/services/auth/twofa.service';
import { EntityNotFoundException, BusinessRuleValidationException } from '../../../core/exceptions/domain.exception';

interface VerifyTwoFactorAuthDto {
  userId: string;
  token: string;
}

@Injectable()
export class VerifyTwoFactorAuthUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  async execute(dto: VerifyTwoFactorAuthDto): Promise<void> {
    try {
      // Obtener el usuario
      const user = await this.userRepository.findById(dto.userId);
      
      // Verificar que el usuario tenga un secreto 2FA configurado
      const secret = user.getTwoFactorSecret();
      if (!secret) {
        throw new BusinessRuleValidationException(
          'El usuario no tiene configurada la autenticación de dos factores',
        );
      }
      
      // Verificar el token
      const isValid = this.twoFactorAuthService.verifyToken(dto.token, secret);
      if (!isValid) {
        throw new BusinessRuleValidationException(
          'Token inválido o expirado',
        );
      }
      
      // Si el usuario aún no tenía habilitado 2FA, habilitarlo
      if (!user.isTwoFactorEnabled()) {
        const updatedUser = user;
        updatedUser.enableTwoFactor();
        await this.userRepository.update(user.getId(), updatedUser);
      }
      
      // Si llegamos aquí, la verificación fue exitosa
    } catch (error) {
      if (
        error instanceof EntityNotFoundException ||
        error instanceof BusinessRuleValidationException
      ) {
        throw error;
      }
      throw new Error(`Error al verificar autenticación de dos factores: ${error.message}`);
    }
  }
}