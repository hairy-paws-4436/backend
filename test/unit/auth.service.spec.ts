import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/application/services/auth.service';
import { TwoFactorAuthService } from '../../src/infrastructure/services/auth/twofa.service';
import { UserRepository } from '../../src/infrastructure/database/mysql/repositories/user.repository';
import { UserEntity } from '../../src/core/domain/user/user.entity';
import { InvalidCredentialsException } from '../../src/core/exceptions/domain.exception';
import { UserRole } from '../../src/core/domain/user/value-objects/user-role.enum';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: UserRepository;
  let jwtService: JwtService;
  let twoFactorAuthService: TwoFactorAuthService;

  const mockUser = {
    getId: jest.fn().mockReturnValue('1'),
    getEmail: jest.fn().mockReturnValue('test@example.com'),
    getPassword: jest.fn().mockReturnValue('hashedPassword'),
    getFirstName: jest.fn().mockReturnValue('John'),
    getLastName: jest.fn().mockReturnValue('Doe'),
    getRole: jest.fn().mockReturnValue(UserRole.ADOPTER),
    isActive: jest.fn().mockReturnValue(true),
    isTwoFactorEnabled: jest.fn().mockReturnValue(false),
    getTwoFactorSecret: jest.fn().mockReturnValue(null),
    enableTwoFactor: jest.fn(),
    disableTwoFactor: jest.fn(),
    deactivate: jest.fn(),
  } as unknown as UserEntity;

  const mockOrmUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    comparePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn().mockResolvedValue(mockUser),
            findOne: jest.fn().mockResolvedValue(mockOrmUser),
            findById: jest.fn().mockResolvedValue(mockUser),
            updateTwoFactorSecret: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
        {
          provide: TwoFactorAuthService,
          useValue: {
            generateSecret: jest.fn().mockReturnValue('secret'),
            getOtpAuthUrl: jest.fn().mockReturnValue('otpAuthUrl'),
            generateQrCode: jest.fn().mockResolvedValue('qrCodeDataUrl'),
            verifyToken: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
    jwtService = module.get<JwtService>(JwtService);
    twoFactorAuthService = module.get<TwoFactorAuthService>(TwoFactorAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockOrmUser.comparePassword.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual(mockUser);
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw an error if user is inactive', async () => {
      const inactiveUser = {
        ...mockUser,
        isActive: jest.fn().mockReturnValue(false),
      } as unknown as UserEntity;

      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(inactiveUser);

      await expect(service.validateUser('test@example.com', 'password')).rejects.toThrow(
        InvalidCredentialsException,
      );
    });

    it('should throw an error with incorrect password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('test@example.com', 'wrongpassword')).rejects.toThrow(
        InvalidCredentialsException,
      );
    });

    it('should throw an error with non-existent email', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockRejectedValue(new Error());

      await expect(service.validateUser('nonexistent@example.com', 'password')).rejects.toThrow(
        InvalidCredentialsException,
      );
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT token for the user', () => {
      const result = service.generateToken(mockUser);

      expect(result).toEqual({ access_token: 'test-token' });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.getId(),
        email: mockUser.getEmail(),
        role: mockUser.getRole(),
      });
    });
  });

  describe('enableTwoFactorAuth', () => {
    it('should enable two-factor authentication for a user', async () => {
      const userWithout2FA = {
        ...mockUser,
        isTwoFactorEnabled: jest.fn().mockReturnValue(false),
      } as unknown as UserEntity;

      jest.spyOn(userRepository, 'findById').mockResolvedValue(userWithout2FA);

      const result = await service.enableTwoFactorAuth('1');

      expect(result).toEqual({
        otpAuthUrl: 'otpAuthUrl',
        qrCodeDataUrl: 'qrCodeDataUrl',
        secret: 'secret',
      });
      expect(userRepository.updateTwoFactorSecret).toHaveBeenCalledWith('1', 'secret');
    });

    it('should throw an error if user already has 2FA enabled', async () => {
      const userWith2FA = {
        ...mockUser,
        isTwoFactorEnabled: jest.fn().mockReturnValue(true),
      } as unknown as UserEntity;

      jest.spyOn(userRepository, 'findById').mockResolvedValue(userWith2FA);

      await expect(service.enableTwoFactorAuth('1')).rejects.toThrow();
    });
  });

  describe('verifyTwoFactorAuthToken', () => {
    it('should verify a valid token', async () => {
      const userWith2FA = {
        ...mockUser,
        getTwoFactorSecret: jest.fn().mockReturnValue('secret'),
        isTwoFactorEnabled: jest.fn().mockReturnValue(false),
        enableTwoFactor: jest.fn(),
      } as unknown as UserEntity;

      jest.spyOn(userRepository, 'findById').mockResolvedValue(userWith2FA);
      jest.spyOn(twoFactorAuthService, 'verifyToken').mockReturnValue(true);

      const result = await service.verifyTwoFactorAuthToken('1', 'valid-token');

      expect(result).toBe(true);
      expect(userWith2FA.enableTwoFactor).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalled();
    });

    it('should not enable 2FA if user already has it enabled', async () => {
      const userWith2FA = {
        ...mockUser,
        getTwoFactorSecret: jest.fn().mockReturnValue('secret'),
        isTwoFactorEnabled: jest.fn().mockReturnValue(true),
        enableTwoFactor: jest.fn(),
      } as unknown as UserEntity;

      jest.spyOn(userRepository, 'findById').mockResolvedValue(userWith2FA);
      jest.spyOn(twoFactorAuthService, 'verifyToken').mockReturnValue(true);

      const result = await service.verifyTwoFactorAuthToken('1', 'valid-token');

      expect(result).toBe(true);
      expect(userWith2FA.enableTwoFactor).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('should return false for an invalid token', async () => {
      const userWith2FA = {
        ...mockUser,
        getTwoFactorSecret: jest.fn().mockReturnValue('secret'),
      } as unknown as UserEntity;

      jest.spyOn(userRepository, 'findById').mockResolvedValue(userWith2FA);
      jest.spyOn(twoFactorAuthService, 'verifyToken').mockReturnValue(false);

      const result = await service.verifyTwoFactorAuthToken('1', 'invalid-token');

      expect(result).toBe(false);
    });

    it('should throw an error if user does not have 2FA setup', async () => {
      const userWithout2FA = {
        ...mockUser,
        getTwoFactorSecret: jest.fn().mockReturnValue(null),
      } as unknown as UserEntity;

      jest.spyOn(userRepository, 'findById').mockResolvedValue(userWithout2FA);

      await expect(service.verifyTwoFactorAuthToken('1', 'token')).rejects.toThrow();
    });
  });

  describe('disableTwoFactorAuth', () => {
    it('should disable two-factor authentication for a user', async () => {
      const userWith2FA = {
        ...mockUser,
        disableTwoFactor: jest.fn(),
      } as unknown as UserEntity;

      jest.spyOn(userRepository, 'findById').mockResolvedValue(userWith2FA);

      await service.disableTwoFactorAuth('1');

      expect(userWith2FA.disableTwoFactor).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith('1', userWith2FA);
    });
  });
});