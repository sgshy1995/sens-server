import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("pain_comments")
export class PainComment {

  @PrimaryGeneratedColumn("uuid", { comment: "评论id" })
  id: string;

  @Column("varchar", { comment: "用户id" })
  user_id: string;

  @Column("varchar", { comment: "问题id" })
  question_id: string;

  @Column("varchar", { comment: "答复id" })
  reply_id: string;

  @Column("varchar", { comment: "评论id 如果存在，表示的是回复的是评论", nullable: true })
  comment_id: string;

  @Column("varchar", { comment: "评论目标用户id" })
  comment_to_user_id: string;

  @Column("int", { comment: "点赞数" })
  like_num: number;

  @Column("text", { comment: "点赞id集合", nullable: true })
  like_user_ids?: string;

  @Column("text", { comment: "评论内容" })
  comment_content: string;

  @Column("timestamp", { comment: "评论时间" })
  comment_time: Date;

  @Column("int", { comment: "答复状态 1 正常 0 删除" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
