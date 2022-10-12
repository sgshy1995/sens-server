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
   * 多个购买——创建订单
   * @param user_id 用户id
   * @param course_ids_str 课程id集合
   * @param course_types_str 课程类型集合
   * @param payment_num 支付金额
   * @param payment_type 支付方式
   * @param order_time 下单时间
   */
  async createCourseOrders(user_id, course_ids_str: string, course_types_str: string, payment_num: string, payment_type: number, order_time: string): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    // 校验课程数据是否已存在或已下架
    const course_ids = course_ids_str.split(",");
    const course_types = course_types_str.split(",").map(type => Number(type));
    const courses: (LiveCourse | VideoCourse)[] = [];
    let not_found = false;
    let total = 0;
    for (let i = 0; i < course_ids.length; i++) {
      const courseFind = course_types[i] === 1 ? await this.liveCourseService.findOneById(course_ids[i]) : await this.videoCourseService.findOneById(course_ids[i]);
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
    } else if (total.toString() !== payment_num) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "价格不一致或发生变化，请重试"
      };
    }
    // 校验用户余额是否充足
    const userInfo = await this.userInfoService.findOneByUserId(user_id);
    if (payment_type === 0) {
      if (userInfo.balance < payment_num) {
        return {
          code: HttpStatus.BAD_REQUEST,
          message: "用户余额不足，请充值后再试"
        };
      }
    }
    // 创建订单
    // 订单号
    const order_no = "218304" + moment(new Date(order_time), "YYYYMMDDHHmmss").format("YYYYMMDDHHmmss") + chance.integer({
      min: 22222222,
      max: 99999999
    }).toString();
    // 支付流水号
    const payment_time = new Date();
    const payment_no = "618124" + moment(new Date(payment_time), "YYYYMMDDHHmmss").format("YYYYMMDDHHmmss") + chance.integer({
      min: 222222222222,
      max: 999999999999
    }).toString();
    const courseOrdersList: CourseOrder[] = [];
    course_ids.forEach((id, index) => {
      const courseOrder = new CourseOrder();
      // 插入数据时，删除 id，以避免请求体内传入 id
      courseOrder.id !== null && courseOrder.id !== undefined && delete courseOrder.id;
      // 用户id
      courseOrder.user_id = user_id;
      courseOrder.course_id = id;
      courseOrder.course_type = course_types[index];
      courseOrder.payment_num = payment_num;
      courseOrder.order_time = new Date(order_time);
      // 支付类型
      courseOrder.payment_type = payment_type;
      courseOrder.order_price = courses[index].is_discount ? courses[index].discount : courses[index].price;
      // 订单号
      courseOrder.order_no = order_no;
      // 支付时间
      courseOrder.payment_time = payment_time;
      // 支付流水号
      courseOrder.payment_no = payment_no;
      // 状态
      courseOrder.status = 2;
      // 购买排序
      courseOrder.order_sort = index;
      // 购买总数
      courseOrder.order_total = course_ids.length;
      // 放入列表
      courseOrdersList.push(courseOrder);
    });
    // 保存
    await this.courseOrderRepo.save(courseOrdersList);
    // 扣款
    if (payment_type === 0) {
      userInfo.balance = (Number(userInfo.balance) - Number(payment_num)).toString();
      await this.userInfoService.updateInfoByUserId(user_id, userInfo);
    }
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
      course_id: true,
      course_type: true,
      order_price: true,
      order_sort: true,
      order_total: true,
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
    const courseOrders = []
    const order_no_list = [];
    courseOrdersFind.forEach(item => {
      if (!order_no_list.includes(item.order_no)) order_no_list.push(item.order_no);
    });
    // TODO 双层 for 循环，如果缓慢考虑后期优化
    for (let i = 0; i < order_no_list.length; i++) {
      const courseOrdersSame = courseOrdersFind.filter(item => item.order_no === order_no_list[i]).sort((a, b) => a.order_sort - b.order_sort);
      const courseOrder = {
        order_no: order_no_list[i],
        payment_no: courseOrdersSame[0].payment_no,
        payment_type: courseOrdersSame[0].payment_type,
        payment_time: courseOrdersSame[0].payment_time,
        payment_num: courseOrdersSame[0].payment_num,
        status: courseOrdersSame[0].status,
        user_id: user_id,
        order_total: courseOrdersSame[0].order_total,
        course_infos: []
      }
      for (let j = 0; j < courseOrdersSame.length; j++) {
        const courseFind = courseOrdersSame[j].course_type === 1 ? await this.liveCourseService.findOneById(courseOrdersSame[j].course_id) : await this.videoCourseService.findOneById(courseOrdersSame[j].course_id)
        courseOrder.course_infos.push(courseFind)
      }
      courseOrders.push(courseOrder)
    }
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: courseOrders
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
      course_id: true,
      course_type: true,
      order_price: true,
      order_sort: true,
      order_total: true,
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
