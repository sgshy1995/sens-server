import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("patient_courses")
export class PatientCourse {

  @PrimaryGeneratedColumn("uuid", { comment: "主体id" })
  id: string;

  @Column("varchar", { comment: "用户id" })
  user_id: string;

  @Column("varchar", { comment: "课程id" })
  course_id: string;

  @Column("datetime", { comment: "有效期" })
  validity_time: Date;

  @Column("int", { comment: "课程直播次数" })
  course_live_num: number;

  @Column("int", { comment: "已学习次数" })
  learn_num: number;

  @Column("varchar", { comment: "订单id" })
  order_id: string;

  @Column("int", { comment: "已取消次数" })
  cancel_num: number;

  @Column("int", { comment: "课程状态 2 已完成 1 学习中 0 冻结/删除" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
