import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect, Like } from "typeorm";
import { Book } from "../../db/entities/Book";
import { ResponseResult } from "../../types/result.interface";
import { UserService } from "../user/user.service";
import { LiveCourseService } from "../live_course/live.course.service";
import { LecturerTimeService } from "../lecturer_time/lecturer.time.service";
import { PatientCourseService } from "../patient_course/patient.course.service";
import moment = require("moment");

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book) private readonly bookRepo: Repository<Book>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => LiveCourseService))
    private readonly liveCourseService: LiveCourseService,
    @Inject(forwardRef(() => LecturerTimeService))
    private readonly lecturerTimeService: LecturerTimeService,
    @Inject(forwardRef(() => PatientCourseService))
    private readonly patientCourseService: PatientCourseService
  ) {
  }

  /**
   * 创建预约
   * @param book book 实体对象
   */
  async createBook(book: Book): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "预约成功" };
    const userFind = await this.userService.findOneById(book.user_id);
    if (!userFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "用户不存在"
      };
    }
    const lecturerTimeFind = await this.lecturerTimeService.findOneById(book.lecturer_time_id);
    if (!lecturerTimeFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "预约时间段不存在"
      };
    } else if (lecturerTimeFind.if_booked) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "该时间段已被预约"
      };
    } else if (lecturerTimeFind.user_id === book.user_id) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "开放时间段用户不能与预约用户重复"
      };
    }
    const booksFind = await this.findManyByUserId(book.user_id);
    const nearlyFind = booksFind.find(item => Math.abs(new Date(item.book_start_time).getTime() - new Date(book.book_start_time).getTime()) < 5400000);
    if (nearlyFind) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: `您已存在最近的预约时间: ${moment(new Date(nearlyFind.book_start_time), "YYYY-MM-DD HH:mm").format("YYYY-MM-DD HH:mm")} ~ ${moment(new Date(nearlyFind.book_end_time), "YYYY-MM-DD HH:mm").format("YYYY-MM-DD HH:mm")}, 两次时间预约间隔需大于30分钟`
      };
    }
    // 插入数据时，删除 id，以避免请求体内传入 id
    book.id !== null && book.id !== undefined && delete book.id;
    // 被预约用户id
    book.booked_user_id = lecturerTimeFind.user_id;
    // 开始时间
    book.book_start_time = lecturerTimeFind.start_time;
    // 结束时间
    book.book_end_time = lecturerTimeFind.end_time;
    // 修改次数
    book.change_num = 0;
    // 状态
    book.status = 1;
    const bookFind = await this.bookRepo.findOne({ where: { user_id: book.user_id, status: 0, outer_canceled_reason: Like(`%%`) } });
    if (bookFind) {
      // 被讲师取消的预约，重新打开，以记录历史取消原因
      bookFind.status = 1
      // 开始时间
      bookFind.book_start_time = lecturerTimeFind.start_time;
      // 结束时间
      bookFind.book_end_time = lecturerTimeFind.end_time;
      // 预约id
      bookFind.lecturer_time_id = book.lecturer_time_id
      // 被预约用户id
      bookFind.booked_user_id = lecturerTimeFind.user_id;
      await this.bookRepo.update(bookFind.id, bookFind)
      // 讲师时间段预定id更新
      lecturerTimeFind.book_id = bookFind.id;
    }else{
      await this.bookRepo.save(book);
      // 讲师时间段预定id更新
      lecturerTimeFind.book_id = book.id;
    }
    // 讲师时间段更新
    lecturerTimeFind.if_booked = 1;
    await this.lecturerTimeService.updateLecturerTime(lecturerTimeFind);
    return responseBody;
  }

  /**
   * 从预约时间更新
   *
   * @param book book 实体对象
   */
  async update(book: Book): Promise<ResponseResult> {
    const bookFind = await this.findOneById(book.id);
    if (!bookFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "预约记录不存在"
      };
    } else if (bookFind.status === 2) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "预约记录已完成，不可修改"
      };
    }
    const bookUpdate = Object.assign(bookFind, book);
    await this.bookRepo.update(bookUpdate.id, bookUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 更新
   *
   * @param book book 实体对象
   */
  async updateBook(book: Book): Promise<ResponseResult> {
    const bookFind = await this.findOneById(book.id);
    if (!bookFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "预约记录不存在"
      };
    } else if (bookFind.status === 2) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "预约记录已完成，不可修改"
      };
    }
    const lecturerTimeOldFind = await this.lecturerTimeService.findOneById(bookFind.lecturer_time_id);
    if (!lecturerTimeOldFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "时间记录不存在"
      };
    }
    if (bookFind.lecturer_time_id !== book.lecturer_time_id) {
      // 修改了预约时间
      if (bookFind.change_num) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: "预约记录已达最大修改次数"
        };
      }
      const lecturerTimeNewFind = await this.lecturerTimeService.findOneById(book.lecturer_time_id);
      if (!lecturerTimeNewFind) {
        return {
          code: HttpStatus.NOT_FOUND,
          message: "时间记录不存在"
        };
      } else if (lecturerTimeNewFind.if_booked) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: "该时间段已被预约，无法修改"
        };
      }
      book.book_start_time = lecturerTimeNewFind.start_time;
      book.book_end_time = lecturerTimeNewFind.end_time;
      const booksFind = await this.findManyByUserId(book.user_id);
      const nearlyFind = booksFind.find(item => Math.abs(new Date(item.book_start_time).getTime() - new Date(book.book_start_time).getTime()) < 5400000);
      if (nearlyFind) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: `您已存在最近的预约时间: ${moment(new Date(nearlyFind.book_start_time), "YYYY-MM-DD HH:mm").format("YYYY-MM-DD HH:mm")} ~ ${moment(new Date(nearlyFind.book_end_time), "YYYY-MM-DD HH:mm").format("YYYY-MM-DD HH:mm")}, 两次时间预约间隔需大于30分钟`
        };
      }
      // 被预约用户id
      book.booked_user_id = lecturerTimeNewFind.user_id;
      // 修改两个时间段的预约状态
      lecturerTimeOldFind.if_booked = 0;
      lecturerTimeOldFind.book_id = null;
      await this.lecturerTimeService.update(lecturerTimeOldFind);
      lecturerTimeNewFind.if_booked = 1;
      lecturerTimeNewFind.book_id = book.id;
      await this.lecturerTimeService.update(lecturerTimeNewFind);
    } else {
      //TODO 没有修改预约时间，很少见
      book.book_start_time = lecturerTimeOldFind.start_time;
      book.book_end_time = lecturerTimeOldFind.end_time;
    }
    const bookUpdate = Object.assign(bookFind, book);
    // 修改次数 + 1
    bookUpdate.change_num += 1;
    await this.bookRepo.update(bookUpdate.id, bookUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 更新 admin 使用
   *
   * @param book book 实体对象
   */
  async updateAdminBook(book: Book): Promise<ResponseResult> {
    const bookFind = await this.findOneById(book.id);
    if (!bookFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "预约记录不存在"
      };
    }
    const lecturerTimeOldFind = await this.lecturerTimeService.findOneById(bookFind.lecturer_time_id);
    if (!lecturerTimeOldFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "时间记录不存在"
      };
    }
    if (bookFind.lecturer_time_id !== book.lecturer_time_id) {
      // 修改了预约时间
      const lecturerTimeNewFind = await this.lecturerTimeService.findOneById(book.lecturer_time_id);
      if (!lecturerTimeNewFind) {
        return {
          code: HttpStatus.NOT_FOUND,
          message: "时间记录不存在"
        };
      } else if (lecturerTimeNewFind.if_booked) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: "该时间段已被预约，无法修改"
        };
      }
      book.book_start_time = lecturerTimeNewFind.start_time;
      book.book_end_time = lecturerTimeNewFind.end_time;
      // 被预约用户id
      book.booked_user_id = lecturerTimeNewFind.user_id;
      // 修改两个时间段的预约状态
      lecturerTimeOldFind.if_booked = 0;
      lecturerTimeOldFind.book_id = null;
      await this.lecturerTimeService.update(lecturerTimeOldFind);
      lecturerTimeNewFind.if_booked = 1;
      lecturerTimeNewFind.book_id = book.id;
      await this.lecturerTimeService.update(lecturerTimeNewFind);
    } else {
      //TODO 没有修改预约时间，很少见
      book.book_start_time = lecturerTimeOldFind.start_time;
      book.book_end_time = lecturerTimeOldFind.end_time;
    }
    const bookUpdate = Object.assign(bookFind, book);
    // 修改次数 + 1
    bookUpdate.change_num += 1;
    await this.bookRepo.update(bookUpdate.id, bookUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 根据用户id查询多个预约
   * @param user_id user_id
   */
  async findManyBooksByUserId(user_id: string): Promise<ResponseResult> {
    const booksFind = await this.findManyByUserId(user_id, {
      id: true,
      user_id: true,
      booked_user_id: true,
      lecturer_time_id: true,
      patient_course_id: true,
      book_start_time: true,
      book_end_time: true,
      change_num: true,
      canceled_reason: true,
      outer_canceled_reason: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: booksFind
    };
  }

  /**
   * 根据用户id查询多个 已预约 医师使用
   * @param booked_user_id booked_user_id 被预订人id
   */
  async findManyBooksReadyBooked(booked_user_id?: string): Promise<ResponseResult> {
    const booksFind = await this.findMany(booked_user_id, {
      id: true,
      user_id: true,
      booked_user_id: true,
      lecturer_time_id: true,
      patient_course_id: true,
      book_start_time: true,
      book_end_time: true,
      change_num: true,
      canceled_reason: true,
      outer_canceled_reason: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: booksFind
    };
  }

  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneBookById(id: string): Promise<ResponseResult> {
    const bookFind = await this.findOneById(id, {
      id: true,
      user_id: true,
      booked_user_id: true,
      lecturer_time_id: true,
      patient_course_id: true,
      book_start_time: true,
      book_end_time: true,
      change_num: true,
      canceled_reason: true,
      outer_canceled_reason: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return bookFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: bookFind
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
  async deleteOneBookById(id: string, canceled_reason: string): Promise<ResponseResult> {
    const bookFind = await this.findOneById(id);
    if (!bookFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
    }
    const patientCourseFind = await this.patientCourseService.findOneById(bookFind.patient_course_id);
    if (patientCourseFind.cancel_num) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "本课程已达最大取消次数，无法取消"
      };
    }
    patientCourseFind.cancel_num += 1;
    await this.patientCourseService.updatePatientCourse(patientCourseFind);
    bookFind.status = 0;
    bookFind.canceled_reason = canceled_reason;
    bookFind.change_num += 1;
    await this.bookRepo.update(bookFind.id, bookFind);
    const lecturerTimeFind = await this.lecturerTimeService.findOneById(bookFind.lecturer_time_id);
    lecturerTimeFind.if_booked = 0;
    lecturerTimeFind.book_id = null;
    await this.lecturerTimeService.update(lecturerTimeFind);
    return {
      code: HttpStatus.OK,
      message: "已取消预约"
    };
  }

  /**
   * 根据 id 删除, 取消预约 admin 使用
   *
   * @param id id
   * @param canceled_reason canceled_reason
   */
  async deleteOneBookAdminById(id: string, canceled_reason: string): Promise<ResponseResult> {
    const bookFind = await this.findOneById(id);
    if (!bookFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
    }
    const lecturerTimeFind = await this.lecturerTimeService.findOneById(bookFind.lecturer_time_id);
    lecturerTimeFind.if_booked = 0;
    lecturerTimeFind.book_id = null;
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
  public async findOneById(id: string, select?: FindOptionsSelect<Book>): Promise<Book | undefined> {
    return await this.bookRepo.findOne({ where: { id }, select });
  }

  /**
   * 根据 id 查询单个信息，如果不存在则抛出404异常
   * @param patient_course_id patient_course_id
   * @param select select conditions
   */
  public async findOneByPatientCourseId(patient_course_id: string, select?: FindOptionsSelect<Book>): Promise<Book | undefined> {
    return await this.bookRepo.findOne({ where: { patient_course_id, status: 1 }, select });
  }

  /**
   * 根据用户查询多个时间段
   * @param user_id user_id
   * @param select select conditions
   */
  public async findManyByUserId(user_id: string, select?: FindOptionsSelect<Book>): Promise<Book[]> {
    return await this.bookRepo.find({
      where: { user_id },
      order: { book_start_time: "asc" },
      select
    });
  }

  /**
   * 根据用户查询多个时间段 可预约
   * @param booked_user_id booked_user_id 被预约id
   * @param select select conditions
   */
  public async findMany(booked_user_id?: string, select?: FindOptionsSelect<Book>): Promise<Book[]> {
    return await this.bookRepo.find({
      where: { status: 1, booked_user_id },
      order: { book_start_time: "asc" },
      select
    });
  }

  /**
   * 查询所有时间段
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<Book>): Promise<Book[] | undefined> {
    return await this.bookRepo.find({
      where: { status: 1 },
      order: { created_at: "desc" },
      select
    });
  }

}
