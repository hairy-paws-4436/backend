import { Injectable } from '@nestjs/common';
import { AnimalEntity } from '../../../core/domain/animal/animal.entity';
import { AnimalRepository } from '../../../infrastructure/database/mysql/repositories/animal.repository';
import { S3Service } from '../../../infrastructure/services/aws/s3.service';
import { AnimalType } from '../../../core/domain/animal/value-objects/animal-type.enum';
import { AnimalGender } from '../../../core/domain/animal/value-objects/animal-gender.enum';
import { BusinessRuleValidationException } from '../../../core/exceptions/domain.exception';

interface CreateAnimalDto {
  name: string;
  type: AnimalType;
  breed: string;
  age: number;
  gender: AnimalGender;
  description: string;
  ownerId: string;
  weight?: number;
  healthDetails?: string;
  vaccinated: boolean;
  sterilized: boolean;
  images?: Express.Multer.File[];
}

@Injectable()
export class CreateAnimalUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(createAnimalDto: CreateAnimalDto): Promise<AnimalEntity> {
    try {
      let imageUrls: string[] = [];
      if (createAnimalDto.images && createAnimalDto.images.length > 0) {
        const imageBuffers = createAnimalDto.images.map(file => file.buffer);
        const originalNames = createAnimalDto.images.map(file => file.originalname);
        imageUrls = await this.s3Service.uploadMultipleFiles(
          imageBuffers,
          'animals',
          originalNames,
        );
      }

      const animalEntity = new AnimalEntity(
        null,
        createAnimalDto.name,
        createAnimalDto.type,
        createAnimalDto.breed,
        createAnimalDto.age,
        createAnimalDto.gender,
        createAnimalDto.description,
        createAnimalDto.ownerId,
        imageUrls,
        undefined,
        true,
        createAnimalDto.weight,
        createAnimalDto.healthDetails,
        createAnimalDto.vaccinated,
        createAnimalDto.sterilized
      );

      return await this.animalRepository.create(animalEntity);
    } catch (error) {
      if (error instanceof BusinessRuleValidationException) {
        throw error;
      }
      throw new Error(`Error creating animal: ${error.message}`);
    }
  }
}
