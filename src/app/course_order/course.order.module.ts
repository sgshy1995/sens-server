import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CourseOrderController } from "./course.order.controller";
import { CourseOrder } from "../../db/entities/CourseOrder";
import { CourseOrderService } from "./course.order.service";
import { VideoCourseModule } from "../video_course/video.course.module";
import { LiveCourseModule } from "../live_course/live.course.module";
import { UserInfoModule } from "../user_info/user.info.module";

@Module({
  imports: [TypeOrmModule.forFeature([CourseOrder]), forwardRef(() => VideoCourseModule), forwardRef(() => LiveCourseModule), forwardRef(() => UserInfoModule)],
  controllers: [CourseOrderController],
  providers: [CourseOrderService],
  exports: [CourseOrderService]
})
export class CourseOrderModule {
}
