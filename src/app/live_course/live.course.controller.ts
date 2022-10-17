import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Res,
  Req,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response, Request } from "express";
import { LiveCourseService } from "./live.course.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import * as path from "path";
import * as nuid from "nuid";
import moment = require("moment");

import multer = require("multer");
import { ResponseResult } from "../../types/result.interface";
import { getConnection } from "typeorm";
import { LiveCourse } from "../../db/entities/LiveCourse";

@Controller("live_course")
export class LiveCourseController {
  constructor(
    private readonly liveCourseService: LiveCourseService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("upload/cover")
  @UseInterceptors(FileInterceptor("file", {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(process.env.UPLOAD_PATH, `/live_courses/cover/${moment(new Date(), "YYYY-MM-DD").format("YYYY-MM-DD")}`));
      },
      filename: (req, file, cb) => {
        // 自定义文件名
        const filename = `${nuid.next()}.${file.mimetype.split("/")[1]}`;
        return cb(null, filename);
      }
    })
  }))
  async uploadDataCover(@UploadedFile() file, @Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    console.log(file);
    const res = {
      code: HttpStatus.OK,
      message: "上传成功",
      data: file.path
    };
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get()
  async findAllLiveCourses(@Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    const res = await this.liveCourseService.findAllLiveCourses();
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post()
  async createLiveCourse(@Body() liveCourse: LiveCourse, @Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    const res = await this.liveCourseService.createLiveCourse(liveCourse);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("custom")
  async findManyLiveCourses(@Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    const { query } = request;
    const hot_order = !!query.hot_order;
    const query_pagination = { pageNo: Number(query.pageNo) || 1, pageSize: Number(query.pageSize) || 8 };
    const where = { ...query };
    const custom_query:Record<string,string> = {};
    const keys = getConnection().getMetadata(LiveCourse).ownColumns.map(column => column.propertyName);
    if (where.sortField && where.sortOrder){
      if (where.sortField === 'frequency_num'){
        custom_query.frequency_num_order = where.sortOrder === 'descend' ? 'desc' : 'asc'
      }
    }
    Object.keys(where).map(key => {
      if (key === "live_num_range" || key === "price_range" || key === "keyword") {
        custom_query[key] = <string>where[key];
      }
      if (!keys.includes(key) || where[key] === undefined || where[key] === null || where[key] === "") {
        delete where[key];
      }
    });
    console.log("where", where);
    const res = await this.liveCourseService.findManyLiveCourses(where, query_pagination, custom_query, hot_order);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get(":id")
  async findOneLiveCourseById(@Param("id") id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.liveCourseService.findOneLiveCourseById(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("find/ids")
  async findManyLiveCoursesByIds(@Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    const { ids } = request.query
    const res = await this.liveCourseService.findManyLiveCoursesByIds(ids ? ids.toString() : '');
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put()
  async updateLiveCourse(@Body() liveCourse: LiveCourse, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.liveCourseService.updateLiveCourse(liveCourse);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put("batch")
  async batchUpdateLiveCoursesStatus(@Body() body: { ids: string, status: number }, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const { ids, status } = body;
    const idsIn = (ids || "").split(",");
    const res = await this.liveCourseService.updateManyStatusByIds(idsIn, status);
    response.status(res.code);
    return res;
  }
}
