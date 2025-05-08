import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import { TwoFactorAuthService } from '../../src/infrastructure/services/auth/twofa.service';
import { Logger } from '@nestjs/common';

jest.mock('otplib', () => ({
  authenticator: {
    options: {},
    generateSecret: jest.fn().mockReturnValue('test-secret'),
    keyuri: jest.fn().mockReturnValue('otpauth://test'),
    verify: jest.fn().mockImplementation((params) => {
      return params.token === 'valid-token';
    }),
    generate: jest.fn().mockReturnValue('generated-token'),
  },
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,testqrcode'),
}));

describe('TwoFactorAuthService', () => {
  let service: TwoFactorAuthService;

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorAuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'APP_NAME') return 'HairyPaws Test';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TwoFactorAuthService>(TwoFactorAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSecret', () => {
    it('should generate a secret', () => {
      const result = service.generateSecret();
      expect(result).toEqual('test-secret');
      expect(authenticator.generateSecret).toHaveBeenCalled();
    });
  });

  describe('getOtpAuthUrl', () => {
    it('should generate an OTP auth URL', () => {
      const result = service.getOtpAuthUrl('test@example.com', 'test-secret');
      expect(result).toEqual('otpauth://test');
      expect(authenticator.keyuri).toHaveBeenCalledWith(
        'test@example.com',
        'HairyPaws Test',
        'test-secret',
      );
    });
  });

  /*describe('generateQrCode', () => {
    it('should generate a QR code data URL', async () => {
      const result = await service.generateQrCode('otpauth://test');
      expect(result).toEqual('data:image/png;base64,testqrcode');
      expect(toDataURL).toHaveBeenCalledWith('otpauth://test');
    });

    it('should throw an error if QR code generation fails', async () => {
      jest.spyOn(toDataURL as jest.Mock, 'mockRejectedValue').mockImplementation(() => {
        throw new Error('QR code generation failed');
      });

      await expect(service.generateQrCode('otpauth://test')).rejects.toThrow();
    });
  });*/

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const result = service.verifyToken('valid-token', 'test-secret');
      expect(result).toBe(true);
      expect(authenticator.verify).toHaveBeenCalledWith({
        token: 'valid-token',
        secret: 'test-secret',
      });
    });

    it('should return false for an invalid token', () => {
      const result = service.verifyToken('invalid-token', 'test-secret');
      expect(result).toBe(false);
    });

    it('should return false if verification throws an error', () => {
      jest.spyOn(authenticator, 'verify').mockImplementation(() => {
        throw new Error('Verification error');
      });

      const result = service.verifyToken('valid-token', 'test-secret');
      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a token from a secret', () => {
      const result = service.generateToken('test-secret');
      expect(result).toEqual('generated-token');
      expect(authenticator.generate).toHaveBeenCalledWith('test-secret');
    });
  });
});