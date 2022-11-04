import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect, FindOptionsOrderValue } from "typeorm";
import { MajorCourse } from "../../db/entities/MajorCourse";
import { ResponseResult } from "../../types/result.interface";
import { UserService } from "../user/user.service";
import { VideoCourseService } from "../video_course/video.course.service";
import { CourseOrderService } from "../course_order/course.order.service";
import { CourseInVideoService } from "../course_in_video/course.in.video.service";

@Injectable()
export class MajorCourseService {
  constructor(
    @InjectRepository(MajorCourse) private readonly majorCourseRepo: Repository<MajorCourse>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => VideoCourseService))
    private readonly videoCourseService: VideoCourseService,
    @Inject(forwardRef(() => CourseOrderService))
    private readonly courseOrderService: CourseOrderService,
    @Inject(forwardRef(() => CourseInVideoService))
    private readonly courseInVideoService: CourseInVideoService
  ) {
  }

  /**
   * 创建专业康复课程
   * @param majorCourse majorCourse 实体对象
   */
  async createMajorCourse(majorCourse: MajorCourse): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    const userFind = await this.userService.findOneById(majorCourse.user_id);
    if (!userFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "用户不存在"
      };
    }
    // 插入数据时，删除 id，以避免请求体内传入 id
    majorCourse.id !== null && majorCourse.id !== undefined && delete majorCourse.id;
    // 状态
    majorCourse.status = 1;
    await this.majorCourseRepo.save(majorCourse);
    return responseBody;
  }

  /**
   * 批量创建专业康复课程
   * @param majorCourses majorCourses 多个实体对象
   */
  async createManyMajorCourses(majorCourses: MajorCourse[]): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    // 插入数据时，删除 id，以避免请求体内传入 id
    majorCourses.map(majorCourse => {
      // 插入数据时，删除 id，以避免请求体内传入 id
      majorCourse.id !== null && majorCourse.id !== undefined && delete majorCourse.id;
      // 状态
      majorCourse.status = 1;
    })
    await this.majorCourseRepo.save(majorCourses);
    return responseBody;
  }

  /**
   * 更新
   *
   * @param majorCourse majorCourse 实体对象
   */
  async updateMajorCourse(majorCourse: MajorCourse): Promise<ResponseResult> {
    if (majorCourse.validity_time) {
      majorCourse.validity_time = new Date(majorCourse.validity_time);
    }
    const majorCourseFind = await this.majorCourseRepo.findOne({ where: { id: majorCourse.id } });
    if (!majorCourseFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "患者课程记录不存在"
      };
    }
    const majorCourseUpdate = Object.assign(majorCourseFind, majorCourse);
    await this.majorCourseRepo.update(majorCourseUpdate.id, majorCourseUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 根据用户id查询多个专业康复课程
   * @param user_id user_id
   * @param created_at created_at
   */
  async findManyMajorCoursesByUserId(user_id: string, created_at: FindOptionsOrderValue): Promise<ResponseResult> {
    const majorCoursesFind = await this.findManyByUserId(user_id, created_at, {
      id: true,
      user_id: true,
      course_id: true,
      validity_time: true,
      order_id: true,
      recent_num: true,
      recent_progress: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    for (let i = 0; i < majorCoursesFind.length; i++) {
      const courseFind = await this.videoCourseService.findOneById(majorCoursesFind[i].course_id);
      Object.defineProperty(majorCoursesFind[i], "course_info", {
        value: courseFind,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: majorCoursesFind
    };
  }


  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneMajorCourseById(id: string): Promise<ResponseResult> {
    const majorCourseFind = await this.findOneById(id, {
      id: true,
      user_id: true,
      course_id: true,
      validity_time: true,
      order_id: true,
      recent_num: true,
      recent_progress: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    if (!majorCourseFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
    }
    const courseFind = await this.videoCourseService.findOneById(majorCourseFind.course_id);
    if (!courseFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "课程不存在"
      };
    }
    const courseInVideos = await this.courseInVideoService.findManyByCourseId(majorCourseFind.course_id);
    if (!courseInVideos.length) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "该课程没有可供播放的视频"
      };
    }
    Object.defineProperty(courseFind, "videos", {
      value: courseInVideos,
      enumerable: true,
      configurable: true,
      writable: true
    });
    Object.defineProperty(majorCourseFind, "course_info", {
      value: courseFind,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: majorCourseFind
    };
  }

  /**
   * 根据 id 删除
   *
   * @param id id
   */
  async deleteOneById(id: string): Promise<ResponseResult> {
    const majorCourseFind = await this.findOneById(id);
    if (!majorCourseFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
    }
    await this.majorCourseRepo.remove(majorCourseFind);
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
  public async findOneById(id: string, select?: FindOptionsSelect<MajorCourse>): Promise<MajorCourse | undefined> {
    return await this.majorCourseRepo.findOne({ where: { id }, select });
  }


  /**
   * 根据用户查询多个专业康复课程
   * @param user_id user_id
   * @param select select conditions
   * @param created_at created_at
   */
  public async findManyByUserId(user_id: string, created_at: FindOptionsOrderValue, select?: FindOptionsSelect<MajorCourse>): Promise<MajorCourse[]> {
    return await this.majorCourseRepo.find({
      where: { user_id },
      order: { created_at },
      select
    });
  }

  /**
   * 查询所有专业康复课程
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<MajorCourse>): Promise<MajorCourse[] | undefined> {
    return await this.majorCourseRepo.find({
      where: { status: 1 },
      order: { created_at: "desc" },
      select
    });
  }

}
