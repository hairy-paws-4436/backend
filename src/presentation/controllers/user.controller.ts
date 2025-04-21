import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { UserService } from '../../application/services/user.service';
import { ChangePasswordDto } from '../dtos/requests/change-password.dto';
import { UpdateProfileDto } from '../dtos/requests/update-profile.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile successfully retrieved',
  })
  async getProfile(@User() user) {
    const userEntity = await this.userService.getUserById(user.id);

    return {
      id: userEntity.getId(),
      email: userEntity.getEmail(),
      firstName: userEntity.getFirstName(),
      lastName: userEntity.getLastName(),
      phoneNumber: userEntity.getPhoneNumber(),
      role: userEntity.getRole(),
      address: userEntity.getAddress(),
      profileImageUrl: userEntity.getProfileImageUrl(),
      twoFactorEnabled: userEntity.isTwoFactorEnabled(),
      verified: userEntity.isVerified(),
    };
  }

  @Put('profile')
  @UseInterceptors(FileInterceptor('profileImage', {
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
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile successfully updated',
  })
  async updateProfile(
    @User() user,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() profileImage: Express.Multer.File,
  ) {
    const updatedUser = await this.userService.updateProfile(user.id, {
      ...updateProfileDto,
      profileImage,
    });

    return {
      id: updatedUser.getId(),
      email: updatedUser.getEmail(),
      firstName: updatedUser.getFirstName(),
      lastName: updatedUser.getLastName(),
      phoneNumber: updatedUser.getPhoneNumber(),
      address: updatedUser.getAddress(),
      profileImageUrl: updatedUser.getProfileImageUrl(),
    };
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Incorrect current password',
  })
  async changePassword(
    @User() user,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.userService.changePassword(user.id, changePasswordDto);

    return { message: 'Password successfully updated' };
  }

  @Post('deactivate')
  @ApiOperation({ summary: 'Deactivate user account' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account successfully deactivated',
  })
  async deactivateAccount(@User() user) {
    await this.userService.deactivateAccount(user.id);

    return { message: 'Account successfully deactivated' };
  }
}
