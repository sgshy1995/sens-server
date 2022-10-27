import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("authenticates")
export class Authenticate {

  @PrimaryGeneratedColumn("uuid", { comment: "认证id" })
  id: string;

  @Column("varchar", { comment: "用户id" })
  user_id: string;

  @Column("varchar", { comment: "认证名" })
  name: string;

  @Column("varchar", { comment: "认证联系电话" })
  phone: string;

  @Column("int", { comment: "认证性别 1 男 0 女" })
  gender: string;

  @Column("varchar", { comment: "认证机构组织" })
  organization: string;

  @Column("varchar", { comment: "身份证正面照" })
  identity_card_front: string;

  @Column("varchar", { comment: "身份证反面照" })
  identity_card_back: string;

  @Column("varchar", { comment: "执业证照" })
  practicing_certificate: string;

  @Column("varchar", { comment: "工作证照" })
  employee_card: string;

  @Column("varchar", { comment: "认证简介" })
  fcc: string;

  @Column("varchar", { comment: "审核意见", nullable: true })
  audit_info?: string;

  @Column("datetime", { comment: "有效期", nullable: true })
  validity_time?: Date;

  @Column("int", { comment: "认证状态 3 审核通过 2 待审核 1 驳回 0 失效" })
  status: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
