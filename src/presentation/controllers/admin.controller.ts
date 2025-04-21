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

@ApiTags('Administration')
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
  @ApiOperation({ summary: 'Get user list' })
  @ApiQuery({
      name: 'verified',
      required: false,
      enum: ['true', 'false'],
      description: 'Filter by verification status',
  })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'User list retrieved successfully',
  })
  async getUsers(
      @Query('role') role?: UserRole,
      @Query('verified') verified?: 'true' | 'false',
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
  @ApiOperation({ summary: 'Get ONG list' })
  @ApiQuery({
      name: 'verified',
      required: false,
      type: Boolean,
      description: 'Filter by verification status',
  })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'ONG list retrieved successfully',
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
  @ApiOperation({ summary: 'Verify a user' })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'User verified successfully',
  })
  @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
  })
  async verifyUser(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() verifyUserDto: VerifyUserDto,
  ) {
      const user = await this.userRepository.findById(id);
      
      user.verify();
      
      await this.userRepository.update(id, user);
      
      return { message: 'User verified successfully' };
  }

  @Post('ongs/:id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an ONG' })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'ONG verified successfully',
  })
  @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'ONG not found',
  })
  async verifyOng(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() verifyOngDto: VerifyOngDto,
  ) {
      await this.ongRepository.updateVerificationStatus(id, true);
      
      const ong = await this.ongRepository.findById(id);
      const user = await this.userRepository.findById(ong.userId);
      
      user.verify();
      await this.userRepository.update(user.getId(), user);
      
      return { message: 'ONG verified successfully' };
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'User deleted successfully',
  })
  @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
  })
  async deleteUser(
      @Param('id', ParseUUIDPipe) id: string,
  ) {
      await this.userRepository.delete(id);
      return { message: 'User deleted successfully' };
  }
}