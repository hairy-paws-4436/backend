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
import { NotificationType } from '../../../../core/domain/notification/value-objects/notification-type.enum';
import { UserEntity } from './user.entity';


  
  @Entity('notifications')
  export class NotificationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'user_id' })
    @Index('idx_notification_user')
    userId: string;
  
    @Column({
      type: 'enum',
      enum: NotificationType,
      default: NotificationType.GENERAL,
    })
    type: NotificationType;
  
    @Column({ length: 255 })
    title: string;
  
    @Column({ type: 'text' })
    message: string;
  
    @Column({ default: false })
    read: boolean;
  
    @Column({ name: 'reference_id', length: 36, nullable: true })
    referenceId: string;
  
    @Column({ name: 'reference_type', length: 50, nullable: true })
    referenceType: string;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  
    @ManyToOne(() => UserEntity, (user) => user.notifications)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;
  }