import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnimalEntity as AnimalOrmEntity } from '../entities/animal.entity';
import { AnimalImageEntity } from '../entities/animal-image.entity';
import { AnimalEntity as AnimalDomainEntity } from '../../../../core/domain/animal/animal.entity';
import { IAnimalRepository } from '../../../../core/interfaces/repositories/base-repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { AnimalType } from '../../../../core/domain/animal/value-objects/animal-type.enum';
import { AnimalGender } from '../../../../core/domain/animal/value-objects/animal-gender.enum';
import { AnimalStatus } from '../../../../core/domain/animal/value-objects/animal-status';


@Injectable()
export class AnimalRepository implements IAnimalRepository {
  constructor(
    @InjectRepository(AnimalOrmEntity)
    private readonly animalRepository: Repository<AnimalOrmEntity>,
    @InjectRepository(AnimalImageEntity)
    private readonly animalImageRepository: Repository<AnimalImageEntity>,
  ) {}

  async findAll(filters?: any): Promise<AnimalDomainEntity[]> {
    const animals = await this.animalRepository.find({
      where: filters,
      relations: ['images'],
      order: { createdAt: 'DESC' },
    });

    return animals.map(animal => this.toDomainEntity(animal));
  }

  async findById(id: string): Promise<AnimalDomainEntity> {
    const animal = await this.animalRepository.findOne({
      where: { id },
      relations: ['images'],
    });

    if (!animal) {
      throw new EntityNotFoundException('Animal', id);
    }

    return this.toDomainEntity(animal);
  }

  async findOne(filters: any): Promise<AnimalDomainEntity> {
    const animal = await this.animalRepository.findOne({
      where: filters,
      relations: ['images'],
    });

    if (!animal) {
      throw new EntityNotFoundException('Animal');
    }

    return this.toDomainEntity(animal);
  }

  async findByOwnerId(ownerId: string): Promise<AnimalDomainEntity[]> {
    const animals = await this.animalRepository.find({
      where: { ownerId },
      relations: ['images'],
      order: { createdAt: 'DESC' },
    });

    return animals.map(animal => this.toDomainEntity(animal));
  }

  async findAvailableForAdoption(): Promise<AnimalDomainEntity[]> {
    const animals = await this.animalRepository.find({
      where: { 
        availableForAdoption: true,
        status: AnimalStatus.AVAILABLE
      },
      relations: ['images'],
      order: { createdAt: 'DESC' },
    });

    return animals.map(animal => this.toDomainEntity(animal));
  }

  async create(entity: AnimalDomainEntity): Promise<AnimalDomainEntity> {
    const animalData = this.toOrmEntity(entity);
    const imageUrls = entity.getImages();
    
    delete animalData.images;
    const createdAnimal = await this.animalRepository.save(animalData);
    
    if (imageUrls && imageUrls.length > 0) {
      const imageEntities = imageUrls.map((url, index) => ({
        animalId: createdAnimal.id,
        imageUrl: url,
        main: index === 0,
      }));
      
      await this.animalImageRepository.save(imageEntities);
    }
    
    return this.findById(createdAnimal.id);
  }

  async update(id: string, entity: Partial<AnimalDomainEntity>): Promise<AnimalDomainEntity> {
    const animal = await this.findById(id);
    const animalData = this.toOrmEntity(entity as AnimalDomainEntity);
    
    delete animalData.images;
    await this.animalRepository.update(id, animalData);
    
    if (entity instanceof AnimalDomainEntity && entity.getImages) {
      const newImageUrls = entity.getImages();
      
      if (newImageUrls && newImageUrls.length > 0) {
        await this.animalImageRepository.delete({ animalId: id });
        
        const imageEntities = newImageUrls.map((url, index) => ({
          animalId: id,
          imageUrl: url,
          main: index === 0,
        }));
        
        await this.animalImageRepository.save(imageEntities);
      }
    }
    
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const animal = await this.findById(id);
    
    await this.animalImageRepository.delete({ animalId: id });
    
    await this.animalRepository.delete(id);
  }

  async exists(filters: any): Promise<boolean> {
    const count = await this.animalRepository.count({
      where: filters,
    });
    
    return count > 0;
  }

  private toDomainEntity(ormEntity: AnimalOrmEntity): AnimalDomainEntity {
    const imageUrls = ormEntity.images 
      ? ormEntity.images.map(image => image.imageUrl)
      : [];
    
    return new AnimalDomainEntity(
      ormEntity.id,
      ormEntity.name,
      ormEntity.type as AnimalType,
      ormEntity.breed,
      ormEntity.age,
      ormEntity.gender as AnimalGender,
      ormEntity.description,
      ormEntity.ownerId,
      imageUrls,
      ormEntity.status as AnimalStatus,
      ormEntity.availableForAdoption,
      ormEntity.weight,
      ormEntity.healthDetails,
      ormEntity.vaccinated,
      ormEntity.sterilized,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  private toOrmEntity(domainEntity: AnimalDomainEntity): Partial<AnimalOrmEntity> & {images?: any[]} {
    const entityData = domainEntity.toObject();
    
    const images = entityData.images 
      ? entityData.images.map((url, index) => ({
          imageUrl: url,
          main: index === 0,
        }))
      : [];
    
    return {
      id: entityData.id,
      name: entityData.name,
      type: entityData.type,
      breed: entityData.breed,
      age: entityData.age,
      gender: entityData.gender,
      description: entityData.description,
      ownerId: entityData.ownerId,
      status: entityData.status,
      availableForAdoption: entityData.availableForAdoption,
      weight: entityData.weight,
      healthDetails: entityData.healthDetails,
      vaccinated: entityData.vaccinated,
      sterilized: entityData.sterilized,
      images: entityData.images,
    };
  }
}