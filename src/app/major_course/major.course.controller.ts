import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Res,
  Req,
  UseGuards
} from "@nestjs/common";
import { Response, Request } from "express";
import { User } from "../../db/entities/User";
import { MajorCourseService } from "./major.course.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import { ResponseResult } from "../../types/result.interface";
import { MajorCourse } from "../../db/entities/MajorCourse";
import { FindOptionsOrderValue } from "typeorm";

interface RequestParams extends Request {
  user: User;
}

@Controller("major_course")
export class MajorCourseController {
  constructor(
    private readonly majorCourseService: MajorCourseService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post()
  async createMajorCourse(@Body() majorCourse: MajorCourse, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    majorCourse.user_id = request.user.id;
    const res = await this.majorCourseService.createMajorCourse(majorCourse);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get()
  async findManyMajorCoursesByUserId(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const user_id = request.user.id;
    const { query } = request;
    const res = await this.majorCourseService.findManyMajorCoursesByUserId(user_id, query.created_at ? ( query.created_at as FindOptionsOrderValue) : 'desc');
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("id/:id")
  async findOneMajorCourseById(@Param("id") id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.majorCourseService.findOneMajorCourseById(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put()
  async updatePatientCourse(@Body() majorCourse: MajorCourse, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.majorCourseService.updateMajorCourse(majorCourse);
    response.status(res.code);
    return res;
  }
}
