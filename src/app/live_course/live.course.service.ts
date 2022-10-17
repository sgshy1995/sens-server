import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  FindOptionsSelect,
  FindOptionsWhere,
  Like,
  getRepository,
  Between,
  MoreThan,
  getManager, Brackets, In
} from "typeorm";
import { LiveCourse } from "../../db/entities/LiveCourse";
import { PaginationQuery, ResponsePaginationResult, ResponseResult } from "../../types/result.interface";
import { VideoCourseService } from "../video_course/video.course.service";
import { CourseChartService } from "../course_chart/course.chart.service";
import { CourseOrderService } from "../course_order/course.order.service";

type CustomQuery = {
  frequency_num_order?: "desc" | "asc"
  live_num_range?: string | null
  price_range?: string | null
  keyword?: string
}

@Injectable()
export class LiveCourseService {
  constructor(
    @InjectRepository(LiveCourse) private readonly liveCourseRepo: Repository<LiveCourse>,
    @Inject(forwardRef(() => VideoCourseService))
    private readonly videoCourseService: VideoCourseService,
    @Inject(forwardRef(() => CourseChartService))
    private readonly courseChartService: CourseChartService,
    @Inject(forwardRef(() => CourseOrderService))
    private readonly courseOrderService: CourseOrderService
  ) {
  }

  /**
   * 创建直播课
   * @param liveCourse liveCourse 实体对象
   */
  async createLiveCourse(liveCourse: LiveCourse): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    // 插入数据时，删除 id，以避免请求体内传入 id
    liveCourse.id !== null && liveCourse.id !== undefined && delete liveCourse.id;
    // 购买人数
    liveCourse.frequency_num = 0;
    // 折扣期限
    liveCourse.discount_validity = liveCourse.discount_validity ? new Date(liveCourse.discount_validity) : null;
    // 发布时间
    liveCourse.publish_time = liveCourse.status === 0 ? null : new Date();
    await this.liveCourseRepo.save(liveCourse);
    return responseBody;
  }

  /**
   * 更新
   *
   * @param liveCourse liveCourse 实体对象
   */
  async updateLiveCourse(liveCourse: LiveCourse): Promise<ResponseResult> {
    const liveCourseFind = await this.liveCourseRepo.findOne({ where: { id: liveCourse.id } });
    if (liveCourseFind.status === 0 && liveCourse.status === 1) {
      // 发布
      liveCourse.publish_time = new Date();
    }
    if (liveCourseFind.is_discount === 0 && liveCourse.is_discount === 1) {
      // 折扣
      liveCourse.discount_validity = liveCourse.discount_validity ? new Date(liveCourse.discount_validity) : null;
    } else if (liveCourseFind.is_discount === 1 && liveCourse.is_discount === 0) {
      // 取消折扣
      liveCourse.discount_validity = null;
    }
    const liveCourseUpdate = Object.assign(liveCourseFind, liveCourse);
    await this.liveCourseRepo.update(liveCourseUpdate.id, liveCourseUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 更新购买人数
   *
   * @param id id
   */
  async addLiveCourseFrequencyNum(id: string): Promise<ResponseResult> {
    const liveCourseFind = await this.liveCourseRepo.findOne({ where: { id } });
    liveCourseFind.frequency_num += 1;
    await this.liveCourseRepo.update(liveCourseFind.id, liveCourseFind);
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
  public async updateManyStatusByIds(ids: string[], status: number, select?: FindOptionsSelect<LiveCourse>): Promise<ResponseResult> {
    const liveCoursesFind = await getRepository(LiveCourse)
      .createQueryBuilder("liveCourse")
      .select()
      .where("liveCourse.id IN (:...ids)", { ids })
      .orderBy("liveCourse.updated_at", "DESC")
      .getMany();
    for (let i = 0; i < liveCoursesFind.length; i++) {
      if (liveCoursesFind[i].status === 0 && status === 1) {
        // 发布
        liveCoursesFind[i].publish_time = new Date();
      }
      liveCoursesFind[i].status = status;
      await this.liveCourseRepo.update(liveCoursesFind[i].id, liveCoursesFind[i]);
    }
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 查询轮播课程
   */
  async findCarousel(): Promise<LiveCourse[]> {
    return await this.liveCourseRepo.find({
      where: { status: 1, carousel: 1 },
      order: { updated_at: "desc" },
      select: {
        id: true,
        title: true,
        cover: true,
        description: true,
        course_type: true,
        live_num: true,
        frequency_num: true,
        price: true,
        is_discount: true,
        discount: true,
        discount_validity: true,
        carousel: true,
        publish_time: true,
        status: true,
        created_at: true,
        updated_at: true
      }
    });
  }

  /**
   * 查询所有的课程
   */
  async findAllLiveCourses(): Promise<ResponseResult> {
    const liveCoursesFind = await this.findAll({
      id: true,
      title: true,
      cover: true,
      description: true,
      course_type: true,
      live_num: true,
      frequency_num: true,
      price: true,
      is_discount: true,
      discount: true,
      discount_validity: true,
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
   * 查询多个视频课
   * @param custom custom find options
   * @param query custom find query
   * @param custom_query custom_query
   * @param hot_sort hot_sort
   */

  async findManyLiveCourses(custom: FindOptionsWhere<LiveCourse>, query: PaginationQuery, custom_query?: CustomQuery, hot_sort: boolean = false): Promise<ResponsePaginationResult> {
    const [liveCoursesFind, totalCount] = await this.findMany(custom, query, custom_query, hot_sort, {
      id: true,
      title: true,
      cover: true,
      description: true,
      course_type: true,
      live_num: true,
      frequency_num: true,
      price: true,
      is_discount: true,
      discount: true,
      discount_validity: true,
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
        data: liveCoursesFind,
        pageSize: query.pageSize,
        pageNo: query.pageNo,
        totalCount: totalCount,
        totalPage: Math.ceil(totalCount / query.pageSize)
      }
    };
  }

  /**
   * 查询多个id查询多个直播课
   * @param ids ids id集合
   */
  async findManyLiveCoursesByIds(ids: string): Promise<ResponseResult> {
    const liveCoursesFind = await this.findManyByIds(ids, {
      id: true,
      title: true,
      cover: true,
      description: true,
      course_type: true,
      live_num: true,
      frequency_num: true,
      price: true,
      is_discount: true,
      discount: true,
      discount_validity: true,
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
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneLiveCourseById(id: string): Promise<ResponseResult> {
    const liveCourseFind = await this.findOneById(id, {
      id: true,
      title: true,
      cover: true,
      description: true,
      course_type: true,
      live_num: true,
      frequency_num: true,
      price: true,
      is_discount: true,
      discount: true,
      discount_validity: true,
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
  public async findOneById(id: string, select?: FindOptionsSelect<LiveCourse>): Promise<LiveCourse | undefined> {
    return await this.liveCourseRepo.findOne({ where: { id }, select });
  }

  /**
   * 查询多个视频课
   * @param custom custom find conditions
   * @param query custom find query
   * @param custom_query custom_query
   * @param hot_order hot_order
   * @param select select conditions
   */
  public async findMany(custom: FindOptionsWhere<LiveCourse>, query: PaginationQuery, custom_query?: CustomQuery, hot_order?: boolean, select?: FindOptionsSelect<LiveCourse>): Promise<[LiveCourse[], number]> {
    const take = query.pageSize || 8;
    const page = query.pageNo || 1;
    const skip = (page - 1) * take;
    const custom_query_in: CustomQuery = custom_query ? { ...custom_query } : {};
    if (custom.title) {
      custom.title = Like(`%${custom.title}%`);
    }
    // 直播次数映射表
    const watch_num_map = {
      "0": [1, 2],
      "1": [3, 5],
      "2": [6, 10],
      "3": [11, 20],
      "4": 20
    };
    // 售价范围映射表
    const price_map = {
      "0": [0, 100],
      "1": [100, 500],
      "2": [500, 1000],
      "3": [1000, 3000],
      "4": [3000, 10000],
      "5": 10000
    };
    if (custom_query_in.keyword){
      custom.hasOwnProperty('description') && delete custom.description
      custom.hasOwnProperty('title') && delete custom.title
    }
    const customIn = {
      ...custom,
      live_num: ["0", "1", "2", "3"].includes(custom_query_in.live_num_range) ?
        Between.apply(null, watch_num_map[custom_query_in.live_num_range]) :
        custom_query_in.live_num_range === "4" ? MoreThan(watch_num_map["4"]) : custom.live_num,
      price: ["0", "1", "2", "3", "4"].includes(custom_query_in.price_range) ?
        Between.apply(null, price_map[custom_query_in.price_range]) :
        custom_query_in.price_range === "5" ? MoreThan(price_map["5"]) : custom.price
    }
    Object.keys(customIn).map(key=>{
      if (customIn[key] === undefined) delete customIn[key]
    })
    /*const prescriptions = await this.liveCourseRepo.findAndCount({
      where: {
        ...custom,
        live_num: ["0", "1", "2", "3"].includes(custom_query_in.live_num_range) ?
          Between.apply(null, watch_num_map[custom_query_in.live_num_range]) :
          custom_query_in.live_num_range === "4" ? MoreThan(watch_num_map["4"]) : custom.live_num,
        price: ["0", "1", "2", "3", "4"].includes(custom_query_in.price_range) ?
          Between.apply(null, price_map[custom_query_in.price_range]) :
          custom_query_in.price_range === "5" ? MoreThan(price_map["5"]) : custom.price
      },
      order: { updated_at: "desc" },
      take,
      skip,
      select
    });*/
    const liveCourses = await getManager().createQueryBuilder(LiveCourse, 'live_course')
      .groupBy('live_course.id')
      .select(Object.keys(select).map(key=>`live_course.${key}`))
      .where(customIn)
      .andWhere(new Brackets(qb => {
        qb.where('live_course.description LIKE :description', { description: `%${custom_query_in.keyword || ''}%` })
          .orWhere('live_course.title LIKE :title', { title: `%${custom_query_in.keyword || ''}%` })
      }))
      .orderBy("live_course.updated_at", "DESC")
      .take(take)
      .skip(skip)
      .getManyAndCount();
    if (hot_order || custom_query_in.frequency_num_order === "desc") {
      liveCourses[0] = liveCourses[0].sort((a, b) => b.frequency_num - a.frequency_num);
    } else if (custom_query_in.frequency_num_order === "asc") {
      liveCourses[0] = liveCourses[0].sort((a, b) => a.frequency_num - b.frequency_num);
    }
    return liveCourses;
  }

  /**
   * 查询多个id的直播课
   * @param ids id集合
   * @param select select conditions
   */
  public async findManyByIds(ids: string, select?: FindOptionsSelect<LiveCourse>): Promise<LiveCourse[] | undefined> {
    const ids_list = ids.split(',')
    return await this.liveCourseRepo.find({
      where: { status: 1, id: In(ids_list) },
      order: { updated_at: "asc" },
      select
    });
  }

  /**
   * 查询所有直播课
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<LiveCourse>): Promise<LiveCourse[] | undefined> {
    return await this.liveCourseRepo.find({
      where: { status: 1 },
      order: { updated_at: "asc" },
      select
    });
  }

}
