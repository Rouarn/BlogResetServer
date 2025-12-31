import { Gender, Role, Status } from '@/common/enums';
import { SocialLink } from '@/common/interfaces';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
} from 'class-validator';

/**
 * 更新用户DTO
 *
 * 继承自CreateUserDto，所有字段都是可选的。
 * 用于更新用户资料信息，不包含认证相关字段。
 *
 * 特点：
 * - 所有字段可选，支持部分更新
 * - 排除authId字段（不允许更改关联关系）
 * - 保持与创建DTO相同的验证规则
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: '用户昵称',
    example: '李四',
    minLength: 2,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(2, 20, { message: '昵称长度必须在2-20个字符之间' })
  nickname?: string;

  @ApiPropertyOptional({
    description: '职业/头衔',
    example: '高级软件工程师',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(0, 100, { message: '职业/头衔不能超过100个字符' })
  title?: string;

  @ApiPropertyOptional({
    description: '用户头像URL',
    example: 'https://example.com/new-avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    description: '个人主页/侧边栏背景图',
    example: 'https://example.com/cover.jpg',
  })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiPropertyOptional({
    description: '用户性别',
    enum: Gender,
    example: Gender.FEMALE,
  })
  @IsOptional()
  @IsEnum(Gender, { message: '性别值无效' })
  gender?: Gender;

  @ApiPropertyOptional({
    description: '手机号码',
    example: '13900139000',
    pattern: '^1[3-9]\\d{9}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  mobile?: string;

  @ApiPropertyOptional({
    description: '邮箱地址',
    example: 'newemail@example.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiPropertyOptional({
    description: '个人简介',
    example: '更新后的个人介绍',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: '当前状态',
    example: 'Open to work',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(0, 100, { message: '当前状态不能超过100个字符' })
  currentStatus?: string;

  @ApiPropertyOptional({
    description: '社交链接配置',
    example: { twitter: '...', github: '...' },
  })
  @IsOptional()
  socialLinks?: SocialLink[];

  @ApiPropertyOptional({
    description: '生日',
    example: '1992-05-15',
    format: 'date',
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) => (value === '' ? null : value))
  @IsDateString({}, { message: '生日格式不正确' })
  birthday?: string;

  @ApiPropertyOptional({
    description: '所在城市',
    example: '上海市',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50, { message: '城市名称不能超过50个字符' })
  city?: string;

  @ApiPropertyOptional({
    description: '职业',
    example: '产品经理',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50, { message: '职业描述不能超过50个字符' })
  profession?: string;

  @ApiPropertyOptional({
    description: '用户角色',
    example: Role.USER,
  })
  @IsOptional()
  @IsEnum(Role, { message: '角色值无效' })
  roles?: Role;
}

/**
 * 批量删除用户DTO
 *
 * 用于批量删除多个用户的操作。
 *
 * 字段说明：
 * - ids: 要删除的用户ID数组
 *
 * 验证规则：
 * - ids: 必填数组，不能为空
 * - 数组中的每个元素必须是有效的UUID
 */
export class BatchDeleteUserDto {
  @ApiProperty({
    description: '要删除的用户ID数组',
    example: ['uuid1', 'uuid2', 'uuid3'],
    type: [String],
  })
  @IsArray({ message: 'ids必须是数组' })
  @ArrayNotEmpty({ message: 'ids数组不能为空' })
  @IsUUID('4', { each: true, message: '每个ID必须是有效的UUID' })
  ids: string[];
}

/**
 * 用户查询DTO
 *
 * 用于用户列表查询和筛选。
 *
 * 字段说明：
 * - current: 当前页码
 * - size: 每页数量
 * - nickname: 昵称模糊搜索
 * - email: 邮箱模糊搜索
 * - roles: 角色筛选
 * - status: 状态筛选
 */
export class QueryUserDto {
  @ApiPropertyOptional({
    description: '当前页码',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码必须大于0' })
  current?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量必须大于0' })
  size?: number = 10;

  @ApiPropertyOptional({
    description: '昵称模糊搜索',
    example: '李',
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    description: '邮箱模糊搜索',
    example: 'example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: '角色筛选',
    enum: Role,
    example: Role.USER,
  })
  @IsOptional()
  @IsEnum(Role, { message: '角色值无效' })
  roles?: Role;

  @ApiPropertyOptional({
    description: '状态筛选',
    enum: Status,
    example: Status.ENABLED,
  })
  @IsOptional()
  @IsEnum(Status, { message: '状态值无效' })
  status?: Status;
}
