import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
    BeforeInsert,
    BeforeUpdate,
  } from 'typeorm';
  import { UserRole } from '../../../../core/domain/user/value-objects/user-role.enum';

  import * as bcrypt from 'bcrypt';
  import { AnimalEntity } from './animal.entity';
import { UserStatus } from 'src/core/domain/user/value-objects/user-status';
import { AdoptionEntity } from './adoption.entity';
import { DonationEntity } from './donation.entity';
import { NotificationEntity } from './notification.entity';

  
  @Entity('users')
  export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ length: 100, unique: true })
    @Index('idx_user_email', { unique: true })
    email: string;
  
    @Column({ length: 100 })
    password: string;
  
    @Column({ name: 'first_name', length: 50 })
    firstName: string;
  
    @Column({ name: 'last_name', length: 50 })
    lastName: string;
  
    @Column({ name: 'phone_number', length: 9, unique: true })
    @Index('idx_user_phone_number', { unique: true })
    phoneNumber: string;
  
    @Column({
      type: 'enum',
      enum: UserRole,
      default: UserRole.ADOPTER,
    })
    role: UserRole;
  
    @Column({
      type: 'enum',
      enum: UserStatus,
      default: UserStatus.ACTIVE,
    })
    status: UserStatus;
  
    @Column({ default: false })
    verified: boolean;
  
    @Column({ length: 255, nullable: true })
    address: string;
  
    @Column({ name: 'profile_image_url', length: 255, nullable: true })
    profileImageUrl: string;
  
    @Column({ name: 'two_factor_secret', length: 255, nullable: true })
    twoFactorSecret: string;
  
    @Column({ name: 'two_factor_enabled', default: false })
    twoFactorEnabled: boolean;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  
    // Relaciones
    @OneToMany(() => AnimalEntity, (animal) => animal.owner)
    animals: AnimalEntity[];
  
    @OneToMany(() => AdoptionEntity, (adoption) => adoption.adopter)
    adoptionRequests: AdoptionEntity[];
  
    @OneToMany(() => AdoptionEntity, (adoption) => adoption.owner)
    receivedAdoptionRequests: AdoptionEntity[];
  
    @OneToMany(() => DonationEntity, (donation) => donation.donor)
    donations: DonationEntity[];
  
    @OneToMany(() => NotificationEntity, (notification) => notification.user)
    notifications: NotificationEntity[];
  
    // Hooks
    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
      // Solo hashear si la contraseña ha sido modificada
      if (this.password && this.password.substring(0, 7) !== '$2b$10$') {
        this.password = await bcrypt.hash(this.password, 10);
      }
    }
  
    // Métodos
    async comparePassword(attempt: string): Promise<boolean> {
      return bcrypt.compare(attempt, this.password);
    }
  }