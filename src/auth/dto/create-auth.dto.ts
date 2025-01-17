import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateAuthDto {
  id: string;
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @Length(3, 10, { message: '用户名长度在3-10位之间' })
  userName: string;
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
  nickname: string;
  avatar: string;
  gender: number;
  phone: string;
  roles: string;
  createTime: Date;
  updateTime: Date;
}
