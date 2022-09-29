import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("course_charts")
export class CourseChart {

  @PrimaryGeneratedColumn("uuid", { comment: "商品id" })
  id: string;

  @Column("varchar", { comment: "用户id" })
  user_id: string;

  @Column("varchar", { comment: "课程id" })
  course_id: string;

  @Column("int", { comment: "课程类型 1 直播课 0 视频课" })
  add_course_type: number;

  @Column("int", { comment: "添加数量" })
  add_num: number;

  @Column("int", { comment: "商品状态 1 正常 0 删除" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
