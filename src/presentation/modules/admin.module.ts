import { Module } from '@nestjs/common';
import { AdminController } from '../controllers/admin.controller';
import { AdminService } from '../../application/services/admin.service';
import { UserModule } from './user.module';
import { OngModule } from './ong.module';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    UserModule,
    OngModule,
    NotificationModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
  ],
  exports: [
    AdminService,
  ],
})
export class AdminModule {}