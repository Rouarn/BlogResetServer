import { Article } from '@/modules/article/entities/article.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@/database';

@Entity('category')
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { comment: 'ID' })
  id: number;

  @Column({ length: 50, comment: '分类名' })
  name: string;

  @Column({ length: 50, unique: true, comment: '英文标识' })
  code: string;

  @Column({ length: 50, nullable: true, comment: '分类名文字颜色' })
  color: string;

  @Column({ type: 'int', default: 0, comment: '排序权重' })
  sortOrder: number;

  @OneToMany(() => Article, (article) => article.category)
  articles: Article[];
}
