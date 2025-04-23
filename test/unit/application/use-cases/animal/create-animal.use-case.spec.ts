import { Test } from '@nestjs/testing';
import { CreateAnimalUseCase } from '../../../../../src/application/use-cases/animal/create-animal.use-case';
import { AnimalRepository } from '../../../../../src/infrastructure/database/mysql/repositories/animal.repository';
import { S3Service } from '../../../../../src/infrastructure/services/aws/s3.service';
import { AnimalType } from '../../../../../src/core/domain/animal/value-objects/animal-type.enum';
import { AnimalGender } from '../../../../../src/core/domain/animal/value-objects/animal-gender.enum';
import { AnimalEntity } from '../../../../../src/core/domain/animal/animal.entity';
import { BusinessRuleValidationException } from '../../../../../src/core/exceptions/domain.exception';

// Mock de AnimalRepository
class MockAnimalRepository {
  private animals: AnimalEntity[] = [];

  async create(entity: AnimalEntity): Promise<AnimalEntity> {
    this.animals.push(entity);
    return entity;
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
}

describe('CreateAnimalUseCase', () => {
  let useCase: CreateAnimalUseCase;
  let animalRepository: MockAnimalRepository;
  let s3Service: MockS3Service;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateAnimalUseCase,
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

    useCase = moduleRef.get<CreateAnimalUseCase>(CreateAnimalUseCase);
    animalRepository = moduleRef.get(AnimalRepository);
    s3Service = moduleRef.get(S3Service);

    // Spy on repository and service methods
    jest.spyOn(animalRepository, 'create');
    jest.spyOn(s3Service, 'uploadMultipleFiles');
  });

  it('should create an animal successfully', async () => {
    // Arrange
    const createAnimalDto = {
      name: 'Rocky',
      type: AnimalType.DOG,
      breed: 'Labrador',
      age: 3,
      gender: AnimalGender.MALE,
      description: 'A friendly and playful dog that loves to run in the park.',
      ownerId: 'owner-id',
      vaccinated: true,
      sterilized: false,
    };

    // Act
    const result = await useCase.execute(createAnimalDto);

    // Assert
    expect(animalRepository.create).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result.getName()).toBe(createAnimalDto.name);
    expect(result.getType()).toBe(createAnimalDto.type);
    expect(result.getBreed()).toBe(createAnimalDto.breed);
    expect(result.getAge()).toBe(createAnimalDto.age);
    expect(result.getGender()).toBe(createAnimalDto.gender);
    expect(result.getDescription()).toBe(createAnimalDto.description);
    expect(result.getOwnerId()).toBe(createAnimalDto.ownerId);
    expect(result.isVaccinated()).toBe(createAnimalDto.vaccinated);
    expect(result.isSterilized()).toBe(createAnimalDto.sterilized);
    expect(result.getImages()).toEqual([]);
  });

  it('should upload images when provided', async () => {
    // Arrange
    const createAnimalDto = {
      name: 'Rocky',
      type: AnimalType.DOG,
      breed: 'Labrador',
      age: 3,
      gender: AnimalGender.MALE,
      description: 'A friendly and playful dog that loves to run in the park.',
      ownerId: 'owner-id',
      vaccinated: true,
      sterilized: false,
      images: [
        {
          buffer: Buffer.from('mock-image-data-1'),
          originalname: 'dog1.jpg',
        },
        {
          buffer: Buffer.from('mock-image-data-2'),
          originalname: 'dog2.jpg',
        },
      ] as Express.Multer.File[],
    };

    // Act
    const result = await useCase.execute(createAnimalDto);

    // Assert
    expect(s3Service.uploadMultipleFiles).toHaveBeenCalledWith(
      createAnimalDto.images.map((img) => img.buffer),
      'animals',
      createAnimalDto.images.map((img) => img.originalname),
    );
    expect(result.getImages().length).toBe(2);
    expect(result.getImages()[0]).toContain('animals/dog1.jpg');
    expect(result.getImages()[1]).toContain('animals/dog2.jpg');
  });

  it('should throw error when validation fails', async () => {
    // Arrange - Invalid age
    const createAnimalDto = {
      name: 'Rocky',
      type: AnimalType.DOG,
      breed: 'Labrador',
      age: -1, // Invalid age (negative)
      gender: AnimalGender.MALE,
      description: 'A friendly and playful dog that loves to run in the park.',
      ownerId: 'owner-id',
      vaccinated: true,
      sterilized: false,
    };

    // Act & Assert
    await expect(useCase.execute(createAnimalDto)).rejects.toThrow(BusinessRuleValidationException);
    expect(animalRepository.create).not.toHaveBeenCalled();
  });

  it('should include optional fields when provided', async () => {
    // Arrange - With optional fields
    const createAnimalDto = {
      name: 'Rocky',
      type: AnimalType.DOG,
      breed: 'Labrador',
      age: 3,
      gender: AnimalGender.MALE,
      description: 'A friendly and playful dog that loves to run in the park.',
      ownerId: 'owner-id',
      vaccinated: true,
      sterilized: false,
      weight: 25.5,
      healthDetails: 'Vaccinated, dewormed, and in excellent health.',
    };

    // Act
    const result = await useCase.execute(createAnimalDto);

    // Assert
    expect(result.getWeight()).toBe(createAnimalDto.weight);
    expect(result.getHealthDetails()).toBe(createAnimalDto.healthDetails);
  });
});