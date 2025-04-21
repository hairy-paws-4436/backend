import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
  Query,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { NotificationService } from '../../infrastructure/services/notification/notification.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({
    name: 'unread',
    required: false,
    type: Boolean,
    description: 'Get only unread notifications',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications successfully retrieved',
  })
  async getNotifications(@User() user, @Query('unread') unread?: string) {
    const notifications = await this.notificationService.getByUserId(
      user.id,
      unread === 'true',
    );

    return notifications;
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification successfully marked as read',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async markAsRead(@Param('id', ParseUUIDPipe) id: string, @User() user) {
    await this.notificationService.markAsRead(id, user.id);
    return { message: 'Notification marked as read' };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications successfully marked as read',
  })
  async markAllAsRead(@User() user) {
    await this.notificationService.markAllAsRead(user.id);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async deleteNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user,
  ) {
    await this.notificationService.delete(id, user.id);
    return { message: 'Notification deleted' };
  }
}
