import { Injectable } from '@nestjs/common';
import { AnimalEntity } from '../../../core/domain/animal/animal.entity';
import { AnimalRepository } from '../../../infrastructure/database/mysql/repositories/animal.repository';
import { EntityNotFoundException } from '../../../core/exceptions/domain.exception';

@Injectable()
export class GetAnimalUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
  ) {}

  async execute(animalId: string): Promise<AnimalEntity> {
    try {
      return await this.animalRepository.findById(animalId);
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      throw new Error(`Error getting pet: ${error.message}`);
    }
  }
}