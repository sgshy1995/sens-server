import {Module, forwardRef} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import { SysNotificationController } from "./sys.notification.controller";
import { SysNotification } from "../../db/entities/SysNotification";
import { SysNotificationService } from "./sys.notification.service";
import { UserModule } from "../user/user.module";

@Module({
  imports: [TypeOrmModule.forFeature([SysNotification]), forwardRef(()=>UserModule)],
  controllers: [SysNotificationController],
  providers: [SysNotificationService],
  exports: [SysNotificationService]
})
export class SysNotificationModule {
}
