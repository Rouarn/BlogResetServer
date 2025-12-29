import { Gender, Role, Status } from '@/common/enums';
import { SocialLink } from '@/common/interfaces';
import { BaseEntity } from '@/database';
import { Article } from '@/modules/article/entities/article.entity';
import { Auth } from '@/modules/auth/entities/auth.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 用户信息实体
 *
 * 专门负责存储用户的个人资料信息，与认证信息分离，实现职责单一。
 * 通过一对一关系关联认证实体，形成完整的用户体系。
 */
@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '用户ID' })
  id: string;

  @Column({ length: 100, nullable: true, default: '用户', comment: '昵称' })
  nickname: string;

  @Column({ length: 100, nullable: true, comment: '职业/头衔' })
  title: string;

  @Column({ nullable: true, comment: '头像URL' })
  avatar: string;

  @Column({ length: 255, nullable: true, comment: '个人主页/侧边栏背景图' })
  cover: string;

  @Column('simple-enum', {
    enum: Gender,
    default: Gender.UNKNOWN,
    nullable: true,
    comment: '性别',
  })
  gender: Gender;

  @Column({ length: 11, nullable: true, comment: '手机号' })
  mobile: string;

  @Column('simple-enum', {
    enum: Role,
    default: Role.USER,
    comment: '用户角色',
    nullable: false,
  })
  roles: Role;

  @Column({ type: 'text', nullable: true, comment: '个人简介' })
  bio: string;

  @Column({ length: 100, nullable: true, comment: '当前状态' })
  currentStatus: string;

  @Column('simple-enum', {
    enum: Status,
    default: Status.ENABLED,
    comment: '账号状态',
  })
  status: Status;

  @Column({ type: 'json', nullable: true, comment: '社交链接配置' })
  socialLinks: SocialLink[];

  @Column({ nullable: true, comment: '邮箱地址' })
  email: string;

  @Column({ type: 'date', nullable: true, comment: '生日' })
  birthday: Date;

  @Column({ length: 100, nullable: true, comment: '所在城市' })
  city: string;

  @Column({ length: 100, nullable: true, comment: '职业' })
  profession: string;

  // 一对一关联认证信息
  @OneToOne(() => Auth, (auth) => auth.user)
  @JoinColumn()
  auth: Auth;

  // 文章列表
  @OneToMany(() => Article, (article) => article.author)
  articles: Article[];
}
