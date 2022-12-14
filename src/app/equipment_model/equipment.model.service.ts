import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect, FindOptionsWhere, Like, getRepository, Between, MoreThan } from "typeorm";
import { EquipmentModel } from "../../db/entities/EquipmentModel";
import { PaginationQuery, ResponsePaginationResult, ResponseResult } from "../../types/result.interface";
import { EquipmentService } from "../equipment/equipment.service";
import { EquipmentChartService } from "../equipment_chart/equipment.chart.service";
import { EquipmentOrderService } from "../equipment_order/equipment.order.service";

type CustomQuery = {
  frequency_num_order?: "desc" | "asc"
  price_range?: string | null
}

@Injectable()
export class EquipmentModelService {
  constructor(
    @InjectRepository(EquipmentModel) private readonly equipmentModelRepo: Repository<EquipmentModel>,
    @Inject(forwardRef(() => EquipmentService))
    private readonly equipmentService: EquipmentService,
    @Inject(forwardRef(() => EquipmentChartService))
    private readonly equipmentChartService: EquipmentChartService,
    @Inject(forwardRef(() => EquipmentOrderService))
    private readonly equipmentOrderService: EquipmentOrderService
  ) {
  }

  /**
   * 创建型号
   * @param equipmentModel equipmentModel 实体对象
   */
  async createEquipmentModel(equipmentModel: EquipmentModel): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    // 插入数据时，删除 id，以避免请求体内传入 id
    equipmentModel.id !== null && equipmentModel.id !== undefined && delete equipmentModel.id;
    // 校验器材
    const equipmentFind = await this.equipmentService.findOneById(equipmentModel.equipment_id);
    if (!equipmentFind){
      return {
        code: HttpStatus.NOT_FOUND,
        message: "器材主体无效"
      };
    }
    // 购买人数
    equipmentModel.frequency_num = 0;
    // 折扣期限
    equipmentModel.discount_validity = equipmentModel.discount_validity ? new Date(equipmentModel.discount_validity) : null;
    // 发布时间
    equipmentModel.publish_time = equipmentModel.status === 0 ? null : new Date();
    await this.equipmentModelRepo.save(equipmentModel);
    // 如果上线 更新型号数 +1
    if(equipmentModel.status) {
      equipmentFind.model_num += 1;
      // 如果有折扣，则器材包含折扣
      if (equipmentModel.is_discount){
        equipmentFind.has_discount = 1;
      }
      await this.equipmentService.updateEquipment(equipmentFind);
    }
    return responseBody;
  }

  /**
   * 更新
   *
   * @param equipmentModel equipmentModel 实体对象
   */
  async updateEquipmentModel(equipmentModel: EquipmentModel): Promise<ResponseResult> {
    // 校验器材
    const equipmentFind = await this.equipmentService.findOneById(equipmentModel.equipment_id);
    if (!equipmentFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "器材主体无效"
      };
    }
    const equipmentModelFind = await this.equipmentModelRepo.findOne({ where: { id: equipmentModel.id } });

    if (equipmentModelFind.is_discount === 0 && equipmentModel.is_discount === 1) {
      // 折扣
      equipmentModel.discount_validity = equipmentModel.discount_validity ? new Date(equipmentModel.discount_validity) : null;
      equipmentFind.has_discount = 1;
    } else if (equipmentModelFind.is_discount === 1 && equipmentModel.is_discount === 0) {
      // 取消折扣
      equipmentModel.discount_validity = null;
    }

    if (equipmentModelFind.status === 0 && equipmentModel.status === 1) {
      // 发布
      equipmentModel.publish_time = new Date();
      // 型号数加一
      equipmentFind.model_num += 1;
    }else if (equipmentModelFind.status === 1 && equipmentModel.status === 0) {
      // 下线 型号数减一，如果已经为0，则自动下架
      equipmentFind.model_num -= 1;
      if (equipmentFind.model_num === 0) {
        equipmentFind.status = 0;
      }
    }

    const equipmentModelUpdate = Object.assign(equipmentModelFind, equipmentModel);
    await this.equipmentModelRepo.update(equipmentModelUpdate.id, equipmentModelUpdate);

    // 更新器材包含折扣信息
    const equipmentModelsFind = await this.findManyByEquipmentId(equipmentModel.equipment_id);
    if (!equipmentModelsFind.find(item=>item.is_discount)){
      equipmentFind.has_discount = 0;
    }
    await this.equipmentService.updateEquipment(equipmentFind);

    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 更新购买人数
   *
   * @param id id
   */
  async addEquipmentModelFrequencyNum(id: string): Promise<ResponseResult> {
    const equipmentModelFind = await this.equipmentModelRepo.findOne({ where: { id } });
    equipmentModelFind.frequency_num += 1;
    await this.equipmentModelRepo.update(equipmentModelFind.id, equipmentModelFind);
    // 同时更新总购买人数
    const equipmentFind = await this.equipmentService.findOneById(equipmentModelFind.equipment_id);
    equipmentFind.frequency_total_num += 1;
    await this.equipmentService.updateEquipment(equipmentFind);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 根据 ids 批量更新状态
   * @param ids ids
   * @param equipment_id equipment_id
   * @param status status
   * @param select select conditions
   */
  public async updateManyStatusByIds(ids: string[], equipment_id: string, status: number, select?: FindOptionsSelect<EquipmentModel>): Promise<ResponseResult> {
    const equipmentModelsFind = await getRepository(EquipmentModel)
      .createQueryBuilder("equipmentModel")
      .select()
      .where("equipmentModel.id IN (:...ids)", { ids })
      .orderBy("equipmentModel.updated_at", "DESC")
      .getMany();
    // 校验所有的视频的课程id是否一致且正确
    const errorOneFind = equipmentModelsFind.find(item => item.equipment_id !== equipment_id);
    if (!errorOneFind) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "器材主体id不一致"
      };
    }
    // 校验器材
    const equipmentFind = await this.equipmentService.findOneById(equipment_id);
    if (!equipmentFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "器材主体无效"
      };
    }
    for (let i = 0; i < equipmentModelsFind.length; i++) {
      if (equipmentModelsFind[i].status === 0 && status === 1) {
        // 发布
        equipmentModelsFind[i].publish_time = new Date();
      }
      equipmentModelsFind[i].status = status;
      await this.equipmentModelRepo.update(equipmentModelsFind[i].id, equipmentModelsFind[i]);
    }
    // 视频数变化 若为0则自动下架
    status ? equipmentFind.model_num += equipmentModelsFind.length : equipmentFind.model_num -= equipmentModelsFind.length;
    if (equipmentFind.model_num === 0) {
      equipmentFind.status = 0;
    }
    // 更新器材包含折扣信息
    const equipmentModelsNewFind = await this.findManyByEquipmentId(equipment_id);
    if (!equipmentModelsNewFind.find(item=>item.is_discount)){
      equipmentFind.has_discount = 0;
    }
    await this.equipmentService.updateEquipment(equipmentFind);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 查询所有的型号
   */
  async findAllEquipmentModels(): Promise<ResponseResult> {
    const equipmentModelsFind = await this.findAll({
      id: true,
      equipment_id: true,
      title: true,
      description: true,
      multi_figure: true,
      parameter: true,
      brand: true,
      frequency_num: true,
      price: true,
      is_discount: true,
      discount: true,
      discount_validity: true,
      inventory: true,
      dispatch_place: true,
      sort: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: equipmentModelsFind
    };
  }

  /**
   * 查询多个型号
   * @param custom custom find options
   * @param query custom find query
   * @param custom_query custom_query
   * @param hot_sort hot_sort
   */

  async findManyEquipmentModels(custom: FindOptionsWhere<EquipmentModel>, query: PaginationQuery, custom_query?: CustomQuery, hot_sort: boolean = false): Promise<ResponsePaginationResult> {
    const [equipmentModelsFind, totalCount] = await this.findMany(custom, query, custom_query, hot_sort, {
      id: true,
      equipment_id: true,
      title: true,
      description: true,
      multi_figure: true,
      parameter: true,
      brand: true,
      frequency_num: true,
      price: true,
      is_discount: true,
      discount: true,
      discount_validity: true,
      inventory: true,
      dispatch_place: true,
      sort: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: {
        data: equipmentModelsFind,
        pageSize: query.pageSize,
        pageNo: query.pageNo,
        totalCount: totalCount,
        totalPage: Math.ceil(totalCount / query.pageSize)
      }
    };
  }

  /**
   * 根据器材id，查询多个型号
   * @param equipment_id equipment_id
   */
  async findManyEquipmentModelsByEquipmentId(equipment_id: string): Promise<ResponseResult> {
    const equipmentModelsFind = await this.findManyByEquipmentId(equipment_id, {
      id: true,
      equipment_id: true,
      title: true,
      description: true,
      multi_figure: true,
      parameter: true,
      brand: true,
      frequency_num: true,
      price: true,
      is_discount: true,
      discount: true,
      discount_validity: true,
      inventory: true,
      dispatch_place: true,
      sort: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: equipmentModelsFind
    };
  }

  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneEquipmentModelById(id: string): Promise<ResponseResult> {
    const equipmentModelFind = await this.findOneById(id, {
      id: true,
      equipment_id: true,
      title: true,
      description: true,
      multi_figure: true,
      parameter: true,
      brand: true,
      frequency_num: true,
      price: true,
      is_discount: true,
      discount: true,
      discount_validity: true,
      inventory: true,
      dispatch_place: true,
      sort: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return equipmentModelFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: equipmentModelFind
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
  public async findOneById(id: string, select?: FindOptionsSelect<EquipmentModel>): Promise<EquipmentModel | undefined> {
    return await this.equipmentModelRepo.findOne({ where: { id }, select });
  }

  /**
   * 查询多个型号
   * @param custom custom find conditions
   * @param query custom find query
   * @param custom_query custom_query
   * @param hot_order hot_order
   * @param select select conditions
   */
  public async findMany(custom: FindOptionsWhere<EquipmentModel>, query: PaginationQuery, custom_query?: CustomQuery, hot_order?: boolean, select?: FindOptionsSelect<EquipmentModel>): Promise<[EquipmentModel[], number]> {
    const take = query.pageSize || 8;
    const page = query.pageNo || 1;
    const skip = (page - 1) * take;
    const custom_query_in: CustomQuery = custom_query ? { ...custom_query } : {};
    if (custom.title) {
      custom.title = Like(`%${custom.title}%`);
    }
    // 售价范围映射表
    const price_map = {
      "0": [0, 100],
      "1": [100, 500],
      "2": [500, 1000],
      "3": [1000, 3000],
      "4": [3000, 10000],
      "5": 10000
    };
    const equipmentModels = await this.equipmentModelRepo.findAndCount({
      where: {
        ...custom,
        price: ["0", "1", "2", "3", "4"].includes(custom_query_in.price_range) ?
          Between.apply(null, price_map[custom_query_in.price_range]) :
          custom_query_in.price_range === "5" ? MoreThan(price_map["5"]) : custom.price
      },
      order: { updated_at: "desc" },
      take,
      skip,
      select
    });
    if (hot_order || custom_query_in.frequency_num_order === "desc") {
      equipmentModels[0] = equipmentModels[0].sort((a, b) => b.frequency_num - a.frequency_num);
    } else if (custom_query_in.frequency_num_order === "asc") {
      equipmentModels[0] = equipmentModels[0].sort((a, b) => a.frequency_num - b.frequency_num);
    }
    return equipmentModels;
  }

  /**
   * 根据器材id，查询多个型号
   * @param equipment_id equipment_id
   * @param select select conditions
   */
  public async findManyByEquipmentId(equipment_id: string, select?: FindOptionsSelect<EquipmentModel>): Promise<EquipmentModel[]> {
    return await this.equipmentModelRepo.find({
      where: {
        equipment_id,
        status: 1
      },
      order: { sort: "asc" },
      select
    });
  }

  /**
   * 查询所有型号
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<EquipmentModel>): Promise<EquipmentModel[] | undefined> {
    return await this.equipmentModelRepo.find({
      where: { status: 1 },
      order: { updated_at: "asc" },
      select
    });
  }

}
