import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { VideoCourseController } from "./video.course.controller";
import { VideoCourse } from "../../db/entities/VideoCourse";
import { VideoCourseService } from "./video.course.service";
import { CourseInVideoModule } from "../course_in_video/course.in.video.module";

@Module({
  imports: [TypeOrmModule.forFeature([VideoCourse]), forwardRef(() => CourseInVideoModule)],
  controllers: [VideoCourseController],
  providers: [VideoCourseService],
  exports: [VideoCourseService]
})
export class VideoCourseModule {
}
