import { Module } from '@nestjs/common';
import { AuthController } from 'src/presentation/controllers/auth.controller';
import { AuthService } from 'src/application/services/auth.service';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/presentation/modules/user.module';
import { EnableTwoFactorAuthUseCase } from 'src/application/use-cases/user/enable-twofa.use-case';
import { RegisterUserUseCase } from 'src/application/use-cases/user/register-user.use-case';
import { VerifyTwoFactorAuthUseCase } from 'src/application/use-cases/user/verify-twofa.use-case';
import { UserRepository } from 'src/infrastructure/database/mysql/repositories/user.repository';
import { TwoFactorAuthService } from './twofa.service';
 // Asegúrate de tener este import

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      secret: 'your-jwt-secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RegisterUserUseCase,
    EnableTwoFactorAuthUseCase,  // Asegúrate de que esté incluido aquí
    VerifyTwoFactorAuthUseCase,
    UserRepository,
    JwtService,
    TwoFactorAuthService,
  ],
  exports: [AuthService, JwtService],
})
export class AuthModule {}
