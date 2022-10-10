import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect } from "typeorm";
import { CourseOrder } from "../../db/entities/CourseOrder";
import { LiveCourse } from "../../db/entities/LiveCourse";
import { VideoCourse } from "../../db/entities/VideoCourse";
import { ResponseResult } from "../../types/result.interface";
import { VideoCourseService } from "../video_course/video.course.service";
import { LiveCourseService } from "../live_course/live.course.service";
import { UserInfoService } from "../user_info/user.info.service";
import moment = require("moment");
import Chance = require("chance");

const chance = new Chance();

@Injectable()
export class CourseOrderService {
  constructor(
    @InjectRepository(CourseOrder) private readonly courseOrderRepo: Repository<CourseOrder>,
    @Inject(forwardRef(() => VideoCourseService))
    private readonly videoCourseService: VideoCourseService,
    @Inject(forwardRef(() => LiveCourseService))
    private readonly liveCourseService: LiveCourseService,
    @Inject(forwardRef(() => UserInfoService))
    private readonly userInfoService: UserInfoService
  ) {
  }

  /**
   * 购买——创建订单
   * @param courseOrder courseOrder 实体对象
   */
  async createCourseOrder(courseOrder: CourseOrder): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    // 校验课程数据是否已存在或已下架
    const course_ids = courseOrder.course_ids.split(",");
    const course_types = courseOrder.course_types.split(",");
    const courses: (LiveCourse | VideoCourse)[] = [];
    let not_found = false;
    let total = 0;
    for (let i = 0; i < course_ids.length; i++) {
      const courseFind = course_types[i] === "1" ? await this.liveCourseService.findOneById(course_ids[i]) : await this.videoCourseService.findOneById(course_ids[i]);
      // 如果课程不存在，标记错误
      if (!courseFind) {
        not_found = true;
      } else {
        courses.push(courseFind);
        total += courseFind.is_discount ? Number(courseFind.discount) : Number(courseFind.price);
      }
    }
    if (not_found) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "所选课程有不存在数据，请重试"
      };
    } else if (courses.find(course => !course.status)) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "所选课程存在已下架，无法购买，请重试"
      };
    } else if (total.toString() !== courseOrder.payment_num) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "价格不一致或发生变化，请重试"
      };
    }
    // 校验用户余额是否充足
    const userInfo = await this.userInfoService.findOneByUserId(courseOrder.user_id);
    if (courseOrder.payment_type === 0) {
      if (userInfo.balance < courseOrder.payment_num) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: "用户余额不足，请充值后再试"
        };
      }
    }
    // 购买价格集合
    courseOrder.order_prices = courses.map(item => item.is_discount ? item.discount : item.price).join();
    // 插入数据时，删除 id，以避免请求体内传入 id
    courseOrder.id !== null && courseOrder.id !== undefined && delete courseOrder.id;
    // 订单号
    courseOrder.order_no = "218304" + moment(new Date(courseOrder.order_time), "YYYYMMDDHHmmss").format("YYYYMMDDHHmmss") + chance.integer({
      min: 22222222,
      max: 99999999
    }).toString();
    // 支付流水号
    courseOrder.payment_time = new Date();
    courseOrder.payment_no = "618124" + moment(new Date(courseOrder.payment_time), "YYYYMMDDHHmmss").format("YYYYMMDDHHmmss") + chance.integer({
      min: 222222222222,
      max: 999999999999
    }).toString();
    // 状态
    courseOrder.status = 2;
    // 保存
    await this.courseOrderRepo.save(courseOrder);
    // 扣款
    userInfo.balance = (Number(userInfo.balance) - Number(courseOrder.payment_num)).toString();
    await this.userInfoService.updateInfoByUserId(courseOrder.user_id, userInfo);
    // 返回结果
    return responseBody;
  }

  /**
   * 更新
   *
   * @param courseOrder courseOrder 实体对象
   */
  async updateCourseOrder(courseOrder: CourseOrder): Promise<ResponseResult> {
    const courseOrderFind = await this.courseOrderRepo.findOne({ where: { id: courseOrder.id } });
    if (!courseOrderFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "数据主体不存在"
      };
    }
    const courseOrderUpdate = Object.assign(courseOrderFind, courseOrder);
    await this.courseOrderRepo.save(courseOrderUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 根据用户id，查询多个订单信息
   * @param user_id user_id
   */
  async findManyCourseOrdersByUserId(user_id: string): Promise<ResponseResult> {
    const courseOrdersFind = await this.findManyByUserId(user_id, {
      id: true,
      user_id: true,
      course_ids: true,
      course_types: true,
      order_prices: true,
      order_no: true,
      order_time: true,
      payment_no: true,
      payment_type: true,
      payment_time: true,
      payment_num: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    // TODO 双层 for 循环，如果缓慢考虑后期优化
    for (let i = 0; i < courseOrdersFind.length; i++) {
      const course_ids = courseOrdersFind[i].course_ids.split(",");
      const course_types = courseOrdersFind[i].course_types.split(",");
      const courses: (LiveCourse | VideoCourse)[] = [];
      for (let j = 0; j < course_ids.length; j++) {
        const courseFind = course_types[j] === "1" ? await this.liveCourseService.findOneById(course_ids[j]) : await this.videoCourseService.findOneById(course_ids[j]);
        courses.push(courseFind);
      }
      Object.defineProperty(courseOrdersFind[i], "courses_info", {
        value: courses,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: courseOrdersFind
    };
  }

  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneCourseOrderById(id: string): Promise<ResponseResult> {
    const courseOrderFind = await this.findOneById(id, {
      id: true,
      user_id: true,
      course_ids: true,
      course_types: true,
      order_prices: true,
      order_no: true,
      order_time: true,
      payment_no: true,
      payment_type: true,
      payment_time: true,
      payment_num: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return courseOrderFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: courseOrderFind
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
  public async findOneById(id: string, select?: FindOptionsSelect<CourseOrder>): Promise<CourseOrder | undefined> {
    return await this.courseOrderRepo.findOne({ where: { id }, select });
  }

  /**
   * 根据用户id，查询多个订单
   * @param user_id user_id
   * @param select select conditions
   */
  public async findManyByUserId(user_id: string, select?: FindOptionsSelect<CourseOrder>): Promise<CourseOrder[]> {
    return await this.courseOrderRepo.find({
      where: {
        user_id,
        status: 2
      },
      order: { updated_at: "desc" },
      select
    });
  }

}
