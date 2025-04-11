import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    OneToOne,
    JoinColumn,
    Index,
  } from 'typeorm';
  import { UserEntity } from './user.entity';
import { EventEntity } from './event.entity';
import { DonationEntity } from './donation.entity';

  
  @Entity('ongs')
  export class OngEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'user_id', unique: true })
    @Index('idx_ong_user_id', { unique: true })
    userId: string;
  
    @Column({ length: 100 })
    name: string;
  
    @Column({ unique: true })
    @Index('idx_ong_ruc', { unique: true })
    ruc: string;
  
    @Column({ type: 'text' })
    description: string;
  
    @Column({ name: 'logo_url', length: 255, nullable: true })
    logoUrl: string;
  
    @Column({ length: 255 })
    address: string;
  
    @Column({ length: 9 })
    phone: string;
  
    @Column({ length: 100 })
    email: string;
  
    @Column({ length: 255, nullable: true })
    website: string;
  
    @Column({ default: false })
    verified: boolean;
  
    @Column({ name: 'bank_account', length: 20, nullable: true })
    bankAccount: string;
  
    @Column({ name: 'bank_name', length: 100, nullable: true })
    bankName: string;
  
    @Column({ name: 'interbank_account', length: 20, nullable: true })
    interbankAccount: string;
  
    @Column({ type: 'text', nullable: true })
    mission: string;
  
    @Column({ type: 'text', nullable: true })
    vision: string;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  
    // Relaciones
    @OneToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;
  
    @OneToMany(() => EventEntity, (event) => event.ong)
    events: EventEntity[];
  
    @OneToMany(() => DonationEntity, (donation) => donation.ong)
    donations: DonationEntity[];
  }