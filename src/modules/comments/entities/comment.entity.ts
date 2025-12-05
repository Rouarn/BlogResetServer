import { Article } from '@/modules/articles/entities/article.entity';
import { User } from '@/modules/users/entities/user.entity';
import { BaseEntity } from 'src/database';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum CommentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED',
}

@Entity('comments')
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { comment: 'ID' })
  id: string;

  @Column({ name: 'article_id', type: 'uuid', comment: '文章ID（articles.id）' })
  articleId: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true, comment: '父评论ID（comments.id）' })
  parentId: string | null;

  @Column({
    name: 'user_id',
    type: 'uuid',
    nullable: true,
    comment: '评论用户ID（登录用户可为空表示游客）',
  })
  userId: string | null;

  @Column({
    name: 'author_nickname',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '游客昵称',
  })
  authorNickname: string | null;

  @Column({
    name: 'author_email',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '游客邮箱',
  })
  authorEmail: string | null;

  @Column({
    name: 'author_website',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '游客网站',
  })
  authorWebsite: string | null;

  @Column({ type: 'text', comment: '评论内容' })
  content: string;

  @Column({
    type: 'enum',
    enum: CommentStatus,
    default: CommentStatus.PENDING,
    comment: '审核状态',
  })
  status: CommentStatus;

  @Column({
    name: 'ip_hash',
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: 'IP 哈希（去重/风控）',
  })
  ipHash: string | null;

  @Column({
    name: 'user_agent',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '客户端 UA',
  })
  userAgent: string | null;

  @Column({
    name: 'moderated_by_id',
    type: 'uuid',
    nullable: true,
    comment: '审核人用户ID（users.id）',
  })
  moderatedById: string | null;

  @Column({ name: 'moderated_at', type: 'timestamp', nullable: true, comment: '审核时间' })
  moderatedAt: Date | null;

  @Column({ name: 'is_public', type: 'boolean', default: true, comment: '是否公开显示' })
  isPublic: boolean;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => Comment, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'moderated_by_id' })
  moderator: User | null;
}
