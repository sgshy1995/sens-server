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
import { PainCommentService } from "./pain.comment.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import { ResponseResult } from "../../types/result.interface";
import { PainComment } from "../../db/entities/PainComment";

interface RequestParams extends Request {
  user: User;
}

@Controller("pain_comment")
export class PainCommentController {
  constructor(
    private readonly painCommentService: PainCommentService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard('jwt')) // 使用 'JWT' 进行验证
  @Get()
  async findAllPainComments(@Res({passthrough: true}) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const res = await this.painCommentService.findAllPainComments()
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard('jwt')) // 使用 'JWT' 进行验证
  @Post()
  async createPainComment(@Body() painComment: PainComment,@Res({passthrough: true}) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const user_id = request.user.id
    const res = await this.painCommentService.createPainComment(user_id, painComment)
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard('jwt')) // 使用 'JWT' 进行验证
  @Get("custom")
  async findManyPainComments(@Res({passthrough: true}) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    const res = await this.painCommentService.findManyPainComments(request.query)
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get(":id")
  async findOnePainCommentById(@Param("id") id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.painCommentService.findOnePainCommentById(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put()
  async updatePainComment(@Param("user_id") user_id: string, @Body() painComment: PainComment, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.painCommentService.updatePainComment(painComment);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put("like")
  async updateLike(@Body() body: { id: string, status: number }, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<ResponseResult> {
    const user_id = request.user.id;
    const { id, status } = body;
    const res = await this.painCommentService.updateLike(id, status, user_id);
    response.status(res.code);
    return res;
  }
}
