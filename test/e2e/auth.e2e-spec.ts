import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { UserRole } from '../../src/core/domain/user/value-objects/user-role.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testDatabaseConfig } from '../test-database-config';


describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDatabaseConfig),
        AppModule,
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
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication flow', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'e2e-test@example.com',
          password: 'Password123!',
          firstName: 'E2E',
          lastName: 'Test',
          phoneNumber: '987654323',
          role: UserRole.ADOPTER,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('e2e-test@example.com');
          expect(res.body.firstName).toBe('E2E');
          expect(res.body.lastName).toBe('Test');
          expect(res.body.role).toBe(UserRole.ADOPTER);

          userId = res.body.id;
        });
    });

    it('should login with registered credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'e2e-test@example.com',
          password: 'Password123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('e2e-test@example.com');

          authToken = res.body.access_token;
        });
    });

    it('should access profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(userId);
          expect(res.body.email).toBe('e2e-test@example.com');
          expect(res.body.firstName).toBe('E2E');
          expect(res.body.lastName).toBe('Test');
          expect(res.body.role).toBe(UserRole.ADOPTER);
        });
    });

    it('should prevent access to profile without token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should prevent access to role-specific endpoints with wrong role', () => {
      return request(app.getHttpServer())
        .get('/animals/owner')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('Validation and security', () => {
    it('should reject registration with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          firstName: 'Invalid',
          lastName: 'Email',
          phoneNumber: '987654324',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('El formato del correo electrónico no es válido');
        });
    });

    it('should reject registration with invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'short',
          firstName: 'Invalid',
          lastName: 'Password',
          phoneNumber: '987654324',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('debe tener al menos 8 caracteres');
        });
    });

    it('should reject registration with invalid Peruvian phone number', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'Password123!',
          firstName: 'Invalid',
          lastName: 'Phone',
          phoneNumber: '12345678',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('El número telefónico debe comenzar con 9 y tener 9 dígitos');
        });
    });

    it('should reject login with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'e2e-test@example.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });

    it('should reject login with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);
    });
  });

  describe('Two-factor authentication', () => {
    it('should enable 2FA for authenticated user', () => {
      return request(app.getHttpServer())
        .post('/auth/2fa/enable')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('qrCodeDataUrl');
        });
    });
  });
});