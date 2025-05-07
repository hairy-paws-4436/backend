import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationController } from '../controllers/donation.controller';
import { DonationEntity } from '../../infrastructure/database/mysql/entities/donation.entity';

import { NotificationModule } from './notification.module';
import { OngModule } from './ong.module';
import { DonationRepository } from '../../infrastructure/database/mysql/repositories/donation.repository';
import { DonationService } from '../../application/services/donation.service';
import { DonationItemRepository } from '../../infrastructure/database/mysql/repositories/donation-item.repository';
import { AwsModule } from '../../infrastructure/services/aws/aws.module';
import { DonationItemEntity } from '../../infrastructure/database/mysql/entities/donation-items.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([DonationEntity, DonationItemEntity]),
    AwsModule,
    OngModule,
    NotificationModule,
  ],
  controllers: [DonationController],
  providers: [
    DonationRepository,
    DonationItemRepository,
    DonationService,
  ],
  exports: [
    DonationRepository,
    DonationItemRepository,
    DonationService,
  ],
})
export class DonationModule {}