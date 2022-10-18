import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect, In } from "typeorm";
import { EquipmentChart } from "../../db/entities/EquipmentChart";
import { ResponseResult } from "../../types/result.interface";
import { EquipmentService } from "../equipment/equipment.service";
import { EquipmentModelService } from "../equipment_model/equipment.model.service";

@Injectable()
export class EquipmentChartService {
  constructor(
    @InjectRepository(EquipmentChart) private readonly equipmentChartRepo: Repository<EquipmentChart>,
    @Inject(forwardRef(() => EquipmentService))
    private readonly equipmentService: EquipmentService,
    @Inject(forwardRef(() => EquipmentModelService))
    private readonly equipmentModelService: EquipmentModelService
  ) {
  }

  /**
   * 添加购物车
   * @param equipmentChart equipmentChart 实体对象
   */
  async createEquipmentChart(equipmentChart: EquipmentChart): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    // 插入数据时，删除 id，以避免请求体内传入 id
    equipmentChart.id !== null && equipmentChart.id !== undefined && delete equipmentChart.id;
    // 校验数据是否已存在
    const equipmentChartHistoryFind = await this.equipmentChartRepo.findOne({
      where: {
        user_id: equipmentChart.user_id,
        equipment_id: equipmentChart.equipment_id,
        equipment_model_id: equipmentChart.equipment_model_id,
        status: 1
      }
    });
    if (equipmentChartHistoryFind) {
      equipmentChartHistoryFind.add_num += equipmentChart.add_num;
      await this.equipmentChartRepo.save(equipmentChartHistoryFind);
    } else {
      const userReadyCreateList = await this.equipmentChartRepo.find({ where: { user_id: equipmentChart.user_id } });
      const userReadyCreateEquipmentList = [];
      userReadyCreateList.map(item => {
        if (!userReadyCreateEquipmentList.includes(item.equipment_id)) {
          userReadyCreateEquipmentList.push(item.equipment_id);
        }
      });
      if (userReadyCreateEquipmentList.length > 20) {
        return {
          code: HttpStatus.CONFLICT,
          message: "购物车最多放二十种器材~"
        };
      }
      equipmentChart.status = 1;
      await this.equipmentChartRepo.save(equipmentChart);
    }
    return responseBody;
  }

  /**
   * 更新
   *
   * @param equipmentChart equipmentChart 实体对象
   */
  async updateEquipmentChart(equipmentChart: EquipmentChart): Promise<ResponseResult> {
    const equipmentChartFind = await this.equipmentChartRepo.findOne({ where: { id: equipmentChart.id } });
    if (!equipmentChartFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "数据主体不存在"
      };
    }
    const equipmentChartUpdate = Object.assign(equipmentChartFind, equipmentChart);
    await this.equipmentChartRepo.save(equipmentChartUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 更新数量
   *
   * @param id id
   * @param type type 'reduce' | 'add'
   */
  async updateEquipmentChartAddNum(id: string, type: "reduce" | "add"): Promise<ResponseResult> {
    const equipmentChartFind = await this.equipmentChartRepo.findOne({ where: { id } });
    if (!equipmentChartFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "数据主体不存在"
      };
    }
    type === "add" ? equipmentChartFind.add_num += 1 : equipmentChartFind.add_num -= 1;
    if (equipmentChartFind.add_num === 0){
      await this.equipmentChartRepo.remove(equipmentChartFind);
    }else{
      await this.equipmentChartRepo.update(equipmentChartFind.id, equipmentChartFind);
    }
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 删除
   *
   * @param id id 数据id
   */
  async deleteEquipmentChart(id: string): Promise<ResponseResult> {
    const equipmentChartFind = await this.equipmentChartRepo.findOne({ where: { id } });
    if (!equipmentChartFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "数据主体不存在"
      };
    }
    await this.equipmentChartRepo.remove(equipmentChartFind);
    return {
      code: HttpStatus.OK,
      message: "删除成功"
    };
  }

  /**
   * 根据多个删除
   *
   * @param ids ids 数据id集合
   */
  async deleteEquipmentChartsByIds(ids: string): Promise<ResponseResult> {
    const ids_list = ids.split(',')
    const equipmentChartsFind = await this.equipmentChartRepo.find({ where: { id: In(ids_list) } });
    await this.equipmentChartRepo.remove(equipmentChartsFind);
    return {
      code: HttpStatus.OK,
      message: "删除成功"
    };
  }

  /**
   * 根据用户id删除多个
   *
   * @param user_id user_id 用户id
   */
  async deleteEquipmentChartsByUserId(user_id: string): Promise<ResponseResult> {
    const equipmentChartsFind = await this.equipmentChartRepo.find({ where: { user_id } });
    await this.equipmentChartRepo.remove(equipmentChartsFind);
    return {
      code: HttpStatus.OK,
      message: "删除成功"
    };
  }

  /**
   * 根据用户id，查询多个购物车信息
   * @param user_id user_id
   */
  async findManyEquipmentChartsByUserId(user_id: string): Promise<ResponseResult> {
    const equipmentChartsFind = await this.findManyByUserId(user_id, {
      id: true,
      user_id: true,
      equipment_id: true,
      equipment_model_id: true,
      add_num: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    for (let i = 0; i < equipmentChartsFind.length; i++) {
      const equipmentFind = await this.equipmentService.findOneById(equipmentChartsFind[i].equipment_id);
      const equipmentModelFind = await this.equipmentModelService.findOneById(equipmentChartsFind[i].equipment_model_id);
      Object.defineProperty(equipmentChartsFind[i], "equipment_info", {
        value: equipmentFind,
        enumerable: true,
        configurable: true,
        writable: true
      });
      Object.defineProperty(equipmentChartsFind[i], "equipment_model_info", {
        value: equipmentModelFind,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: equipmentChartsFind
    };
  }

  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneEquipmentChartById(id: string): Promise<ResponseResult> {
    const equipmentChartFind = await this.findOneById(id, {
      id: true,
      user_id: true,
      equipment_id: true,
      equipment_model_id: true,
      add_num: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return equipmentChartFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: equipmentChartFind
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
  public async findOneById(id: string, select?: FindOptionsSelect<EquipmentChart>): Promise<EquipmentChart | undefined> {
    return await this.equipmentChartRepo.findOne({ where: { id }, select });
  }

  /**
   * 根据用户id，查询多个购物车
   * @param user_id user_id
   * @param select select conditions
   */
  public async findManyByUserId(user_id: string, select?: FindOptionsSelect<EquipmentChart>): Promise<EquipmentChart[]> {
    return await this.equipmentChartRepo.find({
      where: {
        user_id,
        status: 1
      },
      order: { updated_at: "desc" },
      select
    });
  }

}
