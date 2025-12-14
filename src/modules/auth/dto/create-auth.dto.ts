import { Gender } from '@/common/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/**
 * 创建认证信息DTO
 *
 * 用于创建新的认证记录的数据传输对象。
 * 仅包含认证相关的核心信息。
 *
 * 字段说明：
 * - username: 用户名（必填）
 * - password: 密码（必填）
 * - captchaToken: 验证码令牌（必填）
 * - captchaCode: 验证码（必填）
 *
 * 验证规则：
 * - username: 3-20个字符，只能包含字母、数字和下划线
 * - password: 6-50个字符
 * - captchaCode: 4-6个字符
 *
 * 安全特性：
 * - 必须验证码验证
 * - 密码强度验证
 * - 用户名唯一性检查
 */
export class CreateAuthDto {
  @ApiProperty({
    description: '用户名',
    example: 'newuser',
    minLength: 3,
    maxLength: 20,
    pattern: '^[a-zA-Z0-9_]+$',
  })
  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(3, 20, { message: '用户名长度必须在3-20个字符之间' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
    minLength: 6,
    maxLength: 50,
  })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @Length(6, 50, { message: '密码长度必须在6-50个字符之间' })
  password: string;

  @ApiProperty({
    description: '验证码令牌',
    example: 'captcha-token-456',
  })
  @IsString({ message: '验证码令牌必须是字符串' })
  @IsNotEmpty({ message: '验证码令牌不能为空' })
  captchaToken: string;

  @ApiProperty({
    description: '验证码',
    example: 'EFGH',
    minLength: 4,
    maxLength: 6,
  })
  @IsString({ message: '验证码必须是字符串' })
  @IsNotEmpty({ message: '验证码不能为空' })
  @Length(4, 6, { message: '验证码长度必须在4-6个字符之间' })
  captchaCode: string;

  @ApiPropertyOptional({
    description: '昵称',
    example: 'newuser',
    minLength: 2,
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @Length(2, 20, { message: '昵称长度必须在2-20个字符之间' })
  nickname?: string;

  @ApiPropertyOptional({
    description: '邮箱地址',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiPropertyOptional({
    description: '手机号码',
    example: '13800138000',
    pattern: '^1[3-9]\\d{9}$',
  })
  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  mobile?: string;

  @ApiPropertyOptional({
    description: '性别',
    example: 'MALE',
    enum: Gender,
    default: Gender.UNKNOWN,
  })
  @IsOptional()
  @IsEnum(Gender, { message: '性别值不正确' })
  gender?: Gender;
}
