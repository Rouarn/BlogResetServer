import { Article } from '@/modules/articles/entities/article.entity';
import { User } from '@/modules/users/entities/user.entity';
import { BaseEntity } from 'src/database';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

export enum LikeBy {
  USER = 'USER',
  ANON = 'ANON',
}

@Entity('article_likes')
@Unique('UQ_article_likes_user', ['articleId', 'userId'])
@Unique('UQ_article_likes_ip', ['articleId', 'ipHash'])
export class ArticleLike extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { comment: 'ID' })
  id: string;

  @Column({ name: 'article_id', type: 'uuid', comment: '文章ID（articles.id）' })
  articleId: string;

  @Column({
    name: 'liked_by',
    type: 'enum',
    enum: LikeBy,
    default: LikeBy.USER,
    comment: '点赞主体类型：用户/匿名',
  })
  likedBy: LikeBy;

  @Column({
    name: 'user_id',
    type: 'uuid',
    nullable: true,
    comment: '用户ID（当 liked_by=USER 时必填）',
  })
  userId: string | null;

  @Column({
    name: 'ip_hash',
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: '匿名点赞 IP 哈希（当 liked_by=ANON 时必填）',
  })
  ipHash: string | null;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;
}
