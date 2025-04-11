import { Injectable } from '@nestjs/common';

import { S3Service } from '../../infrastructure/services/aws/s3.service';
import { NotificationService } from '../../infrastructure/services/notification/notification.service';
import { DonationType } from '../../core/domain/donation/value-objects/donation-type.enum';
import { DonationStatus } from '../../core/domain/donation/value-objects/donation-status.enum';
import { NotificationType } from '../../core/domain/notification/value-objects/notification-type.enum';
import { BusinessRuleValidationException } from '../../core/exceptions/domain.exception';
import { DonationItemRepository } from 'src/infrastructure/database/mysql/repositories/donation-item.repository';
import { DonationRepository } from 'src/infrastructure/database/mysql/repositories/donation.repository';

interface CreateDonationDto {
  donorId: string;
  ongId: string;
  type: DonationType;
  amount?: number;
  transactionId?: string;
  notes?: string;
  items?: Array<{
    name: string;
    quantity: number;
    description?: string;
  }>;
  receipt?: Express.Multer.File;
}

@Injectable()
export class DonationService {
  constructor(
    private readonly donationRepository: DonationRepository,
    private readonly donationItemRepository: DonationItemRepository,
    private readonly s3Service: S3Service,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Crea una nueva donación
   * @param createDonationDto Datos para crear la donación
   * @returns Donación creada
   */
  async createDonation(createDonationDto: CreateDonationDto) {
    // Validar tipo de donación y datos requeridos
    if (createDonationDto.type === DonationType.MONEY || createDonationDto.type === DonationType.BOTH) {
      if (!createDonationDto.amount || createDonationDto.amount <= 0) {
        throw new BusinessRuleValidationException(
          'Para donaciones de dinero, el monto debe ser mayor a 0',
        );
      }
    }
    
    if (createDonationDto.type === DonationType.ITEMS || createDonationDto.type === DonationType.BOTH) {
      if (!createDonationDto.items || createDonationDto.items.length === 0) {
        throw new BusinessRuleValidationException(
          'Para donaciones de artículos, debe especificar al menos un artículo',
        );
      }
    }
    
    // Subir recibo si se proporciona
    let receiptUrl: string | undefined;
    if (createDonationDto.receipt) {
      receiptUrl = await this.s3Service.uploadFile(
        createDonationDto.receipt.buffer,
        'donations',
        createDonationDto.receipt.originalname,
      );
    }
    
    // Crear donación
    const donationData = {
      donorId: createDonationDto.donorId,
      ongId: createDonationDto.ongId,
      type: createDonationDto.type,
      status: DonationStatus.PENDING,
      amount: createDonationDto.amount,
      transactionId: createDonationDto.transactionId,
      notes: createDonationDto.notes,
      receiptUrl,
    };
    
    const donation = await this.donationRepository.create(donationData);
    
    // Crear items de donación si aplica
    if (createDonationDto.items && createDonationDto.items.length > 0) {
      const itemsData = createDonationDto.items.map(item => ({
        donationId: donation.id,
        name: item.name,
        quantity: item.quantity,
        description: item.description,
      }));
      
      await this.donationItemRepository.createMany(itemsData);
    }
    
    // Obtener donación completa con items
    const completeDonation = await this.getDonationById(donation.id);
    
    // Enviar notificación a la ONG
    await this.notificationService.create({
      userId: createDonationDto.ongId, // Aquí asumimos que el userId de la notificación es el id de la ONG
      type: NotificationType.DONATION_RECEIVED,
      title: 'Nueva donación recibida',
      message: `Has recibido una nueva donación ${createDonationDto.type === DonationType.MONEY ? 'de dinero' : 
        createDonationDto.type === DonationType.ITEMS ? 'de artículos' : 'de dinero y artículos'}`,
      referenceId: donation.id,
      referenceType: 'donation',
    });
    
    return completeDonation;
  }

  /**
   * Obtiene donaciones con filtros
   * @param filters Filtros para las donaciones
   * @returns Lista de donaciones
   */
  async getDonations(filters: any = {}) {
    return await this.donationRepository.findAll(filters);
  }

  /**
   * Obtiene una donación por su ID
   * @param donationId ID de la donación
   * @returns Datos de la donación
   */
  async getDonationById(donationId: string) {
    return await this.donationRepository.findById(donationId);
  }

  /**
   * Confirma la recepción de una donación
   * @param donationId ID de la donación
   * @param confirmerId ID del usuario que confirma
   * @param notes Notas adicionales
   * @returns Donación actualizada
   */
  async confirmDonation(donationId: string, confirmerId: string, notes?: string) {
    // Verificar si la donación existe y está pendiente
    const donation = await this.donationRepository.findById(donationId);
    
    if (donation.status !== DonationStatus.PENDING) {
      throw new BusinessRuleValidationException(
        'Solo se pueden confirmar donaciones pendientes',
      );
    }
    
    // Actualizar donación
    const updateData = {
      status: DonationStatus.CONFIRMED,
      confirmationDate: new Date(),
      confirmedBy: confirmerId,
    };
    
    if (notes) {
      updateData['notes'] = notes;
    }
    
    const updatedDonation = await this.donationRepository.update(donationId, updateData);
    
    // Enviar notificación al donante
    await this.notificationService.create({
      userId: donation.donorId,
      type: NotificationType.DONATION_CONFIRMED,
      title: 'Donación confirmada',
      message: 'Tu donación ha sido confirmada. ¡Gracias por tu apoyo!',
      referenceId: donationId,
      referenceType: 'donation',
    });
    
    return updatedDonation;
  }

  /**
   * Cancela una donación
   * @param donationId ID de la donación
   * @returns Donación actualizada
   */
  async cancelDonation(donationId: string) {
    // Verificar si la donación existe y está pendiente
    const donation = await this.donationRepository.findById(donationId);
    
    if (donation.status !== DonationStatus.PENDING) {
      throw new BusinessRuleValidationException(
        'Solo se pueden cancelar donaciones pendientes',
      );
    }
    
    // Actualizar donación
    const updatedDonation = await this.donationRepository.update(donationId, {
      status: DonationStatus.CANCELLED,
    });
    
    return updatedDonation;
  }

  /**
   * Obtiene donaciones por donante
   * @param donorId ID del donante
   * @returns Lista de donaciones
   */
  async getDonationsByDonor(donorId: string) {
    return await this.donationRepository.findByDonorId(donorId);
  }

  /**
   * Obtiene donaciones por ONG
   * @param ongId ID de la ONG
   * @returns Lista de donaciones
   */
  async getDonationsByOng(ongId: string) {
    return await this.donationRepository.findByOngId(ongId);
  }
}