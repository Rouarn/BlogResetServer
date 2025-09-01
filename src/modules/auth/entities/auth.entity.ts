import * as bcrypt from 'bcryptjs';
import { Exclude } from 'class-transformer';
import { Timestamped, TimestampedEntity } from 'src/audit';
import { Gender, Role, Status } from 'src/common/enums';
import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ra_users')
@Timestamped()
export class Auth extends TimestampedEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '用户id' })
  id: string; // 用户id

  @Column({ length: 100, unique: true, comment: '用户名' })
  userName: string; // 用户名

  @Column({ length: 100, nullable: true, default: '用户', comment: '昵称' })
  nickname: string; //昵称

  @Exclude()
  @Column({ comment: '密码' })
  password: string; // 密码

  @Column({ length: 100, nullable: true, comment: '盐' })
  salt: string; // 盐

  @Column({ nullable: true, comment: '头像' })
  avatar: string; //头像

  @Column('simple-enum', {
    enum: Gender,
    default: Gender.UNKNOWN,
    nullable: true,
    comment: '性别',
  })
  gender: Gender; // 性别

  @Column({ length: 11, nullable: true, comment: '手机号' })
  mobile: string; // 手机号

  @Column('simple-enum', {
    enum: Role,
    default: Role.USER,
    comment: '用户角色',
    nullable: false,
  })
  roles: Role; // 用户角色

  @Column('simple-enum', {
    enum: Status,
    default: Status.ENABLED,
    comment: '用户状态',
  })
  status: Status; // 用户状态

  @BeforeInsert()
  async encryptPwd(): Promise<void> {
    try {
      const saltRounds = 10;
      // 同步地生成一个随机的盐
      const salt = bcrypt.genSaltSync(saltRounds);
      this.salt = salt;
      // 同步地使用新生成的盐对密码进行哈希处理
      this.password = bcrypt.hashSync(this.password, salt);
    } catch (err) {
      console.error('Error during hashing:', err);
    }
  }
}
