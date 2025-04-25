import { Test } from '@nestjs/testing';
import { RequestAdoptionUseCase } from '../../../../../src/application/use-cases/adoption/request-adoption.use-case';
import { AdoptionRepository } from '../../../../../src/infrastructure/database/mysql/repositories/adoption.repository';
import { AnimalRepository } from '../../../../../src/infrastructure/database/mysql/repositories/animal.repository';
import { NotificationService } from '../../../../../src/infrastructure/services/notification/notification.service';
import { AdoptionType } from '../../../../../src/core/domain/adoption/value-objects/adoption-type.enum';
import { AdoptionStatus } from '../../../../../src/core/domain/adoption/value-objects/adoption-status.enum';
import { NotificationType } from '../../../../../src/core/domain/notification/value-objects/notification-type.enum';

import { AnimalType } from '../../../../../src/core/domain/animal/value-objects/animal-type.enum';
import { AnimalGender } from '../../../../../src/core/domain/animal/value-objects/animal-gender.enum';
import { AnimalEntity } from '../../../../../src/core/domain/animal/animal.entity';
import { AdoptionEntity } from '../../../../../src/core/domain/adoption/adoption.entity';
import { BusinessRuleValidationException, EntityNotFoundException } from '../../../../../src/core/exceptions/domain.exception';
import { AnimalStatus } from 'src/core/domain/animal/value-objects/animal-status';

// Mock de AnimalRepository
class MockAnimalRepository {
  private animals: AnimalEntity[] = [
    new AnimalEntity(
      'animal-id-1',
      'Rocky',
      AnimalType.DOG,
      'Labrador',
      3,
      AnimalGender.MALE,
      'A friendly and playful dog',
      'owner-id',
      [],
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
      'A friendly dog',
      'owner-id',
      [],
      AnimalStatus.NOT_AVAILABLE,
      false,
    ),
  ];

  async findById(id: string): Promise<AnimalEntity> {
    const animal = this.animals.find(a => a.getId() === id);
    if (!animal) {
      throw new EntityNotFoundException('Animal', id);
    }
    return animal;
  }
}

// Mock de AdoptionRepository
class MockAdoptionRepository {
  private adoptions: AdoptionEntity[] = [];

  async exists(filters: any): Promise<boolean> {
    if (filters.animalId && filters.adopterId && filters.status === 'pending') {
      return this.adoptions.some(
        a =>
          a.getAnimalId() === filters.animalId &&
          a.getAdopterId() === filters.adopterId &&
          a.getStatus() === AdoptionStatus.PENDING,
      );
    }
    return false;
  }

  async create(entity: AdoptionEntity): Promise<AdoptionEntity> {
    this.adoptions.push(entity);
    return entity;
  }
}

// Mock de NotificationService
class MockNotificationService {
  async create(notificationData: any): Promise<any> {
    return { id: 'notification-id', ...notificationData };
  }
}

describe('RequestAdoptionUseCase', () => {
  let useCase: RequestAdoptionUseCase;
  let animalRepository: MockAnimalRepository;
  let adoptionRepository: MockAdoptionRepository;
  let notificationService: MockNotificationService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RequestAdoptionUseCase,
        {
          provide: AdoptionRepository,
          useClass: MockAdoptionRepository,
        },
        {
          provide: AnimalRepository,
          useClass: MockAnimalRepository,
        },
        {
          provide: NotificationService,
          useClass: MockNotificationService,
        },
      ],
    }).compile();

    useCase = moduleRef.get<RequestAdoptionUseCase>(RequestAdoptionUseCase);
    animalRepository = moduleRef.get(AnimalRepository);
    adoptionRepository = moduleRef.get(AdoptionRepository);
    notificationService = moduleRef.get(NotificationService);

    // Spy on repository and service methods
    jest.spyOn(animalRepository, 'findById');
    jest.spyOn(adoptionRepository, 'exists');
    jest.spyOn(adoptionRepository, 'create');
    jest.spyOn(notificationService, 'create');
  });

  it('should create an adoption request successfully', async () => {
    // Arrange
    const requestAdoptionDto = {
      animalId: 'animal-id-1', // Available animal
      adopterId: 'adopter-id',
      type: AdoptionType.ADOPTION,
    };

    // Act
    const result = await useCase.execute(requestAdoptionDto);

    // Assert
    expect(animalRepository.findById).toHaveBeenCalledWith(requestAdoptionDto.animalId);
    expect(adoptionRepository.exists).toHaveBeenCalled();
    expect(adoptionRepository.create).toHaveBeenCalledTimes(1);
    expect(notificationService.create).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result.getAnimalId()).toBe(requestAdoptionDto.animalId);
    expect(result.getAdopterId()).toBe(requestAdoptionDto.adopterId);
    expect(result.getType()).toBe(requestAdoptionDto.type);
    expect(result.getStatus()).toBe(AdoptionStatus.PENDING);
    expect(result.getOwnerId()).toBe('owner-id'); // From the mock animal
  });

  it('should create a visit request with visit date successfully', async () => {
    // Arrange
    const visitDate = new Date();
    const requestAdoptionDto = {
      animalId: 'animal-id-1', // Available animal
      adopterId: 'adopter-id',
      type: AdoptionType.VISIT,
      visitDate,
    };

    // Act
    const result = await useCase.execute(requestAdoptionDto);

    // Assert
    expect(result.getType()).toBe(AdoptionType.VISIT);
    expect(result.getVisitDate()).toEqual(visitDate);
  });

  it('should throw error when animal is not available for adoption', async () => {
    // Arrange
    const requestAdoptionDto = {
      animalId: 'animal-id-2', // Unavailable animal
      adopterId: 'adopter-id',
      type: AdoptionType.ADOPTION,
    };

    // Act & Assert
    await expect(useCase.execute(requestAdoptionDto)).rejects.toThrow(BusinessRuleValidationException);
    expect(animalRepository.findById).toHaveBeenCalledWith(requestAdoptionDto.animalId);
    expect(adoptionRepository.create).not.toHaveBeenCalled();
    expect(notificationService.create).not.toHaveBeenCalled();
  });

  it('should throw error when owner tries to adopt their own animal', async () => {
    // Arrange
    const requestAdoptionDto = {
      animalId: 'animal-id-1',
      adopterId: 'owner-id', // Same as animal's owner
      type: AdoptionType.ADOPTION,
    };

    // Act & Assert
    await expect(useCase.execute(requestAdoptionDto)).rejects.toThrow(BusinessRuleValidationException);
    expect(animalRepository.findById).toHaveBeenCalledWith(requestAdoptionDto.animalId);
    expect(adoptionRepository.create).not.toHaveBeenCalled();
    expect(notificationService.create).not.toHaveBeenCalled();
  });

  it('should throw error when there is already a pending request', async () => {
    // Arrange
    const requestAdoptionDto = {
      animalId: 'animal-id-1',
      adopterId: 'adopter-id',
      type: AdoptionType.ADOPTION,
    };

    // Create first request
    await useCase.execute(requestAdoptionDto);
    
    // Reset mocks to check second call
    jest.clearAllMocks();

    // Act & Assert - Try to create second request
    await expect(useCase.execute(requestAdoptionDto)).rejects.toThrow(BusinessRuleValidationException);
    expect(animalRepository.findById).toHaveBeenCalledWith(requestAdoptionDto.animalId);
    expect(adoptionRepository.exists).toHaveBeenCalled();
    expect(adoptionRepository.create).not.toHaveBeenCalled();
    expect(notificationService.create).not.toHaveBeenCalled();
  });

  it('should throw error when visit request has no visit date', async () => {
    // Arrange
    const requestAdoptionDto = {
      animalId: 'animal-id-1',
      adopterId: 'adopter-id',
      type: AdoptionType.VISIT,
      // No visitDate provided
    };

    // Act & Assert
    await expect(useCase.execute(requestAdoptionDto)).rejects.toThrow(BusinessRuleValidationException);
    expect(animalRepository.findById).toHaveBeenCalledWith(requestAdoptionDto.animalId);
    expect(adoptionRepository.create).not.toHaveBeenCalled();
    expect(notificationService.create).not.toHaveBeenCalled();
  });

  it('should send adoption notification to the owner', async () => {
    // Arrange
    const requestAdoptionDto = {
      animalId: 'animal-id-1',
      adopterId: 'adopter-id',
      type: AdoptionType.ADOPTION,
    };

    // Act
    await useCase.execute(requestAdoptionDto);

    // Assert
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'owner-id',
        type: NotificationType.ADOPTION_REQUEST,
        referenceType: 'adoption',
      }),
    );
  });

  it('should send visit notification to the owner', async () => {
    // Arrange
    const requestAdoptionDto = {
      animalId: 'animal-id-1',
      adopterId: 'adopter-id',
      type: AdoptionType.VISIT,
      visitDate: new Date(),
    };

    // Act
    await useCase.execute(requestAdoptionDto);

    // Assert
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'owner-id',
        type: NotificationType.VISIT_REQUEST,
        referenceType: 'adoption',
      }),
    );
  });
});