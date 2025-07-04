// Modifica temporalmente el controlador para saltar la validación:

import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpStatus,
  UseInterceptors,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { UpdateNotificationPreferencesDto } from '../dtos/requests/update-notification-preferences.dto';
import { NotificationPreferencesService } from '../../application/services/notification-preferences.service';

@Injectable()
export class DebugInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    console.log('=== RAW REQUEST DEBUG ===');
    console.log('Raw Body:', JSON.stringify(request.body, null, 2));
    console.log('========================');

    // Inspeccionar cada campo individualmente
    if (request.body) {
      Object.entries(request.body).forEach(([key, value]) => {
        console.log(`Field: ${key}, Value: ${value}, Type: ${typeof value}`);
      });
    }

    return next.handle();
  }
}

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
  @UseInterceptors(DebugInterceptor)
  @ApiOperation({ summary: 'Actualizar preferencias de notificación' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preferencias actualizadas exitosamente',
  })
  async updateNotificationPreferences(
    @Body() updatePreferencesDto: any, // CAMBIAR A any TEMPORALMENTE
    @User() user,
  ) {
    console.log('=== NO VALIDATION - RAW DTO ===');
    console.log('DTO received:', JSON.stringify(updatePreferencesDto, null, 2));
    console.log('User ID:', user.id);
    console.log('===============================');

    try {
      // Intentar actualizar sin validación
      const updatedPreferences = await this.notificationPreferencesService.updatePreferences(
        user.id,
        updatePreferencesDto, // Pasar directo sin validación
      );

      console.log('=== UPDATE SUCCESS ===');
      console.log('Updated preferences:', JSON.stringify(updatedPreferences, null, 2));
      console.log('======================');

      return {
        message: 'Preferencias de notificación actualizadas exitosamente',
        preferences: updatedPreferences,
      };
    } catch (error) {
      console.log('=== UPDATE ERROR ===');
      console.log('Error:', error.message);
      console.log('Stack:', error.stack);
      console.log('====================');
      throw error;
    }
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