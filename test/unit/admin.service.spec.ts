// test/unit/admin.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../../src/application/services/admin.service';
import { UserRepository } from '../../src/infrastructure/database/mysql/repositories/user.repository';
import { OngRepository, } from '../../src/infrastructure/database/mysql/repositories/ong.repository';
import { NotificationService } from '../../src/infrastructure/services/notification/notification.service';
import { UserEntity } from '../../src/core/domain/user/user.entity';
import { UserRole } from '../../src/core/domain/user/value-objects/user-role.enum';
import { UserStatus } from '../../src/core/domain/user/value-objects/user-status';
import { NotificationType } from '../../src/core/domain/notification/value-objects/notification-type.enum';


describe('AdminService', () => {
  let service: AdminService;
  let userRepository: UserRepository;
  let ongRepository: OngRepository;
  let notificationService: NotificationService;

  const mockUser = new UserEntity(
    '1',
    'test@example.com',
    'hashedPassword',
    'John',
    'Doe',
    '987654321',
    UserRole.ADOPTER,
    UserStatus.ACTIVE,
    false,
    'Test Address',
    undefined,
    undefined,
    false,
    '12345678'
  );

  const mockOng = {
    id: '1',
    userId: '1',
    name: 'Test ONG',
    ruc: '12345678901',
    verified: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: UserRepository,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockUser]),
            findById: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUser),
            delete: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: OngRepository,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockOng]),
            findById: jest.fn().mockResolvedValue(mockOng),
            updateVerificationStatus: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            create: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepository = module.get<UserRepository>(UserRepository);
    ongRepository = module.get<OngRepository>(OngRepository);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const result = await service.getAllUsers();
      expect(result).toEqual([mockUser]);
      expect(userRepository.findAll).toHaveBeenCalledWith({});
    });

    it('should filter users by role', async () => {
      await service.getAllUsers(UserRole.ADMIN);
      expect(userRepository.findAll).toHaveBeenCalledWith({ role: UserRole.ADMIN });
    });

    it('should filter users by verification status', async () => {
      await service.getAllUsers(undefined, true);
      expect(userRepository.findAll).toHaveBeenCalledWith({ verified: true });
    });

    it('should filter users by status', async () => {
      await service.getAllUsers(undefined, undefined, UserStatus.ACTIVE);
      expect(userRepository.findAll).toHaveBeenCalledWith({ status: UserStatus.ACTIVE });
    });
  });

  describe('getAllOngs', () => {
    it('should return all ONGs', async () => {
      const result = await service.getAllOngs();
      expect(result).toEqual([mockOng]);
      expect(ongRepository.findAll).toHaveBeenCalledWith({});
    });

    it('should filter ONGs by verification status', async () => {
      await service.getAllOngs(true);
      expect(ongRepository.findAll).toHaveBeenCalledWith({ verified: true });
    });
  });

  describe('verifyUser', () => {
    it('should verify a user', async () => {
      // Prepare a spy for the verify method
      const verifySpy = jest.spyOn(mockUser, 'verify');

      await service.verifyUser('1', 'Verification note');

      expect(userRepository.findById).toHaveBeenCalledWith('1');
      expect(verifySpy).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith('1', mockUser);
      expect(notificationService.create).toHaveBeenCalledWith({
        userId: '1',
        type: NotificationType.ACCOUNT_VERIFIED,
        title: 'Account Verified',
        message: 'Your account has been verified by an administrator.',
      });
    });
  });

  describe('verifyOng', () => {
    it('should verify an ONG', async () => {
      // Prepare a spy for the verify method
      const verifySpy = jest.spyOn(mockUser, 'verify');

      await service.verifyOng('1', 'Verification note');

      expect(ongRepository.updateVerificationStatus).toHaveBeenCalledWith('1', true);
      expect(ongRepository.findById).toHaveBeenCalledWith('1');
      expect(userRepository.findById).toHaveBeenCalledWith('1');
      expect(verifySpy).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith('1', mockUser);
      expect(notificationService.create).toHaveBeenCalledWith({
        userId: '1',
        type: NotificationType.ACCOUNT_VERIFIED,
        title: 'Organization Verified',
        message: 'Your organization has been verified by an administrator.',
      });
    });
  });

  describe('changeUserStatus', () => {
    it('should activate a user', async () => {
      // Prepare spies for the activate method
      const activateSpy = jest.spyOn(mockUser, 'activate');

      await service.changeUserStatus('1', UserStatus.ACTIVE);

      expect(userRepository.findById).toHaveBeenCalledWith('1');
      expect(activateSpy).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith('1', mockUser);
    });

    it('should deactivate a user', async () => {
      // Prepare spies for the deactivate method
      const deactivateSpy = jest.spyOn(mockUser, 'deactivate');

      await service.changeUserStatus('1', UserStatus.INACTIVE);

      expect(userRepository.findById).toHaveBeenCalledWith('1');
      expect(deactivateSpy).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith('1', mockUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      await service.deleteUser('1');
      expect(userRepository.delete).toHaveBeenCalledWith('1');
    });
  });
});