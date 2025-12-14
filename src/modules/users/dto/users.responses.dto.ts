import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UserListResponseDto {
  @ApiProperty({ description: '用户列表', type: [User] })
  list: User[];

  @ApiProperty({ description: '总数量', example: 100 })
  total: number;
}

export class DeleteResponseDto {
  @ApiProperty({ description: '结果消息', example: '用户删除成功' })
  message: string;
}

export class BatchDeleteResponseDto {
  @ApiProperty({ description: '结果消息', example: '成功删除 3 个用户' })
  message: string;

  @ApiProperty({ description: '删除数量', example: 3 })
  deletedCount: number;
}
