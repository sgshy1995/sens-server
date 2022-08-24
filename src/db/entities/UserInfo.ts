import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("user_infos")
export class UserInfo {

  @PrimaryGeneratedColumn("uuid", { comment: "信息id" })
  id: string;

  @Column("varchar", { comment: "用户id" })
  user_id: string;

  @Column("int", { comment: "积分" })
  integral: number;

  @Column("varchar", { comment: "余额" })
  balance: string;

  @Column("int", { comment: "年龄", nullable: true })
  age?: number;

  @Column("varchar", { comment: "既往伤病史", nullable: true })
  injury_history?: string;

  @Column("varchar", { comment: "近期伤病描述", nullable: true })
  injury_recent?: string;

  @Column("varchar", { comment: "出院小结", nullable: true })
  discharge_abstract?: string;

  @Column("text", { comment: "影像资料", nullable: true })
  image_data?: string;

  @Column("int", { comment: "信息状态" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
