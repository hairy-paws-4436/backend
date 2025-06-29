import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../decorators/user.decorator';
import { UserRole } from '../../core/domain/user/value-objects/user-role.enum';
import { CompleteFollowUpDto } from '../dtos/requests/complete-followup.dto';
import { PostAdoptionFollowUpService } from '../../application/services/post-adoption-followup.service';


@ApiTags('Post-Adoption Follow-up')
@Controller('post-adoption')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PostAdoptionController {
  constructor(
    private readonly followUpService: PostAdoptionFollowUpService,
  ) {}

  @Get('my-followups')
  @ApiOperation({ summary: 'Obtener seguimientos pendientes del usuario' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'completed', 'overdue'],
    description: 'Filtrar por estado de seguimiento',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de seguimientos obtenida',
  })
  async getMyFollowUps(
    @User() user,
    @Query('status') status?: string,
  ) {
    return await this.followUpService.getUserFollowUps(user.id, status);
  }


  @Post('schedule/:adoptionId')
  @Roles(UserRole.ONG, UserRole.ADMIN)
  @ApiOperation({ summary: 'Programar seguimientos para una adopción' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Seguimientos programados exitosamente',
  })
  async createFollowUpSchedule(
    @Param('adoptionId', ParseUUIDPipe) adoptionId: string,
  ) {

    await this.followUpService.createFollowUpSchedule(adoptionId);

    return {
      message: 'Seguimientos programados exitosamente',
      adoptionId,
    };
  }

  @Get('followup/:followupId')
  @ApiOperation({ summary: 'Obtener detalles de un seguimiento específico' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalles del seguimiento obtenidos',
  })
  async getFollowUpDetails(
    @Param('followupId', ParseUUIDPipe) followupId: string,
    @User() user,
  ) {
    const followUp = await this.followUpService.getFollowUpById(followupId);

    // Verificar que el usuario sea el adoptante o propietario de la ONG
    if (followUp.adopterId !== user.id) {
      // TODO: Verificar si es propietario de la ONG
      throw new ForbiddenException('No tienes permisos para ver este seguimiento');
    }

    return followUp;
  }

  @Post('followup/:followupId/complete')
  @ApiOperation({ summary: 'Completar cuestionario de seguimiento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Seguimiento completado exitosamente',
  })
  async completeFollowUp(
    @Param('followupId', ParseUUIDPipe) followupId: string,
    @Body() completeFollowUpDto: CompleteFollowUpDto,
    @User() user,
  ) {
    const result = await this.followUpService.completeFollowUp(
      followupId,
      user.id,
      completeFollowUpDto,
    );

    return {
      message: 'Seguimiento completado exitosamente',
      followUp: result.followUp,
      riskAssessment: result.riskAssessment,
      recommendations: result.recommendations,
    };
  }

  @Post('followup/:followupId/skip')
  @ApiOperation({ summary: 'Omitir seguimiento (marcar como no completado)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Seguimiento omitido',
  })
  async skipFollowUp(
    @Param('followupId', ParseUUIDPipe) followupId: string,
    @User() user,
  ) {
    await this.followUpService.skipFollowUp(followupId, user.id);

    return {
      message: 'Seguimiento omitido. Puedes completarlo más tarde si cambias de opinión.',
    };
  }

  // Endpoints para ONGs
  @Get('ong/dashboard')
  @Roles(UserRole.ONG)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Dashboard de seguimientos para ONGs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard de seguimientos obtenido',
  })
  async getOngFollowUpDashboard(@User() user) {
    return await this.followUpService.getOngDashboard(user.id);
  }

  @Get('ong/analytics')
  @Roles(UserRole.ONG)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Análisis de seguimientos para ONGs' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['week', 'month', 'quarter', 'year'],
    description: 'Período de análisis',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Análisis obtenido exitosamente',
  })
  async getFollowUpAnalytics(
    @User() user,
    @Query('period') period: string = 'month',
  ) {
    return await this.followUpService.getOngAnalytics(user.id, period);
  }

  @Get('ong/at-risk')
  @Roles(UserRole.ONG)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener adopciones en riesgo' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de adopciones en riesgo',
  })
  async getAtRiskAdoptions(@User() user) {
    return await this.followUpService.getAtRiskAdoptions(user.id);
  }

  @Post('ong/intervention/:followupId')
  @Roles(UserRole.ONG)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Iniciar intervención para adopción en riesgo' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Intervención iniciada',
  })
  async initiateIntervention(
    @Param('followupId', ParseUUIDPipe) followupId: string,
    @Body('interventionType') interventionType: string,
    @Body('notes') notes: string,
    @User() user,
  ) {
    const result = await this.followUpService.initiateIntervention(
      followupId,
      user.id,
      interventionType,
      notes,
    );

    return {
      message: 'Intervención iniciada exitosamente',
      intervention: result,
    };
  }

  // Endpoints administrativos
  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Estadísticas globales de seguimientos' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas globales obtenidas',
  })
  async getGlobalStats() {
    return await this.followUpService.getGlobalStats();
  }

  @Post('admin/send-reminders')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Enviar recordatorios pendientes manualmente' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recordatorios enviados',
  })
  async sendPendingReminders() {
    const result = await this.followUpService.sendPendingReminders();

    return {
      message: 'Recordatorios enviados exitosamente',
      remindersSent: result.sent,
      errors: result.errors,
    };
  }
}