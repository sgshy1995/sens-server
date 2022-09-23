import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LiveCourseController } from "./live.course.controller";
import { LiveCourse } from "../../db/entities/LiveCourse";
import { LiveCourseService } from "./live.course.service";
import { VideoCourseModule } from "../video_course/video.course.module";

@Module({
  imports: [TypeOrmModule.forFeature([LiveCourse]), forwardRef(() => VideoCourseModule)],
  controllers: [LiveCourseController],
  providers: [LiveCourseService],
  exports: [LiveCourseService]
})
export class LiveCourseModule {
}
