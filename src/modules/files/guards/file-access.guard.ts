import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FilesService } from '../services/files.service';

@Injectable()
export class FileAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private filesService: FilesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const fileId = request.params.id;

    // 如果没有文件ID，允许访问（可能是列表接口）
    if (!fileId) {
      return true;
    }

    try {
      // 检查用户是否有权限访问该文件
      await this.filesService.findFileById(fileId, user?.id);
      return true;
    } catch {
      throw new ForbiddenException('无权限访问该文件');
    }
  }
}
