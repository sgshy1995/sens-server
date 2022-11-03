import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LecturerTimeController } from "./lecturer.time.controller";
import { LecturerTime } from "../../db/entities/LecturerTime";
import { LecturerTimeService } from "./lecturer.time.service";
import { UserModule } from "../user/user.module";
import { LiveCourseModule } from "../live_course/live.course.module";
import { BookModule } from "../book/book.module";
import { PatientCourseModule } from "../patient_course/patient.course.module";
import { UserInfoModule } from "../user_info/user.info.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([LecturerTime]),
    forwardRef(() => UserModule),
    forwardRef(() => LiveCourseModule),
    forwardRef(() => BookModule),
    forwardRef(() => PatientCourseModule),
    forwardRef(() => UserInfoModule)
  ],
  controllers: [LecturerTimeController],
  providers: [LecturerTimeService],
  exports: [LecturerTimeService]
})
export class LecturerTimeModule {
}
