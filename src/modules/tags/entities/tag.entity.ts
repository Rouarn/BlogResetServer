import { BaseEntity } from 'src/database';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tags')
export class Tag extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { comment: 'ID' })
  id: string;

  @Index('UQ_tags_name', { unique: true })
  @Column({ length: 100, comment: '标签名称' })
  name: string;

  @Index('UQ_tags_slug', { unique: true })
  @Column({ length: 100, comment: '标签唯一别名' })
  slug: string;

  @Column({ type: 'text', nullable: true, comment: '标签描述' })
  description: string | null;

  @Column({ name: 'is_public', type: 'boolean', default: true, comment: '是否公开' })
  isPublic: boolean;
}
