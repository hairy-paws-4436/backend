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
  import { AnimalEntity } from './animal.entity';
  
  @Entity('animal_images')
  export class AnimalImageEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'animal_id' })
    @Index('idx_animal_image_animal')
    animalId: string;
  
    @Column({ name: 'image_url', length: 255 })
    imageUrl: string;
  
    @Column({ nullable: true })
    description: string;
  
    @Column({ default: false })
    main: boolean;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  
    // Relaciones
    @ManyToOne(() => AnimalEntity, (animal) => animal.images, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'animal_id' })
    animal: AnimalEntity;
  }