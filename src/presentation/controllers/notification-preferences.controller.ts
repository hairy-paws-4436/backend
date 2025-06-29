import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { UpdateNotificationPreferencesDto } from '../dtos/requests/update-notification-preferences.dto';
import { NotificationPreferencesService } from '../../application/services/notification-preferences.service';


@ApiTags('Notification Preferences')
@Controller('notification-preferences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationPreferencesController {
  constructor(
    private readonly notificationPreferencesService: NotificationPreferencesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener preferencias de notificación del usuario' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preferencias obtenidas exitosamente',
  })
  async getNotificationPreferences(@User() user) {
    return await this.notificationPreferencesService.getUserPreferences(user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Actualizar preferencias de notificación' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preferencias actualizadas exitosamente',
  })
  async updateNotificationPreferences(
    @Body() updatePreferencesDto: UpdateNotificationPreferencesDto,
    @User() user,
  ) {
    const updatedPreferences = await this.notificationPreferencesService.updatePreferences(
      user.id,
      updatePreferencesDto,
    );

    return {
      message: 'Preferencias de notificación actualizadas exitosamente',
      preferences: updatedPreferences,
    };
  }

  @Get('templates')
  @ApiOperation({ summary: 'Obtener plantillas predefinidas de preferencias' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plantillas obtenidas exitosamente',
  })
  async getPreferenceTemplates() {
    return this.notificationPreferencesService.getPreferenceTemplates();
  }

  @Put('template/:templateName')
  @ApiOperation({ summary: 'Aplicar plantilla predefinida de preferencias' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plantilla aplicada exitosamente',
  })
  async applyTemplate(
    @User() user,
    @Body('templateName') templateName: string,
  ) {
    const updatedPreferences = await this.notificationPreferencesService.applyTemplate(
      user.id,
      templateName,
    );

    return {
      message: `Plantilla "${templateName}" aplicada exitosamente`,
      preferences: updatedPreferences,
    };
  }
}