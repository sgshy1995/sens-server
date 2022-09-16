import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect, FindOptionsWhere, Like, getRepository, Between, MoreThan } from "typeorm";
import { VideoCourse } from "../../db/entities/VideoCourse";
import { PaginationQuery, ResponsePaginationResult, ResponseResult } from "../../types/result.interface";
import { CourseInVideoService } from "../course_in_video/course.in.video.service";

type CustomQuery = {
  frequency_num_order?: "desc" | "asc"
  video_num_range?: string | null
  price_range?: string | null
}

@Injectable()
export class VideoCourseService {
  constructor(
    @InjectRepository(VideoCourse) private readonly videoCourseRepo: Repository<VideoCourse>,
    @Inject(forwardRef(() => CourseInVideoService))
    private readonly courseInVideoService: CourseInVideoService
  ) {
  }

  /**
   * 创建视频课
   * @param videoCourse videoCourse 实体对象
   */
  async createVideoCourse(videoCourse: VideoCourse): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    // 插入数据时，删除 id，以避免请求体内传入 id
    videoCourse.id !== null && videoCourse.id !== undefined && delete videoCourse.id;
    // 购买人数
    videoCourse.frequency_num = 0;
    // 视频数
    videoCourse.video_num = 0;
    // 折扣期限
    videoCourse.discount_validity = videoCourse.discount_validity ? new Date(videoCourse.discount_validity) : null;
    // 发布时间
    videoCourse.publish_time = videoCourse.status === 0 ? null : new Date();
    // 状态
    videoCourse.status = 0;
    await this.videoCourseRepo.save(videoCourse);
    return responseBody;
  }

  /**
   * 更新
   *
   * @param videoCourse videoCourse 实体对象
   */
  async updateVideoCourse(videoCourse: VideoCourse): Promise<ResponseResult> {
    const videoCourseFind = await this.videoCourseRepo.findOne({ where: { id: videoCourse.id } });
    if (videoCourseFind.status === 0 && videoCourse.status === 1) {
      // 发布
      videoCourse.publish_time = new Date();
    }
    if (videoCourseFind.is_discount === 0 && videoCourse.is_discount === 1) {
      // 折扣
      videoCourse.discount_validity = videoCourse.discount_validity ? new Date(videoCourse.discount_validity) : null;
    } else if (videoCourseFind.is_discount === 1 && videoCourse.is_discount === 0) {
      // 取消折扣
      videoCourse.discount_validity = null;
    }
    const videoCourseUpdate = Object.assign(videoCourseFind, videoCourse);
    await this.videoCourseRepo.update(videoCourseUpdate.id, videoCourseUpdate);
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
  async addVideoCourseFrequencyNum(id: string): Promise<ResponseResult> {
    const videoCourseFind = await this.videoCourseRepo.findOne({ where: { id } });
    videoCourseFind.frequency_num += 1;
    await this.videoCourseRepo.update(videoCourseFind.id, videoCourseFind);
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
  public async updateManyStatusByIds(ids: string[], status: number, select?: FindOptionsSelect<VideoCourse>): Promise<ResponseResult> {
    const videoCoursesFind = await getRepository(VideoCourse)
      .createQueryBuilder("videoCourse")
      .select()
      .where("videoCourse.id IN (:...ids)", { ids })
      .orderBy("videoCourse.updated_at", "DESC")
      .getMany();
    for (let i = 0; i < videoCoursesFind.length; i++) {
      if (videoCoursesFind[i].status === 0 && status === 1) {
        // 发布
        videoCoursesFind[i].publish_time = new Date();
      }
      videoCoursesFind[i].status = status;
      await this.videoCourseRepo.update(videoCoursesFind[i].id, videoCoursesFind[i]);
    }
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 查询所有的课程
   */
  async findAllVideoCourses(): Promise<ResponseResult> {
    const videoCoursesFind = await this.findAll({
      id: true,
      title: true,
      cover: true,
      description: true,
      course_type: true,
      video_num: true,
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
      data: videoCoursesFind
    };
  }

  /**
   * 查询多个视频课
   * @param custom custom find options
   * @param query custom find query
   * @param custom_query custom_query
   * @param hot_sort hot_sort
   */

  async findManyVideoCourses(custom: FindOptionsWhere<VideoCourse>, query: PaginationQuery, custom_query?: CustomQuery, hot_sort: boolean = false): Promise<ResponsePaginationResult> {
    const [videoCoursesFind, totalCount] = await this.findMany(custom, query, custom_query, hot_sort, {
      id: true,
      title: true,
      cover: true,
      description: true,
      course_type: true,
      video_num: true,
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
        data: videoCoursesFind,
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
  async findOneVideoCourseById(id: string): Promise<ResponseResult> {
    const videoCourseFind = await this.findOneById(id, {
      id: true,
      title: true,
      cover: true,
      description: true,
      course_type: true,
      video_num: true,
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
    return videoCourseFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: videoCourseFind
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
  public async findOneById(id: string, select?: FindOptionsSelect<VideoCourse>): Promise<VideoCourse | undefined> {
    return await this.videoCourseRepo.findOne({ where: { id }, select });
  }

  /**
   * 查询多个视频课
   * @param custom custom find conditions
   * @param query custom find query
   * @param custom_query custom_query
   * @param hot_order hot_order
   * @param select select conditions
   */
  public async findMany(custom: FindOptionsWhere<VideoCourse>, query: PaginationQuery, custom_query?: CustomQuery, hot_order?: boolean, select?: FindOptionsSelect<VideoCourse>): Promise<[VideoCourse[], number]> {
    const take = query.pageSize || 8;
    const page = query.pageNo || 1;
    const skip = (page - 1) * take;
    const custom_query_in: CustomQuery = custom_query ? { ...custom_query } : {};
    if (custom.title) {
      custom.title = Like(`%${custom.title}%`);
    }
    // 视频数映射表
    const video_num_map = {
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
    const prescriptions = await this.videoCourseRepo.findAndCount({
      where: {
        ...custom,
        video_num: ["0", "1", "2", "3"].includes(custom_query_in.video_num_range) ?
          Between.apply(null, video_num_map[custom_query_in.video_num_range]) :
          custom_query_in.video_num_range === "4" ? MoreThan(video_num_map["4"]) : custom.video_num,
        price: ["0", "1", "2", "3", "4"].includes(custom_query_in.price_range) ?
          Between.apply(null, price_map[custom_query_in.price_range]) :
          custom_query_in.price_range === "5" ? MoreThan(price_map["5"]) : custom.price
      },
      order: { updated_at: "desc" },
      take,
      skip,
      select
    });
    if (hot_order || custom_query_in.frequency_num_order === "desc") {
      prescriptions[0] = prescriptions[0].sort((a, b) => b.frequency_num - a.frequency_num);
    } else if (custom_query_in.frequency_num_order === "asc") {
      prescriptions[0] = prescriptions[0].sort((a, b) => a.frequency_num - b.frequency_num);
    }
    return prescriptions;
  }

  /**
   * 查询所有视频课
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<VideoCourse>): Promise<VideoCourse[] | undefined> {
    return await this.videoCourseRepo.find({
      where: { status: 1 },
      order: { updated_at: "asc" },
      select
    });
  }

}
