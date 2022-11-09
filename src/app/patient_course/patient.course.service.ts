import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect } from "typeorm";
import { PatientCourse } from "../../db/entities/PatientCourse";
import { ResponseResult } from "../../types/result.interface";
import { UserService } from "../user/user.service";
import { LiveCourseService } from "../live_course/live.course.service";
import { CourseOrderService } from "../course_order/course.order.service";
import { BookService } from "../book/book.service";
import { RoomService } from "../room/room.service";

@Injectable()
export class PatientCourseService {
  constructor(
    @InjectRepository(PatientCourse) private readonly patientCourseRepo: Repository<PatientCourse>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => LiveCourseService))
    private readonly liveCourseService: LiveCourseService,
    @Inject(forwardRef(() => CourseOrderService))
    private readonly courseOrderService: CourseOrderService,
    @Inject(forwardRef(() => BookService))
    private readonly bookService: BookService,
    @Inject(forwardRef(() => RoomService))
    private readonly roomService: RoomService
  ) {
  }

  /**
   * 创建患者课程
   * @param patientCourse patientCourse 实体对象
   */
  async createPatientCourse(patientCourse: PatientCourse): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    const userFind = await this.userService.findOneById(patientCourse.user_id);
    if (!userFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "用户不存在"
      };
    }
    // 插入数据时，删除 id，以避免请求体内传入 id
    patientCourse.id !== null && patientCourse.id !== undefined && delete patientCourse.id;
    // 取消次数
    patientCourse.cancel_num = 0;
    // 状态
    patientCourse.status = 1;
    await this.patientCourseRepo.save(patientCourse);
    return responseBody;
  }

  /**
   * 批量创建患者课程
   * @param patientCourses patientCourses 多个实体对象
   */
  async createManyPatientCourses(patientCourses: PatientCourse[]): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    // 插入数据时，删除 id，以避免请求体内传入 id
    patientCourses.map(patientCourse => {
      patientCourse.id !== null && patientCourse.id !== undefined && delete patientCourse.id;
      // 取消次数
      patientCourse.cancel_num = 0;
      // 状态
      patientCourse.status = 1;
    })
    await this.patientCourseRepo.save(patientCourses);
    return responseBody;
  }

  /**
   * 更新
   *
   * @param patientCourse patientCourse 实体对象
   */
  async updatePatientCourse(patientCourse: PatientCourse): Promise<ResponseResult> {
    if (patientCourse.validity_time) {
      patientCourse.validity_time = new Date(patientCourse.validity_time);
    }
    const patientCourseFind = await this.patientCourseRepo.findOne({ where: { id: patientCourse.id } });
    if (!patientCourseFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "患者课程记录不存在"
      };
    }
    const patientCourseUpdate = Object.assign(patientCourseFind, patientCourse);
    await this.patientCourseRepo.update(patientCourseUpdate.id, patientCourseUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 根据用户id查询多个患者课程
   * @param user_id user_id
   * @param status status
   */
  async findManyPatientCoursesByUserId(user_id: string, status: number): Promise<ResponseResult> {
    const patientCoursesFind = await this.findManyByUserId(user_id, status, {
      id: true,
      user_id: true,
      course_id: true,
      validity_time: true,
      course_live_num: true,
      learn_num: true,
      order_id: true,
      cancel_num: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    for (let i = 0; i < patientCoursesFind.length; i++) {
      const courseFind = await this.liveCourseService.findOneById(patientCoursesFind[i].course_id);
      Object.defineProperty(patientCoursesFind[i], "course_info", {
        value: courseFind,
        enumerable: true,
        configurable: true,
        writable: true
      });
      const bookFind = await this.bookService.findOneByPatientCourseId(patientCoursesFind[i].id)
      Object.defineProperty(patientCoursesFind[i], "book_info", {
        value: bookFind,
        enumerable: true,
        configurable: true,
        writable: true
      });
      const roomFind = bookFind ? await this.roomService.findOneSuccessByBookId(bookFind.id) : null;
      Object.defineProperty(patientCoursesFind[i], "room_info", {
        value: roomFind,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: patientCoursesFind
    };
  }


  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOnePatientCourseById(id: string): Promise<ResponseResult> {
    const patientCourseFind = await this.findOneById(id, {
      id: true,
      user_id: true,
      course_id: true,
      validity_time: true,
      course_live_num: true,
      learn_num: true,
      order_id: true,
      cancel_num: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    if (!patientCourseFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
    }
    const courseFind = await this.liveCourseService.findOneById(patientCourseFind.course_id);
    Object.defineProperty(patientCourseFind, "course_info", {
      value: courseFind,
      enumerable: true,
      configurable: true,
      writable: true
    });
    const bookFind = await this.bookService.findOneByPatientCourseId(patientCourseFind.id)
    Object.defineProperty(patientCourseFind, "book_info", {
      value: bookFind,
      enumerable: true,
      configurable: true,
      writable: true
    });
    const roomFind = await this.roomService.findOneSuccessByBookId(bookFind ? bookFind.id : undefined);
    Object.defineProperty(patientCourseFind, "room_info", {
      value: roomFind,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: patientCourseFind
    };
  }

  /**
   * 根据 id 删除
   *
   * @param id id
   */
  async deleteOneById(id: string): Promise<ResponseResult> {
    const patientCourseFind = await this.findOneById(id);
    if (!patientCourseFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
    }
    await this.patientCourseRepo.remove(patientCourseFind);
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
  public async findOneById(id: string, select?: FindOptionsSelect<PatientCourse>): Promise<PatientCourse | undefined> {
    return await this.patientCourseRepo.findOne({ where: { id }, select });
  }


  /**
   * 根据用户查询多个患者课程
   * @param user_id user_id
   * @param select select conditions
   * @param status status
   */
  public async findManyByUserId(user_id: string, status: number, select?: FindOptionsSelect<PatientCourse>): Promise<PatientCourse[]> {
    return await this.patientCourseRepo.find({
      where: { user_id, status },
      order: { created_at: "desc" },
      select
    });
  }

  /**
   * 查询所有患者课程
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<PatientCourse>): Promise<PatientCourse[] | undefined> {
    return await this.patientCourseRepo.find({
      where: { status: 1 },
      order: { created_at: "desc" },
      select
    });
  }

}
