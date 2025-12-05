import { Article } from '@/modules/articles/entities/article.entity';
import { User } from '@/modules/users/entities/user.entity';
import { BaseEntity } from 'src/database';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('article_revisions')
export class ArticleRevision extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { comment: 'ID' })
  id: string;

  @Column({ name: 'article_id', type: 'uuid', comment: '文章ID（articles.id）' })
  articleId: string;

  @Column({ name: 'editor_id', type: 'uuid', comment: '编辑者ID（users.id）' })
  editorId: string;

  @Column({ length: 255, comment: '修订标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '修订摘要' })
  summary: string | null;

  @Column({ type: 'longtext', comment: '修订时的 Markdown 内容' })
  contentMd: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '修订原因' })
  reason: string | null;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'editor_id' })
  editor: User;
}
