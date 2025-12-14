import { Gender, Role } from '@/common/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/**
 * 创建用户DTO
 *
 * 用于创建新用户时的数据传输和验证。
 * 专注于用户资料信息，不包含认证相关字段。
 *
 * 字段说明：
 * - authId: 关联的认证ID（必填）
 * - nickname: 用户昵称（可选）
 * - avatar: 头像URL（可选）
 * - gender: 性别（可选）
 * - mobile: 手机号（可选）
 * - email: 邮箱地址（可选）
 * - bio: 个人简介（可选）
 * - birthday: 生日（可选）
 * - city: 城市（可选）
 * - profession: 职业（可选）
 * - roles: 用户角色（可选，默认为USER）
 *
 * 验证规则：
 * - authId: 必填字符串
 * - nickname: 2-20个字符
 * - mobile: 11位数字手机号格式
 * - email: 标准邮箱格式
 * - bio: 最多200个字符
 * - city/profession: 最多50个字符
 */
export class CreateUserDto {
  @ApiProperty({
    description: '关联的认证ID',
    example: 'auth-uuid-123',
  })
  @IsString()
  authId: string;

  @ApiPropertyOptional({
    description: '用户昵称',
    example: '张三',
    minLength: 2,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(2, 20, { message: '昵称长度必须在2-20个字符之间' })
  nickname?: string;

  @ApiPropertyOptional({
    description: '用户头像URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    description: '用户性别',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender, { message: '性别值无效' })
  gender?: Gender;

  @ApiPropertyOptional({
    description: '手机号码',
    example: '13800138000',
    pattern: '^1[3-9]\\d{9}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  mobile?: string;

  @ApiPropertyOptional({
    description: '邮箱地址',
    example: 'user@example.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiPropertyOptional({
    description: '个人简介',
    example: '这是一个简短的个人介绍',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200, { message: '个人简介不能超过200个字符' })
  bio?: string;

  @ApiPropertyOptional({
    description: '生日',
    example: '1990-01-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: '生日格式不正确' })
  birthday?: string;

  @ApiPropertyOptional({
    description: '所在城市',
    example: '北京市',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50, { message: '城市名称不能超过50个字符' })
  city?: string;

  @ApiPropertyOptional({
    description: '职业',
    example: '软件工程师',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50, { message: '职业描述不能超过50个字符' })
  profession?: string;

  @ApiPropertyOptional({
    description: '用户角色',
    example: Role.USER,
    default: Role.USER,
  })
  @IsOptional()
  @IsString()
  roles?: string = Role.USER;
}
