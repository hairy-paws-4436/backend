import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
  } from 'typeorm';
  import { AdoptionStatus } from '../../../../core/domain/adoption/value-objects/adoption-status.enum';
  import { AdoptionType } from '../../../../core/domain/adoption/value-objects/adoption-type.enum';
  import { UserEntity } from './user.entity';
  import { AnimalEntity } from './animal.entity';
  
  @Entity('adoptions')
  export class AdoptionEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'animal_id' })
    @Index('idx_adoption_animal')
    animalId: string;
  
    @Column({ name: 'owner_id' })
    @Index('idx_adoption_owner')
    ownerId: string;
  
    @Column({ name: 'adopter_id' })
    @Index('idx_adoption_adopter')
    adopterId: string;
  
    @Column({
      type: 'enum',
      enum: AdoptionType,
      default: AdoptionType.ADOPTION,
    })
    type: AdoptionType;
  
    @Column({
      type: 'enum',
      enum: AdoptionStatus,
      default: AdoptionStatus.PENDING,
    })
    status: AdoptionStatus;
  
    @Column({ name: 'request_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    requestDate: Date;
  
    @Column({ name: 'approval_date', type: 'timestamp', nullable: true })
    approvalDate: Date;
  
    @Column({ name: 'rejection_date', type: 'timestamp', nullable: true })
    rejectionDate: Date;
  
    @Column({ name: 'visit_date', type: 'timestamp', nullable: true })
    visitDate: Date;
  
    @Column({ type: 'text', nullable: true })
    notes: string;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => AnimalEntity, (animal) => animal.adoptionRequests)
    @JoinColumn({ name: 'animal_id' })
    animal: AnimalEntity;
  
    @ManyToOne(() => UserEntity, (user) => user.receivedAdoptionRequests)
    @JoinColumn({ name: 'owner_id' })
    owner: UserEntity;
  
    @ManyToOne(() => UserEntity, (user) => user.adoptionRequests)
    @JoinColumn({ name: 'adopter_id' })
    adopter: UserEntity;
  }