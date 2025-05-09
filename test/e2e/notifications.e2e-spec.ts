// test/e2e/notifications.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { UserRole } from '../../src/core/domain/user/value-objects/user-role.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testDatabaseConfig } from '../test-database-config';

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let notificationId: string;

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

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'notif-test@example.com',
        password: 'Password123!',
        firstName: 'Notification',
        lastName: 'Test',
        phoneNumber: '987654329',
        role: UserRole.ADOPTER,
        identityDocument: '87654324',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'notif-test@example.com',
        password: 'Password123!',
      });
    userToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Notification management', () => {
    it('should get user notifications', async () => {
      const getResponse = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(getResponse.body)).toBe(true);

      if (getResponse.body.length > 0) {
        notificationId = getResponse.body[0].id;
      }
    });

    it('should get a notification by ID if available', async () => {
      if (!notificationId) {
        console.log('Skipping notification ID test - no notifications available');
        return;
      }

      const getResponse = await request(app.getHttpServer())
        .get(`/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(getResponse.body.id).toBe(notificationId);
    });

    it('should mark all notifications as read', async () => {
      await request(app.getHttpServer())
        .post('/notifications/read-all')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const getResponse = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      for (const notification of getResponse.body) {
        expect(notification.read).toBe(true);
      }
    });
  });
});