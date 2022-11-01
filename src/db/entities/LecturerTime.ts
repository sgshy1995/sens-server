import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("lecturer_times")
export class LecturerTime {

  @PrimaryGeneratedColumn("uuid", { comment: "时间表id" })
  id: string;

  @Column("varchar", { comment: "用户id" })
  user_id: string;

  @Column("datetime", { comment: "起始时间" })
  start_time: Date;

  @Column("datetime", { comment: "结束时间" })
  end_time: Date;

  @Column("int", { comment: "是否被预约 1 已预约 0 未预约" })
  if_booked: number;

  @Column("varchar", { comment: "预约id", nullable: true })
  book_id?: string;

  @Column("varchar", { comment: "取消原因", nullable: true })
  canceled_reason?: string;

  @Column("int", { comment: "时间状态 1 正常 0 取消" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
