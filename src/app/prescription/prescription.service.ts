import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect, FindOptionsWhere, Like, getRepository } from "typeorm";
import { Prescription } from "../../db/entities/Prescription";
import { PaginationQuery, ResponsePaginationResult, ResponseResult } from "../../types/result.interface";
import { UserService } from "../user/user.service";

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectRepository(Prescription) private readonly prescriptionRepo: Repository<Prescription>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {
  }

  /**
   * 创建答复
   * @param prescription prescription 实体对象
   */
  async createPrescription(prescription: Prescription): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "发布成功" };
    // 插入数据时，删除 id，以避免请求体内传入 id
    prescription.id !== null && prescription.id !== undefined && delete prescription.id;
    // 观看人数
    prescription.watch_num = 0;
    // 发布时间
    prescription.publish_time = prescription.status === 0 ? null : new Date();
    await this.prescriptionRepo.save(prescription);
    return responseBody;
  }

  /**
   * 更新
   *
   * @param prescription prescription 实体对象
   */
  async updatePrescription(prescription: Prescription): Promise<ResponseResult> {
    const prescriptionFind = await this.prescriptionRepo.findOne({ where: { id: prescription.id } });
    if (prescriptionFind.status === 0 && prescription.status === 1){
      // 发布
      prescription.publish_time = new Date()
    }
    const prescriptionUpdate = Object.assign(prescriptionFind, prescription);
    await this.prescriptionRepo.update(prescriptionUpdate.id, prescriptionUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 更新观看人数
   *
   * @param id id
   */
  async addPrescriptionWatchNum(id: string): Promise<ResponseResult> {
    const prescriptionFind = await this.prescriptionRepo.findOne({ where: { id } });
    prescriptionFind.watch_num += 1
    await this.prescriptionRepo.update(prescriptionFind.id, prescriptionFind);
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
  public async updateManyStatusByIds(ids: string[], status: number, select?: FindOptionsSelect<Prescription>): Promise<ResponseResult> {
    const prescriptionsFind =  await getRepository(Prescription)
      .createQueryBuilder("prescription")
      .select()
      .where("prescription.id IN (:...ids)", { ids })
      .orderBy("prescription.id", 'DESC')
      .getMany();
    for (let i = 0; i < prescriptionsFind.length; i++) {
      if (prescriptionsFind[i].status === 0 && status === 1){
        // 发布
        prescriptionsFind[i].publish_time = new Date()
      }
      prescriptionsFind[i].status = status
      await this.prescriptionRepo.update(prescriptionsFind[i].id, prescriptionsFind[i]);
    }
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 查询所有的处方
   */
  async findAllPrescriptions(): Promise<ResponseResult> {
    const prescriptionsFind = await this.findAll({
      id: true,
      title: true,
      cover: true,
      prescription_type: true,
      watch_num: true,
      prescription_video: true,
      prescription_content: true,
      description: true,
      difficulty: true,
      time_length: true,
      part: true,
      symptoms: true,
      phase: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: prescriptionsFind
    };
  }

  /**
   * 查询多个处方
   * @param custom custom find options
   * @param query custom find query
   * @param hot_sort hot_sort
   */
  async findManyPrescriptions(custom: FindOptionsWhere<Prescription>, query: PaginationQuery, hot_sort: boolean = false): Promise<ResponsePaginationResult> {
    const [prescriptionsFind, totalCount] = await this.findMany(custom, query, hot_sort, {
      id: true,
      title: true,
      cover: true,
      prescription_type: true,
      watch_num: true,
      prescription_video: true,
      prescription_content: true,
      description: true,
      difficulty: true,
      time_length: true,
      part: true,
      symptoms: true,
      phase: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: {
        data: prescriptionsFind,
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
  async findOnePrescriptionById(id: string): Promise<ResponseResult> {
    const prescriptionFind = await this.findOneById(id, {
      id: true,
      title: true,
      cover: true,
      prescription_type: true,
      watch_num: true,
      prescription_video: true,
      prescription_content: true,
      description: true,
      difficulty: true,
      time_length: true,
      part: true,
      symptoms: true,
      phase: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return prescriptionFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: prescriptionFind
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
  public async findOneById(id: string, select?: FindOptionsSelect<Prescription>): Promise<Prescription | undefined> {
    return await this.prescriptionRepo.findOne({ where: { id }, select });
  }

  /**
   * 查询多个处方
   * @param custom custom find conditions
   * @param query custom find query
   * @param hot_order hot_order
   * @param select select conditions
   */
  public async findMany(custom: FindOptionsWhere<Prescription>, query: PaginationQuery, hot_order?: boolean, select?: FindOptionsSelect<Prescription>): Promise<[Prescription[], number]> {
    const take = query.pageSize || 8;
    const page = query.pageNo || 1;
    const skip = (page - 1) * take;
    if (custom.title){
      custom.title = Like(`%${custom.title}%`)
    }
    const prescriptions = await this.prescriptionRepo.findAndCount({
      where: { ...custom },
      order: { updated_at: "desc" },
      take,
      skip,
      select
    });
    if (hot_order){
      prescriptions[0] = prescriptions[0].sort((a,b) => b.watch_num - a.watch_num)
    }
    return prescriptions
  }

  /**
   * 查询所有处方
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<Prescription>): Promise<Prescription[] | undefined> {
    return await this.prescriptionRepo.find({
      where: { status: 1 },
      order: { updated_at: "asc" },
      select
    });
  }

}
