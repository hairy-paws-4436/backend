import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestSetup } from '../utils/setup';
import { UserRole } from '../../src/core/domain/user/value-objects/user-role.enum';
import { UserStatus } from '../../src/core/domain/user/value-objects/user-status';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../src/infrastructure/database/mysql/repositories/user.repository';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let testSetup: TestSetup;
  let userRepository: UserRepository;

  beforeAll(async () => {
    testSetup = new TestSetup();
    await testSetup.initialize();
    app = testSetup.app;
    userRepository = app.get<UserRepository>(UserRepository);
  });

  afterAll(async () => {
    await testSetup.cleanup();
  });

  beforeEach(async () => {
    await testSetup.clearDatabase();
  });

  describe('Authentication Flow', () => {
    it('should register, login, and access protected resources', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '987654321',
        address: 'Test Address',
        dni: '12345678'
      };

      const registerResponse = await request(testSetup.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('id');
      expect(registerResponse.body.email).toBe(userData.email);
      expect(registerResponse.body.role).toBe(UserRole.ADOPTER);

      const loginResponse = await request(testSetup.getHttpServer())
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('access_token');
      const token = loginResponse.body.access_token;

      const profileResponse = await request(testSetup.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.email).toBe(userData.email);
      expect(profileResponse.body.firstName).toBe(userData.firstName);
      expect(profileResponse.body.lastName).toBe(userData.lastName);

      await request(testSetup.getHttpServer())
        .get('/users/profile')
        .expect(401);
    });

    it('should handle invalid login credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await userRepository.create({
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '987654321',
        role: UserRole.ADOPTER,
        status: UserStatus.ACTIVE,
        verified: true,
        address: 'Test Address',
        identityDocument: '12345678',
      } as any);

      await request(testSetup.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      await request(testSetup.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);
    });
  });
});