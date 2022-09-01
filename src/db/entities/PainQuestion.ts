import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("pain_questions")
export class PainQuestion {

  @PrimaryGeneratedColumn("uuid", { comment: "问题id" })
  id: string;

  @Column("varchar", { comment: "用户id" })
  user_id: string;

  @Column("int", { comment: "是否有专业回答 1 是 0 否" })
  has_major: number;

  @Column("varchar", { comment: "伤痛类型" })
  pain_type: string;

  @Column("varchar", { comment: "问题描述" })
  description: string;

  @Column("varchar", { comment: "诊疗史" })
  injury_history: string;

  @Column("timestamp", { comment: "发布时间" })
  question_time: Date;

  @Column("int", { comment: "答复数量" })
  reply_num: number;

  @Column("int", { comment: "收藏数量" })
  collect_num: number;

  @Column("text", { comment: "收藏id集合", nullable: true })
  collect_user_ids?: string;

  @Column("int", { comment: "是否匿名 1 是 0 否" })
  anonymity: number;

  @Column("text", { comment: "影像资料", nullable: true })
  image_data?: string;

  @Column("int", { comment: "问题状态 1 正常 0 删除" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
