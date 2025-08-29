import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { FileStatus, UploadProtocol, FileType } from '../enums';
import { UploadChunk } from './upload-chunk.entity';

@Entity('files')
export class File {
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
    type: 'enum',
    enum: UploadProtocol,
    default: UploadProtocol.HTTP,
  })
  uploadProtocol: UploadProtocol;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.COMPLETED,
  })
  status: FileStatus;

  @Column({
    name: 'file_type',
    type: 'enum',
    enum: FileType,
    default: FileType.OTHER,
  })
  fileType: FileType;

  @Column({ name: 'upload_id', nullable: true })
  uploadId: string;

  @Column({ name: 'total_chunks', nullable: true })
  totalChunks: number;

  @Column({ name: 'uploaded_chunks', nullable: true })
  uploadedChunks: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @OneToMany(() => UploadChunk, (chunk) => chunk.file, { cascade: true })
  chunks: UploadChunk[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
