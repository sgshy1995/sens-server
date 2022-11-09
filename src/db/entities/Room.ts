import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("rooms")
export class Room {

  @PrimaryGeneratedColumn("uuid", { comment: "房间id" })
  id: string;

  @Column("varchar", { comment: "房间号" })
  room_no: string;

  @Column("varchar", { comment: "讲师用户id" })
  lecturer_user_id: string;

  @Column("varchar", { comment: "患者用户id" })
  patient_user_id: string;

  @Column("varchar", { comment: "预约id" })
  book_id: string;

  @Column("varchar", { comment: "预约时间表id" })
  lecturer_time_id: string;

  @Column("varchar", { comment: "预约患者课程id" })
  patient_course_id: string;

  @Column("datetime", { comment: "预约开始时间" })
  book_start_time: Date;

  @Column("datetime", { comment: "预约结束时间" })
  book_end_time: Date;

  @Column("int", { comment: "房间状态 1 正常 0 删除" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
