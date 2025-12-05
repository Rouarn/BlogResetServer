import { Article } from '@/modules/articles/entities/article.entity';
import { File } from '@/shared/files/entities/file.entity';
import { BaseEntity } from 'src/database';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('article_files')
export class ArticleFile extends BaseEntity {
  @PrimaryColumn({ name: 'article_id', type: 'uuid', comment: '文章ID（articles.id）' })
  articleId: string;

  @PrimaryColumn({ name: 'file_id', type: 'uuid', comment: '文件ID（files.id）' })
  fileId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '文件用途说明' })
  description: string | null;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => File, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'file_id' })
  file: File;
}
