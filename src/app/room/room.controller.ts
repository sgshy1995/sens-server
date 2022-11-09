import {
  Body,
  Controller,
  Get,
  Param, Post, Req,
  Res,
  UseGuards
} from "@nestjs/common";
import { Request, Response } from "express";
import { RoomService } from "./room.service";

import { AuthGuard } from "@nestjs/passport";
import { TokenGuard } from "../../guards/token.guard";
import { User } from "../../db/entities/User";

interface RequestParams extends Request {
  user: User;
}

@Controller("room")
export class RoomController {
  constructor(
    private readonly roomService: RoomService
  ) {
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Post("enter")
  async enterRoom(@Body() info: { id: string, role: string }, @Res({ passthrough: true }) response: Response, @Req() request: RequestParams): Promise<Response | void | Record<string, any>> {
    const { id, role } = info;
    const user_id = request.user.id;
    const res = await this.roomService.enterRoom(id, role, user_id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("id/:id")
  async findOneRoomById(@Param("id") id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.roomService.findOneRoomById(id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("lecturer/:lecturer_user_id")
  async findOneRoomByLecturerUserId(@Param("lecturer_user_id") lecturer_user_id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.roomService.findOneRoomByLecturerUserId(lecturer_user_id);
    response.status(res.code);
    return res;
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard("jwt")) // 使用 'JWT' 进行验证
  @Get("patient/:patient_user_id")
  async findOneRoomByPatientUserId(@Param("patient_user_id") patient_user_id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.roomService.findOneRoomByPatientUserId(patient_user_id);
    response.status(res.code);
    return res;
  }
}
