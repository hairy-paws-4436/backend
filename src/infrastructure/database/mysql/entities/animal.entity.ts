import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
  } from 'typeorm';
  import { AnimalType } from '../../../../core/domain/animal/value-objects/animal-type.enum';
  import { AnimalGender } from '../../../../core/domain/animal/value-objects/animal-gender.enum';

  import { AnimalImageEntity } from './animal-image.entity';

import { AdoptionEntity } from './adoption.entity';
import { UserEntity } from './user.entity';
import { AnimalStatus } from '../../../../core/domain/animal/value-objects/animal-status';
  
  @Entity('animals')
  export class AnimalEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ length: 50 })
    name: string;
  
    @Column({
      type: 'enum',
      enum: AnimalType,
      default: AnimalType.OTHER,
    })
    type: AnimalType;
  
    @Column({ length: 50 })
    breed: string;
  
    @Column({ type: 'int' })
    age: number;
  
    @Column({
      type: 'enum',
      enum: AnimalGender,
      default: AnimalGender.MALE,
    })
    gender: AnimalGender;
  
    @Column({ type: 'text' })
    description: string;
  
    @Column({ name: 'owner_id' })
    @Index('idx_animal_owner')
    ownerId: string;
  
    @Column({
      type: 'enum',
      enum: AnimalStatus,
      default: AnimalStatus.AVAILABLE,
    })
    status: AnimalStatus;
  
    @Column({ name: 'available_for_adoption', default: true })
    availableForAdoption: boolean;
  
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    weight: number;
  
    @Column({ name: 'health_details', type: 'text', nullable: true })
    healthDetails: string;
  
    @Column({ default: false })
    vaccinated: boolean;
  
    @Column({ default: false })
    sterilized: boolean;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  
    @ManyToOne(() => UserEntity, (user) => user.animals)
    @JoinColumn({ name: 'owner_id' })
    owner: UserEntity;
  
    @OneToMany(() => AdoptionEntity, (adoption) => adoption.animal)
    adoptionRequests: AdoptionEntity[];
  
    @OneToMany(() => AnimalImageEntity, (image) => image.animal, {
      cascade: true,
      eager: true,
    })
    images: AnimalImageEntity[];
  }