import { Status } from '@/common/enums';
import { BaseEntity } from '@/database';
import { User } from '@/modules/users/entities/user.entity';
import { Exclude } from 'class-transformer';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 认证实体
 *
 * 专门负责用户认证相关的信息，包括用户名、密码、状态等认证必需的字段。
 * 与用户信息实体通过一对一关系关联，实现认证与用户资料的分离。
 */
@Entity('auth')
export class Auth extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '认证ID' })
  id: string;

  @Column({ length: 100, unique: true, comment: '用户名' })
  username: string;

  @Exclude()
  @Column({ comment: '密码', select: false })
  password: string;

  @Exclude()
  @Column({ length: 100, nullable: true, comment: '盐', select: false })
  salt: string;

  @Column('simple-enum', {
    enum: Status,
    default: Status.ENABLED,
    comment: '认证状态',
  })
  status: Status;

  @Column({ type: 'timestamp', nullable: true, comment: '最后登录时间' })
  lastLoginAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true, comment: '最后登录IP' })
  lastLoginIp?: string;

  @Column({ type: 'int', default: 0, comment: '登录失败次数' })
  loginAttempts: number;

  @Column({ type: 'timestamp', nullable: true, comment: '账户锁定时间' })
  lockedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, comment: '密码最后修改时间' })
  passwordChangedAt?: Date;

  // 一对一关联用户信息
  @OneToOne(() => User, (user) => user.auth, { cascade: true, onDelete: 'CASCADE' })
  user: User;
}
