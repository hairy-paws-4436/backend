import { Test, TestingModule } from '@nestjs/testing';
import { OngService } from '../../src/application/services/ong.service';
import { OngRepository } from '../../src/infrastructure/database/mysql/repositories/ong.repository';
import { S3Service } from '../../src/infrastructure/services/aws/s3.service';
import { UserRepository } from '../../src/infrastructure/database/mysql/repositories/user.repository';
import { UserRole } from '../../src/core/domain/user/value-objects/user-role.enum';
import { DuplicateEntityException, EntityNotFoundException } from '../../src/core/exceptions/domain.exception';
import { UserEntity } from '../../src/core/domain/user/user.entity';

describe('OngService', () => {
  let service: OngService;
  let ongRepository: OngRepository;
  let userRepository: UserRepository;
  let s3Service: S3Service;

  const mockUser = {
    getId: jest.fn().mockReturnValue('user1'),
    getEmail: jest.fn().mockReturnValue('user@example.com'),
    getFirstName: jest.fn().mockReturnValue('John'),
    getLastName: jest.fn().mockReturnValue('Doe'),
    getRole: jest.fn().mockReturnValue(UserRole.ADOPTER),
    changeRole: jest.fn(),
    isActive: jest.fn().mockReturnValue(true),
  } as unknown as UserEntity;

  const mockOng = {
    id: 'ong1',
    userId: 'user1',
    name: 'Test ONG',
    ruc: '12345678901',
    description: 'Test description',
    address: 'Test address',
    phone: '987654321',
    email: 'ong@example.com',
    logoUrl: 'https://example.com/logo.jpg',
    verified: false,
    legalDocuments: JSON.stringify(['https://example.com/doc1.pdf']),
  };

  const mockLogo = {
    fieldname: 'logo',
    originalname: 'logo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    size: 4,
    destination: '',
    filename: '',
    path: '',
    stream: null
  } as Express.Multer.File;

  const mockLegalDoc = {
    fieldname: 'legalDocuments',
    originalname: 'doc.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('test'),
    size: 4,
    destination: '',
    filename: '',
    path: '',
    stream: null
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OngService,
        {
          provide: OngRepository,
          useValue: {
            exists: jest.fn().mockResolvedValue(false),
            create: jest.fn().mockResolvedValue(mockOng),
            findAll: jest.fn().mockResolvedValue([mockOng]),
            findById: jest.fn().mockResolvedValue(mockOng),
            findByUserId: jest.fn().mockResolvedValue(mockOng),
            update: jest.fn().mockResolvedValue(mockOng),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: S3Service,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue('https://example.com/logo.jpg'),
            deleteFile: jest.fn().mockResolvedValue(undefined),
            uploadMultipleFiles: jest.fn().mockResolvedValue(['https://example.com/doc1.pdf']),
          },
        },
      ],
    }).compile();

    service = module.get<OngService>(OngService);
    ongRepository = module.get<OngRepository>(OngRepository);
    userRepository = module.get<UserRepository>(UserRepository);
    s3Service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOng', () => {
    it('should create a new ONG', async () => {
      const createOngDto = {
        userId: 'user1',
        name: 'Test ONG',
        ruc: '12345678901',
        description: 'Test description',
        address: 'Test address',
        phone: '987654321',
        email: 'ong@example.com',
        website: 'https://example.com',
        mission: 'Test mission',
        vision: 'Test vision',
        bankAccount: '123456789',
        bankName: 'Test Bank',
        interbankAccount: '123456789012345',
        logo: mockLogo,
        legalDocuments: [mockLegalDoc],
      };

      const result = await service.createOng(createOngDto);

      expect(ongRepository.exists).toHaveBeenCalledWith({ ruc: '12345678901' });
      expect(userRepository.findById).toHaveBeenCalledWith('user1');
      expect(mockUser.changeRole).toHaveBeenCalledWith(UserRole.ONG);
      expect(userRepository.update).toHaveBeenCalledWith('user1', mockUser);
      expect(s3Service.uploadFile).toHaveBeenCalledWith(
        mockLogo.buffer,
        'ongs',
        mockLogo.originalname,
      );
      expect(ongRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user1',
        name: 'Test ONG',
        ruc: '12345678901',
        description: 'Test description',
        logoUrl: 'https://example.com/logo.jpg',
        legalDocuments: expect.any(String),
      }));
      expect(result).toEqual(mockOng);
    });

    it('should throw an error if RUC already exists', async () => {
      jest.spyOn(ongRepository, 'exists').mockResolvedValue(true);

      const createOngDto = {
        userId: 'user1',
        name: 'Test ONG',
        ruc: '12345678901',
        description: 'Test description',
        address: 'Test address',
        phone: '987654321',
        email: 'ong@example.com',
        legalDocuments: [mockLegalDoc],
      };

      await expect(service.createOng(createOngDto)).rejects.toThrow(
        DuplicateEntityException,
      );
      expect(userRepository.update).not.toHaveBeenCalled();
      expect(ongRepository.create).not.toHaveBeenCalled();
    });

    it('should not change role if user is already an ONG', async () => {
      const ongUser = {
        getId: jest.fn().mockReturnValue('user1'),
        getEmail: jest.fn().mockReturnValue('user@example.com'),
        getFirstName: jest.fn().mockReturnValue('John'),
        getLastName: jest.fn().mockReturnValue('Doe'),
        getRole: jest.fn().mockReturnValue(UserRole.ONG),
        changeRole: jest.fn(),
        isActive: jest.fn().mockReturnValue(true),
      } as unknown as UserEntity;

      jest.spyOn(userRepository, 'findById').mockResolvedValue(ongUser);

      const createOngDto = {
        userId: 'user1',
        name: 'Test ONG',
        ruc: '12345678901',
        description: 'Test description',
        address: 'Test address',
        phone: '987654321',
        email: 'ong@example.com',
        legalDocuments: [mockLegalDoc],
      };

      await service.createOng(createOngDto);

      expect(ongUser.changeRole).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
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

  describe('getOngById', () => {
    it('should return an ONG by id', async () => {
      const result = await service.getOngById('ong1');
      expect(result).toEqual(mockOng);
      expect(ongRepository.findById).toHaveBeenCalledWith('ong1');
    });
  });

  describe('getOngByUserId', () => {
    it('should return an ONG by user id', async () => {
      const result = await service.getOngByUserId('user1');
      expect(result).toEqual(mockOng);
      expect(ongRepository.findByUserId).toHaveBeenCalledWith('user1');
    });

    it('should throw an error if ONG is not found', async () => {
      jest.spyOn(ongRepository, 'findByUserId').mockImplementation(() => {
        return Promise.reject(new EntityNotFoundException('ONG for the user'));
      });

      await expect(service.getOngByUserId('nonexistent')).rejects.toThrow(
        EntityNotFoundException,
      );
    });
  });

  describe('updateOng', () => {
    it('should update an ONG', async () => {
      const updateOngDto = {
        name: 'Updated ONG',
        description: 'Updated description',
        logo: mockLogo,
      };

      const result = await service.updateOng('ong1', updateOngDto);

      expect(ongRepository.findById).toHaveBeenCalledWith('ong1');
      expect(s3Service.uploadFile).toHaveBeenCalledWith(
        mockLogo.buffer,
        'ongs',
        mockLogo.originalname,
      );
      expect(s3Service.deleteFile).toHaveBeenCalledWith('https://example.com/logo.jpg');
      expect(ongRepository.update).toHaveBeenCalledWith('ong1', {
        name: 'Updated ONG',
        description: 'Updated description',
        logoUrl: 'https://example.com/logo.jpg',
      });
      expect(result).toEqual(mockOng);
    });

    it('should update an ONG without changing logo', async () => {
      const updateOngDto = {
        name: 'Updated ONG',
        description: 'Updated description',
      };

      const result = await service.updateOng('ong1', updateOngDto);

      expect(ongRepository.findById).toHaveBeenCalledWith('ong1');
      expect(s3Service.uploadFile).not.toHaveBeenCalled();
      expect(s3Service.deleteFile).not.toHaveBeenCalled();
      expect(ongRepository.update).toHaveBeenCalledWith('ong1', updateOngDto);
      expect(result).toEqual(mockOng);
    });
  });

  describe('hasOng', () => {
    it('should return true if user has an ONG', async () => {
      const result = await service.hasOng('user1');
      expect(result).toBe(true);
      expect(ongRepository.findByUserId).toHaveBeenCalledWith('user1');
    });

    it('should return false if user does not have an ONG', async () => {
      jest.spyOn(ongRepository, 'findByUserId').mockImplementation(() => {
        return Promise.reject(new EntityNotFoundException('ONG for the user'));
      });

      const result = await service.hasOng('user1');
      expect(result).toBe(false);
    });

    it('should rethrow unexpected errors', async () => {
      jest.spyOn(ongRepository, 'findByUserId').mockImplementation(() => {
        return Promise.reject(new Error('Unexpected error'));
      });

      await expect(service.hasOng('user1')).rejects.toThrow('Unexpected error');
    });
  });
});
