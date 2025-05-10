import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../decorators/user.decorator';
import { UserRole } from '../../core/domain/user/value-objects/user-role.enum';

import { OngService } from '../../application/services/ong.service';
import { DonationType } from '../../core/domain/donation/value-objects/donation-type.enum';
import { DonationStatus } from '../../core/domain/donation/value-objects/donation-status.enum';

import { ConfirmDonationDto } from '../dtos/requests/confirm-donation.dto';
import { CreateDonationDto } from '../dtos/requests/create-donation.dto';
import { DonationService } from '../../application/services/donation.service';

@ApiTags('Donations')
@Controller('donations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DonationController {
  constructor(
      private readonly donationService: DonationService,
      private readonly ongService: OngService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('receiptUrl', {
      limits: {
          fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
          if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)$/) && !file.mimetype.match(/application\/pdf$/)) {
              return cb(new Error('Only images or PDFs are allowed'), false);
          }
          cb(null, true);
      },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Register a new donation' })
  @ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Donation successfully registered',
  })
  async createDonation(
      @Body() createDonationDto: CreateDonationDto,
      @User() user,
  ) {
      const donation = await this.donationService.createDonation({
          ...createDonationDto,
          donorId: user.id,
      });

      return donation;
  }

  @Get()
  @ApiOperation({ summary: 'Get donations based on user role' })
  @ApiQuery({
      name: 'ongId',
      required: false,
      type: String,
      description: 'ONG ID to filter donations',
  })
  @ApiQuery({
      name: 'type',
      required: false,
      enum: DonationType,
      description: 'Filter by donation type',
  })
  @ApiQuery({
      name: 'status',
      required: false,
      enum: DonationStatus,
      description: 'Filter by donation status',
  })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'Donations successfully retrieved',
  })
  async getDonations(
      @User() user,
      @Query('ongId') ongId?: string,
      @Query('type') type?: DonationType,
      @Query('status') status?: DonationStatus,
  ) {
      const filters = {
          ...(type && { type }),
          ...(status && { status }),
      };
      
      if (user.role === UserRole.ONG) {
          const ong = await this.ongService.getOngByUserId(user.id);
          filters['ongId'] = ong.id;
      } else if (user.role !== UserRole.ADMIN) {
          filters['donorId'] = user.id;
      } else if (ongId) {
          filters['ongId'] = ongId;
      }
      
      return await this.donationService.getDonations(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get donation details' })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'Donation details successfully retrieved',
  })
  @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Donation not found',
  })
  @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'You do not have permission to view this donation',
  })
  async getDonationById(
      @Param('id', ParseUUIDPipe) id: string,
      @User() user,
  ) {
      const donation = await this.donationService.getDonationById(id);
      
      if (
          user.role !== UserRole.ADMIN &&
          user.id !== donation.donorId
      ) {
          if (user.role === UserRole.ONG) {
              const ong = await this.ongService.getOngByUserId(user.id);
              if (donation.ongId !== ong.id) {
                  throw new ForbiddenException('You do not have permission to view this donation');
              }
          } else {
              throw new ForbiddenException('You do not have permission to view this donation');
          }
      }
      
      return donation;
  }

  @Put(':id/confirm')
  @Roles(UserRole.ONG)
  @ApiOperation({ summary: 'Confirm donation receipt' })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'Donation successfully confirmed',
  })
  @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Donation not found',
  })
  @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'You do not have permission to confirm this donation',
  })
  async confirmDonation(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() confirmDonationDto: ConfirmDonationDto,
      @User() user,
  ) {
      const donation = await this.donationService.getDonationById(id);
      
      const ong = await this.ongService.getOngByUserId(user.id);
      if (donation.ongId !== ong.id) {
          throw new ForbiddenException('You are not the receiver of this donation');
      }
      
      return await this.donationService.confirmDonation(id, user.id, confirmDonationDto.notes);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel a donation' })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'Donation successfully cancelled',
  })
  @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Donation not found',
  })
  @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'You do not have permission to cancel this donation',
  })
  async cancelDonation(
      @Param('id', ParseUUIDPipe) id: string,
      @User() user,
  ) {
      const donation = await this.donationService.getDonationById(id);
      
      if (
          user.role !== UserRole.ADMIN &&
          user.id !== donation.donorId
      ) {
          if (user.role === UserRole.ONG) {
              const ong = await this.ongService.getOngByUserId(user.id);
              if (donation.ongId !== ong.id) {
                  throw new ForbiddenException('You do not have permission to cancel this donation');
              }
          } else {
              throw new ForbiddenException('You do not have permission to cancel this donation');
          }
      }
      
      if (donation.status !== DonationStatus.PENDING) {
          throw new ForbiddenException('Only pending donations can be cancelled');
      }
      
      return await this.donationService.cancelDonation(id);
  }
}
