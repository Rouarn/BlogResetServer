import { Controller, Get,  } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public';

@ApiTags('应用')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: '获取欢迎信息' })
  @ApiResponse({ status: 200, description: '返回欢迎信息' })
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
