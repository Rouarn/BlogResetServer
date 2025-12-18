import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * 修改密码DTO
 *
 * 用于用户修改密码的数据传输对象。
 *
 * 字段说明：
 * - oldPassword: 旧密码（必填）
 * - newPassword: 新密码（必填）
 * - confirmPassword: 确认新密码（必填）
 *
 * 验证规则：
 * - 所有密码字段都必须是6-50个字符
 * - 新密码不能与旧密码相同
 * - 新密码与确认密码必须一致
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: '旧密码',
    example: 'oldpassword123',
    minLength: 6,
    maxLength: 50,
  })
  @IsString({ message: '旧密码必须是字符串' })
  @IsNotEmpty({ message: '旧密码不能为空' })
  @Length(6, 50, { message: '旧密码长度必须在6-50个字符之间' })
  oldPassword: string;

  @ApiProperty({
    description: '新密码',
    example: 'newpassword123',
    minLength: 6,
    maxLength: 50,
  })
  @IsString({ message: '新密码必须是字符串' })
  @IsNotEmpty({ message: '新密码不能为空' })
  @Length(6, 50, { message: '新密码长度必须在6-50个字符之间' })
  newPassword: string;

  @ApiProperty({
    description: '确认新密码',
    example: 'newpassword123',
    minLength: 6,
    maxLength: 50,
  })
  @IsString({ message: '确认密码必须是字符串' })
  @IsNotEmpty({ message: '确认密码不能为空' })
  @Length(6, 50, { message: '确认密码长度必须在6-50个字符之间' })
  confirmPassword: string;
}

/**
 * 重置密码DTO
 *
 * 用于忘记密码时重置密码的数据传输对象。
 *
 * 字段说明：
 * - username: 用户名（必填）
 * - newPassword: 新密码（必填）
 * - confirmPassword: 确认新密码（必填）
 * - resetToken: 重置令牌（必填）
 * - captchaToken: 验证码令牌（必填）
 * - captchaCode: 验证码（必填）
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: '用户名',
    example: 'admin',
  })
  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @ApiProperty({
    description: '新密码',
    example: 'newpassword123',
    minLength: 6,
    maxLength: 50,
  })
  @IsString({ message: '新密码必须是字符串' })
  @IsNotEmpty({ message: '新密码不能为空' })
  @Length(6, 50, { message: '新密码长度必须在6-50个字符之间' })
  newPassword: string;

  @ApiProperty({
    description: '确认新密码',
    example: 'newpassword123',
    minLength: 6,
    maxLength: 50,
  })
  @IsString({ message: '确认密码必须是字符串' })
  @IsNotEmpty({ message: '确认密码不能为空' })
  @Length(6, 50, { message: '确认密码长度必须在6-50个字符之间' })
  confirmPassword: string;

  @ApiProperty({
    description: '重置令牌',
    example: 'reset-token-789',
  })
  @IsString({ message: '重置令牌必须是字符串' })
  @IsNotEmpty({ message: '重置令牌不能为空' })
  resetToken: string;

  @ApiProperty({
    description: '验证码令牌',
    example: 'captcha-token-789',
  })
  @IsString({ message: '验证码令牌必须是字符串' })
  @IsNotEmpty({ message: '验证码令牌不能为空' })
  captchaToken: string;

  @ApiProperty({
    description: '验证码',
    example: 'IJKL',
    minLength: 4,
    maxLength: 6,
  })
  @IsString({ message: '验证码必须是字符串' })
  @IsNotEmpty({ message: '验证码不能为空' })
  @Length(4, 6, { message: '验证码长度必须在4-6个字符之间' })
  captchaCode: string;
}
