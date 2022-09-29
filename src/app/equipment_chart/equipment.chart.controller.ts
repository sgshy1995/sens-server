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
import { EquipmentChartService } from "./equipment.chart.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import { ResponseResult } from "../../types/result.interface";
import { EquipmentChart } from "../../db/entities/EquipmentChart";
import { User } from "../../db/entities/User";

interface RequestParams extends Request {
  user: User;
}

@Controller("equipment_chart")
export class EquipmentChartController {
  constructor(
    private readonly equipmentChartService: EquipmentChartService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post()
  async createEquipmentChart(@Body() equipmentChart: EquipmentChart, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    equipmentChart.user_id = request.user.id;
    const res = await this.equipmentChartService.createEquipmentChart(equipmentChart);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get()
  async findManyEquipmentChartsByUserId(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const user_id = request.user.id;
    const res = await this.equipmentChartService.findManyEquipmentChartsByUserId(user_id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Delete(":id")
  async deleteEquipmentChart(@Param("id") id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.equipmentChartService.deleteEquipmentChart(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Delete("user/delete")
  async deleteEquipmentChartsByUserId(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const user_id = request.user.id;
    const res = await this.equipmentChartService.deleteEquipmentChartsByUserId(user_id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Delete("ids/delete")
  async deleteEquipmentChartsByIds(@Res({ passthrough: true }) response: Response, @Body() ids: string[]): Promise<Response | void | Record<string, any>> {
    const res = await this.equipmentChartService.deleteEquipmentChartsByIds(ids);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put()
  async updateEquipmentChart(@Body() equipmentChart: EquipmentChart, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.equipmentChartService.updateEquipmentChart(equipmentChart);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put("num")
  async updateEquipmentChartAddNum(@Body() info: { id: string, type: "reduce" | "add" }, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const { id, type } = info;
    const res = await this.equipmentChartService.updateEquipmentChartAddNum(id, type);
    response.status(res.code);
    return res;
  }
}
