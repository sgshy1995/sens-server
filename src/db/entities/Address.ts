import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("addresses")
export class Address {

  @PrimaryGeneratedColumn("uuid", { comment: "收货地址id" })
  id: string;

  @Column("varchar", { comment: "用户id" })
  user_id: string;

  @Column("varchar", { comment: "省编号" })
  province_code: string;

  @Column("varchar", { comment: "市编号" })
  city_code: string;

  @Column("varchar", { comment: "区县编号" })
  area_code: string;

  @Column("varchar", { comment: "省市区文本" })
  detail_text: string;

  @Column("varchar", { comment: "全部文本" })
  all_text: string;

  @Column("varchar", { comment: "联系电话" })
  phone: string;

  @Column("varchar", { comment: "联系人" })
  name: string;

  @Column("varchar", { comment: "标签", nullable: true })
  tag: string;

  @Column("int", { comment: "收货地址状态 1 正常 0 删除" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
