import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("prescriptions")
export class Prescription {

  @PrimaryGeneratedColumn("uuid", { comment: "处方id" })
  id: string;

  @Column("varchar", { comment: "处方标题" })
  title: string;

  @Column("varchar", { comment: "处方封面" })
  cover: string;

  @Column("int", { comment: "处方类型 0 文章 1 视频" })
  prescription_type: number;

  @Column("int", { comment: "观看人数" })
  watch_num: number;

  @Column("varchar", { comment: "处方视频地址", nullable: true })
  prescription_video?: string;

  @Column("text", { comment: "处方内容", nullable: true })
  prescription_content?: string;

  @Column("text", { comment: "处方描述" })
  description: string;

  @Column("int", { comment: "难度 难度1~难度5" })
  difficulty: number;

  @Column("varchar", { comment: "处方时长" })
  time_length: string;

  @Column("int", { comment: "关节部位 0肩关节 1肘关节 2腕关节 3髋关节 4膝关节 5踝关节 6脊柱" })
  part: number;

  @Column("int", { comment: "症状 0疼痛 1肿胀 2活动受限 3弹响" })
  symptoms: number;

  @Column("int", { comment: "阶段 0 0-2周 1 3-6周 2 6-12周 3 12周以后" })
  phase: number;

  @Column("timestamp", { comment: "发布时间", nullable: true })
  publish_time?: Date;

  @Column("int", { comment: "处方状态 1 正常 0 下架" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
