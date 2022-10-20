import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("couriers")
export class Courier {

  @PrimaryGeneratedColumn("uuid", { comment: "物流信息id" })
  id: string;

  @Column("varchar", { comment: "物流单号" })
  courier_number: string;

  @Column("text", { comment: "物流信息" })
  courier_content: string;

  @Column("int", { comment: "物流状态 6 退件签收 5 疑难件 4 派送失败 3 已签收 2 正在派件 1 在途中 0 揽件" })
  status: number;

  @Column("timestamp", { comment: "最近记录时间", nullable: true })
  recent_update_time?: Date;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
