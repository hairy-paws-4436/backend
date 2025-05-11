import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestSetup } from '../utils/setup';
import { UserRepository } from '../../src/infrastructure/database/mysql/repositories/user.repository';
import { OngRepository } from '../../src/infrastructure/database/mysql/repositories/ong.repository';
import { EventRepository } from '../../src/infrastructure/database/mysql/repositories/event.repository';
import { UserRole } from '../../src/core/domain/user/value-objects/user-role.enum';
import { UserStatus } from '../../src/core/domain/user/value-objects/user-status';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

describe('Event Integration Tests', () => {
  let app: INestApplication;
  let testSetup: TestSetup;
  let userRepository: UserRepository;
  let ongRepository: OngRepository;
  let eventRepository: EventRepository;

  beforeAll(async () => {
    testSetup = new TestSetup();
    await testSetup.initialize();
    app = testSetup.app;
    userRepository = app.get<UserRepository>(UserRepository);
    ongRepository = app.get<OngRepository>(OngRepository);
    eventRepository = app.get<EventRepository>(EventRepository);
  });

  afterAll(async () => {
    await testSetup.cleanup();
  });

  beforeEach(async () => {
    await testSetup.clearDatabase();
  });

  async function createUserAndGetToken(userData: any) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await userRepository.create({
      ...userData,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      verified: true,
    });

    const loginResponse = await request(testSetup.getHttpServer())
      .post('/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    return {
      user,
      token: loginResponse.body.access_token,
    };
  }

  function createTestFile(filename: string, content: string = 'test content') {
    const testFilePath = path.join(__dirname, '..', 'temp', filename);
    const dirPath = path.join(__dirname, '..', 'temp');

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(testFilePath, content);
    return testFilePath;
  }

  describe('Event Flow', () => {
    it('should allow ONG users to create and manage events', async () => {
      const ongUserData = {
        email: 'ong@example.com',
        password: 'Password123!',
        firstName: 'ONG',
        lastName: 'Admin',
        phoneNumber: '987654321',
        role: UserRole.ONG,
        address: 'ONG Address',
        identityDocument: '12345678',
      };

      const { user: ongUser, token: ongToken } = await createUserAndGetToken(ongUserData);

      const ongData = {
        name: 'Test ONG',
        ruc: '12345678901',
        description: 'A test ONG for animal rescue',
        address: 'ONG Office Address',
        phone: '987654321',
        email: 'ong@example.com',
      };

      const logoPath = createTestFile('logo.jpg');
      const docPath = createTestFile('legal_doc.pdf');

      const createOngResponse = await request(testSetup.getHttpServer())
        .post('/ongs')
        .set('Authorization', `Bearer ${ongToken}`)
        .field('name', ongData.name)
        .field('ruc', ongData.ruc)
        .field('description', ongData.description)
        .field('address', ongData.address)
        .field('phone', ongData.phone)
        .field('email', ongData.email)
        .attach('logo', logoPath)
        .attach('legalDocuments', docPath)
        .expect(201);

      const ongId = createOngResponse.body.id;

      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 7);

      const imagePath = createTestFile('event_image.jpg');

      const createEventResponse = await request(testSetup.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${ongToken}`)
        .field('title', 'Animal Adoption Day')
        .field('description', 'Come find your new furry friend at our adoption event!')
        .field('eventDate', eventDate.toISOString())
        .field('location', 'Central Park, Lima')
        .field('isVolunteerEvent', 'false')
        .attach('image', imagePath)
        .expect(201);

      const eventId = createEventResponse.body.id;
      expect(createEventResponse.body.title).toBe('Animal Adoption Day');
      expect(createEventResponse.body.ongId).toBe(ongId);

      const getEventsResponse = await request(testSetup.getHttpServer())
        .get('/events')
        .expect(200);

      expect(Array.isArray(getEventsResponse.body)).toBe(true);
      expect(getEventsResponse.body.length).toBe(1);
      expect(getEventsResponse.body[0].id).toBe(eventId);

      const getEventResponse = await request(testSetup.getHttpServer())
        .get(`/events/${eventId}`)
        .expect(200);

      expect(getEventResponse.body.id).toBe(eventId);
      expect(getEventResponse.body.title).toBe('Animal Adoption Day');

      const updateEventResponse = await request(testSetup.getHttpServer())
        .put(`/events/${eventId}`)
        .set('Authorization', `Bearer ${ongToken}`)
        .field('title', 'Updated Event Title')
        .field('description', 'Updated event description')
        .expect(200);

      expect(updateEventResponse.body.title).toBe('Updated Event Title');

      await request(testSetup.getHttpServer())
        .delete(`/events/${eventId}`)
        .set('Authorization', `Bearer ${ongToken}`)
        .expect(200);

      await request(testSetup.getHttpServer())
        .get(`/events/${eventId}`)
        .expect(404);

      fs.unlinkSync(logoPath);
      fs.unlinkSync(docPath);
      fs.unlinkSync(imagePath);
    });
  });
});