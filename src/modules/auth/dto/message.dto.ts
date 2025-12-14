import { ApiProperty } from '@nestjs/swagger';
/**
 * 通用消息响应DTO
 *
 * 用于返回操作结果的消息。
 */
export class AuthMessageResponse {
  @ApiProperty({ description: '消息内容', example: '操作成功' })
  message: string;
}
