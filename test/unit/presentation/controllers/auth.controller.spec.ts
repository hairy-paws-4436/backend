import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from '../../../../src/presentation/controllers/auth.controller';
import { RegisterUserUseCase } from '../../../../src/application/use-cases/user/register-user.use-case';
import { EnableTwoFactorAuthUseCase } from '../../../../src/application/use-cases/user/enable-twofa.use-case';
import { VerifyTwoFactorAuthUseCase } from '../../../../src/application/use-cases/user/verify-twofa.use-case';
import { UserRepository } from '../../../../src/infrastructure/database/mysql/repositories/user.repository';
import { UserEntity } from '../../../../src/core/domain/user/user.entity';
import { UserRole } from '../../../../src/core/domain/user/value-objects/user-role.enum';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../../../src/infrastructure/services/auth/jwt.strategy';
import { TwoFactorAuthService } from '../../../../src/infrastructure/services/auth/twofa.service';
import { S3Service } from '../../../../src/infrastructure/services/aws/s3.service';
import { UserStatus } from 'src/core/domain/user/value-objects/user-status';

// Mock de UserRepository
class MockUserRepository {
  private users: UserEntity[] = [];

  constructor() {
    // Crear un usuario de prueba
    this.users.push(new UserEntity(
      'test-user-id',
      'test@example.com',
      '$2b$10$Etz0Rq6Oo21OWP7S0YXfNelXJJjgXimvbUjw6O1YoRH7RNQ3UD63C', // hashed 'Password123'
      'Test',
      'User',
      '987654321',
      UserRole.ADOPTER,
      UserStatus.ACTIVE,
      true,
    ));
  }

  async findAll(): Promise<UserEntity[]> {
    return this.users;
  }

  async findById(id: string): Promise<UserEntity> {
    const user = this.users.find(u => u.getId() === id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async findOne(filters: any): Promise<UserEntity> {
    if (filters.email) {
      const user = this.users.find(u => u.getEmail() === filters.email);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }
    throw new Error('User not found');
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const user = this.users.find(u => u.getEmail() === email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async exists(filters: any): Promise<boolean> {
    if (filters.email) {
      return this.users.some(u => u.getEmail() === filters.email);
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

  // Método necesario para la autenticación en los tests
  async findOneForAuth(filters: any): Promise<any> {
    if (filters.email) {
      const user = this.users.find(u => u.getEmail() === filters.email);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Crear un mock que tenga el método comparePassword
      return {
        id: user.getId(),
        email: user.getEmail(),
        password: user.getPassword(),
        firstName: user.getFirstName(),
        lastName: user.getLastName(),
        phoneNumber: user.getPhoneNumber(),
        role: user.getRole(),
        status: user.getStatus(),
        verified: user.isVerified(),
        twoFactorEnabled: user.isTwoFactorEnabled(),
        comparePassword: async (password: string) => {
          // En un test real, usaríamos bcrypt.compare
          // Para el test, simplemente compararemos con la contraseña conocida
          return password === 'Password123';
        }
      };
    }
    throw new Error('User not found');
  }

  async updateTwoFactorSecret(userId: string, secret: string): Promise<void> {
    const user = await this.findById(userId);
    user.setTwoFactorSecret(secret);
  }

  async verifyUser(userId: string): Promise<void> {
    const user = await this.findById(userId);
    user.verify();
  }

  async update(id: string, entity: Partial<UserEntity>): Promise<UserEntity> {
    const index = this.users.findIndex(u => u.getId() === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    
    // Actualizar propiedades
    if (entity.isTwoFactorEnabled && entity.isTwoFactorEnabled()) {
      this.users[index].enableTwoFactor();
    }
    
    return this.users[index];
  }
}

// Mock de TwoFactorAuthService
class MockTwoFactorAuthService {
  generateSecret(): string {
    return 'mock-secret';
  }

  getOtpAuthUrl(email: string, secret: string): string {
    return `otpauth://totp/HairyPaws:${email}?secret=${secret}&issuer=HairyPaws`;
  }

  async generateQrCode(otpAuthUrl: string): Promise<string> {
    return 'data:image/png;base64,mock-qr-code';
  }

  verifyToken(token: string, secret: string): boolean {
    // Para el test, simplificamos y validamos un token específico
    return token === '123456';
  }
}

// Mock de S3Service
class MockS3Service {
  async uploadFile(buffer: any, folder: string, originalName: string): Promise<string> {
    return `https://example-bucket.s3.amazonaws.com/${folder}/${originalName}`;
  }
}

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-secret-key',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        RegisterUserUseCase,
        EnableTwoFactorAuthUseCase,
        VerifyTwoFactorAuthUseCase,
        JwtStrategy,
        {
          provide: UserRepository,
          useClass: MockUserRepository,
        },
        {
          provide: TwoFactorAuthService,
          useClass: MockTwoFactorAuthService,
        },
        {
          provide: S3Service,
          useClass: MockS3Service,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret-key';
              if (key === 'APP_NAME') return 'HairyPaws';
              return null;
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    jwtService = moduleFixture.get<JwtService>(JwtService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'new-user@example.com',
          password: 'Password123',
          firstName: 'New',
          lastName: 'User',
          phoneNumber: '987654322',
          role: UserRole.ADOPTER,
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('new-user@example.com');
          expect(res.body.firstName).toBe('New');
          expect(res.body.lastName).toBe('User');
          expect(res.body.role).toBe(UserRole.ADOPTER);
        });
    });

    it('should return 400 when registering with invalid data', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email', // Invalid email format
          password: 'short', // Too short password
          firstName: '', // Empty name
          lastName: 'User',
          phoneNumber: '12345678', // Invalid phone format for Peru
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should log in successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        })
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('should return 401 with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });
  });

  describe('POST /auth/2fa/enable', () => {
    it('should enable 2FA for authenticated user', async () => {
      // Generate a token for authentication
      const token = jwtService.sign({
        sub: 'test-user-id',
        email: 'test@example.com',
        role: UserRole.ADOPTER,
      });

      return request(app.getHttpServer())
        .post('/auth/2fa/enable')
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('qrCodeDataUrl');
          expect(res.body.qrCodeDataUrl).toContain('data:image/png;base64');
        });
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .post('/auth/2fa/enable')
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return profile for authenticated user', async () => {
      // Generate a token for authentication
      const token = jwtService.sign({
        sub: 'test-user-id',
        email: 'test@example.com',
        role: UserRole.ADOPTER,
      });

      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('test@example.com');
          expect(res.body.firstName).toBe('Test');
          expect(res.body.lastName).toBe('User');
          expect(res.body.role).toBe(UserRole.ADOPTER);
        });
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });
  });
});