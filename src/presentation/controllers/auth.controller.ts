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

@ApiTags('Authentication')
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
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data or user already exists',
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
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successful login',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.userRepository.findByEmail(loginDto.email);

      if (!user.isActive()) {
        throw new UnauthorizedException('Inactive user');
      }

      const ormUser = await this.userRepository.findOne({
        email: loginDto.email,
      });

      const isPasswordValid = await ormUser.comparePassword(loginDto.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.isTwoFactorEnabled()) {
        return {
          requiresTwoFactor: true,
          userId: user.getId(),
        };
      }

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
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify two-factor authentication code',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successful verification',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid code',
  })
  async verifyTwoFactorAuth(@Body() twoFactorAuthDto: TwoFactorAuthDto) {
    try {
      await this.verifyTwoFactorAuthUseCase.execute({
        userId: twoFactorAuthDto.userId,
        token: twoFactorAuthDto.token,
      });

      const user = await this.userRepository.findById(twoFactorAuthDto.userId);

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
      throw new UnauthorizedException('Invalid or expired code');
    }
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'QR code generated successfully',
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
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully',
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
