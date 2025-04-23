import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { UserRole } from '../../src/core/domain/user/value-objects/user-role.enum';
import { AnimalType } from '../../src/core/domain/animal/value-objects/animal-type.enum';
import { AnimalGender } from '../../src/core/domain/animal/value-objects/animal-gender.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testDatabaseConfig } from '../utils/test-utils';
import * as fs from 'fs';
import * as path from 'path';

describe('Animals (e2e)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let adopterToken: string;
  let adminToken: string;
  let animalId: string;

  beforeAll(async () => {
    // Crear aplicación de prueba
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

    // Registrar usuarios de prueba: owner, adopter y admin
    // 1. Registrar owner
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'owner-e2e@example.com',
        password: 'Password123!',
        firstName: 'Owner',
        lastName: 'Test',
        phoneNumber: '987654321',
        role: UserRole.OWNER,
      });
    
    // 2. Registrar adopter
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'adopter-e2e@example.com',
        password: 'Password123!',
        firstName: 'Adopter',
        lastName: 'Test',
        phoneNumber: '987654322',
        role: UserRole.ADOPTER,
      });
    
    // 3. Registrar admin
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin-e2e@example.com',
        password: 'Password123!',
        firstName: 'Admin',
        lastName: 'Test',
        phoneNumber: '987654323',
        role: UserRole.ADMIN,
      });
    
    // Login y obtener tokens
    // 1. Login como owner
    const ownerLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'owner-e2e@example.com',
        password: 'Password123!',
      });
    ownerToken = ownerLoginResponse.body.access_token;
    
    // 2. Login como adopter
    const adopterLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'adopter-e2e@example.com',
        password: 'Password123!',
      });
    adopterToken = adopterLoginResponse.body.access_token;
    
    // 3. Login como admin
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin-e2e@example.com',
        password: 'Password123!',
      });
    adminToken = adminLoginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Animal creation and management', () => {
    it('should create an animal as owner', async () => {
      // Crear un animal
      const createResponse = await request(app.getHttpServer())
        .post('/animals')
        .set('Authorization', `Bearer ${ownerToken}`)
        .field('name', 'Buddy')
        .field('type', AnimalType.DOG)
        .field('breed', 'Beagle')
        .field('age', '3')
        .field('gender', AnimalGender.MALE)
        .field('description', 'A friendly beagle that loves to play and go for long walks in the park. Good with children and other pets.')
        .field('vaccinated', 'true')
        .field('sterilized', 'false')
        .expect(201);
      
      // Guardar el ID para pruebas posteriores
      animalId = createResponse.body.id;
      
      // Verificar la respuesta
      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.name).toBe('Buddy');
      expect(createResponse.body.type).toBe(AnimalType.DOG);
      expect(createResponse.body.breed).toBe('Beagle');
      expect(createResponse.body.age).toBe(3);
      expect(createResponse.body.gender).toBe(AnimalGender.MALE);
      expect(createResponse.body.vaccinated).toBe(true);
      expect(createResponse.body.sterilized).toBe(false);
    });

    it('should get all available animals', async () => {
      const getResponse = await request(app.getHttpServer())
        .get('/animals')
        .expect(200);
      
      // Verificar que hay al menos un animal (el que acabamos de crear)
      expect(Array.isArray(getResponse.body)).toBe(true);
      expect(getResponse.body.length).toBeGreaterThan(0);
      expect(getResponse.body.some(animal => animal.id === animalId)).toBe(true);
    });

    it('should get animal details by ID', async () => {
      const getResponse = await request(app.getHttpServer())
        .get(`/animals/${animalId}`)
        .expect(200);
      
      // Verificar detalles del animal
      expect(getResponse.body.id).toBe(animalId);
      expect(getResponse.body.name).toBe('Buddy');
      expect(getResponse.body.type).toBe(AnimalType.DOG);
      expect(getResponse.body.breed).toBe('Beagle');
    });

    it('should get all owner animals as owner', async () => {
      const getResponse = await request(app.getHttpServer())
        .get('/animals/owner')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      
      // Verificar que el dueño puede ver su animal
      expect(Array.isArray(getResponse.body)).toBe(true);
      expect(getResponse.body.length).toBeGreaterThan(0);
      expect(getResponse.body.some(animal => animal.id === animalId)).toBe(true);
    });

    it('should prevent adopter from accessing owner animals', async () => {
      await request(app.getHttpServer())
        .get('/animals/owner')
        .set('Authorization', `Bearer ${adopterToken}`)
        .expect(403);
    });

    it('should update animal as owner', async () => {
      const updateResponse = await request(app.getHttpServer())
        .put(`/animals/${animalId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .field('name', 'Max')
        .field('description', 'Updated description about Max the beagle.')
        .field('vaccinated', 'true')
        .field('sterilized', 'true')
        .expect(200);
      
      // Verificar que se actualizó correctamente
      expect(updateResponse.body.id).toBe(animalId);
      expect(updateResponse.body.name).toBe('Max');
      expect(updateResponse.body.description).toBe('Updated description about Max the beagle.');
      expect(updateResponse.body.sterilized).toBe(true);
    });

    it('should prevent adopter from updating others animals', async () => {
      await request(app.getHttpServer())
        .put(`/animals/${animalId}`)
        .set('Authorization', `Bearer ${adopterToken}`)
        .field('name', 'Hacked')
        .expect(403);
    });
  });

  describe('Animal adoption process', () => {
    it('should allow adopter to request adoption', async () => {
      const adoptionResponse = await request(app.getHttpServer())
        .post('/adoptions')
        .set('Authorization', `Bearer ${adopterToken}`)
        .send({
          animalId,
          type: 'ADOPTION',
        })
        .expect(201);
      
      // Verificar la respuesta
      expect(adoptionResponse.body).toHaveProperty('id');
      expect(adoptionResponse.body.animalId).toBe(animalId);
      expect(adoptionResponse.body.type).toBe('ADOPTION');
      expect(adoptionResponse.body.status).toBe('PENDING');
    });

    it('should allow owner to see adoption requests', async () => {
      const getResponse = await request(app.getHttpServer())
        .get('/adoptions')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      
      // Verificar que hay solicitudes y pertenecen al animal creado
      expect(Array.isArray(getResponse.body)).toBe(true);
      expect(getResponse.body.length).toBeGreaterThan(0);
      expect(getResponse.body.some(adoption => adoption.animalId === animalId)).toBe(true);
    });

    it('should allow adopter to see their adoption requests', async () => {
      const getResponse = await request(app.getHttpServer())
        .get('/adoptions')
        .set('Authorization', `Bearer ${adopterToken}`)
        .expect(200);
      
      // Verificar que hay solicitudes y pertenecen al animal correcto
      expect(Array.isArray(getResponse.body)).toBe(true);
      expect(getResponse.body.length).toBeGreaterThan(0);
      expect(getResponse.body.some(adoption => adoption.animalId === animalId)).toBe(true);
    });
  });

  describe('Animal deletion', () => {
    it('should allow owner to delete their animal', async () => {
      // Primero crear un nuevo animal para eliminar
      const createResponse = await request(app.getHttpServer())
        .post('/animals')
        .set('Authorization', `Bearer ${ownerToken}`)
        .field('name', 'ToDelete')
        .field('type', AnimalType.DOG)
        .field('breed', 'Mixed')
        .field('age', '2')
        .field('gender', AnimalGender.FEMALE)
        .field('description', 'This animal will be deleted in tests.')
        .field('vaccinated', 'true')
        .field('sterilized', 'true')
        .expect(201);
      
      const animalToDeleteId = createResponse.body.id;
      
      // Ahora intentar eliminar el animal
      await request(app.getHttpServer())
        .delete(`/animals/${animalToDeleteId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      
      // Verificar que el animal ya no existe
      await request(app.getHttpServer())
        .get(`/animals/${animalToDeleteId}`)
        .expect(404);
    });

    it('should prevent adopter from deleting animals', async () => {
      await request(app.getHttpServer())
        .delete(`/animals/${animalId}`)
        .set('Authorization', `Bearer ${adopterToken}`)
        .expect(403);
    });

    it('should allow admin to delete any animal', async () => {
      await request(app.getHttpServer())
        .delete(`/animals/${animalId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      // Verificar que el animal ya no existe
      await request(app.getHttpServer())
        .get(`/animals/${animalId}`)
        .expect(404);
    });
  });
});