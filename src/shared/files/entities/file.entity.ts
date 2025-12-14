import { BaseEntity } from '@/database';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { FileType } from '../enums';

@Entity('files')
export class File extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  filename: string;

  @Column({ name: 'original_name', length: 255 })
  originalName: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ length: 500 })
  path: string;

  @Column({ length: 64, unique: true, nullable: true })
  hash: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({
    name: 'upload_protocol',
    type: 'varchar',
    default: 'HTTP',
  })
  uploadProtocol: string;

  @Column({
    name: 'file_type',
    type: 'enum',
    enum: FileType,
    default: FileType.OTHER,
  })
  fileType: FileType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;
}
