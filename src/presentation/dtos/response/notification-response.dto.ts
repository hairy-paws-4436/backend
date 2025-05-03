import { NotificationEntity } from "src/infrastructure/database/mysql/entities/notification.entity";

export class NotificationResponseDto {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    referenceId: string;
    referenceType: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      verified: boolean;
      profileImageUrl: string;
    };
    
    constructor(notification: NotificationEntity) {
      this.id = notification.id;
      this.type = notification.type;
      this.title = notification.title;
      this.message = notification.message;
      this.read = notification.read;
      this.referenceId = notification.referenceId;
      this.referenceType = notification.referenceType;
      this.createdAt = notification.createdAt;
      this.updatedAt = notification.updatedAt;
      
      if (notification.user) {
        this.user = {
          id: notification.user.id,
          firstName: notification.user.firstName,
          lastName: notification.user.lastName,
          email: notification.user.email,
          phoneNumber: notification.user.phoneNumber,
          verified: notification.user.verified,
          profileImageUrl: notification.user.profileImageUrl,
        };
      }
    }
  }