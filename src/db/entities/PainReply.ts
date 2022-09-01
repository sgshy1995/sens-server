import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("pain_replies")
export class PainReply {

  @PrimaryGeneratedColumn("uuid", { comment: "答复id" })
  id: string;

  @Column("varchar", { comment: "用户id" })
  user_id: string;

  @Column("int", { comment: "是否专业回答 1 是 0 否" })
  is_major: number;

  @Column("varchar", { comment: "问题id" })
  question_id: string;

  @Column("int", { comment: "点赞数" })
  like_num: number;

  @Column("text", { comment: "点赞id集合", nullable: true })
  like_user_ids?: string;

  @Column("int", { comment: "评论数" })
  comment_num: number;

  @Column("text", { comment: "答复内容" })
  reply_content: string;

  @Column("timestamp", { comment: "答复时间" })
  reply_time: Date;

  @Column("text", { comment: "影像资料", nullable: true })
  image_data?: string;

  @Column("int", { comment: "答复状态 1 正常 0 删除" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
