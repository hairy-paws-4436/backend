import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnimalProfileEntity } from '../entities/animal-profile.entity';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';

@Injectable()
export class AnimalProfileRepository {
  constructor(
    @InjectRepository(AnimalProfileEntity)
    private readonly repository: Repository<AnimalProfileEntity>,
  ) {}

  async findByAnimalId(animalId: string): Promise<AnimalProfileEntity> {
    const profile = await this.repository.findOne({
      where: { animalId },
      relations: ['animal'],
    });

    if (!profile) {
      throw new EntityNotFoundException('Animal profile', animalId);
    }

    return profile;
  }

  async findByAnimalIdOptional(animalId: string): Promise<AnimalProfileEntity | null> {
    return await this.repository.findOne({
      where: { animalId },
      relations: ['animal'],
    });
  }

  async create(profileData: Partial<AnimalProfileEntity>): Promise<AnimalProfileEntity> {
    const profile = this.repository.create(profileData);
    return await this.repository.save(profile);
  }

  async update(animalId: string, updateData: Partial<AnimalProfileEntity>): Promise<AnimalProfileEntity> {
    await this.repository.update({ animalId }, updateData);
    return await this.findByAnimalId(animalId);
  }

  async delete(animalId: string): Promise<void> {
    const result = await this.repository.delete({ animalId });
    if (result.affected === 0) {
      throw new EntityNotFoundException('Animal profile', animalId);
    }
  }

  async exists(animalId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { animalId },
    });
    return count > 0;
  }

  async findByEnergyLevel(energyLevel: string): Promise<AnimalProfileEntity[]> {
    return await this.repository.find({
      where: { energyLevel: energyLevel as any },
      relations: ['animal'],
    });
  }

  async findBeginnerFriendly(): Promise<AnimalProfileEntity[]> {
    return await this.repository.find({
      where: { beginnerFriendly: true },
      relations: ['animal'],
    });
  }

  async findApartmentSuitable(): Promise<AnimalProfileEntity[]> {
    return await this.repository.find({
      where: { apartmentSuitable: true },
      relations: ['animal'],
    });
  }

  async findFamilyFriendly(): Promise<AnimalProfileEntity[]> {
    return await this.repository.find({
      where: { familyFriendly: true },
      relations: ['animal'],
    });
  }

  async findWithSpecialNeeds(): Promise<AnimalProfileEntity[]> {
    return await this.repository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.animal', 'animal')
      .where('profile.careLevel = :careLevel', { careLevel: 'special_needs' })
      .orWhere('profile.specialDiet = :specialDiet', { specialDiet: true })
      .orWhere('profile.chronicConditions IS NOT NULL')
      .orWhere('profile.medications IS NOT NULL')
      .getMany();
  }

  async findAll(): Promise<AnimalProfileEntity[]> {
    return await this.repository.find({
      relations: ['animal'],
    });
  }
}