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
      const user = await this.userRepository.findById(dto.userId);
      
      const secret = user.getTwoFactorSecret();
      if (!secret) {
        throw new BusinessRuleValidationException(
          'User does not have two-factor authentication configured',
        );
      }

      const isValid = this.twoFactorAuthService.verifyToken(dto.token, secret);
      if (!isValid) {
        throw new BusinessRuleValidationException(
          'Invalid or expired token',
        );
      }

      if (!user.isTwoFactorEnabled()) {
        const updatedUser = user;
        updatedUser.enableTwoFactor();
        await this.userRepository.update(user.getId(), updatedUser);
      }
    } catch (error) {
      if (
        error instanceof EntityNotFoundException ||
        error instanceof BusinessRuleValidationException
      ) {
        throw error;
      }
      throw new Error(`Error verifying two-factor authentication: ${error.message}`);
    }
  }
}
