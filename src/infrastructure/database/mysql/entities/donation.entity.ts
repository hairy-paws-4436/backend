import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    OneToMany,
  } from 'typeorm';
  import { UserEntity } from './user.entity';
  import { OngEntity } from './ong.entity';
import { DonationStatus } from 'src/core/domain/donation/value-objects/donation-status.enum';
import { DonationType } from 'src/core/domain/donation/value-objects/donation-type.enum';
import { DonationItemEntity } from './donation-items.entity';

  
  @Entity('donations')
  export class DonationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'donor_id' })
    @Index('idx_donation_donor')
    donorId: string;
  
    @Column({ name: 'ong_id' })
    @Index('idx_donation_ong')
    ongId: string;
  
    @Column({
      type: 'enum',
      enum: DonationType,
      default: DonationType.MONEY,
    })
    type: DonationType;
  
    @Column({
      type: 'enum',
      enum: DonationStatus,
      default: DonationStatus.PENDING,
    })
    status: DonationStatus;
  
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    amount: number;
  
    @Column({ name: 'transaction_id', length: 100, nullable: true })
    transactionId: string;
  
    @Column({ name: 'confirmation_date', type: 'timestamp', nullable: true })
    confirmationDate: Date | null;
  
    @Column({ name: 'confirmed_by', length: 36, nullable: true })
    confirmedBy: string;
  
    @Column({ type: 'text', nullable: true })
    notes: string;
  
    @Column({ name: 'receipt_url', length: 255, nullable: true })
    receiptUrl: string;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  
    // Relaciones
    @ManyToOne(() => UserEntity, (user) => user.donations)
    @JoinColumn({ name: 'donor_id' })
    donor: UserEntity;
  
    @ManyToOne(() => OngEntity, (ong) => ong.donations)
    @JoinColumn({ name: 'ong_id' })
    ong: OngEntity;
  
    @OneToMany(() => DonationItemEntity, (item) => item.donation, {
      cascade: true,
      eager: true,
    })
    items: DonationItemEntity[];
  }