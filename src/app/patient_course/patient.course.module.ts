import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PatientCourseController } from "./patient.course.controller";
import { PatientCourse } from "../../db/entities/PatientCourse";
import { PatientCourseService } from "./patient.course.service";
import { UserModule } from "../user/user.module";
import { LiveCourseModule } from "../live_course/live.course.module";
import { CourseOrderModule } from "../course_order/course.order.module";
import { BookModule } from "../book/book.module";

@Module({
  imports: [TypeOrmModule.forFeature([PatientCourse]), forwardRef(() => UserModule), forwardRef(() => LiveCourseModule), forwardRef(() => CourseOrderModule), forwardRef(() => BookModule)],
  controllers: [PatientCourseController],
  providers: [PatientCourseService],
  exports: [PatientCourseService]
})
export class PatientCourseModule {
}
