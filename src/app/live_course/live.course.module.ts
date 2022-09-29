import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LiveCourseController } from "./live.course.controller";
import { LiveCourse } from "../../db/entities/LiveCourse";
import { LiveCourseService } from "./live.course.service";
import { VideoCourseModule } from "../video_course/video.course.module";
import { CourseChartModule } from "../course_chart/course.chart.module";

@Module({
  imports: [TypeOrmModule.forFeature([LiveCourse]), forwardRef(() => VideoCourseModule), forwardRef(() => CourseChartModule)],
  controllers: [LiveCourseController],
  providers: [LiveCourseService],
  exports: [LiveCourseService]
})
export class LiveCourseModule {
}
