import { BaseEntity } from 'src/database';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categories')
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { comment: 'ID' })
  id: string;

  @Column({ length: 100, comment: '分类名称' })
  name: string;

  @Index('UQ_categories_slug', { unique: true })
  @Column({ length: 100, comment: '分类唯一别名' })
  slug: string;

  @Column({ type: 'text', nullable: true, comment: '分类描述' })
  description: string | null;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true, comment: '父分类ID（ra_categories.id）' })
  parentId: string | null;

  @Column({ name: 'is_public', type: 'boolean', default: true, comment: '是否公开' })
  isPublic: boolean;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'parent_id' })
  parent: Category | null;
}
