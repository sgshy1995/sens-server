import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
export class User {

  @PrimaryGeneratedColumn("uuid", { comment: "用户id" })
  id: string;

  @Column("varchar", { comment: "用户名" })
  username: string;

  @Column("varchar", { comment: "用户姓名" })
  name: string;

  @Column("varchar", { comment: "用户头像", nullable: true })
  avatar?: string;

  @Column("varchar", { comment: "用户密码" })
  password: string;

  @Column("varchar", { comment: "盐" })
  salt: string;

  @Column("int", { comment: "用户性别" })
  gender: number;

  @Column("varchar", { comment: "用户手机号" })
  phone: string;

  @Column("int", { comment: "用户身份" })
  identity: number;

  @Column("int", { comment: "用户认证" })
  authenticate: number;

  @Column("varchar", { comment: "用户微信唯一标识", nullable: true })
  wx_unionid?: string;

  @Column("varchar", { comment: "用户微信昵称", nullable: true })
  wx_nickname?: string;

  @Column("timestamp", { comment: "最近登录时间", nullable: true })
  recent_login_time?: Date;

  @Column("int", { comment: "用户状态" })
  status: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
