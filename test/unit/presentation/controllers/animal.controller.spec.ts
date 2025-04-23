import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AnimalController } from '../../../../src/presentation/controllers/animal.controller';
import { CreateAnimalUseCase } from '../../../../src/application/use-cases/animal/create-animal.use-case';
import { UpdateAnimalUseCase } from '../../../../src/application/use-cases/animal/update-animal.use-case';
import { GetAnimalUseCase } from '../../../../src/application/use-cases/animal/get-animal.use-case';
import { GetAnimalsUseCase } from '../../../../src/application/use-cases/animal/get-animals.use-case';
import { DeleteAnimalUseCase } from '../../../../src/application/use-cases/animal/delete-animal.use-case';
import { AnimalRepository } from '../../../../src/infrastructure/database/mysql/repositories/animal.repository';
import { S3Service } from '../../../../src/infrastructure/services/aws/s3.service';
import { AnimalEntity } from '../../../../src/core/domain/animal/animal.entity';
import { AnimalType } from '../../../../src/core/domain/animal/value-objects/animal-type.enum';
import { AnimalGender } from '../../../../src/core/domain/animal/value-objects/animal-gender.enum';

import { UserRole } from '../../../../src/core/domain/user/value-objects/user-role.enum';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../../../src/infrastructure/services/auth/jwt.strategy';
import { AnimalStatus } from 'src/core/domain/animal/value-objects/animal-status';

// Mock de AnimalRepository
class MockAnimalRepository {
  private animals: AnimalEntity[] = [];

  constructor() {
    // Crear algunos animales de prueba
    this.animals.push(
      new AnimalEntity(
        'animal-id-1',
        'Rocky',
        AnimalType.DOG,
        'Labrador',
        3,
        AnimalGender.MALE,
        'A friendly and playful dog',
        'owner-id-1',
        ['image1.jpg', 'image2.jpg'],
        AnimalStatus.AVAILABLE,
        true,
      ),
      new AnimalEntity(
        'animal-id-2',
        'Max',
        AnimalType.DOG,
        'Golden Retriever',
        5,
        AnimalGender.MALE,
        'A friendly and loyal dog',
        'owner-id-1',
        ['image3.jpg'],
        AnimalStatus.AVAILABLE,
        true,
      ),
      new AnimalEntity(
        'animal-id-3',
        'Luna',
        AnimalType.CAT,
        'Siamese',
        2,
        AnimalGender.FEMALE,
        'A playful cat',
        'owner-id-2',
        ['image4.jpg'],
        AnimalStatus.NOT_AVAILABLE,
        false,
      ),
    );
  }

  async findAll(filters?: any): Promise<AnimalEntity[]> {
    let result = [...this.animals];
    
    if (filters) {
      if (filters.availableForAdoption !== undefined) {
        result = result.filter(a => a.isAvailableForAdoption() === filters.availableForAdoption);
      }
      
      if (filters.type) {
        result = result.filter(a => a.getType() === filters.type);
      }
      
      if (filters.breed) {
        result = result.filter(a => a.getBreed() === filters.breed);
      }
      
      if (filters.ownerId) {
        result = result.filter(a => a.getOwnerId() === filters.ownerId);
      }
    }
    
    return result;
  }

  async findById(id: string): Promise<AnimalEntity> {
    const animal = this.animals.find(a => a.getId() === id);
    if (!animal) {
      throw new Error('Animal not found');
    }
    return animal;
  }

  async create(entity: AnimalEntity): Promise<AnimalEntity> {
    this.animals.push(entity);
    return entity;
  }

  async update(id: string, entity: Partial<AnimalEntity>): Promise<AnimalEntity> {
    const index = this.animals.findIndex(a => a.getId() === id);
    if (index === -1) {
      throw new Error('Animal not found');
    }
    
    // Simular actualización mezclando propiedades
    const updatedAnimal = this.animals[index];
    
    // Actualizar las propiedades proporcionadas
    if (entity instanceof AnimalEntity) {
      // Si es una entidad completa
      this.animals[index] = entity;
      return entity;
    } else {
      // Si es un objeto parcial, actualizar solo las propiedades proporcionadas
      // Esto es una simplificación para pruebas, en una implementación real 
      // necesitaríamos manejar cada propiedad específicamente
      return updatedAnimal;
    }
  }

  async delete(id: string): Promise<void> {
    const index = this.animals.findIndex(a => a.getId() === id);
    if (index === -1) {
      throw new Error('Animal not found');
    }
    this.animals.splice(index, 1);
  }
}

// Mock de S3Service
class MockS3Service {
  async uploadFile(buffer: any, folder: string, originalName: string): Promise<string> {
    return `https://example-bucket.s3.amazonaws.com/${folder}/${originalName}`;
  }

  async uploadMultipleFiles(
    buffers: Buffer[],
    folder: string,
    originalNames: string[],
  ): Promise<string[]> {
    return originalNames.map(
      (name) => `https://example-bucket.s3.amazonaws.com/${folder}/${name}`,
    );
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // No hacemos nada aquí, es un mock
  }
}

describe('AnimalController (Integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-secret-key',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AnimalController],
      providers: [
        CreateAnimalUseCase,
        UpdateAnimalUseCase,
        GetAnimalUseCase,
        GetAnimalsUseCase,
        DeleteAnimalUseCase,
        JwtStrategy,
        {
          provide: AnimalRepository,
          useClass: MockAnimalRepository,
        },
        {
          provide: S3Service,
          useClass: MockS3Service,
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

  describe('GET /animals', () => {
    it('should return all available animals', () => {
      return request(app.getHttpServer())
        .get('/animals')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2); // Solo animales disponibles
          expect(res.body[0].name).toBe('Rocky');
          expect(res.body[1].name).toBe('Max');
        });
    });

    it('should filter animals by type', () => {
      return request(app.getHttpServer())
        .get('/animals?type=DOG')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(res.body.every((animal) => animal.type === 'DOG')).toBe(true);
        });
    });

    it('should filter animals by breed', () => {
      return request(app.getHttpServer())
        .get('/animals?breed=Labrador')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].breed).toBe('Labrador');
        });
    });
  });

  describe('GET /animals/:id', () => {
    it('should return an animal by ID', () => {
      return request(app.getHttpServer())
        .get('/animals/animal-id-1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'animal-id-1');
          expect(res.body.name).toBe('Rocky');
          expect(res.body.type).toBe(AnimalType.DOG);
          expect(res.body.breed).toBe('Labrador');
          expect(res.body.images).toHaveLength(2);
        });
    });

    it('should return 404 for non-existent animal', () => {
      return request(app.getHttpServer())
        .get('/animals/non-existent-id')
        .expect(404);
    });
  });

  describe('GET /animals/owner', () => {
    it('should return all animals for the authenticated owner', () => {
      // Generate a token for authentication
      const token = jwtService.sign({
        sub: 'owner-id-1',
        email: 'owner@example.com',
        role: UserRole.OWNER,
      });

      return request(app.getHttpServer())
        .get('/animals/owner')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(res.body.every((animal) => animal.ownerId === 'owner-id-1')).toBe(true);
        });
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .get('/animals/owner')
        .expect(401);
    });

    it('should return 403 when not an owner', () => {
      // Generate a token for authentication with wrong role
      const token = jwtService.sign({
        sub: 'user-id',
        email: 'user@example.com',
        role: UserRole.ADOPTER, // Not OWNER
      });

      return request(app.getHttpServer())
        .get('/animals/owner')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('POST /animals', () => {
    it('should create a new animal for authenticated owner', () => {
      // Generate a token for authentication
      const token = jwtService.sign({
        sub: 'owner-id-1',
        email: 'owner@example.com',
        role: UserRole.OWNER,
      });

      return request(app.getHttpServer())
        .post('/animals')
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'Buddy')
        .field('type', AnimalType.DOG)
        .field('breed', 'Beagle')
        .field('age', '2')
        .field('gender', AnimalGender.MALE)
        .field('description', 'A friendly beagle that loves to play and go for walks.')
        .field('vaccinated', 'true')
        .field('sterilized', 'false')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Buddy');
          expect(res.body.breed).toBe('Beagle');
          expect(res.body.ownerId).toBe('owner-id-1');
          expect(res.body.vaccinated).toBe(true);
          expect(res.body.sterilized).toBe(false);
        });
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .post('/animals')
        .field('name', 'Buddy')
        .field('type', AnimalType.DOG)
        .field('breed', 'Beagle')
        .field('age', '2')
        .field('gender', AnimalGender.MALE)
        .field('description', 'A friendly beagle that loves to play and go for walks.')
        .expect(401);
    });
  });

  describe('DELETE /animals/:id', () => {
    it('should delete an animal for authenticated owner', () => {
      // Generate a token for authentication
      const token = jwtService.sign({
        sub: 'owner-id-1',
        email: 'owner@example.com',
        role: UserRole.OWNER,
      });

      return request(app.getHttpServer())
        .delete('/animals/animal-id-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 204);
        });
    });

    it('should return 403 when trying to delete another owner\'s animal', () => {
      // Generate a token for authentication
      const token = jwtService.sign({
        sub: 'owner-id-2',
        email: 'other-owner@example.com',
        role: UserRole.OWNER,
      });

      return request(app.getHttpServer())
        .delete('/animals/animal-id-1') // animal-id-1 belongs to owner-id-1
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should allow admin to delete any animal', () => {
      // Generate a token for authentication
      const token = jwtService.sign({
        sub: 'admin-id',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      });

      return request(app.getHttpServer())
        .delete('/animals/animal-id-3') // animal-id-3 belongs to owner-id-2
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 204);
        });
    });
  });
});