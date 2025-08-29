import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MultiProtocolService } from '../services/multi-protocol.service';

@ApiTags('协议支持')
@ApiBearerAuth()
@Controller('files/protocols')
export class ProtocolsController {
  constructor(private readonly multiProtocolService: MultiProtocolService) {}

  @Get('supported')
  @ApiOperation({ summary: '获取支持的上传协议' })
  @ApiResponse({ status: 200, description: '获取支持的协议列表成功' })
  async getSupportedProtocols() {
    const protocols = this.multiProtocolService.getSupportedProtocols();
    return {
      success: true,
      data: {
        protocols,
        count: protocols.length,
      },
      message: '获取支持的协议列表成功',
    };
  }
}
