import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("live_courses")
export class LiveCourse {

  @PrimaryGeneratedColumn("uuid", { comment: "课程id" })
  id: string;

  @Column("varchar", { comment: "课程标题" })
  title: string;

  @Column("varchar", { comment: "课程封面" })
  cover: string;

  @Column("text", { comment: "课程介绍" })
  description: string;

  @Column("int", { comment: "课程类型 0 运动康复 1 神经康复 2 产后康复 3 术后康复" })
  course_type: number;

  @Column("int", { comment: "直播次数" })
  live_num: number;

  @Column("int", { comment: "购买次数" })
  frequency_num: number;

  @Column("varchar", { comment: "售价 最多两位小数" })
  price: string;

  @Column("int", { comment: "是否折扣 1 折扣 0 不折扣" })
  is_discount: number;

  @Column("varchar", { comment: "折扣价 最多两位小数", nullable: true })
  discount?: string;

  @Column("timestamp", { comment: "折扣有效期", nullable: true })
  discount_validity?: Date;

  @Column("int", { comment: "是否轮播 1 是 0 否" })
  carousel: number;

  @Column("timestamp", { comment: "发布时间", nullable: true })
  publish_time?: Date;

  @Column("int", { comment: "课程状态 1 正常 0 下架" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
