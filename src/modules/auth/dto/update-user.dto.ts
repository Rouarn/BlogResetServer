import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Gender, Role, Status } from 'src/common/enums/index';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 更新用户信息数据传输对象
 * 用于用户信息更新操作
 */
export class UpdateUserDto {
  @ApiProperty({
    description: '昵称',
    example: 'John Doe',
    required: false,
  })
  @IsString({ message: '昵称必须是字符串' })
  @IsOptional()
  nickname?: string;

  @ApiProperty({
    description: '头像URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsString({ message: '头像URL必须是字符串' })
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    description: '性别',
    enum: Gender,
    example: Gender.MALE,
    required: false,
  })
  @IsEnum(Gender, { message: '性别必须是有效的枚举值' })
  @IsOptional()
  gender?: Gender;

  @ApiProperty({
    description: '手机号码',
    example: '13800138000',
    required: false,
  })
  @IsString({ message: '手机号码必须是字符串' })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: '用户角色',
    enum: Role,
    example: Role.USER,
    required: false,
  })
  @IsEnum(Role, { message: '角色必须是有效的枚举值' })
  @IsOptional()
  roles?: Role;
}

/**
 * 批量删除用户数据传输对象
 */
export class BatchDeleteUserDto {
  @ApiProperty({
    description: '用户ID数组',
    example: ['1', '2', '3'],
    type: [String],
  })
  @IsString({ each: true, message: '用户ID必须是字符串' })
  ids: string[];
}

/**
 * 用户状态切换数据传输对象
 */
export class ToggleUserStatusDto {
  @ApiProperty({
    description: '用户状态',
    enum: Status,
    example: Status.ENABLED,
  })
  @IsEnum(Status, { message: '状态必须是有效的枚举值' })
  status: Status;
}
