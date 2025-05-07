import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity as UserOrmEntity } from '../entities/user.entity';
import { UserEntity as UserDomainEntity } from '../../../../core/domain/user/user.entity';
import { IUserRepository } from '../../../../core/interfaces/repositories/base-repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { UserRole } from '../../../../core/domain/user/value-objects/user-role.enum';
import { UserStatus } from '../../../../core/domain/user/value-objects/user-status';


@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
  ) {}

  async findAll(filters?: any): Promise<UserDomainEntity[]> {
    const users = await this.userRepository.find({
      where: filters,
      order: { createdAt: 'DESC' },
    });

    return users.map(user => this.toDomainEntity(user));
  }

  async findById(id: string): Promise<UserDomainEntity> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new EntityNotFoundException('User', id);
    }

    return this.toDomainEntity(user);
  }

  async findOne(filters: any): Promise<UserDomainEntity> {
    const user = await this.userRepository.findOne({
      where: filters,
    });

    if (!user) {
      throw new EntityNotFoundException('User');
    }

    return this.toDomainEntity(user);
  }

  async findOneForAuth(filters: any): Promise<any> {
    return await this.userRepository.findOne({
      where: filters,
    });
  }

  async findByEmail(email: string): Promise<UserDomainEntity> {
    try {
      return await this.findOne({ email: email.toLowerCase() });
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw new EntityNotFoundException('User with email');
      }
      throw error;
    }
  }

  async findByPhoneNumber(phoneNumber: string): Promise<UserDomainEntity> {
    try {
      return await this.findOne({ phoneNumber });
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw new EntityNotFoundException('User with phone number');
      }
      throw error;
    }
  }

  async create(entity: UserDomainEntity): Promise<UserDomainEntity> {
    const userData = this.toOrmEntity(entity);
    const createdUser = await this.userRepository.save(userData);
    return this.toDomainEntity(createdUser);
  }

  async update(id: string, entity: Partial<UserDomainEntity>): Promise<UserDomainEntity> {
    const user = await this.findById(id);
    const updatedData = this.toOrmEntity(entity as UserDomainEntity);
    
    await this.userRepository.update(id, updatedData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.delete(id);
  }

  async exists(filters: any): Promise<boolean> {
    const count = await this.userRepository.count({
      where: filters,
    });
    
    return count > 0;
  }

  async updateTwoFactorSecret(userId: string, secret: string): Promise<void> {
    await this.userRepository.update(userId, {
      twoFactorSecret: secret,
    });
  }

  async verifyUser(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      verified: true,
    });
  }

  private toDomainEntity(ormEntity: UserOrmEntity): UserDomainEntity {
    return new UserDomainEntity(
      ormEntity.id,
      ormEntity.email,
      ormEntity.password,
      ormEntity.firstName,
      ormEntity.lastName,
      ormEntity.phoneNumber,
      ormEntity.role as UserRole,
      ormEntity.status as UserStatus,
      ormEntity.verified,
      ormEntity.address,
      ormEntity.profileImageUrl,
      ormEntity.twoFactorSecret,
      ormEntity.twoFactorEnabled,
      ormEntity.identityDocument,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  private toOrmEntity(domainEntity: UserDomainEntity): Partial<UserOrmEntity> {
    const entityData = domainEntity.toObject();
    
    return {
      id: entityData.id,
      email: entityData.email,
      password: entityData.password,
      firstName: entityData.firstName,
      lastName: entityData.lastName,
      phoneNumber: entityData.phoneNumber,
      role: entityData.role,
      status: entityData.status,
      verified: entityData.verified,
      address: entityData.address,
      profileImageUrl: entityData.profileImageUrl,
      twoFactorSecret: entityData.twoFactorSecret,
      twoFactorEnabled: entityData.twoFactorEnabled,
    };
  }
}
