import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class TwoFactorAuthDto {
  @ApiProperty({
    description: 'ID del usuario',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'El ID de usuario no es válido' })
  @IsNotEmpty({ message: 'El ID de usuario es requerido' })
  userId: string;

  @ApiProperty({
    description: 'Token de autenticación de dos factores (6 dígitos)',
    example: '123456',
  })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  @Length(6, 6, { message: 'El token debe tener exactamente 6 dígitos' })
  token: string;
}