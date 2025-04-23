import { AnimalEntity } from '../../../../../src/core/domain/animal/animal.entity';
import { AnimalType } from '../../../../../src/core/domain/animal/value-objects/animal-type.enum';
import { AnimalGender } from '../../../../../src/core/domain/animal/value-objects/animal-gender.enum';

import { BusinessRuleValidationException } from '../../../../../src/core/exceptions/domain.exception';
import { AnimalStatus } from 'src/core/domain/animal/value-objects/animal-status';

describe('AnimalEntity', () => {
  describe('constructor', () => {
    it('should create a valid animal entity', () => {
      // Arrange
      const animalData = {
        id: 'test-id',
        name: 'Rocky',
        type: AnimalType.DOG,
        breed: 'Labrador',
        age: 3,
        gender: AnimalGender.MALE,
        description: 'A friendly and playful dog that loves to run in the park.',
        ownerId: 'owner-id',
        images: ['image1.jpg', 'image2.jpg'],
      };

      // Act
      const animal = new AnimalEntity(
        animalData.id,
        animalData.name,
        animalData.type,
        animalData.breed,
        animalData.age,
        animalData.gender,
        animalData.description,
        animalData.ownerId,
        animalData.images,
      );

      // Assert
      expect(animal.getId()).toBe(animalData.id);
      expect(animal.getName()).toBe(animalData.name);
      expect(animal.getType()).toBe(animalData.type);
      expect(animal.getBreed()).toBe(animalData.breed);
      expect(animal.getAge()).toBe(animalData.age);
      expect(animal.getGender()).toBe(animalData.gender);
      expect(animal.getDescription()).toBe(animalData.description);
      expect(animal.getOwnerId()).toBe(animalData.ownerId);
      expect(animal.getImages()).toEqual(animalData.images);
      expect(animal.getStatus()).toBe(AnimalStatus.AVAILABLE);
      expect(animal.isAvailableForAdoption()).toBe(true);
    });

    it('should create an animal with id when id is not provided', () => {
      // Arrange & Act
      const animal = new AnimalEntity(
        null,
        'Rocky',
        AnimalType.DOG,
        'Labrador',
        3,
        AnimalGender.MALE,
        'A friendly and playful dog that loves to run in the park.',
        'owner-id',
      );

      // Assert
      expect(animal.getId()).toBeDefined();
    });

    it('should validate name length and throw error for short names', () => {
      // Arrange & Act & Assert
      expect(() => {
        new AnimalEntity(
          'test-id',
          'R', // Nombre muy corto
          AnimalType.DOG,
          'Labrador',
          3,
          AnimalGender.MALE,
          'A friendly and playful dog that loves to run in the park.',
          'owner-id',
        );
      }).toThrow(BusinessRuleValidationException);
    });

    it('should validate description length and throw error for short descriptions', () => {
      // Arrange & Act & Assert
      expect(() => {
        new AnimalEntity(
          'test-id',
          'Rocky',
          AnimalType.DOG,
          'Labrador',
          3,
          AnimalGender.MALE,
          'Short', // Descripción muy corta
          'owner-id',
        );
      }).toThrow(BusinessRuleValidationException);
    });

    it('should validate age and throw error for negative age', () => {
      // Arrange & Act & Assert
      expect(() => {
        new AnimalEntity(
          'test-id',
          'Rocky',
          AnimalType.DOG,
          'Labrador',
          -1, // Edad negativa
          AnimalGender.MALE,
          'A friendly and playful dog that loves to run in the park.',
          'owner-id',
        );
      }).toThrow(BusinessRuleValidationException);
    });
  });

  describe('methods', () => {
    let animal: AnimalEntity;

    beforeEach(() => {
      animal = new AnimalEntity(
        'test-id',
        'Rocky',
        AnimalType.DOG,
        'Labrador',
        3,
        AnimalGender.MALE,
        'A friendly and playful dog that loves to run in the park.',
        'owner-id',
        ['image1.jpg', 'image2.jpg'],
      );
    });

    it('should update info correctly', () => {
      // Arrange
      const newName = 'Max';
      const newType = AnimalType.CAT;
      const newBreed = 'Persian';
      const newAge = 4;
      const newGender = AnimalGender.FEMALE;
      const newDescription = 'A lovely cat that enjoys sleeping all day.';
      const newWeight = 10;
      const newHealthDetails = 'Healthy, all vaccines up to date.';
      const newVaccinated = true;
      const newSterilized = true;

      // Act
      animal.updateInfo(
        newName,
        newType,
        newBreed,
        newAge,
        newGender,
        newDescription,
        newWeight,
        newHealthDetails,
        newVaccinated,
        newSterilized,
      );

      // Assert
      expect(animal.getName()).toBe(newName);
      expect(animal.getType()).toBe(newType);
      expect(animal.getBreed()).toBe(newBreed);
      expect(animal.getAge()).toBe(newAge);
      expect(animal.getGender()).toBe(newGender);
      expect(animal.getDescription()).toBe(newDescription);
      expect(animal.getWeight()).toBe(newWeight);
      expect(animal.getHealthDetails()).toBe(newHealthDetails);
      expect(animal.isVaccinated()).toBe(newVaccinated);
      expect(animal.isSterilized()).toBe(newSterilized);
    });

    it('should add image correctly', () => {
      // Arrange
      const newImage = 'image3.jpg';
      const initialImagesCount = animal.getImages().length;

      // Act
      animal.addImage(newImage);

      // Assert
      expect(animal.getImages()).toContain(newImage);
      expect(animal.getImages().length).toBe(initialImagesCount + 1);
    });

    it('should remove image correctly', () => {
      // Arrange
      const imageToRemove = 'image1.jpg';
      const initialImagesCount = animal.getImages().length;

      // Act
      animal.removeImage(imageToRemove);

      // Assert
      expect(animal.getImages()).not.toContain(imageToRemove);
      expect(animal.getImages().length).toBe(initialImagesCount - 1);
    });

    it('should set images correctly', () => {
      // Arrange
      const newImages = ['newImage1.jpg', 'newImage2.jpg', 'newImage3.jpg'];

      // Act
      animal.setImages(newImages);

      // Assert
      expect(animal.getImages()).toEqual(newImages);
    });

    it('should make animal available for adoption correctly', () => {
      // Arrange
      animal.makeUnavailableForAdoption(); // First make unavailable to test making available

      // Act
      animal.makeAvailableForAdoption();

      // Assert
      expect(animal.isAvailableForAdoption()).toBe(true);
      expect(animal.getStatus()).toBe(AnimalStatus.AVAILABLE);
    });

    it('should make animal unavailable for adoption correctly', () => {
      // Act
      animal.makeUnavailableForAdoption();

      // Assert
      expect(animal.isAvailableForAdoption()).toBe(false);
      expect(animal.getStatus()).toBe(AnimalStatus.NOT_AVAILABLE);
    });

    it('should mark animal as adopted correctly', () => {
      // Act
      animal.markAsAdopted();

      // Assert
      expect(animal.isAvailableForAdoption()).toBe(false);
      expect(animal.getStatus()).toBe(AnimalStatus.ADOPTED);
    });

    it('should determine if animal can be adopted correctly', () => {
      // Initially animal is available
      expect(animal.canBeAdopted()).toBe(true);

      // Make unavailable
      animal.makeUnavailableForAdoption();
      expect(animal.canBeAdopted()).toBe(false);

      // Make available again
      animal.makeAvailableForAdoption();
      expect(animal.canBeAdopted()).toBe(true);

      // Mark as adopted
      animal.markAsAdopted();
      expect(animal.canBeAdopted()).toBe(false);
    });

    it('should convert to object correctly', () => {
      // Act
      const animalObject = animal.toObject();

      // Assert
      expect(animalObject).toEqual({
        id: 'test-id',
        name: 'Rocky',
        type: AnimalType.DOG,
        breed: 'Labrador',
        age: 3,
        gender: AnimalGender.MALE,
        description: 'A friendly and playful dog that loves to run in the park.',
        ownerId: 'owner-id',
        images: ['image1.jpg', 'image2.jpg'],
        status: AnimalStatus.AVAILABLE,
        availableForAdoption: true,
        weight: undefined,
        healthDetails: undefined,
        vaccinated: false,
        sterilized: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});