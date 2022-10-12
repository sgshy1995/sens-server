import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect, FindOptionsWhere, Like, getRepository, Between, MoreThan, In } from "typeorm";
import { CourseChart } from "../../db/entities/CourseChart";
import { PaginationQuery, ResponsePaginationResult, ResponseResult } from "../../types/result.interface";
import { VideoCourseService } from "../video_course/video.course.service";
import { LiveCourseService } from "../live_course/live.course.service";

@Injectable()
export class CourseChartService {
  constructor(
    @InjectRepository(CourseChart) private readonly courseChartRepo: Repository<CourseChart>,
    @Inject(forwardRef(() => VideoCourseService))
    private readonly videoCourseService: VideoCourseService,
    @Inject(forwardRef(() => LiveCourseService))
    private readonly liveCourseService: LiveCourseService
  ) {
  }

  /**
   * 添加购物车
   * @param courseChart courseChart 实体对象
   */
  async createCourseChart(courseChart: CourseChart): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    // 插入数据时，删除 id，以避免请求体内传入 id
    courseChart.id !== null && courseChart.id !== undefined && delete courseChart.id;
    // 校验数据是否已存在
    const courseChartHistoryFind = await this.courseChartRepo.findOne({
      where: {
        user_id: courseChart.user_id,
        course_id: courseChart.course_id,
        status: 1
      }
    });
    if (courseChartHistoryFind) {
      return {
        code: HttpStatus.CONFLICT,
        message: "该课程已在购物车中，请勿重复添加"
      };
    } else {
      const userReadyCreateList = await this.courseChartRepo.find({ where: { user_id: courseChart.user_id } });
      if (userReadyCreateList.length > 20) {
        return {
          code: HttpStatus.CONFLICT,
          message: "购物车最多放二十个课程~"
        };
      }
      courseChart.add_num = 1;
      courseChart.status = 1;
      await this.courseChartRepo.save(courseChart);
    }
    return responseBody;
  }

  /**
   * 更新
   *
   * @param courseChart courseChart 实体对象
   */
  async updateCourseChart(courseChart: CourseChart): Promise<ResponseResult> {
    const courseChartFind = await this.courseChartRepo.findOne({ where: { id: courseChart.id } });
    if (!courseChartFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "数据主体不存在"
      };
    }
    const courseChartUpdate = Object.assign(courseChartFind, courseChart);
    await this.courseChartRepo.save(courseChartUpdate);
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
  async deleteCourseChart(id: string): Promise<ResponseResult> {
    const courseChartFind = await this.courseChartRepo.findOne({ where: { id } });
    if (!courseChartFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "数据主体不存在"
      };
    }
    await this.courseChartRepo.remove(courseChartFind);
    return {
      code: HttpStatus.OK,
      message: "删除成功"
    };
  }

  /**
   * 删除
   *
   * @param ids ids 数据id集合
   */
  async deleteCourseChartIds(ids: string): Promise<ResponseResult> {
    const ids_list = ids.split(",");
    const courseChartsFind = await this.courseChartRepo.find({ where: { id: In(ids_list) } });
    await this.courseChartRepo.remove(courseChartsFind);
    return {
      code: HttpStatus.OK,
      message: "删除成功"
    };
  }

  /**
   * 删除多个
   *
   * @param user_id user_id 用户id
   */
  async deleteCourseCharts(user_id: string): Promise<ResponseResult> {
    const courseChartsFind = await this.courseChartRepo.find({ where: { user_id } });
    await this.courseChartRepo.remove(courseChartsFind);
    return {
      code: HttpStatus.OK,
      message: "删除成功"
    };
  }

  /**
   * 根据用户id，查询多个购物车信息
   * @param user_id user_id
   */
  async findManyCourseChartsByUserId(user_id: string): Promise<ResponseResult> {
    const courseChartsFind = await this.findManyByUserId(user_id, {
      id: true,
      user_id: true,
      course_id: true,
      add_course_type: true,
      add_num: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    for (let i = 0; i < courseChartsFind.length; i++) {
      const courseFind = courseChartsFind[i].add_course_type === 1 ? await this.liveCourseService.findOneById(courseChartsFind[i].course_id) : await this.videoCourseService.findOneById(courseChartsFind[i].course_id);
      Object.defineProperty(courseChartsFind[i], "course_info", {
        value: courseFind,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: courseChartsFind
    };
  }

  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneCourseChartById(id: string): Promise<ResponseResult> {
    const courseChartFind = await this.findOneById(id, {
      id: true,
      user_id: true,
      course_id: true,
      add_course_type: true,
      add_num: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return courseChartFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: courseChartFind
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
  public async findOneById(id: string, select?: FindOptionsSelect<CourseChart>): Promise<CourseChart | undefined> {
    return await this.courseChartRepo.findOne({ where: { id }, select });
  }

  /**
   * 根据用户id，查询多个购物车
   * @param user_id user_id
   * @param select select conditions
   */
  public async findManyByUserId(user_id: string, select?: FindOptionsSelect<CourseChart>): Promise<CourseChart[]> {
    return await this.courseChartRepo.find({
      where: {
        user_id,
        status: 1
      },
      order: { updated_at: "desc" },
      select
    });
  }

}
