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

  /**
   * Crea una nueva ONG
   * @param createOngDto Datos para crear la ONG
   * @returns ONG creada
   */
  async createOng(createOngDto: CreateOngDto) {
    // Verificar si el RUC ya está registrado
    const rucExists = await this.ongRepository.exists({ ruc: createOngDto.ruc });
    if (rucExists) {
      throw new DuplicateEntityException('ONG', 'RUC', createOngDto.ruc);
    }
    
    // Verificar si el usuario existe y tiene el rol correcto
    const user = await this.userRepository.findById(createOngDto.userId);
    
    // Cambiar rol del usuario a ONG si no lo es
    if (user.getRole() !== UserRole.ONG) {
      user.changeRole(UserRole.ONG);
      await this.userRepository.update(user.getId(), user);
    }
    
    // Subir logo si se proporciona
    let logoUrl: string | undefined;
    if (createOngDto.logo) {
      logoUrl = await this.s3Service.uploadFile(
        createOngDto.logo.buffer,
        'ongs',
        createOngDto.logo.originalname,
      );
    }
    
    // Crear ONG
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
      verified: false, // Por defecto no verificada
      mission: createOngDto.mission,
      vision: createOngDto.vision,
      bankAccount: createOngDto.bankAccount,
      bankName: createOngDto.bankName,
      interbankAccount: createOngDto.interbankAccount,
    };
    
    return await this.ongRepository.create(ongData);
  }

  /**
   * Obtiene todas las ONGs
   * @param verified Filtro opcional por estado de verificación
   * @returns Lista de ONGs
   */
  async getAllOngs(verified?: boolean) {
    const filters = {};
    
    if (verified !== undefined) {
      filters['verified'] = verified;
    }
    
    return await this.ongRepository.findAll(filters);
  }

  /**
   * Obtiene una ONG por su ID
   * @param ongId ID de la ONG
   * @returns Datos de la ONG
   */
  async getOngById(ongId: string) {
    return await this.ongRepository.findById(ongId);
  }

  /**
   * Obtiene una ONG por el ID de usuario
   * @param userId ID del usuario
   * @returns Datos de la ONG
   */
  async getOngByUserId(userId: string) {
    try {
      return await this.ongRepository.findByUserId(userId);
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw new EntityNotFoundException('ONG para el usuario');
      }
      throw error;
    }
  }

  /**
   * Actualiza los datos de una ONG
   * @param ongId ID de la ONG
   * @param updateOngDto Datos a actualizar
   * @returns ONG actualizada
   */
  async updateOng(ongId: string, updateOngDto: UpdateOngDto) {
    // Verificar si la ONG existe
    const ong = await this.ongRepository.findById(ongId);
    
    // Preparar datos a actualizar
    const updateData = { ...updateOngDto };
    
    // Procesar logo si se proporciona
    if (updateOngDto.logo) {
      const logoUrl = await this.s3Service.uploadFile(
        updateOngDto.logo.buffer,
        'ongs',
        updateOngDto.logo.originalname,
      );
      
      // Eliminar logo anterior si existe
      if (ong.logoUrl) {
        try {
          await this.s3Service.deleteFile(ong.logoUrl);
        } catch (error) {
          console.error(`Error al eliminar logo anterior: ${error.message}`);
        }
      }
      
      updateData['logoUrl'] = logoUrl;
      delete updateData.logo;
    }
    
    // Actualizar ONG
    return await this.ongRepository.update(ongId, updateData);
  }

  /**
   * Verifica si un usuario tiene una ONG
   * @param userId ID del usuario
   * @returns true si el usuario tiene una ONG
   */
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