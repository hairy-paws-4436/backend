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
  import { DonationEntity } from './donation.entity';
  
  @Entity('donation_items')
  export class DonationItemEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'donation_id' })
    @Index('idx_donation_item_donation')
    donationId: string;
  
    @Column({ length: 100 })
    name: string;
  
    @Column({ type: 'int' })
    quantity: number;
  
    @Column({ length: 255, nullable: true })
    description: string;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  
    @ManyToOne(() => DonationEntity, (donation) => donation.items, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'donation_id' })
    donation: DonationEntity;

    

  }