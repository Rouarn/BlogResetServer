import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Gender, Role } from 'src/common/enums/index';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 认证数据传输对象
 * 用于用户登录、注册等认证相关操作
 */
export class CreateAuthDto {
  @ApiProperty({
    description: '用户ID',
    example: '1',
    required: false,
  })
  id: string;

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
  nickname: string;

  @ApiProperty({
    description: '头像URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatar: string;

  @ApiProperty({
    description: '性别',
    enum: Gender,
    example: Gender.MALE,
    required: false,
  })
  gender: Gender;

  @ApiProperty({
    description: '手机号码',
    example: '13800138000',
    required: false,
  })
  phone: string;

  @ApiProperty({
    description: '用户角色',
    enum: Role,
    example: Role.USER,
    required: false,
  })
  roles: Role;

  @ApiProperty({
    description: '创建时间',
    example: '2023-12-01T10:00:00.000Z',
    required: false,
  })
  createTime: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2023-12-01T10:00:00.000Z',
    required: false,
  })
  updateTime: Date;
}
