import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import fs = require('fs')
import path = require('path')
import {PathLike} from 'fs';
import moment = require("moment");

@Injectable()
export class PathMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: Function) {
    function createDirIfNotExist(dir_path:PathLike) {
      if (!fs.existsSync(dir_path)) {
        fs.mkdirSync(dir_path,{recursive:true});
      }
    }
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/users/avatar/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/users/background/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/user_infos/data/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/pain_questions/data/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/pain_replies/data/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/prescriptions/video/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/prescriptions/cover/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/live_courses/cover/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/video_courses/cover/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/course_in_videos/cover/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/course_in_videos/video/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/equipments/long_figure/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/equipments/cover/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/equipment_models/multi_figure/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/authenticates/identity_card/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/authenticates/identity_card/front/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/authenticates/identity_card/back/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/authenticates/practicing_certificate/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    createDirIfNotExist(path.join(process.env.UPLOAD_PATH,`/authenticates/employee_card/${moment(new Date(),'YYYY-MM-DD').utcOffset(8).format('YYYY-MM-DD')}`))
    next();
  }
}
