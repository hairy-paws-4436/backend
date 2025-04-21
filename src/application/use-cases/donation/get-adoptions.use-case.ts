import { Injectable } from '@nestjs/common';
import { AdoptionEntity } from '../../../core/domain/adoption/adoption.entity';
import { AdoptionRepository } from '../../../infrastructure/database/mysql/repositories/adoption.repository';

interface GetAdoptionsFilters {
  ownerId?: string;
  adopterId?: string;
  animalId?: string;
  type?: string;
  status?: string;
}

@Injectable()
export class GetAdoptionsUseCase {
  constructor(
    private readonly adoptionRepository: AdoptionRepository,
  ) {}

  async execute(filters?: GetAdoptionsFilters): Promise<AdoptionEntity[]> {
    try {
      return await this.adoptionRepository.findAll(filters);
    } catch (error) {
      throw new Error(`Error getting adoption applications: ${error.message}`);
    }
  }
}