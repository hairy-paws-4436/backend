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
import { AuthModule } from './infrastructure/services/auth/auth.module';

@Module({
  imports: [
    // Configuración
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    
    // Base de datos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: TypeOrmConfigService,
    }),
    
    // Servicios de infraestructura
    AwsModule,
    
    // Módulos de la aplicación
    AuthModule,
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