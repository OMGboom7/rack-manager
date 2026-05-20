import { IsString, IsNotEmpty, IsOptional, IsInt, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRowDto {
  @ApiProperty({ description: '排名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name!: string;

  @ApiProperty({ description: '机房ID' })
  @Type(() => Number)
  @IsNumber()
  datacenterId!: number;
}

export class UpdateRowDto {
  @ApiProperty({ description: '排名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name!: string;
}

export class CreateRackDto {
  @ApiProperty({ description: '机柜名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name!: string;

  @ApiProperty({ description: '排ID' })
  @Type(() => Number)
  @IsNumber()
  rowId!: number;

  @ApiPropertyOptional({ description: 'U位数', default: 42 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(12)
  @Max(60)
  totalU?: number;

  @ApiPropertyOptional({ description: '宽度', default: 19 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  width?: number;

  @ApiPropertyOptional({ description: '业务类型' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  purpose?: string;
}

export class UpdateRackDto {
  @ApiPropertyOptional({ description: '机柜名称' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional({ description: 'U位数' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(12)
  @Max(60)
  totalU?: number;

  @ApiPropertyOptional({ description: '宽度' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  width?: number;

  @ApiPropertyOptional({ description: '业务类型' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  purpose?: string;
}
