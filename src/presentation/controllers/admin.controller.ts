import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    ParseUUIDPipe,
    HttpStatus,
    Query,
    HttpCode,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../guards/jwt-auth.guard';
  import { RolesGuard } from '../guards/roles.guard';
  import { Roles } from '../decorators/roles.decorator';
  import { UserRole } from '../../core/domain/user/value-objects/user-role.enum';
  import { UserRepository } from '../../infrastructure/database/mysql/repositories/user.repository';
import { OngRepository } from 'src/infrastructure/database/mysql/repositories/ong.repository';
import { VerifyOngDto } from '../dtos/requests/verify-ong.dto';
import { VerifyUserDto } from '../dtos/requests/verify-user.dto';

  
  @ApiTags('Administración')
  @Controller('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  export class AdminController {
    constructor(
      private readonly userRepository: UserRepository,
      private readonly ongRepository: OngRepository,
    ) {}
  
    @Get('users')
@ApiOperation({ summary: 'Obtener listado de usuarios' })
@ApiQuery({
  name: 'verified',
  required: false,
  enum: ['true', 'false'],
  description: 'Filtrar por verificación',
})
@ApiResponse({
  status: HttpStatus.OK,
  description: 'Listado de usuarios obtenido exitosamente',
})
async getUsers(
  @Query('role') role?: UserRole,
  @Query('verified') verified?: 'true' | 'false', // Asegura que verified sea 'true' o 'false'
) {
  const filters = {
    ...(role && { role }),
    ...(verified !== undefined && { verified: verified === 'true' }),
  };
  
  const users = await this.userRepository.findAll(filters);
  
  return users.map(user => ({
    id: user.getId(),
    email: user.getEmail(),
    firstName: user.getFirstName(),
    lastName: user.getLastName(),
    phoneNumber: user.getPhoneNumber(),
    role: user.getRole(),
    verified: user.isVerified(),
    createdAt: user.getCreatedAt(),
  }));
}

  
    @Get('ongs')
    @ApiOperation({ summary: 'Obtener listado de ONGs' })
    @ApiQuery({
      name: 'verified',
      required: false,
      type: Boolean,
      description: 'Filtrar por verificación',
    })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Listado de ONGs obtenido exitosamente',
    })
    async getOngs(
        @Query('verified') verified?: 'true' | 'false',
    ) {
      const filters = {
        ...(verified !== undefined && { verified: verified === 'true' }),
      };
      
      const ongs = await this.ongRepository.findAll(filters);
      
      return ongs;
    }
  
    @Post('users/:id/verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verificar un usuario' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Usuario verificado exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Usuario no encontrado',
    })
    async verifyUser(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() verifyUserDto: VerifyUserDto,
    ) {
      // Obtener el usuario
      const user = await this.userRepository.findById(id);
      
      // Verificar el usuario
      user.verify();
      
      // Actualizar el usuario
      await this.userRepository.update(id, user);
      
      return { message: 'Usuario verificado correctamente' };
    }
  
    @Post('ongs/:id/verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verificar una ONG' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'ONG verificada exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'ONG no encontrada',
    })
    async verifyOng(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() verifyOngDto: VerifyOngDto,
    ) {
      // Verificar la ONG
      await this.ongRepository.updateVerificationStatus(id, true);
      
      // También verificar el usuario asociado
      const ong = await this.ongRepository.findById(id);
      const user = await this.userRepository.findById(ong.userId);
      
      user.verify();
      await this.userRepository.update(user.getId(), user);
      
      return { message: 'ONG verificada correctamente' };
    }
  
    @Delete('users/:id')
    @ApiOperation({ summary: 'Eliminar un usuario' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Usuario eliminado exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Usuario no encontrado',
    })
    async deleteUser(
      @Param('id', ParseUUIDPipe) id: string,
    ) {
      await this.userRepository.delete(id);
      return { message: 'Usuario eliminado correctamente' };
    }
  }