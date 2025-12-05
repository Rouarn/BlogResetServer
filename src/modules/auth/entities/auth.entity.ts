import { User } from '@/modules/users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { Exclude } from 'class-transformer';
import { Status } from 'src/common/enums';
import { BaseEntity } from 'src/database';
import { BeforeInsert, Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 认证实体
 * 专门负责用户认证相关的信息
 * 包括用户名、密码、状态等认证必需的字段
 */
@Entity('auth')
export class Auth extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '认证ID' })
  id: string;

  @Column({ length: 100, unique: true, comment: '用户名' })
  username: string;

  @Exclude()
  @Column({ comment: '密码' })
  password: string;

  @Exclude()
  @Column({ length: 100, nullable: true, comment: '盐' })
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

  @BeforeInsert()
  async encryptPwd(): Promise<void> {
    try {
      const saltRounds = 10;
      // 同步地生成一个随机的盐
      const salt = bcrypt.genSaltSync(saltRounds);
      this.salt = salt;
      // 同步地使用新生成的盐对密码进行哈希处理
      this.password = bcrypt.hashSync(this.password, salt);
      this.passwordChangedAt = new Date();
    } catch (err) {
      throw new Error('密码加密过程中发生错误');
    }
  }

  /**
   * 验证密码
   * @param inputPassword 输入的密码
   * @returns 密码是否正确
   */
  async validatePassword(inputPassword: string): Promise<boolean> {
    return bcrypt.compareSync(inputPassword, this.password);
  }

  /**
   * 记录登录成功
   * @param ip 登录IP
   */
  recordSuccessfulLogin(ip?: string): void {
    this.lastLoginAt = new Date();
    this.lastLoginIp = ip;
    this.loginAttempts = 0;
    this.lockedAt = undefined;
  }

  /**
   * 记录登录失败
   */
  recordFailedLogin(): void {
    this.loginAttempts += 1;
    // 如果失败次数超过5次，锁定账户30分钟
    if (this.loginAttempts >= 5) {
      this.lockedAt = new Date();
    }
  }

  /**
   * 检查账户是否被锁定
   * @returns 是否被锁定
   */
  isLocked(): boolean {
    if (!this.lockedAt) return false;

    // 锁定30分钟后自动解锁
    const lockDuration = 30 * 60 * 1000; // 30分钟
    const now = new Date();
    return now.getTime() - this.lockedAt.getTime() < lockDuration;
  }

  /**
   * 解锁账户
   */
  unlock(): void {
    this.loginAttempts = 0;
    this.lockedAt = undefined;
  }
}
