import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect } from "typeorm";
import { UserInfo } from "../../db/entities/UserInfo";
import { ResponseResult } from "../../types/result.interface";
import { UserService } from "../user/user.service";
import { CourseOrderService } from "../course_order/course.order.service";
import { CourseChartService } from "../course_chart/course.chart.service";
import { EquipmentOrderService } from "../equipment_order/equipment.order.service";
import { EquipmentChartService } from "../equipment_chart/equipment.chart.service";
import { TopUpOrderService } from "../top_up_order/top.up.order.service";
import { TopUpOrder } from "../../db/entities/TopUpOrder";
import { AddressService } from "../address/address.service";
import moment = require("moment");
import Chance = require("chance");
import { Address } from "../../db/entities/Address";

const chance = new Chance();

@Injectable()
export class UserInfoService {
  constructor(
    @InjectRepository(UserInfo) private readonly userInfoRepo: Repository<UserInfo>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => CourseOrderService))
    private readonly courseOrderService: CourseOrderService,
    @Inject(forwardRef(() => EquipmentOrderService))
    private readonly equipmentOrderService: EquipmentOrderService,
    @Inject(forwardRef(() => TopUpOrderService))
    private readonly topUpOrderService: TopUpOrderService,
    @Inject(forwardRef(() => CourseChartService))
    private readonly courseChartService: CourseChartService,
    @Inject(forwardRef(() => EquipmentChartService))
    private readonly equipmentChartService: EquipmentChartService,
    @Inject(forwardRef(() => AddressService))
    private readonly addressService: AddressService
  ) {
  }

  /**
   * 创建
   *
   * @param info Info 实体对象
   */
  async createInfo(info: { [T in keyof UserInfo]: any }): Promise<void> {
    await this.userInfoRepo.save(info);
  }

  /**
   * 更新
   *
   * @param user_id user_id
   * @param info Info 实体对象
   */
  async updateInfoByUserId(user_id: string, info: UserInfo): Promise<ResponseResult> {
    const infoFind = await this.userInfoRepo.findOne({
      where: {
        user_id
      }
    });
    const infoFindUpdate = Object.assign(infoFind, info);
    await this.userInfoRepo.update(infoFindUpdate.id, infoFindUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 账户充值
   *
   * @param user_id user_id
   * @param balance balance 金额
   * @param payment_type payment_type 支付类型 1 微信支付 2 支付宝支付 3 Apple支付
   */
  async addBalanceByUserId(user_id: string, balance: string, payment_type: number): Promise<ResponseResult> {
    const infoFind = await this.userInfoRepo.findOne({
      where: {
        user_id
      }
    });
    infoFind.balance = (Number(infoFind.balance) + Number(balance)).toFixed(2);
    await this.userInfoRepo.update(infoFind.id, infoFind);
    // 创建充值订单
    const topUpOrder = new TopUpOrder();
    // 订单号
    topUpOrder.order_time = new Date();
    topUpOrder.order_no = "218304" + moment(new Date(topUpOrder.order_time), "YYYYMMDDHHmmss").format("YYYYMMDDHHmmss") + chance.integer({
      min: 22222222,
      max: 99999999
    }).toString();
    // 支付流水号
    topUpOrder.payment_time = new Date();
    topUpOrder.payment_no = "618124" + moment(new Date(topUpOrder.payment_time), "YYYYMMDDHHmmss").format("YYYYMMDDHHmmss") + chance.integer({
      min: 222222222222,
      max: 999999999999
    }).toString();
    // 金额
    topUpOrder.payment_num = balance;
    // 支付类型
    topUpOrder.payment_type = payment_type;
    // 用户id
    topUpOrder.user_id = user_id;
    // 状态
    topUpOrder.status = 2;
    // 保存订单
    await this.topUpOrderService.createTopUpOrder(topUpOrder);
    return {
      code: HttpStatus.OK,
      message: "账户充值成功"
    };
  }

  /**
   * 购物车课程下单
   *
   * @param user_id user_id
   * @param course_chart_ids 课程购物车id集合
   * @param course_info 课程信息
   * @param order_time 下单时间
   * @param payment_type 下单支付类型
   */
  async addChartCourseOrderByUserId(user_id: string, course_chart_ids: string, course_info: { course_ids: string, course_types: string, payment_num: string }, order_time: string, payment_type: number): Promise<ResponseResult> {
    const infoFind = await this.userInfoRepo.findOne({
      where: {
        user_id
      }
    });
    // 创建课程支付订单
    const course_order_result = await this.courseOrderService.createCourseOrders(user_id, course_info.course_ids, course_info.course_types, course_info.payment_num, payment_type, order_time );
    if (course_order_result.code !== HttpStatus.OK) return course_order_result;
    await this.courseChartService.deleteCourseChartIds(course_chart_ids);
    return {
      code: HttpStatus.OK,
      message: "下单成功"
    };
  }

  /**
   * 普通课程下单
   *
   * @param user_id user_id
   * @param course_info 课程信息
   * @param order_time 下单时间
   * @param payment_type 下单支付类型
   */
  async addNormalCourseOrderByUserId(user_id: string, course_info: { course_ids: string, course_types: string, payment_num: string }, order_time: string, payment_type: number): Promise<ResponseResult> {
    const infoFind = await this.userInfoRepo.findOne({
      where: {
        user_id
      }
    });
    // 创建课程支付订单
    const course_order_result = await this.courseOrderService.createCourseOrders(user_id, course_info.course_ids, course_info.course_types, course_info.payment_num, payment_type, order_time );
    if (course_order_result.code !== HttpStatus.OK) return course_order_result;
    return {
      code: HttpStatus.OK,
      message: "下单成功"
    };
  }

  /**
   * 购物车器材下单
   *
   * @param user_id user_id
   * @param equipment_chart_ids 器材购物车id集合
   * @param equipment_info 器材信息
   * @param shipping_address 配送地址
   * @param shipping_name 配送人
   * @param shipping_phone 配送联系电话
   * @param order_time 下单时间
   * @param payment_type 下单支付类型
   * @param remark 备注
   */
  async addChartEquipmentOrderByUserId(user_id: string, equipment_chart_ids: string, equipment_info: { equipment_ids: string, model_ids: string, order_nums: string, course_types: string, payment_num: string }, shipping_address: string, shipping_name: string, shipping_phone: string, order_time: string, payment_type: number, remark?: string): Promise<ResponseResult> {
    const infoFind = await this.userInfoRepo.findOne({
      where: {
        user_id
      }
    });
    // 创建课程支付订单
    const course_order_result = await this.equipmentOrderService.createEquipmentOrders(user_id, equipment_info.equipment_ids, equipment_info.model_ids, equipment_info.order_nums, shipping_address, shipping_name, shipping_phone, equipment_info.payment_num, payment_type, order_time, remark );
    if (course_order_result.code !== HttpStatus.OK) return course_order_result;
    await this.equipmentChartService.deleteEquipmentChartsByIds(equipment_chart_ids);
    return {
      code: HttpStatus.OK,
      message: "下单成功"
    };
  }

  /**
   * 普通器材下单
   *
   * @param user_id user_id
   * @param equipment_info 器材信息
   * @param shipping_address 配送地址
   * @param shipping_name 配送人
   * @param shipping_phone 配送联系电话
   * @param order_time 下单时间
   * @param payment_type 下单支付类型
   * @param remark 备注
   */
  async addNormalEquipmentOrderByUserId(user_id: string, equipment_info: { equipment_ids: string, model_ids: string, order_nums: string, course_types: string, payment_num: string }, shipping_address: string, shipping_name: string, shipping_phone: string, order_time: string, payment_type: number, remark?: string): Promise<ResponseResult> {
    const infoFind = await this.userInfoRepo.findOne({
      where: {
        user_id
      }
    });
    // 创建课程支付订单
    const course_order_result = await this.equipmentOrderService.createEquipmentOrders(user_id, equipment_info.equipment_ids, equipment_info.model_ids, equipment_info.order_nums, shipping_address, shipping_name, shipping_phone, equipment_info.payment_num, payment_type, order_time, remark );
    if (course_order_result.code !== HttpStatus.OK) return course_order_result;
    return {
      code: HttpStatus.OK,
      message: "下单成功"
    };
  }

  /**
   * 根据 user_id 查询
   *
   * @param user_id user_id
   */
  async findOneInfoById(user_id: string): Promise<ResponseResult> {
    const infoFind = await this.findOneByUserId(user_id, {
      id: true,
      user_id: true,
      integral: true,
      balance: true,
      age: true,
      injury_history: true,
      injury_recent: true,
      discharge_abstract: true,
      image_data: true,
      default_address_id: true,
      status: true
    });
    if (!infoFind){
      return {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      }
    }
    if (infoFind.default_address_id){
      const address = await this.addressService.findOneById(infoFind.default_address_id);
      Object.defineProperty(infoFind, 'default_address_info', {
        value: address ? address : new Address(),
        writable: true,
        enumerable: true,
        configurable: true
      })
    }
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: infoFind
    };
  }

  /**
   * 根据 user_id 查询单个信息，如果不存在则抛出404异常
   * @param user_id user_id
   * @param select select conditions
   */
  public async findOneByUserId(user_id: string, select?: FindOptionsSelect<UserInfo>): Promise<UserInfo | undefined> {
    return await this.userInfoRepo.findOne({ where: { user_id }, select });
  }

}
