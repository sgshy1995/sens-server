import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("equipment_orders")
export class EquipmentOrder {

  @PrimaryGeneratedColumn("uuid", { comment: "订单id" })
  id: string;

  @Column("varchar", { comment: "用户id" })
  user_id: string;

  @Column("text", { comment: "器材id集合" })
  equipment_ids: string;

  @Column("text", { comment: "型号id集合" })
  model_ids: string;

  @Column("varchar", { comment: "购买价格集合" })
  order_prices: string;

  @Column("int", { comment: "购买数量集合" })
  order_nums: string;

  @Column("int", { comment: "购买总数量" })
  order_total_num: number;

  @Column("int", { comment: "购买器材种类数" })
  order_total: number;

  @Column("varchar", { comment: "订单号（28位）编号规则：系统ID（6位）+系统交易日期（8位：YYYYMMDD)+系统交易时间戳(6位：HHmmss)+订单序号（8位，保证当天唯一）" })
  order_no: string;

  @Column("timestamp", { comment: "下单时间" })
  order_time: Date;

  @Column("varchar", { comment: "支付流水号（32位）编号规则：系统ID（6位）+系统交易日期（8位：YYYYMMDD)+系统交易时间戳(6位：HHmmss)+支付流水序号（12位，保证当天唯一）" })
  payment_no: string;

  @Column("int", { comment: "支付类型 0 余额支付 1 微信支付 2 支付宝支付 3 Apple支付" })
  payment_type: number;

  @Column("timestamp", { comment: "支付时间" })
  payment_time: Date;

  @Column("varchar", { comment: "支付金额" })
  payment_num: string;

  @Column("varchar", { comment: "起送地址", nullable: true })
  origin_address?: string;

  @Column("varchar", { comment: "起送人", nullable: true })
  origin_name?: string;

  @Column("varchar", { comment: "起送联系电话", nullable: true })
  origin_phone?: string;

  @Column("varchar", { comment: "配送地址" })
  shipping_address: string;

  @Column("varchar", { comment: "配送人" })
  shipping_name: string;

  @Column("varchar", { comment: "配送联系电话" })
  shipping_phone: string;

  @Column("varchar", { comment: "物流单号", nullable: true })
  courier_number?: string;

  @Column("varchar", { comment: "物流公司", nullable: true })
  courier_company?: string;

  @Column("varchar", { comment: "备注", nullable: true })
  remark?: string;

  @Column("int", { comment: "订单状态 6 已退货 5 退货中 4 已收货 3 已发货 2 待发货 1 待支付 0 取消/关闭" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
