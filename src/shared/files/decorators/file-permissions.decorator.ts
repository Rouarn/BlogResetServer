import { SetMetadata } from '@nestjs/common';

export enum FilePermission {
  READ = 'file:read',
  WRITE = 'file:write',
  DELETE = 'file:delete',
  ADMIN = 'file:admin',
}

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: FilePermission[]): MethodDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
