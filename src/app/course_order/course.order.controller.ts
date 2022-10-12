import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Res,
  Req,
  UseGuards,
  Delete
} from "@nestjs/common";

import { Response, Request } from "express";
import { CourseOrderService } from "./course.order.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import { ResponseResult } from "../../types/result.interface";
import { CourseOrder } from "../../db/entities/CourseOrder";
import { User } from "../../db/entities/User";

interface RequestParams extends Request {
  user: User;
}

@Controller("course_order")
export class CourseOrderController {
  constructor(
    private readonly courseOrderService: CourseOrderService
  ) {
  }

  /*@UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post()
  async createCourseOrder(@Body() courseOrder: CourseOrder, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    courseOrder.user_id = request.user.id;
    const res = await this.courseOrderService.createCourseOrder(courseOrder);
    response.status(res.code);
    return res;
  }*/

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get()
  async findManyCourseOrdersByUserId(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const user_id = request.user.id;
    const res = await this.courseOrderService.findManyCourseOrdersByUserId(user_id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put()
  async updateCourseOrder(@Body() courseOrder: CourseOrder, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.courseOrderService.updateCourseOrder(courseOrder);
    response.status(res.code);
    return res;
  }
}
