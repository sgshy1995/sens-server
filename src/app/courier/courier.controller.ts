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
import { CourierService } from "./courier.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import { ResponseResult } from "../../types/result.interface";
import { Courier } from "../../db/entities/Courier";

interface RequestParams extends Request {
  user: User;
}

@Controller("courier")
export class CourierController {
  constructor(
    private readonly courierService: CourierService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get()
  async findAllCouriers(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const res = await this.courierService.findAllCouriers();
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post()
  async createCourier(@Body() courier: Courier, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const res = await this.courierService.createCourier(courier);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("id/:id")
  async findOneCourierById(@Param("id") id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.courierService.findOneCourierById(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("courier_number/:courier_number")
  async findOneCourierByCourierNumber(@Param("courier_number") courier_number: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.courierService.findOneCourierByCourierNumber(courier_number);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put()
  async updateCourier(@Body() courier: Courier, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.courierService.updateCourier(courier);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("courier_info")
  async getCourierInfo(@Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<ResponseResult> {
    const { query } = request
    const res = await this.courierService.getCourierInfo(query.courier_number.toString(), query.courier_company.toString());
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("courier_company_list")
  async getCourierCompanyList(@Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<ResponseResult> {
    const { query } = request
    const res = await this.courierService.getCourierCompanyList(query.courier_company.toString());
    response.status(res.code);
    return res;
  }
}
