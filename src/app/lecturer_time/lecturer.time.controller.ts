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
import { User } from "../../db/entities/User";
import { LecturerTimeService } from "./lecturer.time.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import { ResponseResult } from "../../types/result.interface";
import { LecturerTime } from "../../db/entities/LecturerTime";

interface RequestParams extends Request {
  user: User;
}

@Controller("lecturer_time")
export class LecturerTimeController {
  constructor(
    private readonly lecturerTimeService: LecturerTimeService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post()
  async createLecturerTime(@Body() lecturerTime: LecturerTime, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    lecturerTime.user_id = request.user.id;
    const res = await this.lecturerTimeService.createLecturerTime(lecturerTime);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get()
  async findManyLecturerTimesByUserId(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const user_id = request.user.id
    const res = await this.lecturerTimeService.findManyLecturerTimesByUserId(user_id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("can_be_booked")
  async findManyLecturerTimesCanBeBooked(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const { query } = request
    const res = await this.lecturerTimeService.findManyLecturerTimesCanBeBooked(query.book_id ? query.book_id.toString() : undefined);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("id/:id")
  async findOneLecturerTimeById(@Param("id") id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.lecturerTimeService.findOneLecturerTimeById(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Delete("normal")
  async deleteOneLecturerTimeById(@Body() info: {id: string, canceled_reason?: string}, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const { id, canceled_reason } = info
    const res = await this.lecturerTimeService.deleteOneLecturerTimeById(id, canceled_reason);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put("normal")
  async updateLecturerTime(@Body() lecturerTime: LecturerTime, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.lecturerTimeService.updateLecturerTime(lecturerTime);
    response.status(res.code);
    return res;
  }
}
