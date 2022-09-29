import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("equipment_charts")
export class EquipmentChart {

  @PrimaryGeneratedColumn("uuid", { comment: "商品id" })
  id: string;

  @Column("varchar", { comment: "用户id" })
  user_id: string;

  @Column("varchar", { comment: "器材id" })
  equipment_id: string;

  @Column("varchar", { comment: "型号id" })
  equipment_model_id: string;

  @Column("int", { comment: "添加数量" })
  add_num: number;

  @Column("int", { comment: "商品状态 1 正常 0 删除" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
