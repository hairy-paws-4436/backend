import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnableTwoFactorAuthUseCase } from 'src/application/use-cases/user/enable-twofa.use-case';
import { RegisterUserUseCase } from 'src/application/use-cases/user/register-user.use-case';
import { VerifyTwoFactorAuthUseCase } from 'src/application/use-cases/user/verify-twofa.use-case';
import { AuthController } from 'src/presentation/controllers/auth.controller';
import { UserModule } from 'src/presentation/modules/user.module';
import { AwsModule } from '../../infrastructure/services/aws/aws.module';
import { JwtStrategy } from '../../infrastructure/services/auth/jwt.strategy';
import { TwoFactorAuthModule } from 'src/infrastructure/services/auth/twofa.module';

// Otras importaciones necesarias...

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
    AwsModule, // Importa el módulo que contiene S3Service
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    RegisterUserUseCase,
    EnableTwoFactorAuthUseCase,
    VerifyTwoFactorAuthUseCase,
    
    // Otros casos de uso y servicios que necesites
  ],
  exports: [
    JwtModule,
  ],
})
export class AuthModule {}