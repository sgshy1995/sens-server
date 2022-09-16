import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect, FindOptionsWhere, Like, getRepository, Between, MoreThan } from "typeorm";
import { CourseInVideo } from "../../db/entities/CourseInVideo";
import { PaginationQuery, ResponsePaginationResult, ResponseResult } from "../../types/result.interface";
import { VideoCourseService } from "../video_course/video.course.service";

@Injectable()
export class CourseInVideoService {
  constructor(
    @InjectRepository(CourseInVideo) private readonly courseInVideoRepo: Repository<CourseInVideo>,
    @Inject(forwardRef(() => VideoCourseService))
    private readonly videoCourseService: VideoCourseService
  ) {
  }

  /**
   * 创建视频
   * @param courseInVideo courseInVideo 实体对象
   */
  async createCourseInVideo(courseInVideo: CourseInVideo): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    // 插入数据时，删除 id，以避免请求体内传入 id
    courseInVideo.id !== null && courseInVideo.id !== undefined && delete courseInVideo.id;
    // 校验视频课
    const videoCourseFind = await this.videoCourseService.findOneById(courseInVideo.course_id);
    if (!videoCourseFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "视频课程主体无效"
      };
    }
    // 发布时间
    courseInVideo.publish_time = courseInVideo.status === 0 ? null : new Date();
    await this.courseInVideoRepo.save(courseInVideo);
    // 如果上线 更新视频数 +1
    if(courseInVideo.status) {
      videoCourseFind.video_num += 1;
      await this.videoCourseService.updateVideoCourse(videoCourseFind);
    }
    return responseBody;
  }

  /**
   * 更新
   *
   * @param courseInVideo courseInVideo 实体对象
   */
  async updateCourseInVideo(courseInVideo: CourseInVideo): Promise<ResponseResult> {
    // 校验视频课
    const videoCourseFind = await this.videoCourseService.findOneById(courseInVideo.course_id);
    if (!videoCourseFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "视频课程主体无效"
      };
    }
    const courseInVideoFind = await this.courseInVideoRepo.findOne({ where: { id: courseInVideo.id } });
    if (courseInVideoFind.status === 0 && courseInVideo.status === 1) {
      // 发布
      courseInVideo.publish_time = new Date();
      // 视频数加一
      videoCourseFind.video_num += 1;
    } else if (courseInVideoFind.status === 1 && courseInVideo.status === 0) {
      // 下线 视频数减一，如果已经为0，则自动下架
      videoCourseFind.video_num -= 1;
      if (videoCourseFind.video_num === 0) {
        videoCourseFind.status = 0;
      }
      await this.videoCourseService.updateVideoCourse(videoCourseFind);
    }
    const courseInVideoUpdate = Object.assign(courseInVideoFind, courseInVideo);
    await this.courseInVideoRepo.update(courseInVideoUpdate.id, courseInVideoUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 根据 ids 批量更新状态
   * @param ids ids
   * @param course_id course_id
   * @param status status
   * @param select select conditions
   */
  public async updateManyStatusByIds(ids: string[], course_id: string, status: number, select?: FindOptionsSelect<CourseInVideo>): Promise<ResponseResult> {
    const courseInVideosFind = await getRepository(CourseInVideo)
      .createQueryBuilder("courseInVideo")
      .select()
      .where("courseInVideo.id IN (:...ids)", { ids })
      .orderBy("courseInVideo.updated_at", "DESC")
      .getMany();
    // 校验所有的视频的课程id是否一致且正确
    const errorOneFind = courseInVideosFind.find(item => item.course_id !== course_id);
    if (!errorOneFind) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "视频课程主体id不一致"
      };
    }
    // 校验视频课
    const videoCourseFind = await this.videoCourseService.findOneById(course_id);
    if (!videoCourseFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "视频课程主体无效"
      };
    }
    for (let i = 0; i < courseInVideosFind.length; i++) {
      if (courseInVideosFind[i].status === 0 && status === 1) {
        // 发布
        courseInVideosFind[i].publish_time = new Date();
      } else if (courseInVideosFind[i].status === 1 && status === 0) {
        // 下线
        courseInVideosFind[i].publish_time = null;
      }
      courseInVideosFind[i].status = status;
      await this.courseInVideoRepo.update(courseInVideosFind[i].id, courseInVideosFind[i]);
    }
    // 视频数变化 若为0则自动下架
    status ? videoCourseFind.video_num += courseInVideosFind.length : videoCourseFind.video_num -= courseInVideosFind.length;
    if (videoCourseFind.video_num === 0) {
      videoCourseFind.status = 0;
    }
    await this.videoCourseService.updateVideoCourse(videoCourseFind);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 查询所有的课程
   */
  async findAllCourseInVideos(): Promise<ResponseResult> {
    const courseInVideosFind = await this.findAll({
      id: true,
      course_id: true,
      title: true,
      cover: true,
      description: true,
      source: true,
      sort: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: courseInVideosFind
    };
  }

  /**
   * 查询多个视频
   * @param custom custom find options
   * @param query custom find query
   */

  async findManyCourseInVideos(custom: FindOptionsWhere<CourseInVideo>, query: PaginationQuery): Promise<ResponsePaginationResult> {
    const [courseInVideosFind, totalCount] = await this.findMany(custom, query, {
      id: true,
      course_id: true,
      title: true,
      cover: true,
      description: true,
      source: true,
      sort: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: {
        data: courseInVideosFind,
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
  async findOneCourseInVideoById(id: string): Promise<ResponseResult> {
    const CourseInVideoFind = await this.findOneById(id, {
      id: true,
      course_id: true,
      title: true,
      cover: true,
      description: true,
      source: true,
      sort: true,
      publish_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return CourseInVideoFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: CourseInVideoFind
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
  public async findOneById(id: string, select?: FindOptionsSelect<CourseInVideo>): Promise<CourseInVideo | undefined> {
    return await this.courseInVideoRepo.findOne({ where: { id }, select });
  }

  /**
   * 查询多个视频
   * @param custom custom find conditions
   * @param query custom find query
   * @param select select conditions
   */
  public async findMany(custom: FindOptionsWhere<CourseInVideo>, query: PaginationQuery, select?: FindOptionsSelect<CourseInVideo>): Promise<[CourseInVideo[], number]> {
    const take = query.pageSize || 8;
    const page = query.pageNo || 1;
    const skip = (page - 1) * take;
    if (custom.title) {
      custom.title = Like(`%${custom.title}%`);
    }
    return await this.courseInVideoRepo.findAndCount({
      where: {
        ...custom
      },
      order: { updated_at: "desc" },
      take,
      skip,
      select
    });
  }

  /**
   * 查询所有视频
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<CourseInVideo>): Promise<CourseInVideo[] | undefined> {
    return await this.courseInVideoRepo.find({
      where: { status: 1 },
      order: { updated_at: "asc" },
      select
    });
  }

}
