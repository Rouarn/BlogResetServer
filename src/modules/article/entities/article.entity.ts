import { ArticleStatus, Status } from '@/common/enums';
import { BaseEntity } from '@/database';
import { Category } from '@/modules/category/entities/category.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('article')
export class Article extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { comment: 'ID' })
  id: number;

  @Column({ length: 100, comment: '标题' })
  title: string;

  @Column({ length: 500, nullable: true, comment: '列表页摘要' })
  summary: string;

  @Column({ type: 'text', comment: 'Markdown 内容' })
  content: string;

  @Column({ length: 255, nullable: true, comment: '封面图 URL' })
  cover: string;

  @Column({ nullable: true, comment: '关联分类 ID' })
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true, comment: '关联用户 ID (作者)' })
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'enum', enum: Status, default: Status.DISABLED, comment: '是否推荐' })
  isFeatured: Status;

  @Column({ default: 0, comment: '阅读数' })
  views: number;

  @Column({ default: 0, comment: '点赞数' })
  likes: number;

  @Column({
    type: 'enum',
    enum: ArticleStatus,
    default: ArticleStatus.DRAFT,
    comment: '状态 (草稿, 已发布)',
  })
  status: ArticleStatus;

  @Column({ type: 'timestamp', nullable: true, comment: '发布时间' })
  publishedAt: Date | null;
}
