import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("equipment_models")
export class EquipmentModel {

  @PrimaryGeneratedColumn("uuid", { comment: "型号id" })
  id: string;

  @Column("varchar", { comment: "器材id" })
  equipment_id: string;

  @Column("varchar", { comment: "型号标题" })
  title: string;

  @Column("text", { comment: "型号介绍" })
  description: string;

  @Column("text", { comment: "型号多图" })
  multi_figure: string;

  @Column("text", { comment: "参数信息", nullable: true })
  parameter?: string;

  @Column("varchar", { comment: "品牌" })
  brand: string;

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

  @Column("int", { comment: "库存数" })
  inventory: number;

  @Column("varchar", { comment: "发货地" })
  dispatch_place: string;

  @Column("int", { comment: "型号排序" })
  sort: number;

  @Column("timestamp", { comment: "发布时间", nullable: true })
  publish_time?: Date;

  @Column("int", { comment: "型号状态 1 正常 0 下架" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
