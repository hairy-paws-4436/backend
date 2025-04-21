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
import { CreateOngDto } from '../dtos/requests/create-ong.dto';
import { UpdateOngDto } from '../dtos/requests/update-ong.dto';

@ApiTags('NGOs')
@Controller('ongs')
export class OngController {
  constructor(
    private readonly ongService: OngService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get list of NGOs' })
  @ApiQuery({
    name: 'verified',
    required: false,
    type: Boolean,
    description: 'Filter by verification',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'NGO list successfully retrieved',
  })
  async getAllOngs(
    @Query('verified') verified?: boolean,
  ) {
    const isVerified = verified === true || (typeof verified === 'string' && verified === 'true');
    return await this.ongService.getAllOngs(isVerified);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of an NGO' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'NGO details successfully retrieved',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'NGO not found',
  })
  async getOngById(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.ongService.getOngById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('logo', {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed (jpg, jpeg, png, gif)'), false);
      }
      cb(null, true);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Register a new NGO' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'NGO successfully registered',
  })
  async createOng(
    @Body() createOngDto: CreateOngDto,
    @UploadedFile() logo: Express.Multer.File,
    @User() user,
  ) {
    const hasOng = await this.ongService.hasOng(user.id);
    if (hasOng) {
      throw new ForbiddenException('You already have a registered NGO');
    }

    const ong = await this.ongService.createOng({
      ...createOngDto,
      userId: user.id,
      logo,
    });

    return ong;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('logo', {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed (jpg, jpeg, png, gif)'), false);
      }
      cb(null, true);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update NGO information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'NGO successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'NGO not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You do not have permission to update this NGO',
  })
  async updateOng(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOngDto: UpdateOngDto,
    @UploadedFile() logo: Express.Multer.File,
    @User() user,
  ) {
    const ong = await this.ongService.getOngById(id);

    if (ong.userId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not the owner of this NGO');
    }

    return await this.ongService.updateOng(id, {
      ...updateOngDto,
      logo,
    });
  }

  @Get('user/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user’s NGO' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'NGO successfully retrieved',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'You do not have a registered NGO',
  })
  async getMyOng(
    @User() user,
  ) {
    return await this.ongService.getOngByUserId(user.id);
  }
}
