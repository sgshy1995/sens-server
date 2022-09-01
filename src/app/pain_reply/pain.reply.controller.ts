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
import { PainReplyService } from "./pain.reply.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import * as path from "path";
import * as nuid from "nuid";
import moment = require("moment");

import multer = require("multer");
import { ResponseResult } from "../../types/result.interface";
import { PainReply } from "../../db/entities/PainReply";
import { FindOptionsWhere } from "typeorm";

interface RequestParams extends Request {
  user: User;
}

@Controller("pain_reply")
export class PainReplyController {
  constructor(
    private readonly painReplyService: PainReplyService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("upload/data")
  @UseInterceptors(FileInterceptor("file", {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(process.env.UPLOAD_PATH, `/pain_replies/data/${moment(new Date(), "YYYY-MM-DD").format("YYYY-MM-DD")}`));
      },
      filename: (req, file, cb) => {
        // 自定义文件名
        const filename = `${nuid.next()}.${file.mimetype.split("/")[1]}`;
        return cb(null, filename);
      }
    })
  }))
  async uploadData(@UploadedFile() file, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    console.log(file);
    console.log(request.user)
    const res = {
      code: HttpStatus.OK,
      message: "上传成功",
      data: file.path
    };
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard('jwt')) // 使用 'JWT' 进行验证
  @Get()
  async findAllPainReplies(@Res({passthrough: true}) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const res = await this.painReplyService.findAllPainReplies()
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard('jwt')) // 使用 'JWT' 进行验证
  @Post()
  async createPainReply(@Body() painReply: PainReply,@Res({passthrough: true}) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const user_id = request.user.id
    const res = await this.painReplyService.createPainReply(user_id, painReply)
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard('jwt')) // 使用 'JWT' 进行验证
  @Get("custom")
  async findManyPainReplies(@Res({passthrough: true}) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    const res = await this.painReplyService.findManyPainReplies(request.query)
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("user/:user_id")
  async findOnePainReplyById(@Param("user_id") user_id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.painReplyService.findOnePainReplyById(user_id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put()
  async updatePainReply(@Param("user_id") user_id: string, @Body() painQuestion: PainReply, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.painReplyService.updatePainReply(painQuestion);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put("like")
  async updateLike(@Body() body: { id: string, status: number }, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<ResponseResult> {
    const user_id = request.user.id;
    const { id, status } = body;
    const res = await this.painReplyService.updateLike(id, status, user_id);
    response.status(res.code);
    return res;
  }
}
