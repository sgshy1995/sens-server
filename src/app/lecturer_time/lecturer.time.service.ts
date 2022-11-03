import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect } from "typeorm";
import { LecturerTime } from "../../db/entities/LecturerTime";
import { ResponseResult } from "../../types/result.interface";
import { UserService } from "../user/user.service";
import { LiveCourseService } from "../live_course/live.course.service";
import { BookService } from "../book/book.service";
import { PatientCourseService } from "../patient_course/patient.course.service";
import { UserInfoService } from "../user_info/user.info.service";
import moment = require("moment");

@Injectable()
export class LecturerTimeService {
  constructor(
    @InjectRepository(LecturerTime) private readonly lecturerTimeRepo: Repository<LecturerTime>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => LiveCourseService))
    private readonly liveCourseService: LiveCourseService,
    @Inject(forwardRef(() => BookService))
    private readonly bookService: BookService,
    @Inject(forwardRef(() => PatientCourseService))
    private readonly patientCourseService: PatientCourseService,
    @Inject(forwardRef(() => UserInfoService))
    private readonly userInfoService: UserInfoService
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
  async update(lecturerTime: LecturerTime): Promise<ResponseResult> {
    const lecturerTimeFind = await this.lecturerTimeRepo.findOne({ where: { id: lecturerTime.id } });
    if (!lecturerTimeFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "时间记录不存在"
      };
    }
    const lecturerTimeUpdate = Object.assign(lecturerTimeFind, lecturerTime);
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
  async updateLecturerTime(lecturerTime: LecturerTime): Promise<ResponseResult> {
    if (lecturerTime.start_time) {
      lecturerTime.start_time = new Date(lecturerTime.start_time);
    }
    if (lecturerTime.end_time) {
      lecturerTime.end_time = new Date(lecturerTime.end_time);
    }
    const lecturerTimeFind = await this.lecturerTimeRepo.findOne({ where: { id: lecturerTime.id } });
    if (!lecturerTimeFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "时间记录不存在"
      };
    } else if (lecturerTimeFind.if_booked) {
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
    if (!lecturerTimeFind) {
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
   * 根据用户id查询多个时间段 讲师使用
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
    for (let i = 0; i < lecturerTimesFind.length; i++) {
      if (lecturerTimesFind[i].if_booked) {
        const bookFind = await this.bookService.findOneById(lecturerTimesFind[i].book_id);
        const patientCourseFind = await this.patientCourseService.findOneById(bookFind ? bookFind.patient_course_id : undefined);
        const courseFind = await this.liveCourseService.findOneById(patientCourseFind ? patientCourseFind.course_id : undefined);
        const userFind = await this.userService.findOneById(bookFind ? bookFind.user_id : undefined, {
          id: true,
          name: true,
          gender: true,
          avatar: true
        });
        const userInfoFind = await this.userInfoService.findOneByUserId(userFind ? userFind.id : undefined, {
          age: true,
          injury_history: true,
          injury_recent: true,
          discharge_abstract: true,
          image_data: true
        });
        Object.defineProperties(lecturerTimesFind[i], {
          book_info: {
            value: bookFind,
            enumerable: true,
            configurable: true,
            writable: true
          },
          patient_course_info: {
            value: patientCourseFind,
            enumerable: true,
            configurable: true,
            writable: true
          },
          course_info: {
            value: courseFind,
            enumerable: true,
            configurable: true,
            writable: true
          },
          user_info: {
            value: userFind,
            enumerable: true,
            configurable: true,
            writable: true
          },
          user_info_info: {
            value: userInfoFind,
            enumerable: true,
            configurable: true,
            writable: true
          }
        });
      }
    }
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: lecturerTimesFind
    };
  }

  /**
   * 根据用户id查询多个 可预约时间段 患者使用
   * @param book_id book_id 历史预约id
   */
  async findManyLecturerTimesCanBeBooked(book_id?: string): Promise<ResponseResult> {
    const lecturerTimesFind = await this.findMany(book_id, {
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
    if (!lecturerTimeFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
    }
    const bookFind = await this.bookService.findOneById(lecturerTimeFind.book_id);
    const patientCourseFind = await this.patientCourseService.findOneById(bookFind ? bookFind.patient_course_id : undefined);
    const courseFind = await this.liveCourseService.findOneById(patientCourseFind ? patientCourseFind.course_id : undefined);
    const userFind = await this.userService.findOneById(bookFind ? bookFind.user_id : undefined, {
      id: true,
      name: true,
      gender: true,
      avatar: true
    });
    const userInfoFind = await this.userInfoService.findOneByUserId(userFind ? userFind.id : undefined, {
      age: true,
      injury_history: true,
      injury_recent: true,
      discharge_abstract: true,
      image_data: true
    });
    Object.defineProperties(lecturerTimeFind, {
      book_info: {
        value: bookFind,
        enumerable: true,
        configurable: true,
        writable: true
      },
      patient_course_info: {
        value: patientCourseFind,
        enumerable: true,
        configurable: true,
        writable: true
      },
      course_info: {
        value: courseFind,
        enumerable: true,
        configurable: true,
        writable: true
      },
      user_info: {
        value: userFind,
        enumerable: true,
        configurable: true,
        writable: true
      },
      user_info_info: {
        value: userInfoFind,
        enumerable: true,
        configurable: true,
        writable: true
      }
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: lecturerTimeFind
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
      lecturerTimeFind.status = 1;
      const bookFind = await this.bookService.findOneById(lecturerTimeFind.book_id);
      if (!bookFind) {
        return {
          code: HttpStatus.NOT_FOUND,
          message: "预约记录不存在"
        };
      }
      bookFind.status = 0
      if (!bookFind.outer_canceled_reason) {
        // 第一次无责取消
        bookFind.outer_canceled_reason = '被讲师无责取消'
      } else {
        // 有责取消，送一次课
        bookFind.outer_canceled_reason = '被讲师取消, 赠送一次课程'
        const patientCourseFind = await this.patientCourseService.findOneById(bookFind ? bookFind.patient_course_id : "");
        if (patientCourseFind) {
          patientCourseFind.course_live_num += 1;
          await this.patientCourseService.updatePatientCourse(patientCourseFind);
        }
      }
      await this.bookService.update(bookFind);
      lecturerTimeFind.if_booked = 0;
      lecturerTimeFind.book_id = null;
      lecturerTimeFind.canceled_reason = canceled_reason;
      await this.lecturerTimeRepo.update(lecturerTimeFind.id, lecturerTimeFind);
    } else {
      // 还未被预约
      await this.lecturerTimeRepo.remove(lecturerTimeFind);
    }
    return {
      code: HttpStatus.OK,
      message: "预约已取消"
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
   * 根据用户查询多个时间段 可预约
   * @param book_id book_id 历史预约id
   * @param select select conditions
   */
  public async findMany(book_id?: string, select?: FindOptionsSelect<LecturerTime>): Promise<LecturerTime[]> {
    let user_history_id = undefined;
    if (book_id) {
      // 如果存在预约记录，则此课程之后都是此讲师授课
      const lecturerTimeHistory = await this.lecturerTimeRepo.findOne({
        where: {
          book_id,
          status: 1
        }
      });
      if (lecturerTimeHistory) {
        user_history_id = lecturerTimeHistory.user_id;
      }
    }
    return await this.lecturerTimeRepo.find({
      where: { if_booked: 0, status: 1, user_id: user_history_id },
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
