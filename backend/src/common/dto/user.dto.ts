import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(32)
  username: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(64)
  password: string;

  @ApiPropertyOptional({ description: '真实姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  realName?: string;

  @ApiPropertyOptional({ description: '角色', enum: ['ADMIN', 'VIEWER'] })
  @IsOptional()
  @IsString()
  @IsIn(['ADMIN', 'VIEWER'])
  role?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '真实姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  realName?: string;

  @ApiPropertyOptional({ description: '角色', enum: ['ADMIN', 'VIEWER'] })
  @IsOptional()
  @IsString()
  @IsIn(['ADMIN', 'VIEWER'])
  role?: string;

  @ApiPropertyOptional({ description: '新密码' })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  password?: string;
}
