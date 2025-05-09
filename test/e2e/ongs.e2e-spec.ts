import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { UserRole } from '../../src/core/domain/user/value-objects/user-role.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testDatabaseConfig } from '../test-database-config';
import * as fs from 'fs';
import * as path from 'path';

describe('ONGs (e2e)', () => {
  let app: INestApplication;
  let ongToken: string;
  let adminToken: string;
  let ongId: string;
  let userId: string;

  function createTestFile(filename: string, content: string = 'test content') {
    const testFilePath = path.join(__dirname, '..', 'temp', filename);
    const dirPath = path.join(__dirname, '..', 'temp');

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(testFilePath, content);
    return testFilePath;
  }

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

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'ong-test@example.com',
        password: 'Password123!',
        firstName: 'ONG',
        lastName: 'User',
        phoneNumber: '987654326',
        role: UserRole.ONG,
        identityDocument: '87654321',
      });

    userId = registerResponse.body.id;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin-test@example.com',
        password: 'Password123!',
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: '987654327',
        role: UserRole.ADMIN,
        identityDocument: '87654322',
      });

    const ongLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'ong-test@example.com',
        password: 'Password123!',
      });
    ongToken = ongLoginResponse.body.access_token;

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin-test@example.com',
        password: 'Password123!',
      });
    adminToken = adminLoginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('ONG registration and management', () => {
    it('should create a new ONG', async () => {
      const logoPath = createTestFile('ong_logo_test.jpg');
      const docPath = createTestFile('ong_doc_test.pdf');

      const createResponse = await request(app.getHttpServer())
        .post('/ongs')
        .set('Authorization', `Bearer ${ongToken}`)
        .field('name', 'Test ONG Organization')
        .field('ruc', '20123456788')
        .field('description', 'A non-profit organization dedicated to animal welfare')
        .field('address', '123 Main St, Lima')
        .field('phone', '987654326')
        .field('email', 'contact@testong.org')
        .field('website', 'https://testong.org')
        .field('mission', 'To help animals in need')
        .field('vision', 'A world where all animals are treated with respect')
        .attach('logo', logoPath)
        .attach('legalDocuments', docPath)
        .expect(201);

      ongId = createResponse.body.id;

      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.name).toBe('Test ONG Organization');
      expect(createResponse.body.ruc).toBe('20123456788');
      expect(createResponse.body.userId).toBe(userId);
      expect(createResponse.body.verified).toBe(false);

      fs.unlinkSync(logoPath);
      fs.unlinkSync(docPath);
    });

    it('should get all ONGs', async () => {
      const getResponse = await request(app.getHttpServer())
        .get('/ongs')
        .expect(200);

      expect(Array.isArray(getResponse.body)).toBe(true);
      expect(getResponse.body.length).toBeGreaterThan(0);
      expect(getResponse.body.some(ong => ong.id === ongId)).toBe(true);
    });

    it('should get ONG by ID', async () => {
      const getResponse = await request(app.getHttpServer())
        .get(`/ongs/${ongId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(ongId);
      expect(getResponse.body.name).toBe('Test ONG Organization');
    });

    it('should get ONG by user ID', async () => {
      const getResponse = await request(app.getHttpServer())
        .get('/ongs/user/me')
        .set('Authorization', `Bearer ${ongToken}`)
        .expect(200);

      expect(getResponse.body.id).toBe(ongId);
      expect(getResponse.body.userId).toBe(userId);
    });

    it('should update an ONG', async () => {
      const logoPath = createTestFile('updated_logo.jpg');

      const updateResponse = await request(app.getHttpServer())
        .put(`/ongs/${ongId}`)
        .set('Authorization', `Bearer ${ongToken}`)
        .field('name', 'Updated ONG Name')
        .field('description', 'Updated description for the ONG')
        .attach('logo', logoPath)
        .expect(200);

      expect(updateResponse.body.id).toBe(ongId);
      expect(updateResponse.body.name).toBe('Updated ONG Name');
      expect(updateResponse.body.description).toBe('Updated description for the ONG');

      fs.unlinkSync(logoPath);
    });

    it('should allow admin to verify an ONG', async () => {
      await request(app.getHttpServer())
        .post(`/admin/ongs/${ongId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Verified after reviewing documents' })
        .expect(200);

      const getResponse = await request(app.getHttpServer())
        .get(`/ongs/${ongId}`)
        .expect(200);

      expect(getResponse.body.verified).toBe(true);
    });
  });
});