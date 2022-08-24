import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("sys_notifications")
export class SysNotification {

  @PrimaryGeneratedColumn("uuid", { comment: "通知id" })
  id: string;

  @Column("int", { comment: "是否预置" })
  preset: number;

  @Column("varchar", { comment: "通知标题" })
  title: string;

  @Column("varchar", { comment: "通知内容" })
  content: string;

  @Column("timestamp", { comment: "发布时间" })
  publish_time: Date;

  @Column("int", { comment: "通知状态" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
