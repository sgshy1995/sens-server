import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  FindOptionsSelect,
  FindOptionsWhere,
  Like,
  getRepository,
  getManager, Brackets, In
} from "typeorm";
import { Equipment } from "../../db/entities/Equipment";
import { PaginationQuery, ResponsePaginationResult, ResponseResult } from "../../types/result.interface";
import { EquipmentModelService } from "../equipment_model/equipment.model.service";
import { EquipmentChartService } from "../equipment_chart/equipment.chart.service";
import { EquipmentOrderService } from "../equipment_order/equipment.order.service";

type CustomQuery = {
  frequency_total_num_order?: "desc" | "asc"
  keyword?: string
}

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment) private readonly equipmentRepo: Repository<Equipment>,
    @Inject(forwardRef(() => EquipmentModelService))
    private readonly equipmentModelService: EquipmentModelService,
    @Inject(forwardRef(() => EquipmentChartService))
    private readonly equipmentChartService: EquipmentChartService,
    @Inject(forwardRef(() => EquipmentOrderService))
    private readonly equipmentOrderService: EquipmentOrderService
  ) {
  }

  /**
   * 创建器材
   * @param equipment equipment 实体对象
   */
  async createEquipment(equipment: Equipment): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    // 插入数据时，删除 id，以避免请求体内传入 id
    equipment.id !== null && equipment.id !== undefined && delete equipment.id;
    // 购买人数
    equipment.frequency_total_num = 0;
    // 型号数
    equipment.model_num = 0;
    // 状态
    equipment.status = equipment.status ? 1 : 0;
    // 是否包含折扣
    equipment.has_discount = 0;
    // 发布时间
    equipment.publish_time = equipment.status === 0 ? null : new Date();
    await this.equipmentRepo.save(equipment);
    return responseBody;
  }

  /**
   * 更新
   *
   * @param equipment equipment 实体对象
   */
  async updateEquipment(equipment: Equipment): Promise<ResponseResult> {
    const equipmentFind = await this.equipmentRepo.findOne({ where: { id: equipment.id } });
    if (equipmentFind.status === 0 && equipment.status === 1) {
      // 发布
      equipment.publish_time = new Date();
    }
    const equipmentUpdate = Object.assign(equipmentFind, equipment);
    await this.equipmentRepo.update(equipmentUpdate.id, equipmentUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 校验器材编号是否重复
   *
   * @param serial_number serial_number
   * @param id id
   */
  async checkEquipmentSerialNumber(serial_number: string, id?: string): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "校验成功", data: true };
    const equipmentFind = await this.equipmentRepo.findOne({ where: { serial_number } });
    if (equipmentFind && equipmentFind.id !== id) {
      responseBody.data = false;
      responseBody.message = "器材编号已存在";
    }
    return responseBody;
  }

  /**
   * 根据 ids 批量更新状态
   * @param ids ids
   * @param status status
   * @param select select conditions
   */
  public async updateManyStatusByIds(ids: string[], status: number, select?: FindOptionsSelect<Equipment>): Promise<ResponseResult> {
    const equipmentsFind = await getRepository(Equipment)
      .createQueryBuilder("equipment")
      .select()
      .where("equipment.id IN (:...ids)", { ids })
      .orderBy("equipment.updated_at", "DESC")
      .getMany();
    for (let i = 0; i < equipmentsFind.length; i++) {
      if (equipmentsFind[i].status === 0 && status === 1) {
        // 发布
        equipmentsFind[i].publish_time = new Date();
      }
      equipmentsFind[i].status = status;
      await this.equipmentRepo.update(equipmentsFind[i].id, equipmentsFind[i]);
    }
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 查询轮播器材
   */
  async findCarouselEquipments(): Promise<ResponseResult> {
    const carouselEquipments = await this.equipmentRepo.find({
      where: { status: 1, carousel: 1 },
      order: { updated_at: "desc" },
      select: {
        id: true,
        serial_number: true,
        title: true,
        cover: true,
        description: true,
        long_figure: true,
        equipment_type: true,
        model_num: true,
        frequency_total_num: true,
        has_discount: true,
        carousel: true,
        publish_time: true,
        status: true,
        created_at: true,
        updated_at: true
      }
    });
    carouselEquipments.splice(5);
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: carouselEquipments
    };
  }

  /**
   * 查询所有的器材
   */
  async findAllEquipments(): Promise<ResponseResult> {
    const equipmentsFind = await this.findAll({
      id: true,
      serial_number: true,
      title: true,
      cover: true,
      description: true,
      long_figure: true,
      equipment_type: true,
      model_num: true,
      frequency_total_num: true,
      has_discount: true,
      carousel: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: equipmentsFind
    };
  }

  /**
   * 查询多个器材
   * @param custom custom find options
   * @param query custom find query
   * @param custom_query custom_query
   * @param hot_sort hot_sort
   */

  async findManyEquipments(custom: FindOptionsWhere<Equipment>, query: PaginationQuery, custom_query?: CustomQuery, hot_sort: boolean = false): Promise<ResponsePaginationResult> {
    const [equipmentsFind, totalCount] = await this.findMany(custom, query, custom_query, hot_sort, {
      id: true,
      serial_number: true,
      title: true,
      cover: true,
      description: true,
      long_figure: true,
      equipment_type: true,
      model_num: true,
      frequency_total_num: true,
      has_discount: true,
      carousel: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: {
        data: equipmentsFind,
        pageSize: query.pageSize,
        pageNo: query.pageNo,
        totalCount: totalCount,
        totalPage: Math.ceil(totalCount / query.pageSize)
      }
    };
  }

  /**
   * 查询多个器材包括型号 无分页
   * @param ids id集合
   */
  async findManyEquipmentsWithModels(ids: string): Promise<ResponseResult> {
    const equipmentsFind = await this.findManyWithModels(ids, {
      id: true,
      serial_number: true,
      title: true,
      cover: true,
      description: true,
      long_figure: true,
      equipment_type: true,
      model_num: true,
      frequency_total_num: true,
      has_discount: true,
      carousel: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: equipmentsFind
    };
  }

  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneEquipmentById(id: string): Promise<ResponseResult> {
    const equipmentFind = await this.findOneById(id, {
      id: true,
      serial_number: true,
      title: true,
      cover: true,
      description: true,
      long_figure: true,
      equipment_type: true,
      model_num: true,
      frequency_total_num: true,
      has_discount: true,
      carousel: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return equipmentFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: equipmentFind
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
  public async findOneById(id: string, select?: FindOptionsSelect<Equipment>): Promise<Equipment | undefined> {
    return await this.equipmentRepo.findOne({ where: { id }, select });
  }

  /**
   * 查询多个视频课
   * @param custom custom find conditions
   * @param query custom find query
   * @param custom_query custom_query
   * @param hot_order hot_order
   * @param select select conditions
   */
  public async findMany(custom: FindOptionsWhere<Equipment>, query: PaginationQuery, custom_query?: CustomQuery, hot_order?: boolean, select?: FindOptionsSelect<Equipment>): Promise<[Equipment[], number]> {
    const take = query.pageSize || 16;
    const page = query.pageNo || 1;
    const skip = (page - 1) * take;
    const custom_query_in: CustomQuery = custom_query ? { ...custom_query } : {};
    if (custom.title) {
      custom.title = Like(`%${custom.title}%`);
    }
    if (custom_query_in.keyword) {
      custom.hasOwnProperty("description") && delete custom.description;
      custom.hasOwnProperty("title") && delete custom.title;
    }
    const customIn = {
      ...custom
    };
    Object.keys(customIn).map(key => {
      if (customIn[key] === undefined) delete customIn[key];
    });
    const equipments = await getManager().createQueryBuilder(Equipment, "equipment")
      .groupBy("equipment.id")
      .select(Object.keys(select).map(key => `equipment.${key}`))
      .where(customIn)
      .andWhere(new Brackets(qb => {
        qb.where("equipment.description LIKE :description", { description: `%${custom_query_in.keyword || ""}%` })
          .orWhere("equipment.title LIKE :title", { title: `%${custom_query_in.keyword || ""}%` });
      }))
      .orderBy("equipment.updated_at", "DESC")
      .take(take)
      .skip(skip)
      .getManyAndCount();
    if (hot_order || custom_query_in.frequency_total_num_order === "desc") {
      equipments[0] = equipments[0].sort((a, b) => b.frequency_total_num - a.frequency_total_num);
    } else if (custom_query_in.frequency_total_num_order === "asc") {
      equipments[0] = equipments[0].sort((a, b) => a.frequency_total_num - b.frequency_total_num);
    }
    return equipments;
  }

  /**
   * 查询多个视频课包括型号 不带分页
   * @param ids id集合
   * @param select select conditions
   */
  public async findManyWithModels(ids: string, select?: FindOptionsSelect<Equipment>): Promise<Equipment[]> {
    const ids_list = ids.split(",");
    const equipments = await this.equipmentRepo.find({ where: { id: In(ids_list) }, select });
    for (let i = 0; i < equipments.length; i++) {
      const models = await this.equipmentModelService.findManyByEquipmentId(equipments[i].id);
      Object.defineProperty(equipments[i], "models", {
        value: models,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    return equipments;
  }

  /**
   * 查询所有视频课
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<Equipment>): Promise<Equipment[] | undefined> {
    return await this.equipmentRepo.find({
      where: { status: 1 },
      order: { updated_at: "asc" },
      select
    });
  }

}
