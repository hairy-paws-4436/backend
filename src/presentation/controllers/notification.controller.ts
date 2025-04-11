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

@ApiTags('Notificaciones')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener notificaciones del usuario' })
  @ApiQuery({
    name: 'unread',
    required: false,
    type: Boolean,
    description: 'Obtener solo notificaciones no leídas',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notificaciones obtenidas exitosamente',
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
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notificación marcada como leída exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notificación no encontrada',
  })
  async markAsRead(@Param('id', ParseUUIDPipe) id: string, @User() user) {
    await this.notificationService.markAsRead(id, user.id);
    return { message: 'Notificación marcada como leída' };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Todas las notificaciones marcadas como leídas exitosamente',
  })
  async markAllAsRead(@User() user) {
    await this.notificationService.markAllAsRead(user.id);
    return { message: 'Todas las notificaciones marcadas como leídas' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar notificación' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notificación eliminada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notificación no encontrada',
  })
  async deleteNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user,
  ) {
    await this.notificationService.delete(id, user.id);
    return { message: 'Notificación eliminada' };
  }
}
