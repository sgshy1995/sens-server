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
import { PainQuestionService } from "./pain.question.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import * as path from "path";
import * as nuid from "nuid";
import moment = require("moment");

import multer = require("multer");
import { ResponseResult } from "../../types/result.interface";
import { PainQuestion } from "../../db/entities/PainQuestion";
import { FindOptionsWhere } from "typeorm";

interface RequestParams extends Request {
  user: User;
}

@Controller("pain_question")
export class PainQuestionController {
  constructor(
    private readonly painQuestionService: PainQuestionService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("upload/data")
  @UseInterceptors(FileInterceptor("file", {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(process.env.UPLOAD_PATH, `/pain_questions/data/${moment(new Date(), "YYYY-MM-DD").format("YYYY-MM-DD")}`));
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
  @Get()
  async findAllPainQuestions(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const res = await this.painQuestionService.findAllPainQuestions();
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post()
  async createPainQuestion(@Body() painQuestion: PainQuestion, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const user_id = request.user.id;
    const res = await this.painQuestionService.createPainQuestion(user_id, painQuestion);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("custom")
  async findManyPainQuestions(@Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    const query = { ...request.query };
    const keyword: string = query.keyword ? query.keyword.toString() : "";
    if (query.hasOwnProperty("keyword")) delete query.keyword;
    const res = await this.painQuestionService.findManyPainQuestions(query, keyword);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get(":id")
  async findOnePainQuestionById(@Param("id") id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.painQuestionService.findOnePainQuestionById(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put("user/:user_id")
  async updatePainQuestion(@Param("user_id") user_id: string, @Body() painQuestion: PainQuestion, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.painQuestionService.updatePainQuestionByUserId(user_id, painQuestion);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put("collect")
  async updateCollect(@Body() body: { id: string, status: number }, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<ResponseResult> {
    const user_id = request.user.id;
    const { id, status } = body;
    const res = await this.painQuestionService.updateCollect(id, status, user_id);
    response.status(res.code);
    return res;
  }
}
