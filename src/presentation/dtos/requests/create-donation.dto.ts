import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { DonationType } from 'src/core/domain/donation/value-objects/donation-type.enum';

class DonationItemDto {
  @ApiProperty({
    description: 'Nombre del artículo',
    example: 'Alimento para perros',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Cantidad del artículo',
    example: 5,
  })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @IsPositive({ message: 'La cantidad debe ser mayor a 0' })
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Descripción detallada del artículo',
    example: 'Alimento para perros adultos, 3kg',
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(255, { message: 'La descripción no puede exceder los 255 caracteres' })
  description?: string;
}

export class CreateDonationDto {
  @ApiProperty({
    description: 'ID de la ONG a la que se realiza la donación',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'El ID de la ONG no es válido' })
  @IsNotEmpty({ message: 'El ID de la ONG es requerido' })
  ongId: string;
  
  // Añadir esta propiedad
  @ApiProperty({
    description: 'ID del donante (se asigna automáticamente)',
  })
  @IsOptional() // Es opcional en el DTO porque se asigna en el controlador
  donorId?: string;

  @ApiProperty({
    description: 'Tipo de donación',
    enum: DonationType,
    example: DonationType.MONEY,
  })
  @IsEnum(DonationType, { message: 'Tipo de donación no válido' })
  @IsNotEmpty({ message: 'El tipo de donación es requerido' })
  type: DonationType;

  @ApiProperty({
    description: 'Monto de la donación (requerido para donaciones de dinero)',
    example: 100.50,
  })
  @ValidateIf(o => o.type === DonationType.MONEY || o.type === DonationType.BOTH)
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({
    description: 'ID de transacción (para donaciones de dinero)',
    example: 'TRX123456789',
  })
  @IsString({ message: 'El ID de transacción debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(100, { message: 'El ID de transacción no puede exceder los 100 caracteres' })
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales sobre la donación',
    example: 'Donación para la campaña de vacunación',
  })
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @IsOptional()
  @MaxLength(500, { message: 'Las notas no pueden exceder los 500 caracteres' })
  notes?: string;

  @ApiProperty({
    description: 'Artículos donados (requerido para donaciones de artículos)',
    type: [DonationItemDto],
  })
  @ValidateIf(o => o.type === DonationType.ITEMS || o.type === DonationType.BOTH)
  @IsArray({ message: 'Los artículos deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => DonationItemDto)
  items?: DonationItemDto[];

  // Añadir esta propiedad
  // En CreateDonationDto
@ApiProperty({
  description: 'Archivo de recibo (opcional)',
  type: 'string',
  format: 'binary',
  required: false
})
@IsOptional()
receipt?: any; // o Express.Multer.File si prefieres ser más específico
}