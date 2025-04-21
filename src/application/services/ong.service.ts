import { Injectable } from '@nestjs/common';

import { UserRepository } from '../../infrastructure/database/mysql/repositories/user.repository';
import { S3Service } from '../../infrastructure/services/aws/s3.service';
import { UserRole } from '../../core/domain/user/value-objects/user-role.enum';
import { DuplicateEntityException, EntityNotFoundException } from '../../core/exceptions/domain.exception';
import { OngRepository } from 'src/infrastructure/database/mysql/repositories/ong.repository';

interface CreateOngDto {
  userId: string;
  name: string;
  ruc: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  mission?: string;
  vision?: string;
  bankAccount?: string;
  bankName?: string;
  interbankAccount?: string;
  logo?: Express.Multer.File;
}

interface UpdateOngDto {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  mission?: string;
  vision?: string;
  bankAccount?: string;
  bankName?: string;
  interbankAccount?: string;
  logo?: Express.Multer.File;
}

@Injectable()
export class OngService {
  constructor(
    private readonly ongRepository: OngRepository,
    private readonly userRepository: UserRepository,
    private readonly s3Service: S3Service,
  ) {}

  async createOng(createOngDto: CreateOngDto) {
    const rucExists = await this.ongRepository.exists({ ruc: createOngDto.ruc });
    if (rucExists) {
      throw new DuplicateEntityException('NGO', 'RUC', createOngDto.ruc);
    }
    
    const user = await this.userRepository.findById(createOngDto.userId);
    
    if (user.getRole() !== UserRole.ONG) {
      user.changeRole(UserRole.ONG);
      await this.userRepository.update(user.getId(), user);
    }
    
    let logoUrl: string | undefined;
    if (createOngDto.logo) {
      logoUrl = await this.s3Service.uploadFile(
        createOngDto.logo.buffer,
        'ongs',
        createOngDto.logo.originalname,
      );
    }
    
    const ongData = {
      userId: createOngDto.userId,
      name: createOngDto.name,
      ruc: createOngDto.ruc,
      description: createOngDto.description,
      address: createOngDto.address,
      phone: createOngDto.phone,
      email: createOngDto.email,
      website: createOngDto.website,
      logoUrl,
      verified: false,
      mission: createOngDto.mission,
      vision: createOngDto.vision,
      bankAccount: createOngDto.bankAccount,
      bankName: createOngDto.bankName,
      interbankAccount: createOngDto.interbankAccount,
    };
    
    return await this.ongRepository.create(ongData);
  }

  async getAllOngs(verified?: boolean) {
    const filters = {};
    
    if (verified !== undefined) {
      filters['verified'] = verified;
    }
    
    return await this.ongRepository.findAll(filters);
  }

  async getOngById(ongId: string) {
    return await this.ongRepository.findById(ongId);
  }

  async getOngByUserId(userId: string) {
    try {
      return await this.ongRepository.findByUserId(userId);
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw new EntityNotFoundException('NGO for the user');
      }
      throw error;
    }
  }

  async updateOng(ongId: string, updateOngDto: UpdateOngDto) {
    const ong = await this.ongRepository.findById(ongId);
    
    const updateData = { ...updateOngDto };
    
    if (updateOngDto.logo) {
      const logoUrl = await this.s3Service.uploadFile(
        updateOngDto.logo.buffer,
        'ongs',
        updateOngDto.logo.originalname,
      );
      
      if (ong.logoUrl) {
        try {
          await this.s3Service.deleteFile(ong.logoUrl);
        } catch (error) {
          console.error(`Error deleting previous logo: ${error.message}`);
        }
      }
      
      updateData['logoUrl'] = logoUrl;
      delete updateData.logo;
    }
    
    return await this.ongRepository.update(ongId, updateData);
  }

  async hasOng(userId: string): Promise<boolean> {
    try {
      await this.ongRepository.findByUserId(userId);
      return true;
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        return false;
      }
      throw error;
    }
  }
}
