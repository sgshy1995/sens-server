import {Module, forwardRef} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

//import { UserController } from './user.controller';
import {User} from '../../db/entities/User';
import {UserService} from './user.service';
import {UserInfoModule} from "../user_info/user.info.module";
import {NotificationModule} from "../notification/notification.module";
import {SysNotificationModule} from "../sys_notification/sys.notification.module";
import {PainQuestionModule} from "../pain_question/pain.question.module";
import {PainReplyModule} from "../pain_reply/pain.reply.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(()=>UserInfoModule),
    forwardRef(()=>NotificationModule),
    forwardRef(()=>SysNotificationModule),
    forwardRef(()=>PainQuestionModule),
    forwardRef(()=>PainReplyModule)
  ],
  //controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {
}
