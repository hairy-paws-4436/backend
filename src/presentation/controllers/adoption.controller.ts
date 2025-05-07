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
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../decorators/user.decorator';
import { UserRole } from '../../core/domain/user/value-objects/user-role.enum';

import { RequestAdoptionUseCase } from '../../application/use-cases/adoption/request-adoption.use-case';

import { AdoptionType } from '../../core/domain/adoption/value-objects/adoption-type.enum';
import { AdoptionStatus } from '../../core/domain/adoption/value-objects/adoption-status.enum';

import { ApproveAdoptionDto } from '../dtos/requests/approve-adoption.dto';
import { RejectAdoptionDto } from '../dtos/requests/reject-adoption.dto';
import { RequestAdoptionDto } from '../dtos/requests/request-adoption.dto';
import { ApproveAdoptionUseCase } from '../../application/use-cases/adoption/approve-adoption.use-case';
import { RejectAdoptionUseCase } from '../../application/use-cases/adoption/reject-adoption.use-case';
import { GetAdoptionUseCase } from '../../application/use-cases/adoption/get-adoption.use-case';
import { GetAdoptionsUseCase } from '../../application/use-cases/donation/get-adoptions.use-case';
import { CancelAdoptionUseCase } from '../../application/use-cases/adoption/cancel-adoption.use-case';

@ApiTags('Adoptions')
@Controller('adoptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdoptionController {
  constructor(
      private readonly requestAdoptionUseCase: RequestAdoptionUseCase,
      private readonly approveAdoptionUseCase: ApproveAdoptionUseCase,
      private readonly rejectAdoptionUseCase: RejectAdoptionUseCase,
      private readonly getAdoptionUseCase: GetAdoptionUseCase,
      private readonly getAdoptionsUseCase: GetAdoptionsUseCase,
      private readonly cancelAdoptionUseCase: CancelAdoptionUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ADOPTER)
  @ApiOperation({ summary: 'Request adoption or visit' })
  @ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Request created successfully',
  })
  async requestAdoption(
      @Body() requestAdoptionDto: RequestAdoptionDto,
      @User() user,
  ) {
      const adoption = await this.requestAdoptionUseCase.execute({
          ...requestAdoptionDto,
          adopterId: user.id,
      });
      
      return adoption.toObject();
  }

  @Get()
  @ApiOperation({ summary: 'Get adoption requests according to user role' })
  @ApiQuery({
      name: 'type',
      required: false,
      enum: AdoptionType,
      description: 'Filter by request type',
  })
  @ApiQuery({
      name: 'status',
      required: false,
      enum: AdoptionStatus,
      description: 'Filter by request status',
  })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'Requests retrieved successfully',
  })
  async getAdoptions(
      @User() user,
      @Query('type') type?: AdoptionType,
      @Query('status') status?: AdoptionStatus,
  ) {
      const filters = {
          ...(type && { type }),
          ...(status && { status }),
      };
      
      let adoptions;
      
      if (user.role === UserRole.ADOPTER) {
          adoptions = await this.getAdoptionsUseCase.execute({
              ...filters,
              adopterId: user.id,
          });
      } else if (user.role === UserRole.OWNER) {
          adoptions = await this.getAdoptionsUseCase.execute({
              ...filters,
              ownerId: user.id,
          });
      } else if (user.role === UserRole.ADMIN) {
          adoptions = await this.getAdoptionsUseCase.execute(filters);
      } else {
          throw new ForbiddenException('You do not have permission to view adoption requests');
      }
      
      return adoptions.map(adoption => adoption.toObject());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get adoption request details' })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'Request retrieved successfully',
  })
  @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Request not found',
  })
  @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'You do not have permission to view this request',
  })
  async getAdoption(
      @Param('id', ParseUUIDPipe) id: string,
      @User() user,
  ) {
      const adoption = await this.getAdoptionUseCase.execute(id);
      
      if (
          user.role !== UserRole.ADMIN &&
          user.id !== adoption.getAdopterId() &&
          user.id !== adoption.getOwnerId()
      ) {
          throw new ForbiddenException('You do not have permission to view this request');
      }
      
      return adoption.toObject();
  }

  @Put(':id/approve')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Approve an adoption request' })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'Request approved successfully',
  })
  @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Request not found',
  })
  @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'You do not have permission to approve this request',
  })
  async approveAdoption(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() approveAdoptionDto: ApproveAdoptionDto,
      @User() user,
  ) {
      const adoption = await this.getAdoptionUseCase.execute(id);
      
      if (user.id !== adoption.getOwnerId()) {
          throw new ForbiddenException('You are not the owner of this pet');
      }
      
      const approvedAdoption = await this.approveAdoptionUseCase.execute({
          adoptionId: id,
          notes: approveAdoptionDto.notes,
      });
      
      return approvedAdoption.toObject();
  }

  @Put(':id/reject')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Reject an adoption request' })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'Request rejected successfully',
  })
  @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Request not found',
  })
  @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'You do not have permission to reject this request',
  })
  async rejectAdoption(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() rejectAdoptionDto: RejectAdoptionDto,
      @User() user,
  ) {
      const adoption = await this.getAdoptionUseCase.execute(id);
      
      if (user.id !== adoption.getOwnerId()) {
          throw new ForbiddenException('You are not the owner of this pet');
      }
      
      const rejectedAdoption = await this.rejectAdoptionUseCase.execute({
          adoptionId: id,
          reason: rejectAdoptionDto.reason,
      });
      
      return rejectedAdoption.toObject();
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel an adoption request' })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'Request cancelled successfully',
  })
  @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Request not found',
  })
  @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'You do not have permission to cancel this request',
  })
  async cancelAdoption(
      @Param('id', ParseUUIDPipe) id: string,
      @User() user,
  ) {
      const adoption = await this.getAdoptionUseCase.execute(id);
      
      if (user.id !== adoption.getAdopterId() && user.id !== adoption.getOwnerId() && user.role !== UserRole.ADMIN) {
          throw new ForbiddenException('You do not have permission to cancel this request');
      }
      
      const cancelledAdoption = await this.cancelAdoptionUseCase.execute({
          adoptionId: id,
      });
      
      return cancelledAdoption.toObject();
  }
}
