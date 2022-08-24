import {Body, Controller, Delete, Get, Inject, Param, Post, Put, Res, Req, HttpStatus, UseGuards} from '@nestjs/common';
import { Response, Request } from 'express';
import { SysNotificationService } from "./sys.notification.service";

import { AuthGuard } from '@nestjs/passport';
import {TokenGuard} from '../../guards/token.guard';

import {ResponseResult} from '../../types/result.interface';
import { SysNotification } from "../../db/entities/SysNotification";

@Controller('sys_notification')
export class SysNotificationController {
  constructor(
    private readonly sysNotificationService: SysNotificationService
  ) { }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard('jwt')) // 使用 'JWT' 进行验证
  @Get(':id')
  async findOneTeamById(@Param('id') id: string, @Res({ passthrough: true }) response: Response): Promise<Response | void | Record<string, any>> {
    const res = await this.sysNotificationService.findOneSysNotificationById(id);
    response.status(res.code)
    return res
  }

  @UseGuards(new TokenGuard()) // 使用 token redis 验证
  @UseGuards(AuthGuard('jwt')) // 使用 'JWT' 进行验证
  @Put(':id')
  async updateInfo(@Param('id') id: string, @Body() sysNotification: SysNotification, @Res({ passthrough: true }) response: Response): Promise<ResponseResult> {
    const res = await this.sysNotificationService.updateSysNotificationById(id, sysNotification);
    response.status(res.code)
    return res
  }
}
