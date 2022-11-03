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
import { BookService } from "./book.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import { ResponseResult } from "../../types/result.interface";
import { Book } from "../../db/entities/Book";

interface RequestParams extends Request {
  user: User;
}

@Controller("book")
export class BookController {
  constructor(
    private readonly bookService: BookService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post()
  async createBook(@Body() book: Book, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    book.user_id = request.user.id;
    const res = await this.bookService.createBook(book);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get()
  async findManyBooksByUserId(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const user_id = request.user.id
    const res = await this.bookService.findManyBooksByUserId(user_id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("ready")
  async findManyBooksReadyBooked(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const { query } = request
    const res = await this.bookService.findManyBooksReadyBooked(query.booked_user_id ? query.booked_user_id.toString() : undefined);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("id/:id")
  async findOneBookById(@Param("id") id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.bookService.findOneBookById(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Delete("normal")
  async deleteOneBookById(@Body() info: {id: string, canceled_reason: string}, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const { id, canceled_reason } = info
    const res = await this.bookService.deleteOneBookById(id, canceled_reason);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put("normal")
  async updateBook(@Body() book: Book, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.bookService.updateBook(book);
    response.status(res.code);
    return res;
  }
}
