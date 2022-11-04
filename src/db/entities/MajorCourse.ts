import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("major_courses")
export class MajorCourse {

  @PrimaryGeneratedColumn("uuid", { comment: "主体id" })
  id: string;

  @Column("varchar", { comment: "用户id" })
  user_id: string;

  @Column("varchar", { comment: "课程id" })
  course_id: string;

  @Column("datetime", { comment: "有效期", nullable: true })
  validity_time: Date;

  @Column("varchar", { comment: "订单id" })
  order_id: string;

  @Column("int", { comment: "最近观看节数", nullable: true })
  recent_num: number;

  @Column("varchar", { comment: "最近观看进度", nullable: true })
  recent_progress: string;

  @Column("int", { comment: "课程状态 1 正常 0 冻结" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
