import {
  Body,
  Controller,
  Delete,
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
import { ResponseResult } from "../../types/result.interface";
import { User } from "../../db/entities/User";
import { UserService } from "./user.service";
import { AuthService } from "../../auth/auth.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import * as path from "path";
import * as nuid from "nuid";
import moment = require("moment");

import multer = require("multer");
import { getConnection } from "typeorm";

interface RequestParams extends Request {
  user: User;
}

@Controller("user")
export class UserController {
  constructor(
    private readonly UserService: UserService, private readonly authService: AuthService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("upload_avatar")
  @UseInterceptors(FileInterceptor("file", {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(process.env.UPLOAD_PATH, `/users/avatar/${moment(new Date(), "YYYY-MM-DD").format("YYYY-MM-DD")}`));
      },
      filename: (req, file, cb) => {
        // 自定义文件名
        const filename = `${nuid.next()}.${file.mimetype.split("/")[1]}`;
        return cb(null, filename);
      }
    })
  }))
  async uploadAvatarFile(@UploadedFile() file, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    console.log(file);
    console.log(request.user);
    // @ts-ignore
    await this.UserService.updateUser(request.user.id, { avatar: file.path.split(path.sep).join("/") });
    const res = {
      code: HttpStatus.OK,
      message: "上传成功"
    };
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("upload_background")
  @UseInterceptors(FileInterceptor("file", {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(process.env.UPLOAD_PATH, `/users/background/${moment(new Date(), "YYYY-MM-DD").format("YYYY-MM-DD")}`));
      },
      filename: (req, file, cb) => {
        // 自定义文件名
        const filename = `${nuid.next()}.${file.mimetype.split("/")[1]}`;
        return cb(null, filename);
      }
    })
  }))
  async uploadBackgroundFile(@UploadedFile() file, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    console.log(file);
    console.log(request.user);
    // @ts-ignore
    await this.UserService.updateUser(request.user.id, { background: file.path.split(path.sep).join("/") });
    const res = {
      code: HttpStatus.OK,
      message: "上传成功"
    };
    response.status(res.code);
    return res;
  }

  @Post("login")
  async login(@Body() loginInfo: { device_id: string, phone: string, capture_phone: string }, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    console.log("JWT验证 - Step 1: 用户请求登录");
    const validateCaptureResult = await this.authService.validateCapturePhone(loginInfo.device_id, loginInfo.phone, loginInfo.capture_phone);
    if (validateCaptureResult) {
      response.status(validateCaptureResult.code);
      return validateCaptureResult;
    }

    const authResult = await this.authService.validateUserByPhone(loginInfo.phone);

    switch (authResult.code) {
      case 1:
        const resRight = await this.authService.certificate(authResult.user);
        response.status(resRight.code);
        return resRight;
      default:
        const resDefault = {
          code: HttpStatus.BAD_REQUEST,
          message: "账号或密码不正确"
        };
        response.status(resDefault.code);
        return resDefault;
    }
  }

  @Post("admin/login")
  async adminLogin(@Body() loginInfo: { visitor_id: string, phone: string, capture_phone: string }, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    console.log("JWT验证 - Step 1: 用户请求登录");
    const validateCaptureResult = await this.authService.validateAdminCapturePhone(loginInfo.visitor_id, loginInfo.phone, loginInfo.capture_phone);
    if (validateCaptureResult) {
      response.status(validateCaptureResult.code);
      return validateCaptureResult;
    }

    const authResult = await this.authService.validateAdminUserByPhone(loginInfo.phone);

    switch (authResult.code) {
      case 1:
        const resRight = await this.authService.certificate(authResult.user);
        response.status(resRight.code);
        return resRight;
      case -1:
        const resNotExist = {
          code: HttpStatus.NOT_FOUND,
          message: "用户不存在"
        };
        response.status(resNotExist.code);
        return resNotExist;
      case 0:
        const resError = {
          code: HttpStatus.FORBIDDEN,
          message: "用户权限错误"
        };
        response.status(resError.code);
        return resError;
      default:
        const resDefault = {
          code: HttpStatus.BAD_REQUEST,
          message: "账号或密码不正确"
        };
        response.status(resDefault.code);
        return resDefault;
    }
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("logout")
  async logout(@Body() User: User, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.authService.dropJwt(User);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get()
  async findOneUserByJWT(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const jwtUser = request.user;
    const res = !request.headers.authorization ? {
      code: HttpStatus.UNAUTHORIZED,
      message: "未认证，请登录"
    } : (jwtUser && jwtUser.username) ? await this.UserService.findOneUserByUsername(jwtUser.username) : {
      code: HttpStatus.NOT_FOUND,
      message: "登录已过期，请重新登录"
    };
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("username/:username")
  async findOneUserByUsername(@Param("username") username: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.UserService.findOneUserByUsername(username);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("custom")
  async findManyUsers(@Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    const { query } = request;
    const query_pagination = { pageNo: Number(query.pageNo) || 1, pageSize: Number(query.pageSize) || 8 };
    const where = { ...query };
    const keys = getConnection().getMetadata(User).ownColumns.map(column => column.propertyName);
    const custom_query = {};
    Object.keys(where).map(key => {
      if (key === "start_time" || key === "end_time") {
        custom_query[key] = where[key];
      }
      if (!keys.includes(key) || where[key] === undefined || where[key] === null || where[key] === "") {
        delete where[key];
      }
    });
    console.log("where", where);
    const res = await this.UserService.findManyUsers(where, custom_query, query_pagination);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Delete(":id")
  async deleteUser(@Param("id") id: string): Promise<ResponseResult> {
    await this.UserService.deleteUser(id);
    return { code: 200, message: "删除成功" };
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put("id/:id")
  async updateUser(@Param("id") id: string, @Body() body: { user: User, device_id?: string, phone_capture?: string }, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const userUpdate = await this.UserService.findOneById(id);
    const { user, phone_capture, device_id } = body;
    if (user.hasOwnProperty("phone")) {
      userUpdate.phone = user.phone;
      const validateCaptureResult = await this.authService.validateNewCapturePhone(device_id, userUpdate.phone, userUpdate.username, phone_capture);
      if (validateCaptureResult) {
        response.status(validateCaptureResult.code);
        return validateCaptureResult;
      }
    } else if (user.hasOwnProperty("name")) {
      userUpdate.name = user.name;
    } else if (user.hasOwnProperty("gender")) {
      userUpdate.gender = user.gender;
    } else if (user.hasOwnProperty("background")) {
      userUpdate.background = user.background;
    }
    const res = await this.UserService.updateUser(id, userUpdate);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put("if_lecture_auth")
  async updateIfLectureAuth(@Body() body: { id: string, if_lecture_auth: number }, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const { id, if_lecture_auth } = body;
    const res = await this.UserService.updateIfLectureAuth(id, if_lecture_auth);
    response.status(res.code);
    return res;
  }

}
