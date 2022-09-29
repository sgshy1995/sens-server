import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CourseChartController } from "./course.chart.controller";
import { CourseChart } from "../../db/entities/CourseChart";
import { CourseChartService } from "./course.chart.service";
import { VideoCourseModule } from "../video_course/video.course.module";
import { LiveCourseModule } from "../live_course/live.course.module";

@Module({
  imports: [TypeOrmModule.forFeature([CourseChart]), forwardRef(() => VideoCourseModule), forwardRef(() => LiveCourseModule)],
  controllers: [CourseChartController],
  providers: [CourseChartService],
  exports: [CourseChartService]
})
export class CourseChartModule {
}
