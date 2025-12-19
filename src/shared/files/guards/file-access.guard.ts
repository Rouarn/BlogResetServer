import { CurrentUser } from '@/common/decorators';
import { BusinessExceptionFactory } from '@/common/exceptions';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FilesService } from '../services/files.service';

@Injectable()
export class FileAccessGuard implements CanActivate {
  constructor(private filesService: FilesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: CurrentUser; params: { id?: string } }>();
    const user = request.user;
    const fileId = request.params.id;

    // 如果没有文件ID，允许访问（可能是列表接口）
    if (!fileId) {
      return true;
    }

    try {
      // 检查用户是否有权限访问该文件
      await this.filesService.findFileById(fileId, user?.userId);
      return true;
    } catch {
      throw BusinessExceptionFactory.forbidden('禁止访问该文件', { fileId });
    }
  }
}
