import { User } from '@/modules/users/entities/user.entity';
import { File } from '@/shared/files/entities/file.entity';
import { BaseEntity } from 'src/database';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum ArticleVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

@Entity('articles')
export class Article extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { comment: 'ID' })
  id: string;

  @Column({ name: 'author_id', type: 'uuid', comment: '作者用户ID（users.id）' })
  authorId: string;

  @Column({
    name: 'editor_id',
    type: 'uuid',
    nullable: true,
    comment: '最近编辑者用户ID（users.id）',
  })
  editorId: string | null;

  @Column({ length: 255, comment: '文章标题' })
  title: string;

  @Index('UQ_articles_slug', { unique: true })
  @Column({ length: 255, comment: '文章唯一别名（用于路由）' })
  slug: string;

  @Column({ type: 'text', nullable: true, comment: '文章摘要/描述' })
  summary: string | null;

  @Column({ type: 'longtext', comment: 'Markdown 原文内容' })
  contentMd: string;

  @Column({
    type: 'enum',
    enum: ArticleStatus,
    default: ArticleStatus.DRAFT,
    comment: '文章状态：草稿/已发布/归档',
  })
  status: ArticleStatus;

  @Column({
    type: 'enum',
    enum: ArticleVisibility,
    default: ArticleVisibility.PUBLIC,
    comment: '可见性：公开/私密',
  })
  visibility: ArticleVisibility;

  @Column({
    name: 'published_at',
    type: 'timestamp',
    nullable: true,
    comment: '发布时间（发布后填充）',
  })
  publishedAt: Date | null;

  @Column({
    name: 'cover_file_id',
    type: 'uuid',
    nullable: true,
    comment: '封面文件ID（files.id）',
  })
  coverFileId: string | null;

  @Column({ name: 'allow_comments', type: 'boolean', default: true, comment: '是否允许评论' })
  allowComments: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'editor_id' })
  editor: User | null;

  @ManyToOne(() => File)
  @JoinColumn({ name: 'cover_file_id' })
  coverFile: File | null;
}
