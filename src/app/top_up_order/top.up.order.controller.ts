import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Res,
  Req,
  UseGuards,
} from "@nestjs/common";

import { Response, Request } from "express";
import { TopUpOrderService } from "./top.up.order.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import { ResponseResult } from "../../types/result.interface";
import { TopUpOrder } from "../../db/entities/TopUpOrder";
import { User } from "../../db/entities/User";

interface RequestParams extends Request {
  user: User;
}

@Controller("top_up_order")
export class TopUpOrderController {
  constructor(
    private readonly topUpOrderService: TopUpOrderService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post()
  async createTopUpOrder(@Body() topUpOrder: TopUpOrder, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    topUpOrder.user_id = request.user.id;
    const res = await this.topUpOrderService.createTopUpOrder(topUpOrder);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get()
  async findManyTopUpOrdersByUserId(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const user_id = request.user.id;
    const { query } = request
    const res = await this.topUpOrderService.findManyTopUpOrdersByUserId(user_id, query.order_type ? query.order_type.toString() : 'payment_time', query.order ? query.order.toString() : 'desc');
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put()
  async updateTopUpOrder(@Body() topUpOrder: TopUpOrder, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.topUpOrderService.updateTopUpOrder(topUpOrder);
    response.status(res.code);
    return res;
  }
}
