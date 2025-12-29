import { Public } from '@/common/decorators';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('站点')
@Controller('site')
export class SiteController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @Public()
  @ApiOperation({ summary: '获取站点/博主信息' })
  getProfile(): Promise<User> {
    return this.usersService.findAdminProfile();
  }
}
