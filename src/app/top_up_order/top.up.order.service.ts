import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect } from "typeorm";
import { TopUpOrder } from "../../db/entities/TopUpOrder";
import { ResponseResult } from "../../types/result.interface";
import moment = require("moment");
import Chance = require("chance");
import { UserInfoService } from "../user_info/user.info.service";

const chance = new Chance();

@Injectable()
export class TopUpOrderService {
  constructor(
    @InjectRepository(TopUpOrder) private readonly topUpOrderRepo: Repository<TopUpOrder>,
    @Inject(forwardRef(() => UserInfoService))
    private readonly userInfoService: UserInfoService
  ) {
  }

  /**
   * 充值——创建订单
   * @param topUpOrder topUpOrder 实体对象
   */
  async createTopUpOrder(topUpOrder: TopUpOrder): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    // 插入数据时，删除 id，以避免请求体内传入 id
    topUpOrder.id !== null && topUpOrder.id !== undefined && delete topUpOrder.id;
    // 订单号
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
    // 状态
    topUpOrder.status = 2;
    // 保存
    await this.topUpOrderRepo.save(topUpOrder);
    // 返回结果
    return responseBody;
  }

  /**
   * 更新
   *
   * @param topUpOrder topUpOrder 实体对象
   */
  async updateTopUpOrder(topUpOrder: TopUpOrder): Promise<ResponseResult> {
    const topUpOrderFind = await this.topUpOrderRepo.findOne({ where: { id: topUpOrder.id } });
    if (!topUpOrderFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "数据主体不存在"
      };
    }
    const courseOrderUpdate = Object.assign(topUpOrderFind, topUpOrder);
    await this.topUpOrderRepo.save(courseOrderUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 根据用户id，查询多个订单信息
   * @param user_id user_id
   * @param order_type payment_time | payment_num
   * @param order desc | asc
   */
  async findManyTopUpOrdersByUserId(user_id: string, order_type: string, order: string): Promise<ResponseResult> {
    const topUpOrdersFind = await this.findManyByUserId(user_id, order_type, order, {
      id: true,
      user_id: true,
      order_no: true,
      order_time: true,
      payment_no: true,
      payment_type: true,
      payment_time: true,
      payment_num: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: topUpOrdersFind
    };
  }

  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneTopUpOrderById(id: string): Promise<ResponseResult> {
    const topUpOrderFind = await this.findOneById(id, {
      id: true,
      user_id: true,
      order_no: true,
      order_time: true,
      payment_no: true,
      payment_type: true,
      payment_time: true,
      payment_num: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return topUpOrderFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: topUpOrderFind
      } : {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
  }

  /**
   * 根据 id 查询单个信息，如果不存在则抛出404异常
   * @param id id
   * @param select select conditions
   */
  public async findOneById(id: string, select?: FindOptionsSelect<TopUpOrder>): Promise<TopUpOrder | undefined> {
    return await this.topUpOrderRepo.findOne({ where: { id }, select });
  }

  /**
   * 根据用户id，查询多个订单
   * @param user_id user_id
   * @param select select conditions
   * @param order_type payment_time | payment_num
   * @param order desc | asc
   */
  public async findManyByUserId(user_id: string, order_type: string, order: string, select?: FindOptionsSelect<TopUpOrder>): Promise<TopUpOrder[]> {
    let topUpOrders = await this.topUpOrderRepo.find({
      where: {
        user_id,
        status: 2
      },
      order: { [order_type]: order },
      select
    });
    if (order_type === "payment_num") {
      topUpOrders = order === "asc" ? topUpOrders.sort((a, b) => Number(a.payment_num) - Number(b.payment_num)) : topUpOrders.sort((a, b) => Number(b.payment_num) - Number(a.payment_num));
    }
    return topUpOrders;
  }
}
