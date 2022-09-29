import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { VideoCourseController } from "./video.course.controller";
import { VideoCourse } from "../../db/entities/VideoCourse";
import { VideoCourseService } from "./video.course.service";
import { CourseInVideoModule } from "../course_in_video/course.in.video.module";
import { LiveCourseModule } from "../live_course/live.course.module";
import { CourseChartModule } from "../course_chart/course.chart.module";

@Module({
  imports: [TypeOrmModule.forFeature([VideoCourse]), forwardRef(() => CourseInVideoModule), forwardRef(() => LiveCourseModule), forwardRef(() => CourseChartModule)],
  controllers: [VideoCourseController],
  providers: [VideoCourseService],
  exports: [VideoCourseService]
})
export class VideoCourseModule {
}
