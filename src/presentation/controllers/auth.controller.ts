import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';

import { RegisterUserUseCase } from '../../application/use-cases/user/register-user.use-case';
import { EnableTwoFactorAuthUseCase } from '../../application/use-cases/user/enable-twofa.use-case';
import { VerifyTwoFactorAuthUseCase } from '../../application/use-cases/user/verify-twofa.use-case';
import { UserRepository } from '../../infrastructure/database/mysql/repositories/user.repository';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../core/domain/user/value-objects/user-role.enum';
import { RolesGuard } from '../guards/roles.guard';
import { LoginDto } from '../dtos/requests/login.dto';
import { RegisterDto } from '../dtos/requests/register.dto';
import { TwoFactorAuthDto } from '../dtos/requests/twofa.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly enableTwoFactorAuthUseCase: EnableTwoFactorAuthUseCase,
    private readonly verifyTwoFactorAuthUseCase: VerifyTwoFactorAuthUseCase,
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuario registrado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos o usuario ya existe',
  })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.registerUserUseCase.execute({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phoneNumber: registerDto.phoneNumber,
      role: registerDto.role || UserRole.ADOPTER,
      address: registerDto.address,
    });

    return {
      id: user.getId(),
      email: user.getEmail(),
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      role: user.getRole(),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login exitoso',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Credenciales inválidas',
  })
  async login(@Body() loginDto: LoginDto) {
    try {
      // Buscar usuario por email
      const user = await this.userRepository.findByEmail(loginDto.email);

      // Verificar que el usuario esté activo
      if (!user.isActive()) {
        throw new UnauthorizedException('Usuario inactivo');
      }

      // Verificar contraseña (la entidad de ORM tiene el método comparePassword)
      const ormUser = await this.userRepository.findOne({
        email: loginDto.email,
      });

      const isPasswordValid = await ormUser.comparePassword(loginDto.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Verificar si el usuario tiene 2FA habilitado
      if (user.isTwoFactorEnabled()) {
        return {
          requiresTwoFactor: true,
          userId: user.getId(),
        };
      }

      // Generar token JWT
      const payload = {
        sub: user.getId(),
        email: user.getEmail(),
        role: user.getRole(),
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.getId(),
          email: user.getEmail(),
          firstName: user.getFirstName(),
          lastName: user.getLastName(),
          role: user.getRole(),
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar código de autenticación de dos factores',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verificación exitosa',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Código inválido',
  })
  async verifyTwoFactorAuth(@Body() twoFactorAuthDto: TwoFactorAuthDto) {
    try {
      // Verificar el token 2FA
      await this.verifyTwoFactorAuthUseCase.execute({
        userId: twoFactorAuthDto.userId,
        token: twoFactorAuthDto.token,
      });

      // Si la verificación es exitosa, buscar el usuario
      const user = await this.userRepository.findById(twoFactorAuthDto.userId);

      // Generar token JWT
      const payload = {
        sub: user.getId(),
        email: user.getEmail(),
        role: user.getRole(),
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.getId(),
          email: user.getEmail(),
          firstName: user.getFirstName(),
          lastName: user.getLastName(),
          role: user.getRole(),
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Código inválido o expirado');
    }
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Habilitar autenticación de dos factores' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'QR generado exitosamente',
  })
  async enableTwoFactorAuth(@User() user) {
    const result = await this.enableTwoFactorAuthUseCase.execute({
      userId: user.id,
    });

    return {
      qrCodeDataUrl: result.qrCodeDataUrl,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil obtenido exitosamente',
  })
  async getProfile(@User() user) {
    const userEntity = await this.userRepository.findById(user.id);

    return {
      id: userEntity.getId(),
      email: userEntity.getEmail(),
      firstName: userEntity.getFirstName(),
      lastName: userEntity.getLastName(),
      phoneNumber: userEntity.getPhoneNumber(),
      role: userEntity.getRole(),
      address: userEntity.getAddress(),
      profileImageUrl: userEntity.getProfileImageUrl(),
      twoFactorEnabled: userEntity.isTwoFactorEnabled(),
      verified: userEntity.isVerified(),
    };
  }
}
