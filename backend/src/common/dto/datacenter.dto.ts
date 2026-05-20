import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDatacenterDto {
  @ApiProperty({ description: '机房名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name!: string;

  @ApiPropertyOptional({ description: '位置' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  location?: string;
}

export class UpdateDatacenterDto {
  @ApiPropertyOptional({ description: '机房名称' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional({ description: '位置' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  location?: string;
}
