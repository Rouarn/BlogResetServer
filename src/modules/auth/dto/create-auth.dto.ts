import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { Gender } from 'src/common/enums';

/**
 * 认证数据传输对象
 * 用于用户注册等认证相关操作
 */
export class CreateAuthDto {
  @ApiProperty({
    description: '用户名',
    example: 'john_doe',
    minLength: 3,
    maxLength: 10,
  })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @Length(3, 10, { message: '用户名长度在3-10位之间' })
  userName: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
  })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;

  @ApiProperty({
    description: '昵称',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  nickname: string;

  @ApiProperty({
    description: '头像URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '头像URL必须是字符串' })
  avatar: string;

  @ApiProperty({
    description: '性别',
    enum: Gender,
    example: Gender.MALE,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender, { message: '性别必须是有效的枚举值' })
  gender: Gender;

  @ApiProperty({
    description: '手机号码',
    example: '13800138000',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '手机号码必须是字符串' })
  phone: string;
}
