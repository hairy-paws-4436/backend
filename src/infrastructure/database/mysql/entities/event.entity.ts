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
  import { OngEntity } from './ong.entity';
  
  @Entity('events')
  export class EventEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'ong_id' })
    @Index('idx_event_ong')
    ongId: string;
  
    @Column({ length: 100 })
    title: string;
  
    @Column({ type: 'text' })
    description: string;
  
    @Column({ name: 'event_date', type: 'timestamp' })
    eventDate: Date;
  
    @Column({ name: 'end_date', type: 'timestamp', nullable: true })
    endDate: Date;
  
    @Column({ length: 255 })
    location: string;
  
    @Column({ name: 'image_url', length: 255, nullable: true })
    imageUrl: string;
  
    @Column({ default: true })
    active: boolean;
  
    @Column({ name: 'is_volunteer_event', default: false })
    isVolunteerEvent: boolean;
  
    @Column({ name: 'max_participants', type: 'int', nullable: true })
    maxParticipants: number;
  
    @Column({ type: 'text', nullable: true })
    requirements: string;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  
    @ManyToOne(() => OngEntity, (ong) => ong.events)
    @JoinColumn({ name: 'ong_id' })
    ong: OngEntity;
  }