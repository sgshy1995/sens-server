import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserInfoController } from "./user.info.controller";
import { UserInfo } from "../../db/entities/UserInfo";
import { UserInfoService } from "./user.info.service";
import { UserModule } from "../user/user.module";
import { CourseOrderModule } from "../course_order/course.order.module";
import { TopUpOrderModule } from "../top_up_order/top.up.order.module";

@Module({
  imports: [TypeOrmModule.forFeature([UserInfo]), forwardRef(() => UserModule), forwardRef(() => CourseOrderModule), forwardRef(() => TopUpOrderModule)],
  controllers: [UserInfoController],
  providers: [UserInfoService],
  exports: [UserInfoService]
})
export class UserInfoModule {
}
