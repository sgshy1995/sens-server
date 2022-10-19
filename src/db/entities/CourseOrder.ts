import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("course_orders")
export class CourseOrder {

  @PrimaryGeneratedColumn("uuid", { comment: "订单id" })
  id: string;

  @Column("varchar", { comment: "用户id" })
  user_id: string;

  @Column("text", { comment: "课程id集合" })
  course_ids: string;

  @Column("varchar", { comment: "课程类型集合 1 直播课 0 视频课" })
  course_types: string;

  @Column("varchar", { comment: "购买价格集合" })
  order_prices: string;

  @Column("int", { comment: "购买总数" })
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

  @Column("int", { comment: "订单状态 2 已完成 1 待支付 0 取消/关闭" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
