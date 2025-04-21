import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'Password123!',
  })
  @IsString({ message: 'The current password must be a string' })
  @IsNotEmpty({ message: 'The current password is required' })
  oldPassword: string;

  @ApiProperty({
    description: 'New password (minimum 8 characters, must contain at least one uppercase letter, one lowercase letter, and one number)',
    example: 'NewPassword456!',
  })
  @IsString({ message: 'The new password must be a string' })
  @IsNotEmpty({ message: 'The new password is required' })
  @MinLength(8, { message: 'The new password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'The new password must contain at least one uppercase letter, one lowercase letter, and one number or special character',
  })
  newPassword: string;
}
