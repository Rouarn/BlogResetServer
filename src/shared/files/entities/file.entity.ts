import { BaseEntity } from '@/database';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { FileType } from '../enums';

@Entity('files')
export class File extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '文件ID' })
  id: string;

  @Column({ length: 255, comment: '存储文件名' })
  filename: string;

  @Column({ name: 'original_name', length: 255, comment: '原始文件名' })
  originalName: string;

  @Column({ name: 'mime_type', length: 100, comment: 'MIME类型' })
  mimeType: string;

  @Column({ type: 'bigint', comment: '文件大小(字节)' })
  size: number;

  @Column({ length: 500, comment: '存储路径' })
  path: string;

  @Column({ length: 64, unique: true, nullable: true, comment: '文件哈希值(SHA256)' })
  hash: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true, comment: '上传用户ID' })
  userId: string;

  @Column({
    name: 'upload_protocol',
    type: 'varchar',
    default: 'HTTP',
    comment: '上传协议',
  })
  uploadProtocol: string;

  @Column({
    name: 'file_type',
    type: 'enum',
    enum: FileType,
    default: FileType.OTHER,
    comment: '文件类型分类',
  })
  fileType: FileType;

  @Column({ type: 'text', nullable: true, comment: '文件描述' })
  description: string;

  @Column({ name: 'is_public', default: false, comment: '是否公开访问' })
  isPublic: boolean;
}
