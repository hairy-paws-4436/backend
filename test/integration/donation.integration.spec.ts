import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestSetup } from '../utils/setup';
import { UserRepository } from '../../src/infrastructure/database/mysql/repositories/user.repository';
import { OngRepository } from '../../src/infrastructure/database/mysql/repositories/ong.repository';
import { DonationRepository } from '../../src/infrastructure/database/mysql/repositories/donation.repository';
import { DonationItemRepository } from '../../src/infrastructure/database/mysql/repositories/donation-item.repository';
import { UserRole } from '../../src/core/domain/user/value-objects/user-role.enum';
import { UserStatus } from '../../src/core/domain/user/value-objects/user-status';
import { DonationType } from '../../src/core/domain/donation/value-objects/donation-type.enum';
import { DonationStatus } from '../../src/core/domain/donation/value-objects/donation-status.enum';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

describe('Donation Integration Tests', () => {
  let app: INestApplication;
  let testSetup: TestSetup;
  let userRepository: UserRepository;
  let ongRepository: OngRepository;
  let donationRepository: DonationRepository;
  let donationItemRepository: DonationItemRepository;

  beforeAll(async () => {
    testSetup = new TestSetup();
    await testSetup.initialize();
    app = testSetup.app;
    userRepository = app.get<UserRepository>(UserRepository);
    ongRepository = app.get<OngRepository>(OngRepository);
    donationRepository = app.get<DonationRepository>(DonationRepository);
    donationItemRepository = app.get<DonationItemRepository>(DonationItemRepository);
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

  describe('Donation Flow', () => {
    it('should allow users to make a money donation and ONG confirm it', async () => {
      const donorData = {
        email: 'donor@example.com',
        password: 'Password123!',
        firstName: 'Donor',
        lastName: 'User',
        phone: '123456789',
        role: UserRole.ADOPTER,
        address: 'Donor Address',
        dni: '87654321'
      };

      const ongUserData = {
        email: 'ong@example.com',
        password: 'Password123!',
        firstName: 'ONG',
        lastName: 'Admin',
        phone: '987654321',
        role: UserRole.ONG,
        address: 'ONG Address',
        dni: '12345678'
      };

      const { user: donor, token: donorToken } = await createUserAndGetToken(donorData);
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

      const receiptPath = createTestFile('receipt.jpg');

      const donationResponse = await request(testSetup.getHttpServer())
        .post('/donations')
        .set('Authorization', `Bearer ${donorToken}`)
        .field('ongId', ongId)
        .field('type', DonationType.MONEY)
        .field('amount', '100')
        .field('transactionId', 'tx-123456')
        .field('notes', 'Test donation')
        .attach('receipt', receiptPath)
        .expect(201);

      const donationId = donationResponse.body.id;
      expect(donationResponse.body.status).toBe(DonationStatus.PENDING);
      expect(donationResponse.body.amount).toBe(100);

      const ongDonationsResponse = await request(testSetup.getHttpServer())
        .get('/donations/ong')
        .set('Authorization', `Bearer ${ongToken}`)
        .expect(200);

      expect(ongDonationsResponse.body).toHaveLength(1);
      expect(ongDonationsResponse.body[0].id).toBe(donationId);
      expect(ongDonationsResponse.body[0].amount).toBe(100);

      const confirmResponse = await request(testSetup.getHttpServer())
        .post(`/donations/${donationId}/confirm`)
        .set('Authorization', `Bearer ${ongToken}`)
        .send({ notes: 'Thank you for your donation!' })
        .expect(200);

      expect(confirmResponse.body.status).toBe(DonationStatus.CONFIRMED);

      const getDonationResponse = await request(testSetup.getHttpServer())
        .get(`/donations/${donationId}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(getDonationResponse.body.status).toBe(DonationStatus.CONFIRMED);
      expect(getDonationResponse.body.notes).toContain('Thank you');

      fs.unlinkSync(logoPath);
      fs.unlinkSync(docPath);
      fs.unlinkSync(receiptPath);
    });

    it('should allow users to make an items donation', async () => {
      const { user: donor, token: donorToken } = await createUserAndGetToken({
        email: 'donor@example.com',
        password: 'Password123!',
        firstName: 'Donor',
        lastName: 'User',
        phone: '123456789',
        role: UserRole.ADOPTER,
        address: 'Donor Address',
        dni: '87654321'
      });

      const { user: ongUser, token: ongToken } = await createUserAndGetToken({
        email: 'ong@example.com',
        password: 'Password123!',
        firstName: 'ONG',
        lastName: 'Admin',
        phone: '987654321',
        role: UserRole.ONG,
        address: 'ONG Address',
        dni: '12345678'
      });

      const logoPath = createTestFile('logo.jpg');
      const docPath = createTestFile('legal_doc.pdf');

      const createOngResponse = await request(testSetup.getHttpServer())
        .post('/ongs')
        .set('Authorization', `Bearer ${ongToken}`)
        .field('name', 'Test ONG')
        .field('ruc', '12345678901')
        .field('description', 'A test ONG for animal rescue')
        .field('address', 'ONG Office Address')
        .field('phone', '987654321')
        .field('email', 'ong@example.com')
        .attach('logo', logoPath)
        .attach('legalDocuments', docPath)
        .expect(201);

      const ongId = createOngResponse.body.id;

      const receiptPath = createTestFile('receipt.jpg');
      const items = [
        { name: 'Dog Food', quantity: 5, description: 'Bags of premium dog food' },
        { name: 'Cat Toys', quantity: 10, description: 'Assorted toys for cats' }
      ];

      const donationResponse = await request(testSetup.getHttpServer())
        .post('/donations')
        .set('Authorization', `Bearer ${donorToken}`)
        .field('ongId', ongId)
        .field('type', DonationType.ITEMS)
        .field('notes', 'Donation of pet supplies')
        .field('items', JSON.stringify(items))
        .attach('receipt', receiptPath)
        .expect(201);

      const donationId = donationResponse.body.id;
      expect(donationResponse.body.status).toBe(DonationStatus.PENDING);
      expect(donationResponse.body.type).toBe(DonationType.ITEMS);

      const donationDetailsResponse = await request(testSetup.getHttpServer())
        .get(`/donations/${donationId}`)
        .set('Authorization', `Bearer ${ongToken}`)
        .expect(200);

      expect(donationDetailsResponse.body.items).toBeDefined();
      expect(donationDetailsResponse.body.items.length).toBe(2);
      expect(donationDetailsResponse.body.items[0].name).toBe('Dog Food');
      expect(donationDetailsResponse.body.items[1].name).toBe('Cat Toys');

      fs.unlinkSync(logoPath);
      fs.unlinkSync(docPath);
      fs.unlinkSync(receiptPath);
    });
  });
});