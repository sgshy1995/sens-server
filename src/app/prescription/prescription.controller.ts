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
  UploadedFile, Delete
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response, Request } from "express";
import { User } from "../../db/entities/User";
import { PrescriptionService } from "./prescription.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";

import * as path from "path";
import * as nuid from "nuid";
import moment = require("moment");

import multer = require("multer");
import { ResponseResult } from "../../types/result.interface";
import { Prescription } from "../../db/entities/Prescription";
import { getConnection } from "typeorm";

interface RequestParams extends Request {
  user: User;
}

@Controller("prescription")
export class PrescriptionController {
  constructor(
    private readonly prescriptionService: PrescriptionService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("upload/video")
  @UseInterceptors(FileInterceptor("file", {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(process.env.UPLOAD_PATH, `/prescriptions/video/${moment(new Date(), "YYYY-MM-DD").format("YYYY-MM-DD")}`));
      },
      filename: (req, file, cb) => {
        // 自定义文件名
        const filename = `${nuid.next()}.${file.mimetype.split("/")[1]}`;
        return cb(null, filename);
      }
    })
  }))
  async uploadDataVideo(@UploadedFile() file, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
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
  @Post("upload/cover")
  @UseInterceptors(FileInterceptor("file", {
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(process.env.UPLOAD_PATH, `/prescriptions/cover/${moment(new Date(), "YYYY-MM-DD").format("YYYY-MM-DD")}`));
      },
      filename: (req, file, cb) => {
        // 自定义文件名
        const filename = `${nuid.next()}.${file.mimetype.split("/")[1]}`;
        return cb(null, filename);
      }
    })
  }))
  async uploadDataCover(@UploadedFile() file, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
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
  async findAllPrescriptions(@Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const res = await this.prescriptionService.findAllPrescriptions();
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("watch/:id")
  async addPrescriptionWatchNum(@Param("id") id: string, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const res = await this.prescriptionService.addPrescriptionWatchNum(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post()
  async createPrescription(@Body() prescription: Prescription, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const res = await this.prescriptionService.createPrescription(prescription);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("custom")
  async findManyPrescriptions(@Res({ passthrough: true }) response: Response, @Req() request: Request): Promise<Response | void | Record<string, any>> {
    const { query } = request;
    const hot_order = !!query.hot_order
    const query_pagination = { pageNo: Number(query.pageNo) || 1, pageSize: Number(query.pageSize) || 8};
    const where = { ...query };
    const keys = getConnection().getMetadata(Prescription).ownColumns.map(column => column.propertyName);
    Object.keys(where).map(key => {
      if (!keys.includes(key) || where[key] === undefined || where[key] === null || where[key] === '') {
        delete where[key];
      }
    });
    console.log("where", where);
    const res = await this.prescriptionService.findManyPrescriptions(where, query_pagination, hot_order);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get(":id")
  async findOnePrescriptionById(@Param("id") id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.prescriptionService.findOnePrescriptionById(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Delete(":id")
  async deleteOnePrescriptionById(@Param("id") id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const prescription = await this.prescriptionService.findOneById(id);
    prescription.status = 0;
    const res = await this.prescriptionService.updatePrescription(prescription);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put()
  async updatePrescription(@Body() prescription: Prescription, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.prescriptionService.updatePrescription(prescription);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Put("batch")
  async batchUpdatePrescriptionStatus(@Body() body: { ids: string, status: number }, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const { ids, status } = body;
    const idsIn = (ids || "").split(",");
    const res = await this.prescriptionService.updateManyStatusByIds(idsIn, status);
    response.status(res.code);
    return res;
  }
}
