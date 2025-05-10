import { Injectable } from '@nestjs/common';

import { S3Service } from '../../infrastructure/services/aws/s3.service';
import { NotificationService } from '../../infrastructure/services/notification/notification.service';
import { DonationType } from '../../core/domain/donation/value-objects/donation-type.enum';
import { DonationStatus } from '../../core/domain/donation/value-objects/donation-status.enum';
import { NotificationType } from '../../core/domain/notification/value-objects/notification-type.enum';
import { BusinessRuleValidationException } from '../../core/exceptions/domain.exception';
import { DonationRepository } from '../../infrastructure/database/mysql/repositories/donation.repository';
import { DonationItemRepository } from '../../infrastructure/database/mysql/repositories/donation-item.repository';
import { OngRepository } from '../../infrastructure/database/mysql/repositories/ong.repository';
import { CreateDonationDto } from '../../presentation/dtos/requests/create-donation.dto';

@Injectable()
export class DonationService {
  constructor(
    private readonly donationRepository: DonationRepository,
    private readonly donationItemRepository: DonationItemRepository,
    private readonly notificationService: NotificationService,
    private readonly ongRepository: OngRepository,
  ) {}

  async createDonation(createDonationDto: CreateDonationDto) {
    if (createDonationDto.type === DonationType.MONEY || createDonationDto.type === DonationType.BOTH) {
      if (!createDonationDto.amount || createDonationDto.amount <= 0) {
        throw new BusinessRuleValidationException(
          'For money donations, the amount must be greater than 0',
        );
      }
    }

    if (createDonationDto.type === DonationType.ITEMS || createDonationDto.type === DonationType.BOTH) {
      if (!createDonationDto.items || createDonationDto.items.length === 0) {
        throw new BusinessRuleValidationException(
          'For item donations, at least one item must be specified',
        );
      }
    }

    const donationData = {
      donorId: createDonationDto.donorId,
      ongId: createDonationDto.ongId,
      type: createDonationDto.type,
      status: DonationStatus.PENDING,
      amount: createDonationDto.amount,
      transactionId: createDonationDto.transactionId,
      notes: createDonationDto.notes,
    };

    const donation = await this.donationRepository.create(donationData);

    if (createDonationDto.items && Array.isArray(createDonationDto.items)) {
      const itemsData = createDonationDto.items.map(item => ({
        donationId: donation.id,
        name: item.name,
        quantity: item.quantity,
        description: item.description,
      }));

      await this.donationItemRepository.createMany(itemsData);
    }

    const completeDonation = await this.getDonationById(donation.id);

    try {
      const ong = await this.ongRepository.findById(createDonationDto.ongId);

      await this.notificationService.create({
        userId: ong.userId,
        type: NotificationType.DONATION_RECEIVED,
        title: 'New donation received',
        message: `You have received a new donation ${createDonationDto.type === DonationType.MONEY ? 'of money' : 
          createDonationDto.type === DonationType.ITEMS ? 'of items' : 'of money and items'}`,
        referenceId: donation.id,
        referenceType: 'donation',
      });
    } catch (error) {
      console.error('Error sending notification to ONG:', error.message);
    }

    return completeDonation;
  }

  async getDonations(filters: any = {}) {
    return await this.donationRepository.findAll(filters);
  }

  async getDonationById(donationId: string) {
    return await this.donationRepository.findById(donationId);
  }

  async confirmDonation(donationId: string, confirmerId: string, notes?: string) {
    const donation = await this.donationRepository.findById(donationId);

    if (donation.status !== DonationStatus.PENDING) {
      throw new BusinessRuleValidationException(
        'Only pending donations can be confirmed',
      );
    }

    const updateData = {
      status: DonationStatus.CONFIRMED,
      confirmationDate: new Date(),
      confirmedBy: confirmerId,
    };

    if (notes) {
      updateData['notes'] = notes;
    }

    const updatedDonation = await this.donationRepository.update(donationId, updateData);

    try {
      await this.notificationService.create({
        userId: donation.donorId,
        type: NotificationType.DONATION_CONFIRMED,
        title: 'Donation confirmed',
        message: 'Your donation has been confirmed. Thank you for your support!',
        referenceId: donationId,
        referenceType: 'donation',
      });
    } catch (error) {
      console.error('Error sending notification to donor:', error.message);
    }

    return updatedDonation;
  }

  async cancelDonation(donationId: string) {
    const donation = await this.donationRepository.findById(donationId);

    if (donation.status !== DonationStatus.PENDING) {
      throw new BusinessRuleValidationException(
        'Only pending donations can be canceled',
      );
    }

    const updatedDonation = await this.donationRepository.update(donationId, {
      status: DonationStatus.CANCELLED,
    });

    return updatedDonation;
  }

  async getDonationsByDonor(donorId: string) {
    return await this.donationRepository.findByDonorId(donorId);
  }

  async getDonationsByOng(ongId: string) {
    return await this.donationRepository.findByOngId(ongId);
  }
}
