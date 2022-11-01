import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect } from "typeorm";
import { LecturerTime } from "../../db/entities/LecturerTime";
import { ResponseResult } from "../../types/result.interface";
import { UserService } from "../user/user.service";
import { LiveCourseService } from "../live_course/live.course.service";
import moment = require("moment");

@Injectable()
export class LecturerTimeService {
  constructor(
    @InjectRepository(LecturerTime) private readonly lecturerTimeRepo: Repository<LecturerTime>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => LiveCourseService))
    private readonly liveCourseService: LiveCourseService
  ) {
  }

  /**
   * 创建时间
   * @param lecturerTime lecturerTime 实体对象
   */
  async createLecturerTime(lecturerTime: LecturerTime): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建预约时间成功" };
    const userFind = await this.userService.findOneById(lecturerTime.user_id);
    if (!userFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "用户不存在"
      };
    }
    if (userFind.identity !== 1 || userFind.authenticate !== 2 || userFind.if_lecture_auth !== 1) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "用户没有讲师权限"
      };
    }
    const lecturerTimesFind = await this.findManyByUserId(lecturerTime.user_id);
    const nearlyFind = lecturerTimesFind.find(item => Math.abs(new Date(item.start_time).getTime() - new Date(lecturerTime.start_time).getTime()) < 5400000);
    if (nearlyFind) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: `您已存在最近的预约时间: ${moment(new Date(nearlyFind.start_time), "YYYY-MM-DD HH:mm").format("YYYY-MM-DD HH:mm")} ~ ${moment(new Date(nearlyFind.end_time), "YYYY-MM-DD HH:mm").format("YYYY-MM-DD HH:mm")}, 两次时间预约间隔需大于30分钟`
      };
    }
    // 插入数据时，删除 id，以避免请求体内传入 id
    lecturerTime.id !== null && lecturerTime.id !== undefined && delete lecturerTime.id;
    // 开始时间
    lecturerTime.start_time = new Date(lecturerTime.start_time);
    // 结束时间
    lecturerTime.end_time = new Date(lecturerTime.end_time);
    // 预约
    lecturerTime.if_booked = 0;
    // 状态
    lecturerTime.status = 1;
    await this.lecturerTimeRepo.save(lecturerTime);
    return responseBody;
  }

  /**
   * 更新
   *
   * @param lecturerTime lecturerTime 实体对象
   */
  async updateLecturerTime(lecturerTime: LecturerTime): Promise<ResponseResult> {
    if (lecturerTime.start_time) {
      lecturerTime.start_time = new Date(lecturerTime.start_time);
    }
    if (lecturerTime.end_time) {
      lecturerTime.end_time = new Date(lecturerTime.end_time);
    }
    const lecturerTimeFind = await this.lecturerTimeRepo.findOne({ where: { id: lecturerTime.id } });
    if (!lecturerTimeFind){
      return {
        code: HttpStatus.NOT_FOUND,
        message: "时间记录不存在"
      };
    }else if (lecturerTimeFind.if_booked){
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "该时间段已被预约，无法修改"
      };
    }
    const lecturerTimeUpdate = Object.assign(lecturerTimeFind, lecturerTime);
    const lecturerTimesFind = await this.findManyByUserId(lecturerTime.user_id);
    const nearlyFind = lecturerTimesFind.find(item => Math.abs(new Date(item.start_time).getTime() - new Date(lecturerTime.start_time).getTime()) < 5400000 && item.id !== lecturerTimeUpdate.id);
    if (nearlyFind) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: `您已存在最近的预约时间: ${moment(new Date(nearlyFind.start_time), "YYYY-MM-DD HH:mm").format("YYYY-MM-DD HH:mm")} ~ ${moment(new Date(nearlyFind.end_time), "YYYY-MM-DD HH:mm").format("YYYY-MM-DD HH:mm")}, 两次时间预约间隔需大于30分钟`
      };
    }
    await this.lecturerTimeRepo.update(lecturerTimeUpdate.id, lecturerTimeUpdate);
    if (lecturerTimeUpdate.status)
      return {
        code: HttpStatus.OK,
        message: "更新成功"
      };
  }

  /**
   * 更新
   *
   * @param lecturerTime lecturerTime 实体对象
   */
  async adminUpdateLecturerTime(lecturerTime: LecturerTime): Promise<ResponseResult> {
    if (lecturerTime.start_time) {
      lecturerTime.start_time = new Date(lecturerTime.start_time);
    }
    if (lecturerTime.end_time) {
      lecturerTime.end_time = new Date(lecturerTime.end_time);
    }
    const lecturerTimeFind = await this.lecturerTimeRepo.findOne({ where: { id: lecturerTime.id } });
    if (!lecturerTimeFind){
      return {
        code: HttpStatus.NOT_FOUND,
        message: "时间记录不存在"
      };
    }
    const lecturerTimeUpdate = Object.assign(lecturerTimeFind, lecturerTime);
    const lecturerTimesFind = await this.findManyByUserId(lecturerTime.user_id);
    const nearlyFind = lecturerTimesFind.find(item => Math.abs(new Date(item.start_time).getTime() - new Date(lecturerTime.start_time).getTime()) < 5400000 && item.id !== lecturerTimeUpdate.id);
    if (nearlyFind) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: `您已存在最近的预约时间: ${moment(new Date(nearlyFind.start_time), "YYYY-MM-DD HH:mm").format("YYYY-MM-DD HH:mm")} ~ ${moment(new Date(nearlyFind.end_time), "YYYY-MM-DD HH:mm").format("YYYY-MM-DD HH:mm")}, 两次时间预约间隔需大于30分钟`
      };
    }
    await this.lecturerTimeRepo.update(lecturerTimeUpdate.id, lecturerTimeUpdate);
    if (lecturerTimeUpdate.status)
      return {
        code: HttpStatus.OK,
        message: "更新成功"
      };
  }

  /**
   * 根据用户id查询多个时间段
   * @param user_id user_id
   */
  async findManyLecturerTimesByUserId(user_id: string): Promise<ResponseResult> {
    const lecturerTimesFind = await this.findManyByUserId(user_id, {
      id: true,
      user_id: true,
      start_time: true,
      end_time: true,
      if_booked: true,
      book_id: true,
      canceled_reason: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: lecturerTimesFind
    };
  }


  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneLecturerTimeById(id: string): Promise<ResponseResult> {
    const lecturerTimeFind = await this.findOneById(id, {
      id: true,
      user_id: true,
      start_time: true,
      end_time: true,
      if_booked: true,
      book_id: true,
      canceled_reason: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return lecturerTimeFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: lecturerTimeFind
      } : {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
  }

  /**
   * 根据 id 删除, 取消预约
   *
   * @param id id
   * @param canceled_reason canceled_reason
   */
  async deleteOneLecturerTimeById(id: string, canceled_reason: string): Promise<ResponseResult> {
    const lecturerTimeFind = await this.findOneById(id);
    if (!lecturerTimeFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
    }
    if (lecturerTimeFind.if_booked) {
      // 已经被预约
      lecturerTimeFind.status = 0;
      lecturerTimeFind.canceled_reason = canceled_reason;
      await this.lecturerTimeRepo.update(lecturerTimeFind.id, lecturerTimeFind);
    } else {
      // 还未被预约
      await this.lecturerTimeRepo.remove(lecturerTimeFind);
    }
    return {
      code: HttpStatus.OK,
      message: "删除成功"
    };
  }

  /**
   * 根据 id 查询单个信息，如果不存在则抛出404异常
   * @param id id
   * @param select select conditions
   */
  public async findOneById(id: string, select?: FindOptionsSelect<LecturerTime>): Promise<LecturerTime | undefined> {
    return await this.lecturerTimeRepo.findOne({ where: { id }, select });
  }


  /**
   * 根据用户查询多个时间段
   * @param user_id user_id
   * @param select select conditions
   */
  public async findManyByUserId(user_id: string, select?: FindOptionsSelect<LecturerTime>): Promise<LecturerTime[]> {
    return await this.lecturerTimeRepo.find({
      where: { user_id },
      order: { start_time: "desc" },
      select
    });
  }

  /**
   * 查询所有时间段
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<LecturerTime>): Promise<LecturerTime[] | undefined> {
    return await this.lecturerTimeRepo.find({
      where: { status: 1 },
      order: { created_at: "desc" },
      select
    });
  }

}
