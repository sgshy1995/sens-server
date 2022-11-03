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
import { PatientCourseService } from "./patient.course.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import { ResponseResult } from "../../types/result.interface";
import { PatientCourse } from "../../db/entities/PatientCourse";

interface RequestParams extends Request {
  user: User;
}

@Controller("patient_course")
export class PatientCourseController {
  constructor(
    private readonly patientCourseService: PatientCourseService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post()
  async createPatientCourse(@Body() patientCourse: PatientCourse, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    patientCourse.user_id = request.user.id;
    const res = await this.patientCourseService.createPatientCourse(patientCourse);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get()
  async findManyPatientCoursesByUserId(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const user_id = request.user.id;
    const { query } = request;
    const res = await this.patientCourseService.findManyPatientCoursesByUserId(user_id, query.status ? Number(query.status.toString()) : undefined);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("id/:id")
  async findOnePatientCourseById(@Param("id") id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.patientCourseService.findOnePatientCourseById(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put()
  async updatePatientCourse(@Body() patientCourse: PatientCourse, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.patientCourseService.updatePatientCourse(patientCourse);
    response.status(res.code);
    return res;
  }
}
