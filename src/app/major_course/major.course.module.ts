import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MajorCourseController } from "./major.course.controller";
import { MajorCourse } from "../../db/entities/MajorCourse";
import { MajorCourseService } from "./major.course.service";
import { UserModule } from "../user/user.module";
import { VideoCourseModule } from "../video_course/video.course.module";
import { CourseOrderModule } from "../course_order/course.order.module";
import { CourseInVideoModule } from "../course_in_video/course.in.video.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([MajorCourse]),
    forwardRef(() => UserModule),
    forwardRef(() => VideoCourseModule),
    forwardRef(() => CourseOrderModule),
    forwardRef(() => CourseInVideoModule)
  ],
  controllers: [MajorCourseController],
  providers: [MajorCourseService],
  exports: [MajorCourseService]
})
export class MajorCourseModule {
}
