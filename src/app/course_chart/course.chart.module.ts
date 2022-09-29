import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CourseInVideoController } from "./course.in.video.controller";
import { CourseInVideo } from "../../db/entities/CourseInVideo";
import { CourseInVideoService } from "./course.in.video.service";
import { VideoCourseModule } from "../video_course/video.course.module";

@Module({
  imports: [TypeOrmModule.forFeature([CourseInVideo]), forwardRef(() => VideoCourseModule)],
  controllers: [CourseInVideoController],
  providers: [CourseInVideoService],
  exports: [CourseInVideoService]
})
export class CourseInVideoModule {
}
