import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect } from "typeorm";
import { EquipmentOrder } from "../../db/entities/EquipmentOrder";
import { Equipment } from "../../db/entities/Equipment";
import { EquipmentModel } from "../../db/entities/EquipmentModel";
import { ResponseResult } from "../../types/result.interface";
import { EquipmentService } from "../equipment/equipment.service";
import { EquipmentModelService } from "../equipment_model/equipment.model.service";
import { UserInfoService } from "../user_info/user.info.service";
import moment = require("moment");
import Chance = require("chance");

const chance = new Chance();

@Injectable()
export class EquipmentOrderService {
  constructor(
    @InjectRepository(EquipmentOrder) private readonly equipmentOrderRepo: Repository<EquipmentOrder>,
    @Inject(forwardRef(() => EquipmentService))
    private readonly equipmentService: EquipmentService,
    @Inject(forwardRef(() => EquipmentModelService))
    private readonly equipmentModelService: EquipmentModelService,
    @Inject(forwardRef(() => UserInfoService))
    private readonly userInfoService: UserInfoService
  ) {
  }

  /**
   * 多个购买——创建订单
   * @param user_id 用户id
   * @param equipment_ids_str 器材id集合
   * @param model_ids_str 型号id集合
   * @param order_nums_str 下单数量集合
   * @param shipping_address 配送地址
   * @param shipping_name 配送人
   * @param shipping_phone 配送联系方式
   * @param payment_num 支付金额
   * @param payment_type 支付方式
   * @param order_time 下单时间
   * @param remark 备注
   */
  async createEquipmentOrders(user_id, equipment_ids_str: string, model_ids_str: string, order_nums_str: string, shipping_address: string, shipping_name: string, shipping_phone: string, payment_num: string, payment_type: number, order_time: string, remark?: string): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    // 校验型号数据是否存在或已下架、缺货
    const equipment_ids = equipment_ids_str.split(",");
    const model_ids = model_ids_str.split(",");
    const order_nums = order_nums_str.split(",");
    const models: EquipmentModel[] = [];
    let not_found = false;
    let not_inventory = false;
    let total = 0;
    for (let i = 0; i < model_ids.length; i++) {
      const modelFind = await this.equipmentModelService.findOneById(model_ids[i]);
      // 如果课程不存在，标记错误
      if (!modelFind) {
        not_found = true;
      } else if (!modelFind.inventory) {
        not_inventory = true;
      } else {
        models.push(modelFind);
        total += modelFind.is_discount ? (Number(order_nums[i]) * Number(modelFind.discount)) : (Number(order_nums[i]) * Number(modelFind.price));
      }
    }
    if (models.find((model, index) => model.equipment_id !== equipment_ids[index])) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "器材和型号信息不匹配，请重试"
      };
    } else if (not_found) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "所选型号有不存在数据，请重试"
      };
    } else if (not_inventory) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "所选型号有存在库存不足，请重试"
      };
    } else if (models.find(course => !course.status)) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "所选型号存在已下架，无法购买，请重试"
      };
    } else if (total.toString() !== payment_num.toString()) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "价格不一致或发生变化，请重试"
      };
    }
    // 校验用户余额是否充足
    const userInfo = await this.userInfoService.findOneByUserId(user_id);
    if (payment_type === 0) {
      if (Number(userInfo.balance) < Number(payment_num)) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: "用户余额不足，请充值后再试"
        };
      }
    }
    // 创建订单
    // 订单号
    const order_no = "218304" + moment(new Date(order_time), "YYYYMMDDHHmmss").format("YYYYMMDDHHmmss") + chance.integer({
      min: 22222222,
      max: 99999999
    }).toString();
    // 支付流水号
    const payment_time = new Date();
    const payment_no = "618124" + moment(new Date(payment_time), "YYYYMMDDHHmmss").format("YYYYMMDDHHmmss") + chance.integer({
      min: 222222222222,
      max: 999999999999
    }).toString();

    const equipmentOrder = new EquipmentOrder();
    // 插入数据时，删除 id，以避免请求体内传入 id
    equipmentOrder.id !== null && equipmentOrder.id !== undefined && delete equipmentOrder.id;
    // 用户id
    equipmentOrder.user_id = user_id;
    equipmentOrder.equipment_ids = equipment_ids_str;
    equipmentOrder.model_ids = model_ids_str;
    // 购买价格
    equipmentOrder.order_prices = models.map(model => model.is_discount ? model.discount : model.price).join();
    // 下单数量
    equipmentOrder.order_nums = order_nums_str;
    // 支付金额
    equipmentOrder.payment_num = payment_num;
    // 下单时间
    equipmentOrder.order_time = new Date(order_time);
    // 支付类型
    equipmentOrder.payment_type = payment_type;
    // 订单号
    equipmentOrder.order_no = order_no;
    // 支付时间
    equipmentOrder.payment_time = payment_time;
    // 支付流水号
    equipmentOrder.payment_no = payment_no;
    // 状态
    equipmentOrder.status = 2;
    // 购买器材种类数
    equipmentOrder.order_total = model_ids.length;
    // 购买总数量
    equipmentOrder.order_total_num = order_nums.map(num => Number(num)).reduce((a, b) => a + b);
    // 配送地址
    equipmentOrder.shipping_address = shipping_address;
    // 配送人
    equipmentOrder.shipping_name = shipping_name;
    // 配送联系方式
    equipmentOrder.shipping_phone = shipping_phone;
    // 备注
    equipmentOrder.remark = remark || null;
    // 保存
    await this.equipmentOrderRepo.save(equipmentOrder);
    // 课程增加购买次数
    for (let i = 0; i < models.length; i++) {
      models[i].frequency_num += 1;
      await this.equipmentModelService.updateEquipmentModel(models[i]);
      const equipment = await this.equipmentService.findOneById(models[i].equipment_id);
      equipment.frequency_total_num += models.length;
      await this.equipmentService.updateEquipment(equipment);
    }
    // 扣款
    if (payment_type === 0) {
      userInfo.balance = (Number(userInfo.balance) - Number(payment_num)).toString();
    }
    // 增加积分
    userInfo.integral += Number(payment_num);
    await this.userInfoService.updateInfoByUserId(user_id, userInfo);
    // 返回结果
    return responseBody;
  }

  /**
   * 更新
   *
   * @param equipmentOrder equipmentOrder 实体对象
   */
  async updateEquipmentOrder(equipmentOrder: EquipmentOrder): Promise<ResponseResult> {
    const equipmentOrderFind = await this.equipmentOrderRepo.findOne({ where: { id: equipmentOrder.id } });
    if (!equipmentOrderFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "数据主体不存在"
      };
    }
    const equipmentOrderUpdate = Object.assign(equipmentOrderFind, equipmentOrder);
    await this.equipmentOrderRepo.save(equipmentOrderUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 根据用户id，查询多个订单信息
   * @param user_id user_id
   */
  async findManyEquipmentOrdersByUserId(user_id: string): Promise<ResponseResult> {
    const equipmentOrdersFind = await this.findManyByUserId(user_id, {
      id: true,
      user_id: true,
      equipment_ids: true,
      model_ids: true,
      order_prices: true,
      order_nums: true,
      order_total_num: true,
      order_total: true,
      order_no: true,
      order_time: true,
      payment_no: true,
      payment_type: true,
      payment_time: true,
      payment_num: true,
      origin_address: true,
      origin_name: true,
      origin_phone: true,
      shipping_address: true,
      shipping_phone: true,
      shipping_name: true,
      courier_number: true,
      remark: true,
      status: true,
      created_at: true,
      updated_at: true
    });

    // 找出所有的重复器材
    for (let j = 0; j < equipmentOrdersFind.length; j++) {
      const equipment_ids = equipmentOrdersFind[j].equipment_ids.split(',')
      const model_ids = equipmentOrdersFind[j].model_ids.split(',')
      const order_prices = equipmentOrdersFind[j].order_prices.split(',')
      const order_nums = equipmentOrdersFind[j].order_nums.split(',').map(num => Number(num))

      const equipment_no_list = [];

      for (let k = 0; k < equipment_ids.length; k++) {
        if (!equipment_no_list.includes(equipment_ids[k])) equipment_no_list.push(equipment_ids[k]);
      }

      const equipments = []

      // 获取器材和对应型号
      for (let k = 0; k < equipment_no_list.length; k++) {
        const equipmentFind = await this.equipmentService.findOneById(equipment_no_list[k]);
        const equipment_order = {
          ...equipmentFind,
          models: []
        };
        const model_no_list = [];
        const model_no_price_list = [];
        const model_no_num_list = [];
        equipment_ids.forEach((equipment_id, index) => {
          if (equipment_id === equipment_no_list[k]){
            model_no_list.push(model_ids[index])
            model_no_price_list.push(order_prices[index])
            model_no_num_list.push(order_nums[index])
          }
        })
        for (let l = 0; l < model_no_list.length; l++) {
          const modelFind = await this.equipmentModelService.findOneById(model_no_list[l]);
          const model_order = {
            ...modelFind,
            add_num:  model_no_num_list[l],
            order_price: model_no_price_list[l]
          };
          equipment_order.models.push(model_order);
        }
        equipments.push(equipment_order);
      }

      Object.defineProperty(equipmentOrdersFind[j], 'equipment', {
        value: equipments,
        enumerable: true,
        configurable: true,
        writable: true
      })
    }

    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: equipmentOrdersFind
    };
  }

  /**
   * 根据订单号，查询订单信息
   * @param order_no order_no
   */
  async findOneEquipmentOrderByOrderNo(order_no: string): Promise<ResponseResult> {
    const equipmentOrderFind = await this.findOneByOrderNo(order_no, {
      id: true,
      user_id: true,
      equipment_ids: true,
      model_ids: true,
      order_prices: true,
      order_nums: true,
      order_total_num: true,
      order_total: true,
      order_no: true,
      order_time: true,
      payment_no: true,
      payment_type: true,
      payment_time: true,
      payment_num: true,
      origin_address: true,
      origin_name: true,
      origin_phone: true,
      shipping_address: true,
      shipping_phone: true,
      shipping_name: true,
      courier_number: true,
      remark: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    if (!equipmentOrderFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "订单号不存在"
      };
    }
    const equipment_ids = equipmentOrderFind.equipment_ids.split(',')
    const model_ids = equipmentOrderFind.model_ids.split(',')
    const order_prices = equipmentOrderFind.order_prices.split(',')
    const order_nums = equipmentOrderFind.order_nums.split(',').map(num => Number(num))

    const equipment_no_list = [];

    for (let k = 0; k < equipment_ids.length; k++) {
      if (!equipment_no_list.includes(equipment_ids[k])) equipment_no_list.push(equipment_ids[k]);
    }

    const equipments = []

    // 获取器材和对应型号
    for (let k = 0; k < equipment_no_list.length; k++) {
      const equipmentFind = await this.equipmentService.findOneById(equipment_no_list[k]);
      const equipment_order = {
        ...equipmentFind,
        models: []
      };
      const model_no_list = [];
      const model_no_price_list = [];
      const model_no_num_list = [];
      equipment_ids.forEach((equipment_id, index) => {
        if (equipment_id === equipment_no_list[k]){
          model_no_list.push(model_ids[index])
          model_no_price_list.push(order_prices[index])
          model_no_num_list.push(order_nums[index])
        }
      })
      for (let l = 0; l < model_no_list.length; l++) {
        const modelFind = await this.equipmentModelService.findOneById(model_no_list[l]);
        const model_order = {
          ...modelFind,
          add_num:  model_no_num_list[l],
          order_price: model_no_price_list[l]
        };
        equipment_order.models.push(model_order);
      }
      equipments.push(equipment_order);
    }

    Object.defineProperty(equipmentOrderFind, 'equipment', {
      value: equipments,
      enumerable: true,
      configurable: true,
      writable: true
    })
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: equipmentOrderFind
    };
  }

  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneEquipmentOrderById(id: string): Promise<ResponseResult> {
    const equipmentOrderFind = await this.findOneById(id, {
      id: true,
      user_id: true,
      equipment_ids: true,
      model_ids: true,
      order_prices: true,
      order_nums: true,
      order_total_num: true,
      order_total: true,
      order_no: true,
      order_time: true,
      payment_no: true,
      payment_type: true,
      payment_time: true,
      payment_num: true,
      origin_address: true,
      origin_name: true,
      origin_phone: true,
      shipping_address: true,
      shipping_phone: true,
      shipping_name: true,
      courier_number: true,
      remark: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    if (!equipmentOrderFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "订单号不存在"
      };
    }
    const equipment_ids = equipmentOrderFind.equipment_ids.split(',')
    const model_ids = equipmentOrderFind.model_ids.split(',')
    const order_prices = equipmentOrderFind.order_prices.split(',')
    const order_nums = equipmentOrderFind.order_nums.split(',').map(num => Number(num))

    const equipment_no_list = [];

    for (let k = 0; k < equipment_ids.length; k++) {
      if (!equipment_no_list.includes(equipment_ids[k])) equipment_no_list.push(equipment_ids[k]);
    }

    const equipments = []

    // 获取器材和对应型号
    for (let k = 0; k < equipment_no_list.length; k++) {
      const equipmentFind = await this.equipmentService.findOneById(equipment_no_list[k]);
      const equipment_order = {
        ...equipmentFind,
        models: []
      };
      const model_no_list = [];
      const model_no_price_list = [];
      const model_no_num_list = [];
      equipment_ids.forEach((equipment_id, index) => {
        if (equipment_id === equipment_no_list[k]){
          model_no_list.push(model_ids[index])
          model_no_price_list.push(order_prices[index])
          model_no_num_list.push(order_nums[index])
        }
      })
      for (let l = 0; l < model_no_list.length; l++) {
        const modelFind = await this.equipmentModelService.findOneById(model_no_list[l]);
        const model_order = {
          ...modelFind,
          add_num:  model_no_num_list[l],
          order_price: model_no_price_list[l]
        };
        equipment_order.models.push(model_order);
      }
      equipments.push(equipment_order);
    }

    Object.defineProperty(equipmentOrderFind, 'equipment', {
      value: equipments,
      enumerable: true,
      configurable: true,
      writable: true
    })
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: equipmentOrderFind
    };
  }

  /**
   * 根据 id 查询单个信息，如果不存在则抛出404异常
   * @param id id
   * @param select select conditions
   */
  public async findOneById(id: string, select?: FindOptionsSelect<EquipmentOrder>): Promise<EquipmentOrder | undefined> {
    return await this.equipmentOrderRepo.findOne({ where: { id }, select });
  }

  /**
   * 根据用户id，查询多个订单
   * @param user_id user_id
   * @param select select conditions
   */
  public async findManyByUserId(user_id: string, select?: FindOptionsSelect<EquipmentOrder>): Promise<EquipmentOrder[]> {
    return await this.equipmentOrderRepo.find({
      where: {
        user_id
      },
      order: { updated_at: "desc" },
      select
    });
  }

  /**
   * 根据订单号，查询多个订单
   * @param order_no order_no
   * @param select select conditions
   */
  public async findOneByOrderNo(order_no: string, select?: FindOptionsSelect<EquipmentOrder>): Promise<EquipmentOrder> {
    return await this.equipmentOrderRepo.findOne({
      where: {
        order_no
      },
      order: { updated_at: "desc" },
      select
    });
  }

}
