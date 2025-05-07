import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  ForbiddenException,
  ParseBoolPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../decorators/user.decorator';
import { UserRole } from '../../core/domain/user/value-objects/user-role.enum';

import { OngService } from '../../application/services/ong.service';

import { CreateEventDto } from '../dtos/requests/create-event.dto';
import { UpdateEventDto } from '../dtos/requests/update-event.dto';
import { EventService } from '../../application/services/event.service';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(
      private readonly eventService: EventService,
      private readonly ongService: OngService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get list of events' })
  @ApiQuery({
      name: 'ongId',
      required: false,
      type: String,
      description: 'ONG ID to filter events',
  })
  @ApiQuery({
      name: 'active',
      required: false,
      type: Boolean,
      description: 'Filter by active/inactive events',
  })
  @ApiQuery({
      name: 'isVolunteer',
      required: false,
      type: Boolean,
      description: 'Filter by volunteer events',
  })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'Event list successfully retrieved',
  })
  async getAllEvents(
      @Query('ongId') ongId?: string,
      @Query('active', new ParseBoolPipe({ optional: true })) active?: boolean,
      @Query('isVolunteer', new ParseBoolPipe({ optional: true })) isVolunteer?: boolean,
  ) {
      const filters = {
          ...(ongId && { ongId }),
          ...(active !== undefined && { active }),
          ...(isVolunteer !== undefined && { isVolunteerEvent: isVolunteer }),
      };

      return await this.eventService.getAllEvents(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event details' })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'Event details successfully retrieved',
  })
  @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Event not found',
  })
  async getEventById(
      @Param('id', ParseUUIDPipe) id: string,
  ) {
      return await this.eventService.getEventById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image', {
      limits: {
          fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
          if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)$/)) {
              return cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed'), false);
          }
          cb(null, true);
      },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Event successfully created',
  })
  async createEvent(
      @Body() createEventDto: CreateEventDto,
      @UploadedFile() image: Express.Multer.File,
      @User() user,
  ) {
      const ong = await this.ongService.getOngByUserId(user.id);

      return await this.eventService.createEvent({
          ...createEventDto,
          ongId: ong.id,
          image,
      });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image', {
      limits: {
          fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
          if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)$/)) {
              return cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed'), false);
          }
          cb(null, true);
      },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update event information' })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'Event successfully updated',
  })
  @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Event not found',
  })
  @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'You do not have permission to update this event',
  })
  async updateEvent(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateEventDto: UpdateEventDto,
      @UploadedFile() image: Express.Multer.File,
      @User() user,
  ) {
      const event = await this.eventService.getEventById(id);

      const ong = await this.ongService.getOngByUserId(user.id);

      if (event.ongId !== ong.id && user.role !== UserRole.ADMIN) {
          throw new ForbiddenException('You are not the owner of this event');
      }

      return await this.eventService.updateEvent(id, {
          ...updateEventDto,
          image,
      });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ONG, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({
      status: HttpStatus.OK,
      description: 'Event successfully deleted',
  })
  @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Event not found',
  })
  @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'You do not have permission to delete this event',
  })
  async deleteEvent(
      @Param('id', ParseUUIDPipe) id: string,
      @User() user,
  ) {
      const event = await this.eventService.getEventById(id);

      if (user.role !== UserRole.ADMIN) {
          const ong = await this.ongService.getOngByUserId(user.id);

          if (event.ongId !== ong.id) {
              throw new ForbiddenException('You are not the owner of this event');
          }
      }

      await this.eventService.deleteEvent(id);

      return { message: 'Event successfully deleted' };
  }
}
