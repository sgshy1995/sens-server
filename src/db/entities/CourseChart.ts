import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("course_in_videos")
export class CourseInVideo {

  @PrimaryGeneratedColumn("uuid", { comment: "视频id" })
  id: string;

  @Column("varchar", { comment: "课程id" })
  course_id: string;

  @Column("varchar", { comment: "视频标题" })
  title: string;

  @Column("varchar", { comment: "视频封面" })
  cover: string;

  @Column("text", { comment: "视频介绍" })
  description: string;

  @Column("varchar", { comment: "视频地址" })
  source: string;

  @Column("varchar", { comment: "视频时长" })
  time_length: string;

  @Column("int", { comment: "视频排序" })
  sort: number;

  @Column("timestamp", { comment: "发布时间", nullable: true })
  publish_time?: Date;

  @Column("int", { comment: "视频状态 1 正常 0 下架" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
