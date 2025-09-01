import { BaseEntity } from 'src/database';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { File } from './file.entity';

@Entity('ra_upload_chunks')
export class UploadChunk extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'file_id', type: 'uuid' })
  fileId: string;

  @Column({ name: 'chunk_number' })
  chunkNumber: number;

  @Column({ name: 'chunk_size' })
  chunkSize: number;

  @Column({ name: 'chunk_hash', length: 64, nullable: true })
  chunkHash: string;

  @Column({ name: 'chunk_path', length: 500 })
  chunkPath: string;

  @ManyToOne(() => File, (file) => file.chunks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'file_id' })
  file: File;
}
