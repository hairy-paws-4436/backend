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
      const user = await this.userRepository.findById(dto.userId);

      if (user.isTwoFactorEnabled()) {
        throw new BusinessRuleValidationException(
          'Two-factor authentication is already enabled for this user',
        );
      }

      const secret = this.twoFactorAuthService.generateSecret();

      const otpAuthUrl = this.twoFactorAuthService.getOtpAuthUrl(
        user.getEmail(),
        secret,
      );

      const qrCodeDataUrl = await this.twoFactorAuthService.generateQrCode(otpAuthUrl);

      await this.userRepository.updateTwoFactorSecret(user.getId(), secret);

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
      throw new Error(`Error enabling two-factor authentication: ${error.message}`);
    }
  }
}
