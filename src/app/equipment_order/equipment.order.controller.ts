import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Res,
  Req,
  UseGuards, Post
} from "@nestjs/common";

import { Response, Request } from "express";
import { EquipmentOrderService } from "./equipment.order.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import { ResponseResult } from "../../types/result.interface";
import { EquipmentOrder } from "../../db/entities/EquipmentOrder";
import { User } from "../../db/entities/User";
import { getConnection } from "typeorm";

interface RequestParams extends Request {
  user: User;
}

@Controller("equipment_order")
export class EquipmentOrderController {
  constructor(
    private readonly equipmentOrderService: EquipmentOrderService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("user")
  async findManyEquipmentOrdersByUserId(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const user_id = request.user.id;
    const res = await this.equipmentOrderService.findManyEquipmentOrdersByUserId(user_id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("custom")
  async findManyEquipmentOrders(@Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    const { query } = request;
    const query_pagination = { pageNo: Number(query.pageNo) || 1, pageSize: Number(query.pageSize) || 8 };
    const where = { ...query };
    const keys = getConnection().getMetadata(EquipmentOrder).ownColumns.map(column => column.propertyName);
    Object.keys(where).map(key => {
      if (!keys.includes(key) || where[key] === undefined || where[key] === null || where[key] === "") {
        delete where[key];
      }
    });
    console.log("where", where);
    const res = await this.equipmentOrderService.findManyEquipmentOrders(where, query_pagination);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("order_no/:order_no")
  async findOneEquipmentOrderByOrderNo(@Param("order_no") order_no: string, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const res = await this.equipmentOrderService.findOneEquipmentOrderByOrderNo(order_no);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("id/:id")
  async findOneEquipmentOrderById(@Param("id") id: string, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const res = await this.equipmentOrderService.findOneEquipmentOrderById(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put()
  async updateEquipmentOrder(@Body() equipmentOrder: EquipmentOrder, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.equipmentOrderService.updateEquipmentOrder(equipmentOrder);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("shipment")
  async beginOrderShipment(@Body() equipmentOrder: EquipmentOrder, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.equipmentOrderService.beginOrderShipment(equipmentOrder);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("receive/:order_no")
  async receiveOrderShipment(@Param("order_no") order_no: string, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.equipmentOrderService.receiveOrderShipment(order_no);
    response.status(res.code);
    return res;
  }
}
