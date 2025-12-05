import { Article } from '@/modules/articles/entities/article.entity';
import { Category } from '@/modules/categories/entities/category.entity';
import { BaseEntity } from 'src/database';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('article_categories')
export class ArticleCategory extends BaseEntity {
  @PrimaryColumn({ name: 'article_id', type: 'uuid', comment: '文章ID（articles.id）' })
  articleId: string;

  @PrimaryColumn({ name: 'category_id', type: 'uuid', comment: '分类ID（categories.id）' })
  categoryId: string;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
