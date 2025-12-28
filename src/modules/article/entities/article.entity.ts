import { BaseEntity } from '@/database';
import { User } from '@/modules/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('article')
export class Article extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { comment: 'ID' })
  id: string;

  @Column({ length: 100, nullable: true, comment: '文章标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '文章内容' })
  content: string;

  @Column({ type: 'timestamp', nullable: true, comment: '发布时间' })
  publishTime: Date;

  @Column({ length: 50, nullable: true, comment: '文章分类' })
  classification: string;

  @ManyToOne(() => User, (user) => user.articles)
  author: User;
}
