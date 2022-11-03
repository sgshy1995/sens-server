import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("books")
export class Book {

  @PrimaryGeneratedColumn("uuid", { comment: "预约表id" })
  id: string;

  @Column("varchar", { comment: "预约用户id" })
  user_id: string;

  @Column("varchar", { comment: "被预约用户id" })
  booked_user_id: string;

  @Column("varchar", { comment: "被预约时间表id" })
  lecturer_time_id: string;

  @Column("varchar", { comment: "预约患者课程id" })
  patient_course_id: string;

  @Column("datetime", { comment: "预约开始时间" })
  book_start_time: Date;

  @Column("datetime", { comment: "预约结束时间" })
  book_end_time: Date;

  @Column("int", { comment: "修改次数" })
  change_num: number;

  @Column("varchar", { comment: "取消原因", nullable: true })
  canceled_reason?: string;

  @Column("varchar", { comment: "外部取消原因", nullable: true })
  outer_canceled_reason?: string;

  @Column("int", { comment: "预约状态 2 已完成 1 已预约 0 取消" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
