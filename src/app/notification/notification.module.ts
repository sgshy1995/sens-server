import {Module, forwardRef} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import { NotificationController } from "./notification.controller";
import { Notification } from "../../db/entities/Notification";
import { NotificationService } from "./notification.service";
import {UserModule} from "../user/user.module";

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), forwardRef(()=>UserModule)],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService]
})
export class NotificationModule {
}
