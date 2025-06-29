import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './infrastructure/database/typeorm-config.service';

import { AwsModule } from './infrastructure/services/aws/aws.module';
import { AdminModule } from './presentation/modules/admin.module';
import { AdoptionModule } from './presentation/modules/adoption.module';
import { AnimalModule } from './presentation/modules/animal.module';

import { DonationModule } from './presentation/modules/donation.module';
import { EventModule } from './presentation/modules/event.module';
import { NotificationModule } from './presentation/modules/notification.module';
import { OngModule } from './presentation/modules/ong.module';
import { UserModule } from './presentation/modules/user.module';
import { AuthModule } from './presentation/modules/auth.module';
import { EnhancedFeaturesModule } from './presentation/modules/enhanced-features.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: TypeOrmConfigService,
    }),
    AwsModule,
    AuthModule,
    EnhancedFeaturesModule,
    UserModule,
    AnimalModule,
    AdoptionModule,
    OngModule,
    EventModule,
    DonationModule,
    AdminModule,
    NotificationModule,
  ],
})
export class AppModule {}