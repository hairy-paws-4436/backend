import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationController } from '../controllers/donation.controller';
import { DonationEntity } from '../../infrastructure/database/mysql/entities/donation.entity';
import { DonationService } from 'src/application/services/donation.service';
import { DonationItemEntity } from 'src/infrastructure/database/mysql/entities/donation-items.entity';
import { DonationItemRepository } from 'src/infrastructure/database/mysql/repositories/donation-item.repository';
import { DonationRepository } from 'src/infrastructure/database/mysql/repositories/donation.repository';
import { AwsModule } from 'src/infrastructure/services/aws/aws.module';
import { NotificationModule } from './notification.module';
import { OngModule } from './ong.module';


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