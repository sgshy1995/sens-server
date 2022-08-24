import {Body, Controller, Delete, Get, Inject, Param, Post, Put, Res, Req, HttpStatus, UseGuards} from '@nestjs/common';
import { Response, Request } from 'express';
import { NotificationService } from "./notification.service";

import { AuthGuard } from '@nestjs/passport';
import {TokenGuard} from '../../guards/token.guard';

import {ResponseResult} from '../../types/result.interface';
import { Notification } from "../../db/entities/Notification";

@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService
  ) { }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard('jwt')) // 使用 'JWT' 进行验证
  @Get('user/:user_id')
  async findOneTeamById(@Param('user_id') user_id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.notificationService.findOneNotificationByUserId(user_id);
    response.status(res.code)
    return res
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard('jwt')) // 使用 'JWT' 进行验证
  @Put('user/:user_id')
  async updateInfo(@Param('user_id') user_id: string, @Body() notification: Notification, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.notificationService.updateInfoByUserId(user_id, notification);
    response.status(res.code)
    return res
  }
}
