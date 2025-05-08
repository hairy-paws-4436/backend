import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../src/core/domain/user/value-objects/user-role.enum';
import { UserEntity } from '../../src/core/domain/user/user.entity';
import { S3Service } from '../../src/infrastructure/services/aws/s3.service';
import { UserRepository } from '../../src/infrastructure/database/mysql/repositories/user.repository';
import { UserService } from '../../src/application/services/user.service';
import { DuplicateEntityException } from '../../src/core/exceptions/domain.exception';
import { UserStatus } from '../../src/core/domain/user/value-objects/user-status';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let userRepository: UserRepository;
  let s3Service: S3Service;

  const mockUser = new UserEntity(
    '1',
    'test@example.com',
    'hashedPassword',
    'John',
    'Doe',
    '987654321',
    UserRole.ADOPTER,
    UserStatus.ACTIVE,
    true,
    'Test Address',
    'http://example.com/profile.jpg',
    undefined,
    false,
    '12345678'
  );

  const mockProfileImage: Express.Multer.File = {
    fieldname: 'profileImage',
    originalname: 'profile.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    size: 4,
    destination: '',
    filename: '',
    path: '',
    stream: null
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn().mockResolvedValue(mockUser),
            findOne: jest.fn().mockResolvedValue(null),
            update: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: S3Service,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue('http://example.com/new-profile.jpg'),
            deleteFile: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    s3Service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const result = await service.getUserById('1');
      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateProfileSpy = jest.spyOn(mockUser, 'updateProfile');
      const updateProfileImageSpy = jest.spyOn(mockUser, 'updateProfileImage');

      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '987654321',
        address: 'New Address',
        profileImage: mockProfileImage,
      };

      const result = await service.updateProfile('1', updateData);

      expect(userRepository.findById).toHaveBeenCalledWith('1');
      expect(updateProfileSpy).toHaveBeenCalledWith(
        'Jane',
        'Smith',
        '987654321',
        'New Address',
      );
      expect(s3Service.uploadFile).toHaveBeenCalledWith(
        updateData.profileImage.buffer,
        'profiles',
        updateData.profileImage.originalname,
      );
      expect(s3Service.deleteFile).toHaveBeenCalledWith('http://example.com/profile.jpg');
      expect(updateProfileImageSpy).toHaveBeenCalledWith('http://example.com/new-profile.jpg');
      expect(userRepository.update).toHaveBeenCalledWith('1', mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw error if phone number is already in use', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        getId: () => '2',
      } as any);

      const updateData = {
        phoneNumber: '987654321',
      };

      await expect(service.updateProfile('1', updateData)).rejects.toThrow(
        DuplicateEntityException,
      );
    });

    it('should not throw error if phone number belongs to same user', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        getId: () => '1',
      } as any);

      const updateData = {
        phoneNumber: '987654321',
      };

      await expect(service.updateProfile('1', updateData)).resolves.not.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      const updatePasswordSpy = jest.spyOn(mockUser, 'updatePassword');

      const changePasswordDto = {
        oldPassword: 'oldPassword',
        newPassword: 'newPassword',
      };

      await service.changePassword('1', changePasswordDto);

      expect(userRepository.findById).toHaveBeenCalledWith('1');
      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword', 'hashedPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(updatePasswordSpy).toHaveBeenCalledWith('newHashedPassword');
      expect(userRepository.update).toHaveBeenCalledWith('1', mockUser);
    });

    it('should throw error with incorrect current password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const changePasswordDto = {
        oldPassword: 'wrongPassword',
        newPassword: 'newPassword',
      };

      await expect(service.changePassword('1', changePasswordDto)).rejects.toThrow(
        'Incorrect current password',
      );
    });
  });

  describe('deactivateAccount', () => {
    it('should deactivate a user account', async () => {
      const deactivateSpy = jest.spyOn(mockUser, 'deactivate');

      await service.deactivateAccount('1');

      expect(userRepository.findById).toHaveBeenCalledWith('1');
      expect(deactivateSpy).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith('1', mockUser);
    });
  });
});