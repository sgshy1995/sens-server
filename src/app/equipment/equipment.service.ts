import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect, FindOptionsWhere, Like, getRepository, Between, MoreThan } from "typeorm";
import { Equipment } from "../../db/entities/Equipment";
import { PaginationQuery, ResponsePaginationResult, ResponseResult } from "../../types/result.interface";
import { EquipmentModelService } from "../equipment_model/equipment.model.service";

type CustomQuery = {
  frequency_total_num_order?: "desc" | "asc"
}

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment) private readonly equipmentRepo: Repository<Equipment>,
    @Inject(forwardRef(() => EquipmentModelService))
    private readonly equipmentModelService: EquipmentModelService
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
   * 查询所有的器材
   */
  async findAllEquipments(): Promise<ResponseResult> {
    const liveCoursesFind = await this.findAll({
      id: true,
      serial_number: true,
      title: true,
      cover: true,
      description: true,
      long_figure: true,
      equipment_type: true,
      frequency_total_num: true,
      carousel: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: liveCoursesFind
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
      frequency_total_num: true,
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
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneEquipmentById(id: string): Promise<ResponseResult> {
    const liveCourseFind = await this.findOneById(id, {
      id: true,
      serial_number: true,
      title: true,
      cover: true,
      description: true,
      long_figure: true,
      equipment_type: true,
      frequency_total_num: true,
      carousel: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return liveCourseFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: liveCourseFind
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
    const take = query.pageSize || 8;
    const page = query.pageNo || 1;
    const skip = (page - 1) * take;
    const custom_query_in: CustomQuery = custom_query ? { ...custom_query } : {};
    if (custom.title) {
      custom.title = Like(`%${custom.title}%`);
    }
    const equipments = await this.equipmentRepo.findAndCount({
      where: {
        ...custom
      },
      order: { updated_at: "desc" },
      take,
      skip,
      select
    });
    if (hot_order || custom_query_in.frequency_total_num_order === "desc") {
      equipments[0] = equipments[0].sort((a, b) => b.frequency_total_num - a.frequency_total_num);
    } else if (custom_query_in.frequency_total_num_order === "asc") {
      equipments[0] = equipments[0].sort((a, b) => a.frequency_total_num - b.frequency_total_num);
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
