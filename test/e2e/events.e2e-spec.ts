// test/e2e/events.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { UserRole } from '../../src/core/domain/user/value-objects/user-role.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testDatabaseConfig } from '../test-database-config';
import * as fs from 'fs';
import * as path from 'path';

describe('Events (e2e)', () => {
  let app: INestApplication;
  let ongToken: string;
  let ongId: string;
  let eventId: string;

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

    // Registrar usuario ONG
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'ong-e2e@example.com',
        password: 'Password123!',
        firstName: 'ONG',
        lastName: 'Test',
        phoneNumber: '987654325',
        role: UserRole.ONG,
        identityDocument: '12345678',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'ong-e2e@example.com',
        password: 'Password123!',
      });
    ongToken = loginResponse.body.access_token;

    const logoPath = createTestFile('ong_logo.jpg');
    const docPath = createTestFile('ong_doc.pdf');

    const ongResponse = await request(app.getHttpServer())
      .post('/ongs')
      .set('Authorization', `Bearer ${ongToken}`)
      .field('name', 'E2E Test ONG')
      .field('ruc', '20123456789')
      .field('description', 'This is an ONG created for e2e testing')
      .field('address', 'Test Address 123')
      .field('phone', '987654325')
      .field('email', 'ong-e2e@example.com')
      .attach('logo', logoPath)
      .attach('legalDocuments', docPath);

    ongId = ongResponse.body.id;

    fs.unlinkSync(logoPath);
    fs.unlinkSync(docPath);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Event management', () => {
    it('should create a new event', async () => {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 7);

      const imagePath = createTestFile('event_image.jpg');

      const createResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${ongToken}`)
        .field('title', 'E2E Test Event')
        .field('description', 'This is an event created during e2e testing')
        .field('eventDate', eventDate.toISOString())
        .field('location', 'Test Location')
        .field('isVolunteerEvent', 'true')
        .field('maxParticipants', '20')
        .field('requirements', 'Must love animals')
        .attach('image', imagePath)
        .expect(201);

      eventId = createResponse.body.id;

      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.title).toBe('E2E Test Event');
      expect(createResponse.body.isVolunteerEvent).toBe(true);
      expect(createResponse.body.maxParticipants).toBe(20);

      fs.unlinkSync(imagePath);
    });

    it('should get all events', async () => {
      const getResponse = await request(app.getHttpServer())
        .get('/events')
        .expect(200);

      expect(Array.isArray(getResponse.body)).toBe(true);
      expect(getResponse.body.length).toBeGreaterThan(0);
      expect(getResponse.body.some(event => event.id === eventId)).toBe(true);
    });

    it('should get event by ID', async () => {
      const getResponse = await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(eventId);
      expect(getResponse.body.title).toBe('E2E Test Event');
    });

    it('should update an event', async () => {
      const updateResponse = await request(app.getHttpServer())
        .put(`/events/${eventId}`)
        .set('Authorization', `Bearer ${ongToken}`)
        .field('title', 'Updated E2E Event')
        .field('description', 'This event has been updated during testing')
        .expect(200);

      expect(updateResponse.body.id).toBe(eventId);
      expect(updateResponse.body.title).toBe('Updated E2E Event');
      expect(updateResponse.body.description).toBe('This event has been updated during testing');
    });

    it('should delete an event', async () => {
      await request(app.getHttpServer())
        .delete(`/events/${eventId}`)
        .set('Authorization', `Bearer ${ongToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .expect(404);
    });
  });
});