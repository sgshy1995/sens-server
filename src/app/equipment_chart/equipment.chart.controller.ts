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
import { CourseChartService } from "./course.chart.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import { ResponseResult } from "../../types/result.interface";
import { CourseChart } from "../../db/entities/CourseChart";
import { User } from "../../db/entities/User";

interface RequestParams extends Request {
  user: User;
}

@Controller("course_chart")
export class CourseChartController {
  constructor(
    private readonly courseChartService: CourseChartService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post()
  async createCourseChart(@Body() courseChart: CourseChart, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    courseChart.user_id = request.user.id;
    const res = await this.courseChartService.createCourseChart(courseChart);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get()
  async findManyCourseChartsByUserId(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const user_id = request.user.id;
    const res = await this.courseChartService.findManyCourseChartsByUserId(user_id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Delete(":id")
  async deleteCourseChart(@Param("id") id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.courseChartService.deleteCourseChart(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Delete()
  async deleteCourseCharts(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const user_id = request.user.id;
    const res = await this.courseChartService.deleteCourseCharts(user_id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put()
  async updateCourseChart(@Body() courseChart: CourseChart, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.courseChartService.updateCourseChart(courseChart);
    response.status(res.code);
    return res;
  }
}
