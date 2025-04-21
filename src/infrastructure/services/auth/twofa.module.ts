import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TwoFactorAuthService } from './twofa.service';

@Module({
  imports: [ConfigModule],
  providers: [TwoFactorAuthService],
  exports: [TwoFactorAuthService],
})
export class TwoFactorAuthModule {}