import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("notifications")
export class Notification {

  @PrimaryGeneratedColumn("uuid", { comment: "通知id" })
  id: string;

  @Column("varchar", { comment: "用户id" })
  user_id: string;

  @Column("int", { comment: "通知类型" })
  notification_type: number;

  @Column("varchar", { comment: "系统通知id", nullable: true })
  sys_notification_id?: string;

  @Column("varchar", { comment: "通知标题", nullable: true })
  title?: string;

  @Column("varchar", { comment: "通知内容", nullable: true })
  content?: string;

  @Column("timestamp", { comment: "发布时间" })
  publish_time: Date;

  @Column("int", { comment: "阅读状态 0 未读 1 已读" })
  read: number;

  @Column("int", { comment: "通知状态" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
