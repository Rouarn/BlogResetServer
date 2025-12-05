import { Article } from '@/modules/articles/entities/article.entity';
import { Tag } from '@/modules/tags/entities/tag.entity';
import { BaseEntity } from 'src/database';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('article_tags')
export class ArticleTag extends BaseEntity {
  @PrimaryColumn({ name: 'article_id', type: 'uuid', comment: '文章ID（ra_articles.id）' })
  articleId: string;

  @PrimaryColumn({ name: 'tag_id', type: 'uuid', comment: '标签ID（ra_tags.id）' })
  tagId: string;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
