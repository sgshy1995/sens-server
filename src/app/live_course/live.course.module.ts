import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LiveCourseController } from "./live.course.controller";
import { LiveCourse } from "../../db/entities/LiveCourse";
import { LiveCourseService } from "./live.course.service";

@Module({
  imports: [TypeOrmModule.forFeature([LiveCourse])],
  controllers: [LiveCourseController],
  providers: [LiveCourseService],
  exports: [LiveCourseService]
})
export class LiveCourseModule {
}
