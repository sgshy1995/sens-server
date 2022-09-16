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
import { CourseInVideoService } from "./course.in.video.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import * as path from "path";
import * as nuid from "nuid";
import moment = require("moment");

import multer = require("multer");
import { ResponseResult } from "../../types/result.interface";
import { getConnection } from "typeorm";
import { CourseInVideo } from "../../db/entities/CourseInVideo";

@Controller("course_in_video")
export class CourseInVideoController {
  constructor(
    private readonly courseInVideoService: CourseInVideoService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("upload/video")
  @UseInterceptors(FileInterceptor("file", {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(process.env.UPLOAD_PATH, `/course_in_videos/video/${moment(new Date(), "YYYY-MM-DD").format("YYYY-MM-DD")}`));
      },
      filename: (req, file, cb) => {
        // 自定义文件名
        const filename = `${nuid.next()}.${file.mimetype.split("/")[1]}`;
        return cb(null, filename);
      }
    })
  }))
  async uploadDataVideo(@UploadedFile() file, @Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
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
  @Post("upload/cover")
  @UseInterceptors(FileInterceptor("file", {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(process.env.UPLOAD_PATH, `/course_in_videos/cover/${moment(new Date(), "YYYY-MM-DD").format("YYYY-MM-DD")}`));
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
  @Post()
  async createCourseInVideo(@Body() courseInVideo: CourseInVideo, @Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    const res = await this.courseInVideoService.createCourseInVideo(courseInVideo);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("custom")
  async findManyCourseInVideos(@Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    const { query } = request;
    const query_pagination = { pageNo: Number(query.pageNo) || 1, pageSize: Number(query.pageSize) || 8 };
    const where = { ...query };
    const keys = getConnection().getMetadata(CourseInVideo).ownColumns.map(column => column.propertyName);
    Object.keys(where).map(key => {
      if (!keys.includes(key) || where[key] === undefined || where[key] === null || where[key] === "") {
        delete where[key];
      }
    });
    console.log("where", where);
    const res = await this.courseInVideoService.findManyCourseInVideos(where, query_pagination);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get(":id")
  async findOneCourseInVideoById(@Param("id") id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.courseInVideoService.findOneCourseInVideoById(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put()
  async updateCourseInVideo(@Body() courseInVideo: CourseInVideo, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.courseInVideoService.updateCourseInVideo(courseInVideo);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put("batch")
  async batchUpdateCourseInVideosStatus(@Body() body: { ids: string, course_id: string, status: number }, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const { ids, status, course_id } = body;
    const idsIn = (ids || "").split(",");
    const res = await this.courseInVideoService.updateManyStatusByIds(idsIn, course_id, status);
    response.status(res.code);
    return res;
  }
}
