import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
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
import { User } from "../../db/entities/User";
import { UserInfoService } from "./user.info.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import * as path from "path";
import * as nuid from "nuid";
import moment = require("moment");

import multer = require("multer");
import { ResponseResult } from "../../types/result.interface";
import { UserInfo } from "../../db/entities/UserInfo";

interface RequestParams extends Request {
  user: User;
}

@Controller("user_info")
export class UserInfoController {
  constructor(
    private readonly userInfoService: UserInfoService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("upload/data")
  @UseInterceptors(FileInterceptor("file", {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(process.env.UPLOAD_PATH, `/user_infos/data/${moment(new Date(), "YYYY-MM-DD").format("YYYY-MM-DD")}`));
      },
      filename: (req, file, cb) => {
        // 自定义文件名
        const filename = `${nuid.next()}.${file.mimetype.split("/")[1]}`;
        return cb(null, filename);
      }
    })
  }))
  async uploadFileBackground(@UploadedFile() file, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    console.log(file);
    console.log(request.user);
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
  @Get("user")
  async findOneUserByJWT(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const jwtUser = request.user;
    const res = !request.headers.authorization ? {
      code: HttpStatus.UNAUTHORIZED,
      message: "未认证，请登录"
    } : (jwtUser && jwtUser.username) ? await this.userInfoService.findOneInfoById(jwtUser.id) : {
      code: HttpStatus.NOT_FOUND,
      message: "登录已过期，请重新登录"
    };
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("user/:user_id")
  async findOneTeamById(@Param("user_id") user_id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.userInfoService.findOneInfoById(user_id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put("user/:user_id")
  async updateInfo(@Param("user_id") user_id: string, @Body() info: UserInfo, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.userInfoService.updateInfoByUserId(user_id, info);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put("balance/add")
  async addBalanceByUserId(@Body() info: { balance: string, payment_type: number }, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<ResponseResult> {
    const { balance, payment_type } = info;
    const user_id = request.user.id;
    const res = await this.userInfoService.addBalanceByUserId(user_id, balance, payment_type);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("chart_course_order")
  async addChartCourseOrderByUserId(@Body() info: { course_chart_ids: string, course_info: { course_ids: string, course_types: string, payment_num: string }, order_time: string, payment_type: number }, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<ResponseResult> {
    const { course_chart_ids, course_info, order_time, payment_type } = info;
    const user_id = request.user.id;
    const res = await this.userInfoService.addChartCourseOrderByUserId(user_id, course_chart_ids, course_info, order_time, payment_type);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("normal_course_order")
  async addNormalCourseOrderByUserId(@Body() info: { course_info: { course_ids: string, course_types: string, payment_num: string }, order_time: string, payment_type: number }, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<ResponseResult> {
    const { course_info, order_time, payment_type } = info;
    const user_id = request.user.id;
    const res = await this.userInfoService.addNormalCourseOrderByUserId(user_id, course_info, order_time, payment_type);
    response.status(res.code);
    return res;
  }
}
