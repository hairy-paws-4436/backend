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
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../decorators/user.decorator';
import { UserRole } from '../../core/domain/user/value-objects/user-role.enum';
import { OngGamificationService } from '../../application/services/ong-gamification.service';

import { OngService } from '../../application/services/ong.service';
import { BadgeType } from '../../infrastructure/database/mysql/entities/ong-gamification.entity';

@ApiTags('ONG Gamification')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamificationController {
  constructor(
    private readonly gamificationService: OngGamificationService,
    private readonly ongService: OngService,
  ) {}

  @Get('my-stats')
  @Roles(UserRole.ONG)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener estadísticas de gamificación de mi ONG' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getMyGamificationStats(@User() user) {
    const ong = await this.ongService.getOngByUserId(user.id);
    return await this.gamificationService.getOngStats(ong.id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Obtener tabla de clasificación de ONGs' })
  @ApiQuery({
    name: 'timeframe',
    required: false,
    enum: ['weekly', 'monthly', 'all'],
    description: 'Marco temporal para el ranking',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número máximo de ONGs en el ranking (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tabla de clasificación obtenida',
  })
  async getLeaderboard(
    @Query('timeframe') timeframe: 'weekly' | 'monthly' | 'all' = 'monthly',
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return await this.gamificationService.getLeaderboard(limit, timeframe);
  }

  @Post('set-monthly-goal')
  @Roles(UserRole.ONG)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Establecer meta mensual de adopciones' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meta establecida exitosamente',
  })
  async setMonthlyGoal(
    @Body('goal', ParseIntPipe) goal: number,
    @User() user,
  ) {
    const ong = await this.ongService.getOngByUserId(user.id);
    await this.gamificationService.setMonthlyGoal(ong.id, goal);

    return {
      message: `Meta mensual establecida en ${goal} adopciones`,
      goal,
    };
  }

  @Put('featured-badges')
  @Roles(UserRole.ONG)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Actualizar badges destacados en el perfil' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Badges destacados actualizados',
  })
  async updateFeaturedBadges(
    @Body('badges') badges: BadgeType[],
    @User() user,
  ) {
    const ong = await this.ongService.getOngByUserId(user.id);
    await this.gamificationService.updateFeaturedBadges(ong.id, badges);

    return {
      message: 'Badges destacados actualizados exitosamente',
      featuredBadges: badges,
    };
  }

  @Get('badges/available')
  @Roles(UserRole.ONG)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener badges disponibles para ganar' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de badges disponibles',
  })
  async getAvailableBadges(@User() user) {
    const ong = await this.ongService.getOngByUserId(user.id);
    const stats = await this.gamificationService.getOngStats(ong.id);

    return {
      nextBadges: stats.nextBadges,
      allBadgeDescriptions: this.getBadgeDescriptions(),
    };
  }

  @Get('achievements/recent')
  @Roles(UserRole.ONG)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener logros recientes' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número de logros recientes (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logros recientes obtenidos',
  })
  async getRecentAchievements(
    @User() user,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    const ong = await this.ongService.getOngByUserId(user.id);
    const stats = await this.gamificationService.getOngStats(ong.id);

    return {
      recentAchievements: stats.recentAchievements.slice(0, limit),
    };
  }

  @Get('community/top-performers')
  @ApiOperation({ summary: 'Obtener top performers de la comunidad' })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['adoptions', 'events', 'donations', 'engagement'],
    description: 'Categoría específica de rendimiento',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top performers obtenidos',
  })
  async getTopPerformers(
    @Query('category') category?: string,
  ) {
    // Obtener diferentes tipos de rankings
    const monthly = await this.gamificationService.getLeaderboard(5, 'monthly');
    const allTime = await this.gamificationService.getLeaderboard(5, 'all');

    return {
      monthlyTop: monthly,
      allTimeTop: allTime,
      category: category || 'all',
    };
  }

  @Get('ong/:ongId/public-profile')
  @ApiOperation({ summary: 'Obtener perfil público de gamificación de una ONG' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil público obtenido',
  })
  async getOngPublicProfile(@Param('ongId', ParseUUIDPipe) ongId: string) {
    const stats = await this.gamificationService.getOngStats(ongId);

    // Filtrar solo información pública
    return {
      level: stats.gamification.currentLevel,
      totalPoints: stats.gamification.totalPoints,
      totalAdoptions: stats.gamification.totalAdoptionsFacilitated,
      eventsOrganized: stats.gamification.eventsOrganized,
      featuredBadges: stats.gamification.featuredBadges || stats.gamification.earnedBadges.slice(0, 3),
      monthlyRank: stats.rankingInfo.monthlyRank,
      globalRank: stats.rankingInfo.globalRank,
      currentStreak: stats.gamification.currentStreakDays,
    };
  }

  // Endpoints administrativos
  @Post('admin/recalculate-points')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Recalcular puntos para todas las ONGs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Puntos recalculados exitosamente',
  })
  async recalculateAllPoints() {
    // TODO: Implementar recálculo masivo de puntos
    return {
      message: 'Recálculo de puntos iniciado en segundo plano',
      status: 'processing',
    };
  }

  @Get('admin/global-stats')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener estadísticas globales de gamificación' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas globales obtenidas',
  })
  async getGlobalGamificationStats() {
    // TODO: Implementar estadísticas globales
    return {
      totalActiveOngs: 0,
      totalPointsAwarded: 0,
      averageLevel: 0,
      topCategories: [],
    };
  }

  private getBadgeDescriptions() {
    return {
      [BadgeType.FIRST_ADOPTION]: {
        name: 'Primera Adopción',
        description: 'Facilita tu primera adopción exitosa',
        icon: '🏆',
        points: 100,
      },
      [BadgeType.ADOPTION_MILESTONE_10]: {
        name: 'Adoptador Dedicado',
        description: 'Facilita 10 adopciones exitosas',
        icon: '🥉',
        points: 100,
      },
      [BadgeType.ADOPTION_MILESTONE_50]: {
        name: 'Héroe de Rescate',
        description: 'Facilita 50 adopciones exitosas',
        icon: '🥈',
        points: 500,
      },
      [BadgeType.ADOPTION_MILESTONE_100]: {
        name: 'Campeón de Adopciones',
        description: 'Facilita 100 adopciones exitosas',
        icon: '🥇',
        points: 1000,
      },
      [BadgeType.ADOPTION_MILESTONE_500]: {
        name: 'Leyenda de Rescate',
        description: 'Facilita 500 adopciones exitosas',
        icon: '👑',
        points: 5000,
      },
      [BadgeType.PROFILE_COMPLETENESS]: {
        name: 'Perfil Completo',
        description: 'Completa el 100% de tu perfil de ONG',
        icon: '✅',
        points: 300,
      },
      [BadgeType.MONTHLY_ACTIVE]: {
        name: 'Siempre Activo',
        description: '30 días consecutivos de actividad',
        icon: '🔥',
        points: 400,
      },
      [BadgeType.EVENT_ORGANIZER]: {
        name: 'Organizador de Eventos',
        description: 'Organiza 5 eventos comunitarios',
        icon: '🎪',
        points: 250,
      },
      [BadgeType.DONOR_FAVORITE]: {
        name: 'Favorito de Donantes',
        description: 'Recibe S/5,000 en donaciones',
        icon: '💝',
        points: 300,
      },
      [BadgeType.RAPID_RESPONDER]: {
        name: 'Respuesta Rápida',
        description: 'Responde en menos de 1 hora consistentemente',
        icon: '⚡',
        points: 150,
      },
    };
  }
}