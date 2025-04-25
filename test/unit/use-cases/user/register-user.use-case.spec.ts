import { Test } from '@nestjs/testing';
import { RegisterUserUseCase } from '../../../../../src/application/use-cases/user/register-user.use-case';
import { UserRepository } from '../../../../../src/infrastructure/database/mysql/repositories/user.repository';
import { S3Service } from '../../../../../src/infrastructure/services/aws/s3.service';
import { UserRole } from '../../../../../src/core/domain/user/value-objects/user-role.enum';
import { UserEntity } from '../../../../../src/core/domain/user/user.entity';
import { DuplicateEntityException } from '../../../../../src/core/exceptions/domain.exception';

// Mock de UserRepository
class MockUserRepository {
  private users: UserEntity[] = [];

  async findByEmail(email: string): Promise<UserEntity> {
    const user = this.users.find(u => u.getEmail() === email.toLowerCase());
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async exists(filters: any): Promise<boolean> {
    if (filters.email) {
      return this.users.some(u => u.getEmail() === filters.email.toLowerCase());
    }
    if (filters.phoneNumber) {
      return this.users.some(u => u.getPhoneNumber() === filters.phoneNumber);
    }
    return false;
  }

  async create(entity: UserEntity): Promise<UserEntity> {
    this.users.push(entity);
    return entity;
  }
}

// Mock de S3Service
class MockS3Service {
  async uploadFile(buffer: any, folder: string, originalName: string): Promise<string> {
    return `https://example-bucket.s3.amazonaws.com/${folder}/${originalName}`;
  }
}

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let userRepository: MockUserRepository;
  let s3Service: MockS3Service;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        {
          provide: UserRepository,
          useClass: MockUserRepository,
        },
        {
          provide: S3Service,
          useClass: MockS3Service,
        },
      ],
    }).compile();

    useCase = moduleRef.get<RegisterUserUseCase>(RegisterUserUseCase);
    userRepository = moduleRef.get(UserRepository);
    s3Service = moduleRef.get(S3Service);

    // Spy on repository methods
    jest.spyOn(userRepository, 'exists');
    jest.spyOn(userRepository, 'create');
    jest.spyOn(s3Service, 'uploadFile');
  });

  it('should register a new user successfully', async () => {
    // Arrange
    const registerDto = {
      email: 'new-user@example.com',
      password: 'Password123',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '987654321',
      role: UserRole.ADOPTER,
    };

    // Act
    const result = await useCase.execute(registerDto);

    // Assert
    expect(userRepository.exists).toHaveBeenCalledTimes(2); // Check for email and phone
    expect(userRepository.create).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result.getEmail()).toBe(registerDto.email.toLowerCase());
    expect(result.getFirstName()).toBe(registerDto.firstName);
    expect(result.getLastName()).toBe(registerDto.lastName);
    expect(result.getPhoneNumber()).toBe(registerDto.phoneNumber);
    expect(result.getRole()).toBe(registerDto.role);
  });

  it('should upload profile image when provided', async () => {
    // Arrange
    const registerDto = {
      email: 'user-with-image@example.com',
      password: 'Password123',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '987654322',
      role: UserRole.ADOPTER,
      profileImage: {
        buffer: Buffer.from('mock-image-data'),
        originalname: 'profile.jpg',
      } as Express.Multer.File,
    };

    // Act
    const result = await useCase.execute(registerDto);

    // Assert
    expect(s3Service.uploadFile).toHaveBeenCalledWith(
      registerDto.profileImage.buffer,
      'profiles',
      registerDto.profileImage.originalname,
    );
    expect(result.getProfileImageUrl()).toBeDefined();
  });

  it('should throw error when email already exists', async () => {
    // Arrange
    const existingEmail = 'existing@example.com';
    
    // Register first user
    await useCase.execute({
      email: existingEmail,
      password: 'Password123',
      firstName: 'Existing',
      lastName: 'User',
      phoneNumber: '987654323',
      role: UserRole.ADOPTER,
    });

    // Try to register with same email
    const registerDto = {
      email: existingEmail, // Same email
      password: 'Password123',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '987654324', // Different phone
      role: UserRole.ADOPTER,
    };

    // Act & Assert
    await expect(useCase.execute(registerDto)).rejects.toThrow(DuplicateEntityException);
    expect(userRepository.exists).toHaveBeenCalledWith({ email: existingEmail.toLowerCase() });
  });

  it('should throw error when phone number already exists', async () => {
    // Arrange
    const existingPhone = '987654325';
    
    // Register first user
    await useCase.execute({
      email: 'user1@example.com',
      password: 'Password123',
      firstName: 'User',
      lastName: 'One',
      phoneNumber: existingPhone,
      role: UserRole.ADOPTER,
    });

    // Try to register with same phone
    const registerDto = {
      email: 'user2@example.com', // Different email
      password: 'Password123',
      firstName: 'User',
      lastName: 'Two',
      phoneNumber: existingPhone, // Same phone
      role: UserRole.ADOPTER,
    };

    // Act & Assert
    await expect(useCase.execute(registerDto)).rejects.toThrow(DuplicateEntityException);
    expect(userRepository.exists).toHaveBeenCalledWith({ phoneNumber: existingPhone });
  });

  it('should hash password before saving', async () => {
    // Arrange
    const registerDto = {
      email: 'password-test@example.com',
      password: 'Password123',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '987654326',
      role: UserRole.ADOPTER,
    };

    // Act
    const result = await useCase.execute(registerDto);

    // Assert
    // The password should be hashed - not the original password
    expect(result.getPassword()).not.toBe(registerDto.password);
    // Bcrypt hashes start with $2b$
    expect(result.getPassword()).toMatch(/^\$2[aby]\$/);
  });
});