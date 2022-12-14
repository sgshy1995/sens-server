import {
  Body,
  Controller,
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
import { EquipmentModelService } from "./equipment.model.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import * as path from "path";
import * as nuid from "nuid";
import moment = require("moment");

import multer = require("multer");
import { ResponseResult } from "../../types/result.interface";
import { getConnection } from "typeorm";
import { EquipmentModel } from "../../db/entities/EquipmentModel";

@Controller("equipment_model")
export class EquipmentModelController {
  constructor(
    private readonly equipmentModelService: EquipmentModelService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("upload/multi_figure")
  @UseInterceptors(FileInterceptor("file", {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(process.env.UPLOAD_PATH, `/equipment_models/multi_figure/${moment(new Date(), "YYYY-MM-DD").format("YYYY-MM-DD")}`));
      },
      filename: (req, file, cb) => {
        // 自定义文件名
        const filename = `${nuid.next()}.${file.mimetype.split("/")[1]}`;
        return cb(null, filename);
      }
    })
  }))
  async uploadDataMultiFigure(@UploadedFile() file, @Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    console.log(file);
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
  async findAllEquipmentModels(@Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    const res = await this.equipmentModelService.findAllEquipmentModels();
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post()
  async createEquipmentModel(@Body() equipmentModel: EquipmentModel, @Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    const res = await this.equipmentModelService.createEquipmentModel(equipmentModel);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("custom")
  async findManyEquipmentModels(@Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    const { query } = request;
    const hot_order = !!query.hot_order;
    const query_pagination = { pageNo: Number(query.pageNo) || 1, pageSize: Number(query.pageSize) || 8 };
    const where = { ...query };
    const custom_query: Record<string, string> = {};
    const keys = getConnection().getMetadata(EquipmentModel).ownColumns.map(column => column.propertyName);
    if (where.sortField && where.sortOrder) {
      if (where.sortField === "frequency_num") {
        custom_query.frequency_num_order = where.sortOrder === "descend" ? "desc" : "asc";
      }
    }
    Object.keys(where).map(key => {
      if (key === "price_range") {
        custom_query[key] = <string>where[key];
      }
      if (!keys.includes(key) || where[key] === undefined || where[key] === null || where[key] === "") {
        delete where[key];
      }
    });
    console.log("where", where);
    const res = await this.equipmentModelService.findManyEquipmentModels(where, query_pagination, custom_query, hot_order);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get(":id")
  async findOneEquipmentModelById(@Param("id") id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.equipmentModelService.findOneEquipmentModelById(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("equipment/:equipment_id")
  async findManyCourseInVideosByCourseId(@Param("equipment_id") equipment_id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.equipmentModelService.findManyEquipmentModelsByEquipmentId(equipment_id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put()
  async updateEquipmentModel(@Body() equipmentModel: EquipmentModel, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.equipmentModelService.updateEquipmentModel(equipmentModel);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put("batch")
  async batchUpdateEquipmentModelsStatus(@Body() body: { ids: string, status: number, equipment_id: string }, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const { ids, status, equipment_id } = body;
    const idsIn = (ids || "").split(",");
    const res = await this.equipmentModelService.updateManyStatusByIds(idsIn, equipment_id, status);
    response.status(res.code);
    return res;
  }
}
