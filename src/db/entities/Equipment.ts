import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("equipments")
export class Equipment {

  @PrimaryGeneratedColumn("uuid", { comment: "器材id" })
  id: string;

  @Column("varchar", { comment: "器材编号 唯一编号，数字和大写字母组合" })
  serial_number: string;

  @Column("varchar", { comment: "器材标题" })
  title: string;

  @Column("varchar", { comment: "器材封面" })
  cover: string;

  @Column("text", { comment: "器材介绍" })
  description: string;

  @Column("text", { comment: "器材长图" })
  long_figure: string;

  @Column("int", { comment: "器材类型 0 康复训练器材 1 康复理疗设备 2 康复治疗师工具" })
  equipment_type: number;

  @Column("int", { comment: "购买总次数" })
  frequency_total_num: number;

  @Column("int", { comment: "是否轮播 1 是 0 否" })
  carousel: number;

  @Column("timestamp", { comment: "发布时间", nullable: true })
  publish_time?: Date;

  @Column("int", { comment: "器材状态 1 正常 0 下架" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
