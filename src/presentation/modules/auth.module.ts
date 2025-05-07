import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GetTwoFactorStatusUseCase } from '../../application/use-cases/auth/get-twofa-status.use-case';
import { EnableTwoFactorAuthUseCase } from '../../application/use-cases/user/enable-twofa.use-case';
import { VerifyTwoFactorAuthUseCase } from '../../application/use-cases/user/verify-twofa.use-case';
import { AuthController } from '../controllers/auth.controller';
import { JwtStrategy } from '../../infrastructure/services/auth/jwt.strategy';
import { RegisterUserUseCase } from '../../application/use-cases/user/register-user.use-case';
import { UserModule } from './user.module';
import { TwoFactorAuthModule } from '../../infrastructure/services/auth/twofa.module';
import { AwsModule } from '../../infrastructure/services/aws/aws.module';
import { EmailModule } from '../../infrastructure/services/email/email.module';


@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION'),
        },
      }),
    }),
    UserModule,
    TwoFactorAuthModule,
    AwsModule,
    EmailModule
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    RegisterUserUseCase,
    EnableTwoFactorAuthUseCase,
    VerifyTwoFactorAuthUseCase,
    GetTwoFactorStatusUseCase
  ],
  exports: [
    JwtModule,
  ],
})
export class AuthModule {}